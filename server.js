const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/chat", async (req, res) => {
  try {
    const resposta = await fetch("https://georg-ml7854jc-swedencentral.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.2-chat",
        messages: [
          { role: "user", content: req.body.pergunta }
        ]
      })
    });

    const data = await resposta.json();
    res.json(data);

  } catch (erro) {
    res.json({ erro: "Erro no servidor" });
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});