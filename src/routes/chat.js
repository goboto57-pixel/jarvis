// Живой вопрос-ответ: и приложение (в серверном режиме), и сайт
// могут стучаться сюда напрямую, без ожидания расписания.

const express = require("express");
const { v4: uuid } = require("uuid");
const { chatCompleteWithTools } = require("../services/mistral");
const { DEVICE_COMMANDS } = require("../deviceCommands");
const { db } = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Нужно поле message" });

  try {
    const outcome = await chatCompleteWithTools(message);
    let reply;

    if (outcome.type === "call") {
      const known = DEVICE_COMMANDS.some((c) => c.action === outcome.name);
      if (!known) {
        reply = `ИИ попытался вызвать неизвестную команду '${outcome.name}'`;
      } else {
        // Сервер не может выполнить действие сам — только поставить в очередь.
        // Телефон заберёт её в следующем цикле опроса (если он на связи).
        const command = {
          id: uuid(),
          action: outcome.name,
          args: outcome.args || {},
          status: "pending",
          result: null,
          createdAt: new Date().toISOString(),
          sentAt: null,
          finishedAt: null,
        };
        await db.read();
        db.data.deviceCommands.unshift(command);
        db.data.deviceCommands = db.data.deviceCommands.slice(0, 200);
        await db.write();

        const label = DEVICE_COMMANDS.find((c) => c.action === outcome.name)?.label || outcome.name;
        reply = `Поставил команду телефону: «${label}». Выполнится, как только телефон будет на связи (включено фоновое прослушивание).`;
      }
    } else {
      reply = outcome.text;
    }

    await db.read();
    db.data.history.unshift({
      id: `chat-${Date.now()}`,
      taskId: null,
      prompt: message,
      result: reply,
      ranAt: new Date().toISOString(),
    });
    db.data.history = db.data.history.slice(0, 200);
    await db.write();

    res.json({ reply });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
