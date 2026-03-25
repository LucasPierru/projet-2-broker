import { DbClient } from "../types/analytics.types";

const parsePayload = (payloadText: string): unknown => {
  try {
    return JSON.parse(payloadText);
  } catch {
    return { raw: payloadText };
  }
};

export const logAnalyticsEvent = async (
  db: DbClient,
  eventType: string,
  payloadText: string,
  sourceService?: string
) => {
  const parsedPayload = parsePayload(payloadText);
  const source = sourceService && sourceService.length > 0 ? sourceService : "unknown";

  await db.query(
    `INSERT INTO analytics_events (event_type, source_service, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [eventType, source, JSON.stringify(parsedPayload)]
  );
};

export const listRecentLogs = async (db: DbClient, limit = 50) => {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;

  const { rows } = await db.query(
    `SELECT id, event_type, source_service, payload, created_at
     FROM analytics_events
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return rows;
};

export const getAnalyticsServiceInfo = (server: string, port: number) => ({
  server,
  port,
});
