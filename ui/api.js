export const API = {
  catalog: "http://localhost:3006/v1/catalogs",
  orders: "http://localhost:3002/v1/orders",
  deliveries: "http://localhost:3004/v1/deliveries",
  analytics: "http://localhost:3005/v1/analytics",
  notifications: "http://localhost:3001/v1/notifications",
};

export const pretty = (value) => JSON.stringify(value, null, 2);

export const asCurrency = (value) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

export const parseJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { raw: await response.text() };
  }
  return response.json();
};
