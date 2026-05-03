// ============================================================
// GreenTarif — Admin Panel JS
// ============================================================

const ORDERS_KEY = 'greentarif_orders';

function adminAuth() {
  const stored = sessionStorage.getItem('admin_auth');
  if (stored === 'ok') return true;
  const form = document.getElementById('adminLoginForm');
  if (!form) return false;
  const loginPanel = document.getElementById('adminLogin');
  const mainPanel = document.getElementById('adminMain');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const pw = this.querySelector('[name="password"]').value;
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'ok');
      loginPanel.classList.add('hidden');
      mainPanel.classList.remove('hidden');
      initAdmin();
    } else {
      document.getElementById('loginError').classList.remove('hidden');
    }
  });
  return false;
}

function initAdmin() {
  loadAdminProducts();
  loadAdminOrders();
  bindAdminNav();
  bindProductForm();
}

// ============================================================
// Products Management
// ============================================================
let adminProducts = [];

async function loadAdminProducts() {
  adminProducts = await loadProducts();
  renderProductsTable(adminProducts);
  populateCategoryFilter();
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = products.map(p => `
  <tr>
    <td><img src="${p.image_url}" style="width:50px;height:40px;object-fit:cover;border-radius:6px;background:var(--bg)"></td>
    <td><strong>${p.article}</strong></td>
    <td>${p.name}</td>
    <td>${p.category_name}</td>
    <td><strong>${formatPrice(p.price)}</strong></td>
    <td>${p.stock} ${p.unit}</td>
    <td>
      <div class="admin-toggle">
        <div class="toggle ${p.active ? 'on' : ''}" data-article="${p.article}" onclick="toggleProduct('${p.article}')"></div>
        <span style="font-size:12px">${p.active ? 'Вкл' : 'Выкл'}</span>
      </div>
    </td>
    <td style="white-space:nowrap">
      <button class="btn-green" style="padding:6px 10px;font-size:12px" onclick="editProduct('${p.article}')">✏️ Ред.</button>
      <button class="btn-danger" style="margin-left:4px" onclick="deleteProduct('${p.article}')">✕</button>
    </td>
  </tr>`).join('');
}

function toggleProduct(article) {
  const p = adminProducts.find(x => x.article === article);
  if (!p) return;
  p.active = !p.active;
  saveProducts();
  renderProductsTable(adminProducts);
  showNotification(p.active ? '✅ Товар включён' : '⛔ Товар отключён');
}

function deleteProduct(article) {
  if (!confirm('Удалить товар ' + article + '?')) return;
  adminProducts = adminProducts.filter(p => p.article !== article);
  saveProducts();
  renderProductsTable(adminProducts);
  showNotification('Товар удалён');
}

function saveProducts() {
  // In a real app this would POST to a server. Here we save to localStorage for demo.
  localStorage.setItem('gt_products_override', JSON.stringify(adminProducts));
}

function editProduct(article) {
  const p = adminProducts.find(x => x.article === article);
  if (!p) return;
  switchTab('tabProducts');
  const form = document.getElementById('productForm');
  if (!form) return;
  form.querySelector('[name="article"]').value = p.article;
  form.querySelector('[name="name"]').value = p.name;
  form.querySelector('[name="brand"]').value = p.brand;
  form.querySelector('[name="price"]').value = p.price;
  form.querySelector('[name="old_price"]').value = p.old_price || '';
  form.querySelector('[name="stock"]').value = p.stock;
  form.querySelector('[name="category_id"]').value = p.category_id;
  form.querySelector('[name="power_wp"]').value = p.power_wp || '';
  form.querySelector('[name="description"]').value = p.description || '';
  form.querySelector('[name="image_url"]').value = p.image_url || '';
  form.querySelector('[name="active"]').checked = p.active;
  form.dataset.editing = article;
  document.getElementById('productFormSection')?.scrollIntoView({ behavior: 'smooth' });
}

