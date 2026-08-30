// Обёртка над Mistral AI chat/completions для серверных задач.
//
// ВАЖНО: обычная модель Mistral не "ходит в интернет" сама по себе — она
// отвечает по своим знаниям (с датой отсечки), а не читает live-новости.
// Для задач вида "найди в новостях X" на будущее подключи модель/провайдера
// с поддержкой поиска (например через агента с tool "web_search" или
// сторонний news API типа NewsAPI/GNews) — это отдельная доработка.
// Пока runTask честно предупреждает об этом в ответе, если это похоже
// на запрос новостей.

const fetch = require("node-fetch");

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const CHAT_MODEL = "mistral-small-latest";

async function chatComplete(prompt) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mistral вернул ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "(пустой ответ)";
}

module.exports = { chatComplete };
