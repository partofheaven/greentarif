// ============================================================
// GreenTarif — Calculator JS (Full page)
// ============================================================

const OBJECT_LABELS = { house: 'Частный дом', dacha: 'Дача / коттедж', business: 'Бизнес / производство' };
const OBJECT_COVERAGE = { house: 0.85, dacha: 1.0, business: 0.9 };

function calcSolarSystem(monthlyBill, objectType) {
  const tariff = SOLAR_CALC.tariff;
  const insolation = SOLAR_CALC.insolation;
  const costPerKw = SOLAR_CALC.systemCostPerKw;
  const efficiency = SOLAR_CALC.efficiency;
  const coverage = OBJECT_COVERAGE[objectType] || 0.85;

  const monthlyKwh = monthlyBill / tariff;
  const yearlyKwh = monthlyKwh * 12;
  const coveredKwh = yearlyKwh * coverage;

  const systemKw = Math.ceil((coveredKwh / (insolation * efficiency)) * 10) / 10;
  const annualSaving = Math.round(coveredKwh * tariff);
  const systemCost = Math.round(systemKw * costPerKw);
  const paybackYears = parseFloat((systemCost / annualSaving).toFixed(1));

  // Panel count (400W panels)
  const panelCount = Math.ceil(systemKw * 1000 / 400);
  const inverterKw = systemKw <= 3 ? 3 : systemKw <= 6 ? 5 : 10;
  const batteryCount = objectType === 'dacha' ? Math.ceil(systemKw / 5) : 1;

  return {
    systemKw, annualSaving, systemCost, paybackYears,
    panelCount, inverterKw, batteryCount,
    monthlyKwh: Math.round(monthlyKwh), yearlyKwh: Math.round(yearlyKwh),
    coverage: Math.round(coverage * 100),
    co2Saved: Math.round(coveredKwh * 0.5) // kg CO2 per year
  };
}

function buildSystemRecommendation(r, objectType) {
  const panelPrice = r.panelCount * 18500;
  const inverterPrice = r.inverterKw === 3 ? 55000 : r.inverterKw === 5 ? 85000 : 150000;
  const mountPrice = 22000;
  const installPrice = Math.round(r.systemKw * 15000);
  const total = panelPrice + inverterPrice + mountPrice + installPrice;

  return `
  <div class="recommended-system">
    <h4>🔧 Рекомендуемая комплектация для ${OBJECT_LABELS[objectType] || objectType}</h4>
    <div class="system-items">
      <div class="system-item">
        <span class="system-item-name">☀️ Солнечные панели JA Solar 400 Вт × ${r.panelCount} шт</span>
        <span class="system-item-price">${formatPrice(panelPrice)}</span>
      </div>
      <div class="system-item">
        <span class="system-item-name">⚡ Гибридный инвертор Growatt ${r.inverterKw} кВт</span>
        <span class="system-item-price">${formatPrice(inverterPrice)}</span>
      </div>
      <div class="system-item">
        <span class="system-item-name">🔧 Монтажная система K2 Systems</span>
        <span class="system-item-price">${formatPrice(mountPrice)}</span>
      </div>
      <div class="system-item">
        <span class="system-item-name">🏗️ Монтаж и пусконаладка под ключ</span>
        <span class="system-item-price">${formatPrice(installPrice)}</span>
      </div>
      <div class="system-item" style="background:var(--green-pale);font-weight:800">
        <span class="system-item-name" style="color:var(--green-dark)">💰 Итого под ключ</span>
        <span class="system-item-price" style="font-size:18px">${formatPrice(total)}</span>
      </div>
    </div>
  </div>`;
}

// Full calculator page
const fullCalcForm = document.getElementById('fullCalcForm');
if (fullCalcForm) {
  fullCalcForm.addEventListener('submit', function (e) {
    e.preventDefault();
    runFullCalc();
  });

  fullCalcForm.addEventListener('input', function () {
    const bill = parseFloat(this.querySelector('[name="monthlyBill"]')?.value) || 0;
    if (bill >= 100) runFullCalc();
  });
}

function runFullCalc() {
  const form = document.getElementById('fullCalcForm');
  if (!form) return;

  const bill = parseFloat(form.querySelector('[name="monthlyBill"]').value) || 0;
  const type = form.querySelector('[name="objectType"]').value;
  const area = parseInt(form.querySelector('[name="area"]')?.value) || 0;

  if (bill < 100) return;

  const r = calcSolarSystem(bill, type);
  const result = document.getElementById('fullCalcResult');
  if (!result) return;

  result.classList.add('visible');

  result.querySelector('#rcSaving').textContent = formatPrice(r.annualSaving);
  result.querySelector('#rcPayback').textContent = r.paybackYears + ' лет';
  result.querySelector('#rcPower').textContent = r.systemKw + ' кВт';
  result.querySelector('#rcCO2').textContent = r.co2Saved + ' кг';
  result.querySelector('#rcPanels').textContent = r.panelCount + ' шт';
  result.querySelector('#rcInverter').textContent = r.inverterKw + ' кВт';
  result.querySelector('#rcMonthlySaving').textContent = formatPrice(Math.round(r.annualSaving / 12));
  result.querySelector('#rcSystemCost').textContent = formatPrice(r.systemCost);

  const sysRec = result.querySelector('#systemRecommendation');
  if (sysRec) sysRec.innerHTML = buildSystemRecommendation(r, type);

  // Store for lead form
  form.dataset.result = JSON.stringify(r);
  form.dataset.bill = bill;
  form.dataset.type = type;

  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Lead form on calculator page
const calcPageLeadForm = document.getElementById('calcPageLeadForm');
calcPageLeadForm?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const mainForm = document.getElementById('fullCalcForm');
  const name = this.querySelector('[name="name"]').value;
  const phone = this.querySelector('[name="phone"]').value;
  const r = mainForm?.dataset.result ? JSON.parse(mainForm.dataset.result) : {};
  const bill = mainForm?.dataset.bill || '?';
  const type = OBJECT_LABELS[mainForm?.dataset.type] || '?';

  const msg = `🌞 <b>Заявка с расширенного калькулятора</b>
👤 Имя: ${name}
📱 Телефон: ${phone}

📊 <b>Параметры расчёта:</b>
🏠 Тип объекта: ${type}
💡 Счёт за свет: ${bill} ₽/мес

⚡ <b>Результат:</b>
🔆 Мощность системы: ${r.systemKw || '?'} кВт
☀️ Панелей: ${r.panelCount || '?'} шт
💰 Экономия в год: ${r.annualSaving ? formatPrice(r.annualSaving) : '?'}
📅 Окупаемость: ${r.paybackYears || '?'} лет
🌿 CO₂ в год: ${r.co2Saved || '?'} кг`;

  await sendToTelegram(msg);
  this.innerHTML = `<div class="modal-success" style="text-align:center;padding:20px">
    <div style="font-size:60px;margin-bottom:12px">✅</div>
    <h3 style="color:var(--green-dark)">Заявка отправлена!</h3>
    <p style="color:var(--text-muted)">Наш менеджер свяжется с вами в течение 30 минут</p>
  </div>`;
});
