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
const { DEVICE_COMMANDS } = require("../deviceCommands");

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

// Каталог устройства -> формат "tools" для function calling Mistral.
function deviceCommandsAsTools() {
  return DEVICE_COMMANDS.map((cmd) => ({
    type: "function",
    function: {
      name: cmd.action,
      description: cmd.label,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          cmd.params.map((p) => [p.name, { type: p.type === "number" ? "integer" : "string", description: p.label }])
        ),
      },
    },
  }));
}

const TOOLS_SYSTEM_PROMPT =
  "Ты — ассистент Джарвис, отвечаешь через веб-панель управления (не сам телефон). " +
  "Если запрос явно про управление телефоном — вызови подходящую функцию из списка инструментов " +
  "(команда будет поставлена в очередь и выполнится на телефоне, когда он будет на связи). " +
  "Если это обычный вопрос без действия на устройстве — просто ответь текстом кратко и по-русски.";

/**
 * То же самое, что chatComplete, но с function calling: модель может либо
 * ответить текстом, либо попросить выполнить команду на телефоне.
 * Возвращает { type: "text", text } или { type: "call", name, args }.
 */
async function chatCompleteWithTools(prompt) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: TOOLS_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      tools: deviceCommandsAsTools(),
      tool_choice: "auto",
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mistral вернул ${res.status}: ${text}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.[0]?.function;

  if (toolCall) {
    let args = {};
    try { args = JSON.parse(toolCall.arguments || "{}"); } catch (e) { /* игнор */ }
    return { type: "call", name: toolCall.name, args };
  }

  return { type: "text", text: (message?.content || "(пустой ответ)").trim() };
}

module.exports = { chatComplete, chatCompleteWithTools };
