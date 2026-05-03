// ============================================================
// GreenTarif — Main JS
// ============================================================

// Burger menu
const burger = document.getElementById('burger');
const nav = document.getElementById('mainNav');
if (burger && nav) {
  burger.addEventListener('click', () => nav.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !nav.contains(e.target)) nav.classList.remove('open');
  });
}

// Active nav link
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();

// ============================================================
// Savings ticker
// ============================================================
(function initSavingsTicker() {
  const el = document.getElementById('savingsAmount');
  if (!el) return;
  const start = new Date(STORE_CONFIG.savingsStartDate).getTime();
  const minutesElapsed = (Date.now() - start) / 60000;
  let current = STORE_CONFIG.savingsBase + Math.floor(minutesElapsed * STORE_CONFIG.savingsPerMinute);

  function formatRub(n) {
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  el.textContent = formatRub(current);
  setInterval(() => {
    current += Math.floor(STORE_CONFIG.savingsPerMinute / 60);
    el.textContent = formatRub(current);
  }, 1000);
})();

// ============================================================
// Solar Hours Widget
// ============================================================
(function initSolarHours() {
  const hoursEl = document.getElementById('solarHoursToday');
  const earnedEl = document.getElementById('solarEarnedToday');
  if (!hoursEl && !earnedEl) return;

  function getSolarHours() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    // Avg daylight hours in Krasnodar by month
    const avgHours = [8.5, 9.5, 11.5, 13.5, 15, 15.5, 15, 13.5, 11.5, 9.5, 8, 7.5];
    const peakHours = [3.5, 4.5, 5.5, 6.0, 6.5, 7.0, 7.0, 6.5, 5.5, 4.5, 3.5, 3.0];
    const hour = now.getHours() + now.getMinutes() / 60;
    const daylight = avgHours[month];
    const sunrise = 12 - daylight / 2;
    const sunset = 12 + daylight / 2;
    const fraction = Math.max(0, Math.min(1, (hour - sunrise) / (sunset - sunrise)));
    return (peakHours[month] * fraction).toFixed(1);
  }

  function getEarnedToday() {
    const solarHours = parseFloat(getSolarHours());
    // Avg 5 kW installed across clients, 5.5 rub/kWh, assume 50 active clients
    const earned = Math.floor(solarHours * 5 * 5.5 * 50);
    return earned;
  }

  function update() {
    if (hoursEl) hoursEl.textContent = getSolarHours();
    if (earnedEl) earnedEl.textContent = getEarnedToday().toLocaleString('ru-RU') + ' ₽';
  }

  update();
  setInterval(update, 60000);
})();

// ============================================================
// Mini Calculator (homepage)
// ============================================================
(function initMiniCalc() {
  const form = document.getElementById('miniCalcForm');
  if (!form) return;

  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);

  function calculate() {
    const bill = parseFloat(document.getElementById('monthlyBill')?.value) || 0;
    const type = document.getElementById('objectType')?.value || 'house';
    if (bill < 100) return;

    const tariff = SOLAR_CALC.tariff;
    const insolation = SOLAR_CALC.insolation;
    const costPerKw = SOLAR_CALC.systemCostPerKw;

    const monthlyKwh = bill / tariff;
    const yearlyKwh = monthlyKwh * 12;

    // Coverage coefficient by object type
    const coverage = type === 'business' ? 0.9 : type === 'dacha' ? 1.0 : 0.85;
    const neededKw = (yearlyKwh * coverage) / (insolation * SOLAR_CALC.efficiency);
    const systemKw = Math.ceil(neededKw * 10) / 10;

    const annualSaving = Math.round(yearlyKwh * coverage * tariff);
    const systemCost = Math.round(systemKw * costPerKw);
    const payback = (systemCost / annualSaving).toFixed(1);

    const res = document.getElementById('miniCalcResult');
    if (res) {
      document.getElementById('resSaving').textContent = annualSaving.toLocaleString('ru-RU') + ' ₽';
      document.getElementById('resPayback').textContent = payback + ' лет';
      document.getElementById('resPower').textContent = systemKw + ' кВт';
      res.classList.add('visible');

      // Store for modal
      form.dataset.saving = annualSaving;
      form.dataset.payback = payback;
      form.dataset.power = systemKw;
    }
  }
})();

