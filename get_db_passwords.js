const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./astro.db");

db.serialize(() => {
    console.log("--- TABELA USERS ---");
    db.each("SELECT * FROM users", (err, row) => {
        console.log(row);
    });
});