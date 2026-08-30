require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { initDb } = require("./db");
const { initScheduler } = require("./scheduler");
const { requireAuth } = require("./middleware/auth");

const tasksRouter = require("./routes/tasks");
const chatRouter = require("./routes/chat");
const deviceRouter = require("./routes/device");

const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Проверка живости — Render дергает этот путь, чтобы понять, что сервис жив.
// Без авторизации, специально.
app.get("/health", (req, res) => res.json({ ok: true }));

// Всё остальное — только с токеном
app.use("/tasks", requireAuth, tasksRouter);
app.use("/chat", requireAuth, chatRouter);
app.use("/device", requireAuth, deviceRouter);

const PORT = process.env.PORT || 3000;

async function main() {
  await initDb();
  await initScheduler();
  app.listen(PORT, () => console.log(`[jarvis-server] слушаю порт ${PORT}`));
}

main().catch((err) => {
  console.error("Не удалось запустить сервер:", err);
  process.exit(1);
});
