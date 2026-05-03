// ============================================================
// GreenTarif — Cart JS
// ============================================================

const CART_KEY = 'greentarif_cart';

function cartLoad() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}

function cartSave(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

function cartAdd(article, qty = 1) {
  const items = cartLoad();
  const existing = items.find(i => i.article === article);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ article, qty });
  }
  cartSave(items);
  showNotification('✅ Товар добавлен в корзину');
}

function cartRemove(article) {
  const items = cartLoad().filter(i => i.article !== article);
  cartSave(items);
  renderCart();
}

function cartSetQty(article, qty) {
  const items = cartLoad();
  const item = items.find(i => i.article === article);
  if (item) {
    item.qty = Math.max(1, qty);
    cartSave(items);
  }
}

function cartClear() {
  cartSave([]);
}

function cartTotal(items, products) {
  return items.reduce((sum, i) => {
    const p = products.find(pr => pr.article === i.article);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

function updateCartBadge() {
  const items = cartLoad();
  const count = items.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

// ============================================================
// Cart page render
// ============================================================
async function renderCart() {
  const wrap = document.getElementById('cartWrap');
  const emptyWrap = document.getElementById('cartEmpty');
  const summaryWrap = document.getElementById('cartSummary');
  if (!wrap) return;

  const items = cartLoad();
  const products = await loadProducts();

  if (items.length === 0) {
    wrap.classList.add('hidden');
    emptyWrap?.classList.remove('hidden');
    summaryWrap?.classList.add('hidden');
    return;
  }

  emptyWrap?.classList.add('hidden');
  wrap.classList.remove('hidden');
  summaryWrap?.classList.remove('hidden');

  wrap.innerHTML = items.map(item => {
    const p = products.find(pr => pr.article === item.article);
    if (!p) return '';
    return `
    <div class="cart-item" id="cart-item-${p.article}">
      <img class="cart-item-img" src="${p.image_url}" alt="${p.name}">
      <div>
        <a class="cart-item-name" href="product.html?id=${p.article}">${p.name}</a>
        <div class="cart-item-article">Арт: ${p.article} • ${p.brand}</div>
        <div class="qty-input" style="width:fit-content;margin-top:8px">
          <button class="qty-btn" onclick="changeQty('${p.article}', -1)">−</button>
          <input class="qty-val" type="number" min="1" value="${item.qty}" id="qty-${p.article}"
            onchange="cartSetQty('${p.article}', parseInt(this.value)); renderCart()">
          <button class="qty-btn" onclick="changeQty('${p.article}', 1)">+</button>
        </div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <button class="cart-item-remove" onclick="cartRemove('${p.article}')">✕</button>
        <div class="cart-item-price">${formatPrice(p.price * item.qty)}</div>
        ${item.qty > 1 ? `<div style="font-size:12px;color:var(--text-muted)">${formatPrice(p.price)} × ${item.qty}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // Summary
  const subtotal = cartTotal(items, products);
  const delivery = subtotal >= STORE_CONFIG.freeDeliveryFrom ? 0 : STORE_CONFIG.deliveryCost;
  const total = subtotal + delivery;

  if (summaryWrap) {
    summaryWrap.querySelector('#subtotal').textContent = formatPrice(subtotal);
    summaryWrap.querySelector('#deliveryCost').textContent = delivery === 0 ? 'Бесплатно' : formatPrice(delivery);
    summaryWrap.querySelector('#totalAmount').textContent = formatPrice(total);
    const checkoutLink = summaryWrap.querySelector('#checkoutLink');
    if (checkoutLink) checkoutLink.href = `checkout.html`;
  }
}

function changeQty(article, delta) {
  const items = cartLoad();
  const item = items.find(i => i.article === article);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  cartSave(items);
  renderCart();
}

// Init
updateCartBadge();
if (document.getElementById('cartWrap')) renderCart();
