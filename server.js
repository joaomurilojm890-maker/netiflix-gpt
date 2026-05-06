import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// 🔥 LIBERA ACESSO EXTERNO (celular / outros dispositivos)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Servidor rodando em:`);
  console.log(`👉 Local: http://localhost:${PORT}`);
  console.log(`👉 Rede: http://SEU_IP:${PORT}`);
});

// 📁 frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// 🧠 memória simples
let historico = [];
let perfilUsuario = {
  generoFavorito: null
};

function detectarGenero(msg) {
  if (msg.includes("ação")) return "ação";
  if (msg.includes("terror")) return "terror";
  if (msg.includes("romance")) return "romance";
  if (msg.includes("comédia")) return "comédia";
  return null;
}

// 🤖 CHAT BOT DE FILMES INTELIGENTE
app.post("/api/chat", (req, res) => {
  const pergunta = req.body.pergunta;

  console.log("Pergunta:", pergunta);

  if (!pergunta) {
    return res.json({ resposta: "Me pergunta algo sobre filmes 😄" });
  }

  const msg = pergunta.toLowerCase();

  historico.push(pergunta);
  if (historico.length > 8) historico.shift();

  const genero = detectarGenero(msg);

  if (genero) {
    perfilUsuario.generoFavorito = genero;
  }

  let resposta = "";

  if (msg.includes("oi") || msg.includes("olá") || msg.includes("fala")) {
    resposta = "Oi 😄 Quer recomendações de filmes ou já tem um gênero?";
  }

  else if (msg.includes("recomenda") || msg.includes("filme")) {
    if (perfilUsuario.generoFavorito === "ação") {
      resposta = "🔥 Ação: John Wick, Vingadores, Mad Max";
    }
    else if (perfilUsuario.generoFavorito === "terror") {
      resposta = "👻 Terror: Hereditário, It, Invocação do Mal";
    }
    else if (perfilUsuario.generoFavorito === "romance") {
      resposta = "❤️ Romance: Titanic, Diário de uma Paixão";
    }
    else if (perfilUsuario.generoFavorito === "comédia") {
      resposta = "😂 Comédia: Superbad, Se Beber Não Case";
    }
    else {
      resposta = "Me fala um gênero (ação, terror, romance, comédia) 🎬";
    }
  }

  else if (genero === "ação") {
    resposta = "🔥 Ação: John Wick, Mad Max, Vingadores";
  }
  else if (genero === "terror") {
    resposta = "👻 Terror: Hereditário, It, Invocação do Mal";
  }
  else if (genero === "romance") {
    resposta = "❤️ Romance: Titanic, Diário de uma Paixão";
  }
  else if (genero === "comédia") {
    resposta = "😂 Comédia: Superbad, Se Beber Não Case";
  }

  else {
    resposta = `Entendi 😄 você disse: "${pergunta}". Quer recomendações de filmes?`;
  }

  res.json({
    resposta,
    historico,
    perfilUsuario
  });
});