// Отправка push-уведомлений через ntfy (https://ntfy.sh или свой сервер).
// Никакого Firebase/аккаунта не нужно: просто POST на топик.
// Приложение на телефоне подписывается на этот же топик через ntfy Android SDK
// (или официальное приложение ntfy на время теста).

const fetch = require("node-fetch");

const NTFY_SERVER = process.env.NTFY_SERVER || "https://ntfy.sh";
const NTFY_TOPIC = process.env.NTFY_TOPIC;

async function sendPush({ title, message, priority = "default" }) {
  if (!NTFY_TOPIC) {
    console.warn("[notify] NTFY_TOPIC не задан — уведомление не отправлено");
    return;
  }

  const res = await fetch(`${NTFY_SERVER}/${NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Title: title || "Jarvis",
      Priority: priority, // min | low | default | high | urgent
    },
    body: message,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ntfy вернул ${res.status}: ${text}`);
  }
}

module.exports = { sendPush };
