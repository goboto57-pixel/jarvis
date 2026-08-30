// Планировщик: держит в памяти активные cron-задачи и выполняет их
// в заданное время, даже если телефон выключен/приложение закрыто —
// именно в этом и есть смысл сервера.

const cron = require("node-cron");
const { db } = require("./db");
const { chatComplete } = require("./services/mistral");
const { sendPush } = require("./services/notify");

// task.schedule — cron-строка, например "30 16 * * *" = каждый день в 16:30
// task.prompt   — что попросить сделать (текст запроса к Джарвису)
// task.once     — если true, задача выполнится один раз и удалится

const activeJobs = new Map(); // taskId -> объект cron job

function scheduleTask(task) {
  if (!cron.validate(task.schedule)) {
    throw new Error(`Некорректное cron-выражение: ${task.schedule}`);
  }

  const job = cron.schedule(task.schedule, () => runTask(task.id), {
    timezone: task.timezone || "Europe/Moscow",
  });

  activeJobs.set(task.id, job);
}

function unscheduleTask(taskId) {
  const job = activeJobs.get(taskId);
  if (job) {
    job.stop();
    activeJobs.delete(taskId);
  }
}

async function runTask(taskId) {
  await db.read();
  const task = db.data.tasks.find((t) => t.id === taskId);
  if (!task) return;

  let resultText;
  try {
    if (Array.isArray(task.steps) && task.steps.length > 0) {
      resultText = await runMultiStepTask(task.steps);
    } else {
      resultText = await chatComplete(task.prompt);
    }
  } catch (err) {
    resultText = `Ошибка при выполнении задачи: ${err.message}`;
  }

  db.data.history.unshift({
    id: `${taskId}-${Date.now()}`,
    taskId,
    prompt: task.prompt,
    result: resultText,
    ranAt: new Date().toISOString(),
  });
  db.data.history = db.data.history.slice(0, 200); // не раздуваем файл
  await db.write();

  await sendPush({
    title: "Джарвис выполнил задачу",
    message: resultText.slice(0, 500),
  }).catch((err) => console.error("[scheduler] push не отправлен:", err.message));

  if (task.once) {
    task.status = "done";
    unscheduleTask(taskId);
    await db.write();
  }
}

// Многошаговая задача: выполняет шаги по порядку, результат каждого
// предыдущего шага добавляется в промпт следующего как контекст —
// например шаг 1 "узнай, кто выиграл матч Астана вчера" → шаг 2
// "напиши по этому результату короткий пост" увидит результат шага 1.
async function runMultiStepTask(steps) {
  const results = [];
  let previous = "";

  for (let i = 0; i < steps.length; i++) {
    const contextPrefix = previous
      ? `Результат предыдущего шага: "${previous}"\n\nТеперь выполни: `
      : "";
    const stepResult = await chatComplete(`${contextPrefix}${steps[i]}`);
    results.push(`Шаг ${i + 1} (${steps[i]}):\n${stepResult}`);
    previous = stepResult;
  }

  return results.join("\n\n---\n\n");
}

// Вызывается один раз при старте сервера — поднимает все задачи из БД
async function initScheduler() {
  await db.read();
  for (const task of db.data.tasks) {
    if (task.status !== "done") {
      try {
        scheduleTask(task);
      } catch (err) {
        console.error(`[scheduler] не смог запланировать задачу ${task.id}:`, err.message);
      }
    }
  }
  console.log(`[scheduler] запущено активных задач: ${activeJobs.size}`);
}

module.exports = { initScheduler, scheduleTask, unscheduleTask, runTask };