// ============================================================
// Callback / Request forms → Telegram
// ============================================================
async function sendToTelegram(text) {
  if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN === 'ВАШ_ТОКЕН') {
    console.log('Telegram not configured. Message:', text);
    return true;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' })
    });
    return res.ok;
  } catch (e) {
    console.error('Telegram error:', e);
    return false;
  }
}

// Callback modal
const callbackBtns = document.querySelectorAll('[data-modal="callback"]');
const callbackModal = document.getElementById('callbackModal');
const callbackClose = callbackModal?.querySelector('.modal-close');
const callbackForm = document.getElementById('callbackForm');

callbackBtns.forEach(btn => btn.addEventListener('click', () => openModal(callbackModal)));
callbackClose?.addEventListener('click', () => closeModal(callbackModal));
callbackModal?.addEventListener('click', e => { if (e.target === callbackModal) closeModal(callbackModal); });

callbackForm?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const name = this.querySelector('[name="name"]').value;
  const phone = this.querySelector('[name="phone"]').value;
  const time = this.querySelector('[name="time"]')?.value || 'Любое';
  const msg = `📞 <b>Заявка на обратный звонок</b>\n👤 Имя: ${name}\n📱 Телефон: ${phone}\n🕐 Удобное время: ${time}`;
  await sendToTelegram(msg);
  showSuccess(callbackModal);
});

// Calculator lead form
const calcLeadForm = document.getElementById('calcLeadForm');
calcLeadForm?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const miniForm = document.getElementById('miniCalcForm');
  const name = this.querySelector('[name="name"]').value;
  const phone = this.querySelector('[name="phone"]').value;
  const saving = miniForm?.dataset.saving || '?';
  const payback = miniForm?.dataset.payback || '?';
  const power = miniForm?.dataset.power || '?';
  const bill = document.getElementById('monthlyBill')?.value || '?';
  const type = document.getElementById('objectType')?.value || '?';
  const msg = `🌞 <b>Заявка с калькулятора</b>\n👤 Имя: ${name}\n📱 Телефон: ${phone}\n\n📊 Результат расчёта:\n💡 Счёт за свет: ${bill} ₽/мес\n🏠 Тип объекта: ${type}\n⚡ Рекомендуемая мощность: ${power} кВт\n💰 Экономия в год: ${saving} ₽\n📅 Окупаемость: ${payback} лет`;
  await sendToTelegram(msg);
  const modal = document.getElementById('calcLeadModal');
  showSuccess(modal);
});

const calcLeadBtns = document.querySelectorAll('[data-modal="calcLead"]');
const calcLeadModal = document.getElementById('calcLeadModal');
calcLeadBtns.forEach(btn => btn.addEventListener('click', () => openModal(calcLeadModal)));
calcLeadModal?.querySelector('.modal-close')?.addEventListener('click', () => closeModal(calcLeadModal));
calcLeadModal?.addEventListener('click', e => { if (e.target === calcLeadModal) closeModal(calcLeadModal); });

// ============================================================
// Modal helpers
// ============================================================
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  const form = modal.querySelector('form');
  if (form) form.reset();
  const success = modal.querySelector('.modal-success');
  if (success) success.classList.add('hidden');
  const formWrap = modal.querySelector('.modal-form');
  if (formWrap) formWrap.classList.remove('hidden');
}

function showSuccess(modal) {
  if (!modal) return;
  const success = modal.querySelector('.modal-success');
  const formWrap = modal.querySelector('.modal-form');
  if (success) success.classList.remove('hidden');
  if (formWrap) formWrap.classList.add('hidden');
  setTimeout(() => closeModal(modal), 3000);
}

