const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Rota principal: decide página conforme login
app.get("/", (req, res) => {
  if (!req.session.userId) {
    return res.sendFile(path.join(__dirname, "public", "auth.html"));
  }
  return res.sendFile(path.join(__dirname, "public", "app.html"));
});

// Serve arquivos estáticos (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// --- BANCO DE DADOS ---
const db = new sqlite3.Database("./astro.db");

// Cria tabelas automaticamente
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      sign TEXT,
      birth_date TEXT,
      birth_time TEXT,
      city TEXT
    )
  `);
});

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/?error=notlogged");
  }
  next();
}

// --- ROTAS ---

// Cadastro
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, password],
    function (err) {
      if (err) return res.send("Erro ao cadastrar: " + err.message);
      res.redirect("/?registered=1");
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (err) return res.send("Erro: " + err.message);
      if (!user) return res.redirect("/?error=invalid");

      req.session.userId = user.id;
      res.redirect("/");
    }
  );
});

// Criar mapa
app.post("/createmap", requireLogin, (req, res) => {
  const { birth_date, birth_time, city } = req.body;

  // Geração simples de signo (placeholder)
  const fakeSigns = ["Áries", "Touro", "Gêmeos", "Câncer"];
  const randomSign = fakeSigns[Math.floor(Math.random() * fakeSigns.length)];

  db.run(
    "INSERT INTO maps (user_id, sign, birth_date, birth_time, city) VALUES (?, ?, ?, ?, ?)",
    [req.session.userId, randomSign, birth_date, birth_time, city],
    function (err) {
      if (err) return res.send("Erro ao criar mapa: " + err.message);

      // Retornamos o ID do mapa criado
      res.redirect("/?map_id=" + this.lastID);
    }
  );
});

// API para retornar mapa em JSON
app.get("/api/map/:id", requireLogin, (req, res) => {
  db.get(
    "SELECT * FROM maps WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.userId],
    (err, map) => {
      if (err) return res.json({ error: err.message });
      if (!map) return res.json({ error: "Mapa não encontrado" });
      res.json(map);
    }
  );
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Iniciar servidor
app.listen(4300, () => console.log("Servidor rodando http://localhost:4300"));
