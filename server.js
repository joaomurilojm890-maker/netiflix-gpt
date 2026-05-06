import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🤖 CHAT PRINCIPAL
app.post("/api/chat", async (req, res) => {
  const { pergunta, modo } = req.body;

  if (!pergunta) {
    return res.json({ resposta: "Me pergunta algo 😄" });
  }

  // ⚔️ DEBATE ENTRE IAS
  if (modo === "debate") {
    try {
      // 🧠 GEMINI
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Você é um crítico de filmes. Opine sobre: ${pergunta}`
              }]
            }]
          })
        }
      );

      const geminiData = await geminiRes.json();

      const gemini =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Gemini não respondeu";

      // 🤖 GPT
      const gptRes = await fetch(
        process.env.PROF_API_BASE_URL + process.env.PROF_CHAT_PATH,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.PROF_BEARER_TOKEN}`
          },
          body: JSON.stringify({
            model: "gpt-5.2-chat",
            messages: [
              {
                role: "user",
                content: `Gemini disse: "${gemini}". Agora discuta sobre: ${pergunta}`
              }
            ],
            max_completion_tokens: 200
          })
        }
      );

      const gptData = await gptRes.json();

      const gpt =
        gptData?.output?.[0]?.content?.[0]?.text ||
        "GPT não respondeu";

      return res.json({
        resposta: `
🧠 GEMINI:
${gemini}

🤖 GPT:
${gpt}
        `
      });

    } catch (err) {
      return res.json({ resposta: "Erro no debate 😢" });
    }
  }

  // 🧠 GEMINI NORMAL
  if (modo === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: pergunta }]
          }]
        })
      }
    );

    const data = await response.json();

    return res.json({
      resposta: data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta"
    });
  }

  // 🤖 GPT NORMAL (fallback)
  return res.json({
    resposta: "Modo GPT ativo (configure aqui sua lógica)"
  });
});

// 🚀 SERVER
app.listen(PORT, () => {
  console.log(`🔥 http://localhost:${PORT}`);
});