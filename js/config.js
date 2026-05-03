// Telegram Bot Configuration
// Получите токен у @BotFather в Telegram
const TELEGRAM_TOKEN = 'ВАШ_ТОКЕН';
const TELEGRAM_CHAT_ID = 'ВАШ_CHAT_ID';

// Admin Panel
const ADMIN_PASSWORD = 'greentarif2024';

// Store Settings
const STORE_CONFIG = {
  name: 'GreenTarif',
  phone: '+7 (861) 200-50-30',
  email: 'info@greentarif.ru',
  address: 'г. Краснодар, ул. Красная, 139',
  workingHours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-16:00',
  currency: 'RUB',
  deliveryCost: 2500,
  freeDeliveryFrom: 100000,
  // Savings counter base value and growth rate
  savingsBase: 4850000,          // Стартовое значение экономии (₽)
  savingsPerMinute: 38,          // Рост в минуту (₽) — среднее по системам
  savingsStartDate: '2024-01-01T00:00:00'
};

// Krasnodar region solar calculation constants
const SOLAR_CALC = {
  tariff: 5.5,            // ₽/кВт·ч — тариф ТКЭ Краснодар
  insolation: 1400,       // кВт·ч/кВт в год — инсоляция Краснодар
  systemCostPerKw: 80000, // ₽/кВт — стоимость системы под ключ
  efficiency: 0.8,        // КПД системы с учётом потерь
};
