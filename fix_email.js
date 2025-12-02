const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./astro.db");

// Configuração
const idDoHacker = 6; // Vi no seu print que seu ID é 6
const emailCorreto = "hacked_admin@astrovibe.com"; // O email limpo, sem aspas extras

db.serialize(() => {
    console.log(`Tentando corrigir o email do usuário ID ${idDoHacker}...`);

    // Comando SQL direto para forçar a atualização
    db.run(
        "UPDATE users SET email = ? WHERE id = ?",
        [emailCorreto, idDoHacker],
        function(err) {
            if (err) {
                return console.error("❌ Erro ao atualizar:", err.message);
            }
            console.log(`✅ Sucesso! Linhas alteradas: ${this.changes}`);
        }
    );

    // Verificação final
    db.each(`SELECT * FROM users WHERE id = ${idDoHacker}`, (err, row) => {
        console.log("--- ESTADO ATUAL NO BANCO ---");
        console.log(row);
        console.log("-----------------------------");
        console.log("Agora tente logar com:");
        console.log(`Email: ${row.email}`);
        console.log(`Senha: (Sua senha original, ex: 'teste1234')`);
    });
});