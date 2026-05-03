// Telegram Bot Configuration
// 1. Создайте бота у @BotFather в Telegram
// 2. Скопируйте этот файл в js/config.js
// 3. Вставьте свои значения ниже
const TELEGRAM_TOKEN = '';
const TELEGRAM_CHAT_ID = '';

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
  savingsBase: 4850000,
  savingsPerMinute: 38,
  savingsStartDate: '2024-01-01T00:00:00'
};

// Krasnodar region solar calculation constants
const SOLAR_CALC = {
  tariff: 5.5,            // ₽/кВт·ч — тариф ТКЭ Краснодар
  insolation: 1400,       // кВт·ч/кВт в год — инсоляция Краснодар
  systemCostPerKw: 80000, // ₽/кВт — стоимость системы под ключ
  efficiency: 0.8,        // КПД системы с учётом потерь
};
