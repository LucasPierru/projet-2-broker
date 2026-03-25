import { API, asCurrency, parseJson, pretty } from "./api.js";

const productsTableBody = document.getElementById("productsTableBody");
const refreshProductsBtn = document.getElementById("refreshProductsBtn");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const customerIdInput = document.getElementById("customerId");
const apiOutput = document.getElementById("apiOutput");
const orderSummary = document.getElementById("orderSummary");

let products = [];

const setOutput = (payload) => {
  apiOutput.textContent = typeof payload === "string" ? payload : pretty(payload);
};

const renderProducts = () => {
  if (!products.length) {
    productsTableBody.innerHTML = "<tr><td colspan='4'>No products found.</td></tr>";
    return;
  }

  productsTableBody.innerHTML = products
    .map(
      (product) => `
      <tr>
        <td>
          <strong>${product.name}</strong>
          ${product.active ? "<div><span class='badge'>Active</span></div>" : ""}
        </td>
        <td>${asCurrency(product.price)}</td>
        <td>${product.description || "-"}</td>
        <td>
          <input
            type="number"
            min="0"
            value="0"
            data-product-id="${product.id}"
            data-price="${product.price}"
            style="max-width: 90px"
          />
        </td>
      </tr>
    `,
    )
    .join("");
};

const loadProducts = async () => {
  refreshProductsBtn.disabled = true;
  refreshProductsBtn.textContent = "Loading...";

  try {
    const response = await fetch(API.catalog);
    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(pretty(data));
    }

    products = data.products || [];
    renderProducts();
    setOutput(data);
  } catch (error) {
    setOutput({ error: String(error) });
  } finally {
    refreshProductsBtn.disabled = false;
    refreshProductsBtn.textContent = "Refresh products";
  }
};

const collectOrderItems = () => {
  const quantityInputs = Array.from(productsTableBody.querySelectorAll("input[data-product-id]"));

  return quantityInputs
    .map((input) => {
      const quantity = Number(input.value || 0);
      const productId = input.dataset.productId;
      const unitPrice = Number(input.dataset.price || 0);
      return { product_id: productId, quantity, unit_price: unitPrice };
    })
    .filter((item) => item.quantity > 0);
};

const placeOrder = async () => {
  const customerId = customerIdInput.value.trim();
  const items = collectOrderItems();

  if (!customerId) {
    setOutput({ error: "Customer ID is required" });
    return;
  }

  if (!items.length) {
    setOutput({ error: "Select at least one product quantity > 0" });
    return;
  }

  const total = Number(items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2));

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Placing...";

  try {
    const response = await fetch(API.orders, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customer_id: customerId, items, total }),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(pretty(data));
    }

    setOutput(data);
    orderSummary.textContent = `Order sent for ${items.length} item type(s) – total ${asCurrency(total)}`;

    Array.from(productsTableBody.querySelectorAll("input[data-product-id]")).forEach((input) => {
      input.value = 0;
    });
  } catch (error) {
    setOutput({ error: String(error) });
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place order";
  }
};

refreshProductsBtn.addEventListener("click", loadProducts);
placeOrderBtn.addEventListener("click", placeOrder);

loadProducts();
