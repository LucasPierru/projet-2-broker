import { API, parseJson, pretty } from "./api.js";

const limitInput = document.getElementById("limit");
const refreshLogsBtn = document.getElementById("refreshLogsBtn");
const analyticsTableBody = document.getElementById("analyticsTableBody");
const notificationsTableBody = document.getElementById("notificationsTableBody");
const apiOutput = document.getElementById("apiOutput");

const setOutput = (payload) => {
  apiOutput.textContent = typeof payload === "string" ? payload : pretty(payload);
};

const safeLimit = () => {
  const value = Number(limitInput.value);
  if (!Number.isFinite(value) || value <= 0) return 20;
  return Math.min(200, value);
};

const shortJson = (value) => {
  const text = JSON.stringify(value);
  if (!text) return "-";
  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
};

const renderAnalytics = (logs) => {
  if (!logs.length) {
    analyticsTableBody.innerHTML = "<tr><td colspan='4'>No analytics logs.</td></tr>";
    return;
  }

  analyticsTableBody.innerHTML = logs
    .map(
      (log) => `
      <tr>
        <td>${new Date(log.created_at).toLocaleString()}</td>
        <td>${log.event_type}</td>
        <td>${log.source_service}</td>
        <td>${shortJson(log.payload)}</td>
      </tr>
    `,
    )
    .join("");
};

const renderNotifications = (logs) => {
  if (!logs.length) {
    notificationsTableBody.innerHTML = "<tr><td colspan='5'>No notification logs.</td></tr>";
    return;
  }

  notificationsTableBody.innerHTML = logs
    .map(
      (log) => `
      <tr>
        <td>${new Date(log.created_at).toLocaleString()}</td>
        <td>${log.event_type}</td>
        <td><span class="badge">${log.status}</span></td>
        <td>${log.attempts ?? 0}</td>
        <td>${shortJson(log.payload)}</td>
      </tr>
    `,
    )
    .join("");
};

const loadLogs = async () => {
  const limit = safeLimit();
  refreshLogsBtn.disabled = true;
  refreshLogsBtn.textContent = "Loading...";

  try {
    const [analyticsResponse, notificationsResponse] = await Promise.all([
      fetch(`${API.analytics}?limit=${limit}`),
      fetch(`${API.notifications}?limit=${limit}`),
    ]);

    const analyticsData = await parseJson(analyticsResponse);
    const notificationsData = await parseJson(notificationsResponse);

    if (!analyticsResponse.ok) {
      throw new Error(`Analytics request failed: ${pretty(analyticsData)}`);
    }

    if (!notificationsResponse.ok) {
      throw new Error(`Notifications request failed: ${pretty(notificationsData)}`);
    }

    renderAnalytics(analyticsData.logs || []);
    renderNotifications(notificationsData.logs || []);

    setOutput({
      analytics: { count: (analyticsData.logs || []).length },
      notifications: { count: (notificationsData.logs || []).length },
    });
  } catch (error) {
    setOutput({ error: String(error) });
  } finally {
    refreshLogsBtn.disabled = false;
    refreshLogsBtn.textContent = "Refresh logs";
  }
};

refreshLogsBtn.addEventListener("click", loadLogs);
loadLogs();
