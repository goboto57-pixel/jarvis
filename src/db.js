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
const defaultData = {
  tasks: [],
  history: [],
  // Команды "сайт → телефон" (вкладка "Телефон") и последний контакт устройства.
  deviceCommands: [],
  deviceStatus: { lastSeenAt: null, battery: null },
};
const db = new Low(adapter, defaultData);

async function initDb() {
  await db.read();
  db.data ||= defaultData;
  // На случай апгрейда со старого data.json (там могли не быть новых полей
  // deviceCommands/deviceStatus) — дозаполняем, не трогая существующие данные.
  for (const key of Object.keys(defaultData)) {
    if (db.data[key] === undefined) db.data[key] = defaultData[key];
  }
  await db.write();
}

module.exports = { db, initDb };
