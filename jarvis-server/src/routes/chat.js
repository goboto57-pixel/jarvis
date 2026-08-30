// Живой вопрос-ответ: и приложение (в серверном режиме), и сайт
// могут стучаться сюда напрямую, без ожидания расписания.

const express = require("express");
const { chatComplete } = require("../services/mistral");
const { db } = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Нужно поле message" });

  try {
    const reply = await chatComplete(message);

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
