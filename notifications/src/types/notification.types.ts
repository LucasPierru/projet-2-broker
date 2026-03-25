export type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

export type NotificationRow = {
  id: string;
  event_type: string;
  payload: unknown;
  status: string;
};