function bindProductForm() {
  const form = document.getElementById('productForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const article = this.querySelector('[name="article"]').value.trim();
    const existing = adminProducts.find(p => p.article === article);
    const data = {
      article,
      name: this.querySelector('[name="name"]').value.trim(),
      brand: this.querySelector('[name="brand"]').value.trim(),
      price: parseInt(this.querySelector('[name="price"]').value),
      old_price: parseInt(this.querySelector('[name="old_price"]').value) || null,
      stock: parseInt(this.querySelector('[name="stock"]').value),
      category_id: this.querySelector('[name="category_id"]').value,
      category_name: this.querySelector('[name="category_id"]').selectedOptions[0]?.text || '',
      power_wp: parseInt(this.querySelector('[name="power_wp"]').value) || null,
      description: this.querySelector('[name="description"]').value,
      image_url: this.querySelector('[name="image_url"]').value,
      active: this.querySelector('[name="active"]').checked,
      currency: 'RUB',
      unit: 'шт',
      warranty_years: 12,
      images: [],
      specifications: {},
      sort: existing?.sort || 999
    };
    if (existing) {
      Object.assign(existing, data);
      showNotification('✅ Товар обновлён');
    } else {
      adminProducts.unshift(data);
      showNotification('✅ Товар добавлен');
    }
    saveProducts();
    renderProductsTable(adminProducts);
    form.reset();
    delete form.dataset.editing;
  });
}

function populateCategoryFilter() {
  const sel = document.getElementById('filterCategory');
  if (!sel) return;
  const cats = [...new Set(adminProducts.map(p => p.category_id))];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = adminProducts.find(p => p.category_id === c)?.category_name || c;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    const val = sel.value;
    renderProductsTable(val ? adminProducts.filter(p => p.category_id === val) : adminProducts);
  });
}

// Product search
document.getElementById('productSearch')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderProductsTable(adminProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.article.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q)
  ));
});

// ============================================================
// Orders Management
// ============================================================
let adminOrders = [];

function loadAdminOrders() {
  const stored = localStorage.getItem(ORDERS_KEY);
  adminOrders = stored ? JSON.parse(stored) : [];
  renderOrdersTable(adminOrders);
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:40px">Заказов пока нет</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
  <tr>
    <td><strong>${o.order_id}</strong></td>
    <td>${new Date(o.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
    <td>${o.client_name}<br><span style="font-size:12px;color:var(--text-muted)">${o.client_phone}</span></td>
    <td>${o.items.length} поз.</td>
    <td><strong>${formatPrice(o.total)}</strong></td>
    <td><span class="status-badge ${o.status}">${statusLabel(o.status)}</span></td>
    <td>
      <select style="border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:12px"
        onchange="changeOrderStatus('${o.order_id}', this.value)">
        ${['new','processing','delivered','cancelled'].map(s =>
          `<option value="${s}" ${o.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`
        ).join('')}
      </select>
    </td>
  </tr>`).join('');

  document.getElementById('ordersCount').textContent = orders.length;
}

function statusLabel(s) {
  return { new: 'Новый', processing: 'В работе', delivered: 'Доставлен', cancelled: 'Отменён' }[s] || s;
}

async function changeOrderStatus(orderId, newStatus) {
  const o = adminOrders.find(x => x.order_id === orderId);
  if (!o) return;
  o.status = newStatus;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(adminOrders));
  renderOrdersTable(adminOrders);

  const msg = `📋 <b>Статус заказа изменён</b>
🔖 Заказ: ${orderId}
👤 Клиент: ${o.client_name}
📱 Телефон: ${o.client_phone}
📦 Новый статус: <b>${statusLabel(newStatus)}</b>`;
  await sendToTelegram(msg);
  showNotification('Статус обновлён');
}

document.getElementById('filterStatus')?.addEventListener('change', function () {
  const val = this.value;
  renderOrdersTable(val ? adminOrders.filter(o => o.status === val) : adminOrders);
});

// ============================================================
// Tab navigation
// ============================================================
function bindAdminNav() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.remove('hidden');
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
}

// ============================================================
// Init
// ============================================================
if (document.getElementById('adminLogin')) {
  const isAuth = sessionStorage.getItem('admin_auth') === 'ok';
  if (isAuth) {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminMain').classList.remove('hidden');
    initAdmin();
  } else {
    adminAuth();
  }
}
