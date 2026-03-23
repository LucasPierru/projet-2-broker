type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

type NotificationRow = {
  id: string;
  event_type: string;
  payload: unknown;
  status: string;
  attempts: number;
};

const MAX_RETRY_ATTEMPTS = Number(process.env.NOTIFICATIONS_MAX_RETRIES || 5);

const parsePayload = (payloadText: string): unknown => {
  try {
    return JSON.parse(payloadText);
  } catch {
    return payloadText;
  }
};

const sendNotificationToClient = async (
  eventType: string,
  payload: unknown
): Promise<void> => {
  const shouldFail = process.env.NOTIFICATIONS_FORCE_FAIL === "true";

  if (shouldFail) {
    throw new Error("Notification client delivery failed");
  }

  console.log("[notifications-service] Notification sent", {
    eventType,
    payload,
  });
};

const createNotification = async (
  db: DbClient,
  eventType: string,
  payload: unknown
): Promise<NotificationRow> => {
  const {
    rows: [notification],
  } = await db.query(
    `INSERT INTO notifications (event_type, payload, status, attempts)
     VALUES ($1, $2::jsonb, 'pending', 0)
     RETURNING id, event_type, payload, status, attempts`,
    [eventType, JSON.stringify(payload)]
  );

  return notification;
};

const markNotificationSent = async (db: DbClient, notificationId: string) => {
  await db.query(
    `UPDATE notifications
     SET status = 'sent',
         attempts = attempts + 1,
         sent_at = NOW(),
         next_retry_at = NULL,
         last_error = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [notificationId]
  );
};

const markNotificationFailed = async (
  db: DbClient,
  notification: Pick<NotificationRow, "id" | "attempts">,
  errorMessage: string
) => {
  const nextAttempt = notification.attempts + 1;
  const hasRetryLeft = nextAttempt < MAX_RETRY_ATTEMPTS;

  await db.query(
    `UPDATE notifications
     SET status = 'failed',
         attempts = attempts + 1,
         last_error = $2,
         next_retry_at = CASE
           WHEN $3 THEN NOW() + INTERVAL '5 minutes'
           ELSE NULL
         END,
         updated_at = NOW()
     WHERE id = $1`,
    [notification.id, errorMessage, hasRetryLeft]
  );
};

const attemptDelivery = async (
  db: DbClient,
  notification: Pick<NotificationRow, "id" | "event_type" | "payload" | "attempts">
) => {
  try {
    await sendNotificationToClient(notification.event_type, notification.payload);
    await markNotificationSent(db, notification.id);
    return { delivered: 1, failed: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await markNotificationFailed(db, notification, message);
    return { delivered: 0, failed: 1 };
  }
};

export const handleNotificationEvent = async (
  db: DbClient,
  eventType: string,
  payloadText: string
) => {
  const payload = parsePayload(payloadText);
  const notification = await createNotification(db, eventType, payload);

  await attemptDelivery(db, notification);
};

export const retryFailedNotifications = async (db: DbClient, limit = 20) => {
  const { rows: failedNotifications } = await db.query(
    `SELECT id, event_type, payload, attempts
     FROM notifications
     WHERE status = 'failed'
       AND (next_retry_at IS NULL OR next_retry_at <= NOW())
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit]
  );

  let delivered = 0;
  let failed = 0;

  for (const notification of failedNotifications) {
    const result = await attemptDelivery(db, notification);
    delivered += result.delivered;
    failed += result.failed;
  }

  return {
    scanned: failedNotifications.length,
    delivered,
    failed,
  };
};