// ============================================================
// Notification toast
// ============================================================
function showNotification(msg, duration = 3000) {
  let n = document.getElementById('notification');
  if (!n) {
    n = document.createElement('div');
    n.id = 'notification';
    n.className = 'notification';
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.classList.add('show');
  clearTimeout(n._timer);
  n._timer = setTimeout(() => n.classList.remove('show'), duration);
}

// ============================================================
// Load products helper
// ============================================================
async function loadProducts() {
  try {
    const r = await fetch('data/products.json');
    return await r.json();
  } catch {
    return [];
  }
}

async function loadCategories() {
  try {
    const r = await fetch('data/categories.json');
    return await r.json();
  } catch {
    return [];
  }
}

function formatPrice(p) {
  return p.toLocaleString('ru-RU') + ' ₽';
}

function getStockLabel(stock) {
  if (stock <= 0) return '<span class="product-stock out">Нет в наличии</span>';
  if (stock <= 5) return `<span class="product-stock low">Осталось ${stock} шт</span>`;
  return `<span class="product-stock">В наличии: ${stock} шт</span>`;
}

function buildProductCard(p) {
  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  const power = p.power_wp ? `⚡ ${p.power_wp} Вт` : (p.power_kw ? `⚡ ${p.power_kw} кВт` : (p.energy_kwh ? `🔋 ${p.energy_kwh} кВт·ч` : ''));
  return `
  <div class="product-card">
    ${discount ? `<span class="product-badge sale">-${discount}%</span>` : (p.hits ? '<span class="product-badge">Хит</span>' : '')}
    <div class="product-img-wrap">
      <a href="product.html?id=${p.article}">
        <img class="product-img" src="${p.image_url}" alt="${p.name}" loading="lazy">
      </a>
    </div>
    <div class="product-info">
      <div class="product-brand">${p.brand}</div>
      <a class="product-name" href="product.html?id=${p.article}">${p.name}</a>
      ${power ? `<span class="product-power">${power}</span>` : ''}
      ${getStockLabel(p.stock)}
      <div class="product-price-row">
        <span class="product-price">${formatPrice(p.price)}</span>
        ${p.old_price ? `<span class="product-old-price">${formatPrice(p.old_price)}</span>` : ''}
      </div>
    </div>
    <div class="product-actions">
      <button class="btn-cart" onclick="cartAdd('${p.article}')">🛒 В корзину</button>
      <button class="btn-quick" onclick="openQuickBuy('${p.article}', '${p.name}')">1 клик</button>
    </div>
  </div>`;
}

// Quick buy modal
function openQuickBuy(article, name) {
  const modal = document.getElementById('quickBuyModal');
  if (!modal) return;
  modal.querySelector('#quickBuyProductName').textContent = name;
  modal.querySelector('#quickBuyArticle').value = article;
  openModal(modal);
}

const quickBuyModal = document.getElementById('quickBuyModal');
quickBuyModal?.querySelector('.modal-close')?.addEventListener('click', () => closeModal(quickBuyModal));
quickBuyModal?.addEventListener('click', e => { if (e.target === quickBuyModal) closeModal(quickBuyModal); });

const quickBuyForm = document.getElementById('quickBuyForm');
quickBuyForm?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const name = this.querySelector('[name="name"]').value;
  const phone = this.querySelector('[name="phone"]').value;
  const article = this.querySelector('[name="article"]').value;
  const productName = document.getElementById('quickBuyProductName')?.textContent || article;
  const msg = `⚡ <b>Купить в 1 клик</b>\n📦 Товар: ${productName}\n🔖 Артикул: ${article}\n👤 Имя: ${name}\n📱 Телефон: ${phone}`;
  await sendToTelegram(msg);
  showSuccess(quickBuyModal);
});

// Highlight active nav on page load
document.querySelectorAll('nav a').forEach(a => {
  if (a.href === location.href) a.classList.add('active');
});
