// Простое хранилище на JSON-файле. Хватает для одного пользователя (тебя).
//
// ВАЖНО про Render: на бесплатном плане диск эфемерный — при новом деплое
// (git push) файл data.json пересоздастся пустым. Если это станет проблемой,
// смотри README.md → "Переезд на Postgres".

const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

const file = path.join(__dirname, "..", "data.json");
const adapter = new JSONFile(file);
const defaultData = { tasks: [], history: [] };
const db = new Low(adapter, defaultData);

async function initDb() {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

module.exports = { db, initDb };
