// Канал "сайт → телефон". Без push-инфраструктуры (FCM и т.п.): телефон сам
// периодически спрашивает сервер "есть новые команды?" (поллинг из
// WakeWordService, пока включён "Фоновый режим" в приложении), выполняет
// и отчитывается результатом. Сайт кладёт команды и смотрит на статус/результат.

const express = require("express");
const { v4: uuid } = require("uuid");
const { db } = require("../db");
const { DEVICE_COMMANDS } = require("../deviceCommands");

const router = express.Router();

// Телефон считается "на связи", если heartbeat был не позже, чем это.
// Полный цикл поллинга на телефоне ~24 сек (heartbeat) — берём с запасом.
const ONLINE_THRESHOLD_MS = 60_000;

// Список доступных команд + какие поля показать — для формы на сайте.
router.get("/catalog", (req, res) => {
  res.json(DEVICE_COMMANDS);
});

// Сайт: поставить команду в очередь.
router.post("/commands", async (req, res) => {
  const { action, args } = req.body;
  if (!action) return res.status(400).json({ error: "Нужно поле action" });

  const known = DEVICE_COMMANDS.some((c) => c.action === action);
  if (!known) {
    return res.status(400).json({ error: `Неизвестная команда '${action}'` });
  }

  const command = {
    id: uuid(),
    action,
    args: args && typeof args === "object" ? args : {},
    status: "pending", // pending -> sent (телефон забрал) -> done/error
    result: null,
    createdAt: new Date().toISOString(),
    sentAt: null,
    finishedAt: null,
  };

  await db.read();
  db.data.deviceCommands.unshift(command);
  db.data.deviceCommands = db.data.deviceCommands.slice(0, 200);
  await db.write();

  res.status(201).json(command);
});

// Сайт: список команд для отображения (последние сверху).
router.get("/commands", async (req, res) => {
  await db.read();
  res.json(db.data.deviceCommands);
});

// Телефон: забрать ещё не отправленные команды.
router.get("/commands/pending", async (req, res) => {
  await db.read();
  const pending = db.data.deviceCommands.filter((c) => c.status === "pending");
  const now = new Date().toISOString();
  pending.forEach((c) => {
    c.status = "sent";
    c.sentAt = now;
  });
  if (pending.length > 0) await db.write();
  res.json(pending);
});

// Телефон: отчитаться результатом выполнения.
router.post("/commands/:id/result", async (req, res) => {
  const { status, result } = req.body;
  if (!["done", "error"].includes(status)) {
    return res.status(400).json({ error: "status должен быть 'done' или 'error'" });
  }

  await db.read();
  const command = db.data.deviceCommands.find((c) => c.id === req.params.id);
  if (!command) return res.status(404).json({ error: "Команда не найдена" });

  command.status = status;
  command.result = result || null;
  command.finishedAt = new Date().toISOString();
  await db.write();

  res.json(command);
});

// Телефон: "я на связи" + опционально заряд батареи.
router.post("/heartbeat", async (req, res) => {
  const { battery } = req.body;

  await db.read();
  db.data.deviceStatus = {
    lastSeenAt: new Date().toISOString(),
    battery: typeof battery === "number" ? battery : db.data.deviceStatus?.battery ?? null,
  };
  await db.write();

  res.json({ ok: true });
});

// Сайт: онлайн телефон или нет + заряд.
router.get("/status", async (req, res) => {
  await db.read();
  const status = db.data.deviceStatus || { lastSeenAt: null, battery: null };
  const online =
    !!status.lastSeenAt && Date.now() - new Date(status.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

  res.json({ online, lastSeenAt: status.lastSeenAt, battery: status.battery });
});

module.exports = router;
