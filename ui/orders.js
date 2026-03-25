import { API, asCurrency, parseJson, pretty } from "./api.js";

const customerIdInput = document.getElementById("customerId");
const loadOrdersBtn = document.getElementById("loadOrdersBtn");
const ordersContainer = document.getElementById("ordersContainer");
const apiOutput = document.getElementById("apiOutput");

const setOutput = (payload) => {
  apiOutput.textContent = typeof payload === "string" ? payload : pretty(payload);
};

const setDeliveryStatusBadge = (card, status) => {
  const badge = card.querySelector("[data-role='delivery-status-badge']");
  if (!badge) return;
  badge.textContent = status || "not_found";
};

const applyDeliveryToCard = (card, delivery) => {
  card.querySelector("input[data-role='delivery-id']").value = delivery?.id || "";
  card.querySelector("select[data-role='status']").value = delivery?.status || "pending";
  card.querySelector("input[data-role='carrier']").value = delivery?.carrier || "";
  card.querySelector("input[data-role='tracking']").value = delivery?.tracking_number || "";
  card.querySelector("input[data-role='estimated']").value = toInputDateTime(delivery?.estimated_delivery_at);
  card.querySelector("input[data-role='delivered']").value = toInputDateTime(delivery?.delivered_at);
  setDeliveryStatusBadge(card, delivery?.status);
};

const renderOrderItems = (items = []) => {
  if (!items.length) {
    return "<small class='muted'>No items on this order.</small>";
  }

  const rows = items
    .map(
      (item) => `<tr><td>${item.product_id}</td><td>${item.quantity}</td><td>${asCurrency(item.unit_price)}</td></tr>`,
    )
    .join("");

  return `<table>
    <thead><tr><th>Product ID</th><th>Qty</th><th>Unit Price</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
};

const deliveryEditorHtml = (orderId) => `
  <div class="card" style="margin-top: 12px;">
    <div class="row">
      <div class="field">
        <label>Delivery ID</label>
        <input type="text" data-role="delivery-id" readonly />
      </div>
      <div class="field">
        <label>Status</label>
        <select data-role="status">
          <option value="pending">pending</option>
          <option value="processing">processing</option>
          <option value="in_transit">in_transit</option>
          <option value="delivered">delivered</option>
          <option value="failed">failed</option>
        </select>
      </div>
      <div class="field">
        <label>Carrier</label>
        <input type="text" data-role="carrier" placeholder="DHL" />
      </div>
      <div class="field">
        <label>Tracking #</label>
        <input type="text" data-role="tracking" placeholder="ABC123" />
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>Estimated Delivery</label>
        <input type="datetime-local" data-role="estimated" />
      </div>
      <div class="field">
        <label>Delivered At</label>
        <input type="datetime-local" data-role="delivered" />
      </div>
      <div class="field" style="max-width: 220px;">
        <button data-action="load-delivery" data-order-id="${orderId}" class="secondary">Load delivery</button>
      </div>
      <div class="field" style="max-width: 220px;">
        <button data-action="update-delivery" data-order-id="${orderId}">Update delivery</button>
      </div>
    </div>
  </div>
`;

const renderOrders = (orders) => {
  if (!orders.length) {
    ordersContainer.innerHTML = "No orders for this customer.";
    return;
  }

  ordersContainer.innerHTML = orders
    .map(
      (order) => `
      <article class="card">
        <div class="row">
          <div><strong>Order:</strong> ${order.id}</div>
          <div><strong>Order Status:</strong> <span class="badge">${order.status}</span></div>
          <div><strong>Delivery Status:</strong> <span class="badge" data-role="delivery-status-badge">loading...</span></div>
          <div><strong>Total:</strong> ${asCurrency(order.total)}</div>
        </div>
        ${renderOrderItems(order.items)}
        ${deliveryEditorHtml(order.id)}
      </article>
    `,
    )
    .join("");
};

const loadOrders = async () => {
  const customerId = customerIdInput.value.trim();

  if (!customerId) {
    setOutput({ error: "Customer ID is required" });
    return;
  }

  loadOrdersBtn.disabled = true;
  loadOrdersBtn.textContent = "Loading...";

  try {
    const response = await fetch(`${API.orders}/customer/${encodeURIComponent(customerId)}`);
    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(pretty(data));
    }

    const orders = data.orders || [];
    renderOrders(orders);

    await Promise.all(
      orders.map(async (order) => {
        const card = ordersContainer.querySelector(`button[data-order-id='${order.id}']`)?.closest("article");

        if (!card) {
          return;
        }

        try {
          const delivery = await fetchDeliveryByOrderId(order.id);
          applyDeliveryToCard(card, delivery);
        } catch {
          setDeliveryStatusBadge(card, "not_found");
        }
      }),
    );

    setOutput(data);
  } catch (error) {
    setOutput({ error: String(error) });
  } finally {
    loadOrdersBtn.disabled = false;
    loadOrdersBtn.textContent = "Load orders";
  }
};

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toApiDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const fetchDeliveryByOrderId = async (orderId) => {
  const response = await fetch(`${API.deliveries}/order/${encodeURIComponent(orderId)}/status`);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(pretty(data));
  }

  return data.delivery || null;
};

const loadDelivery = async (button) => {
  const orderId = button.dataset.orderId;
  const card = button.closest("article");

  try {
    const delivery = await fetchDeliveryByOrderId(orderId);

    applyDeliveryToCard(card, delivery);

    setOutput({ success: true, delivery });
  } catch (error) {
    setOutput({ error: String(error) });
  }
};

const updateDelivery = async (button) => {
  const orderId = button.dataset.orderId;
  const card = button.closest("article");

  let deliveryId = card.querySelector("input[data-role='delivery-id']").value.trim();

  if (!deliveryId) {
    try {
      const delivery = await fetchDeliveryByOrderId(orderId);
      deliveryId = delivery?.id || "";

      if (!deliveryId) {
        setOutput({ error: `No delivery found for order ${orderId}.` });
        return;
      }

      applyDeliveryToCard(card, delivery);
    } catch (error) {
      setOutput({ error: String(error) });
      return;
    }
  }

  const payload = {
    status: card.querySelector("select[data-role='status']").value,
    carrier: card.querySelector("input[data-role='carrier']").value.trim() || null,
    tracking_number: card.querySelector("input[data-role='tracking']").value.trim() || null,
    estimated_delivery_at: toApiDateTime(card.querySelector("input[data-role='estimated']").value),
    delivered_at: toApiDateTime(card.querySelector("input[data-role='delivered']").value),
  };

  try {
    const response = await fetch(`${API.deliveries}/${encodeURIComponent(deliveryId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(pretty(data));
    }

    setDeliveryStatusBadge(card, data?.delivery?.status || payload.status);
    setOutput(data);
  } catch (error) {
    setOutput({ error: String(error) });
  }
};

ordersContainer.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  if (action === "load-delivery") {
    await loadDelivery(button);
    return;
  }

  if (action === "update-delivery") {
    await updateDelivery(button);
  }
});

loadOrdersBtn.addEventListener("click", loadOrders);
