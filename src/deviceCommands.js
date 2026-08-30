// Каталог команд, которые умеет выполнять телефон (см. Android:
// CommandRegistry.kt). Здесь только для того, чтобы сайт мог построить
// форму (какие поля показать), сама команда выполняется на телефоне.
//
// params[].type: "text" | "number"

const DEVICE_COMMANDS = [
  { action: "flashlight_on", label: "Фонарик: включить", params: [] },
  { action: "flashlight_off", label: "Фонарик: выключить", params: [] },
  {
    action: "set_volume",
    label: "Громкость медиа",
    params: [{ name: "percent", type: "number", label: "Процент (0-100)" }],
  },
  { action: "mute_media", label: "Заглушить медиа", params: [] },
  {
    action: "set_brightness",
    label: "Яркость экрана",
    params: [{ name: "percent", type: "number", label: "Процент (0-100)" }],
  },
  { action: "wifi_on", label: "Wi-Fi: включить", params: [] },
  { action: "wifi_off", label: "Wi-Fi: выключить", params: [] },
  { action: "bluetooth_on", label: "Bluetooth: включить", params: [] },
  { action: "bluetooth_off", label: "Bluetooth: выключить", params: [] },
  { action: "dnd_on", label: "Не беспокоить: включить", params: [] },
  { action: "dnd_off", label: "Не беспокоить: выключить", params: [] },
  {
    action: "open_app",
    label: "Открыть приложение",
    params: [{ name: "app_name", type: "text", label: "Название приложения" }],
  },
  {
    action: "call_number",
    label: "Позвонить",
    params: [{ name: "number", type: "text", label: "Номер телефона" }],
  },
  {
    action: "send_sms",
    label: "Отправить SMS",
    params: [
      { name: "number", type: "text", label: "Номер телефона" },
      { name: "text", type: "text", label: "Текст сообщения" },
    ],
  },
  {
    action: "set_alarm",
    label: "Поставить будильник",
    params: [
      { name: "hour", type: "number", label: "Час (0-23)" },
      { name: "minute", type: "number", label: "Минута (0-59)" },
      { name: "label", type: "text", label: "Метка (необязательно)" },
    ],
  },
  {
    action: "set_timer",
    label: "Запустить таймер",
    params: [
      { name: "seconds", type: "number", label: "Секунды" },
      { name: "label", type: "text", label: "Метка (необязательно)" },
    ],
  },
  {
    action: "set_reminder",
    label: "Поставить напоминание",
    params: [
      { name: "hour", type: "number", label: "Час (0-23)" },
      { name: "minute", type: "number", label: "Минута (0-59)" },
      { name: "text", type: "text", label: "О чём напомнить" },
    ],
  },
  { action: "go_home", label: "Домой", params: [] },
  { action: "go_back", label: "Назад", params: [] },
  { action: "open_recents", label: "Недавние приложения", params: [] },
  { action: "open_notifications", label: "Шторка уведомлений", params: [] },
  { action: "open_quick_settings", label: "Быстрые настройки", params: [] },
  { action: "take_screenshot", label: "Сделать скриншот", params: [] },
  { action: "lock_screen", label: "Заблокировать экран", params: [] },
  { action: "scroll_down", label: "Прокрутить вниз", params: [] },
  { action: "scroll_up", label: "Прокрутить вверх", params: [] },
  {
    action: "tap_by_text",
    label: "Нажать на элемент экрана по тексту",
    params: [{ name: "text", type: "text", label: "Видимый текст элемента" }],
  },
];

module.exports = { DEVICE_COMMANDS };
