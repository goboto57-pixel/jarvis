const express = require("express");
const { v4: uuid } = require("uuid");
const { db } = require("../db");
const { scheduleTask, unscheduleTask, runTask } = require("../scheduler");

const router = express.Router();

// Список всех задач
router.get("/", async (req, res) => {
  await db.read();
  res.json(db.data.tasks);
});

// Создать новую задачу
// body: { prompt: "найди новости про ...", schedule: "30 16 * * *", timezone?, once? }
// ИЛИ многошаговая: { steps: ["шаг 1", "шаг 2"], schedule, once? }
router.post("/", async (req, res) => {
  const { prompt, steps, schedule, timezone, once } = req.body;

  if ((!prompt && !steps) || !schedule) {
    return res.status(400).json({ error: "Нужны prompt (или steps) и schedule" });
  }

  const task = {
    id: uuid(),
    prompt: prompt || null,
    steps: Array.isArray(steps) ? steps : null,
    schedule, // cron-выражение, например "30 16 * * *"
    timezone: timezone || "Europe/Moscow",
    once: Boolean(once),
    status: "active",
    createdAt: new Date().toISOString(),
  };

  try {
    scheduleTask(task); // бросит ошибку, если cron-строка кривая
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  await db.read();
  db.data.tasks.push(task);
  await db.write();

  res.status(201).json(task);
});

// Удалить задачу
router.delete("/:id", async (req, res) => {
  unscheduleTask(req.params.id);
  await db.read();
  db.data.tasks = db.data.tasks.filter((t) => t.id !== req.params.id);
  await db.write();
  res.status(204).end();
});

// Выполнить задачу прямо сейчас (для теста, не дожидаясь расписания)
router.post("/:id/run-now", async (req, res) => {
  await db.read();
  const task = db.data.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Задача не найдена" });

  await runTask(task.id);
  res.json({ ok: true });
});

// История выполненных задач
router.get("/history/all", async (req, res) => {
  await db.read();
  res.json(db.data.history);
});

module.exports = router;
