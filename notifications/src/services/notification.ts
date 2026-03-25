import { DbClient, NotificationRow } from "../types/notification.types";

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
    `INSERT INTO notifications (event_type, payload, status)
     VALUES ($1, $2::jsonb, 'pending')
     RETURNING id, event_type, payload, status`,
    [eventType, JSON.stringify(payload)]
  );

  return notification;
};

const markNotificationSent = async (db: DbClient, notificationId: string) => {
  await db.query(
    `UPDATE notifications
     SET status = 'sent',
         sent_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [notificationId]
  );
};

const markNotificationFailed = async (
  db: DbClient,
  notificationId: string,
  errorMessage: string
) => {
  await db.query(
    `UPDATE notifications
     SET status = 'failed',
         last_error = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [notificationId, errorMessage]
  );
};

const attemptDelivery = async (
  db: DbClient,
  notification: Pick<NotificationRow, "id" | "event_type" | "payload">
) => {
  try {
    await sendNotificationToClient(notification.event_type, notification.payload);
    await markNotificationSent(db, notification.id);
    return { delivered: 1, failed: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await markNotificationFailed(db, notification.id, message);
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

export const listRecentNotifications = async (db: DbClient, limit = 50) => {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;

  const { rows } = await db.query(
    `SELECT
      id,
      event_type,
      payload,
      status,
      attempts,
      last_error,
      next_retry_at,
      sent_at,
      created_at,
      updated_at
     FROM notifications
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return rows;
};
