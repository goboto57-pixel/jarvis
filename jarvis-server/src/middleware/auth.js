// Простая проверка токена: и приложение, и сайт шлют
// заголовок Authorization: Bearer <AUTH_TOKEN>.
// Без этого любой в интернете сможет дергать твой сервер и тратить твои API-ключи.

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: "Неверный или отсутствующий токен" });
  }
  next();
}

module.exports = { requireAuth };
