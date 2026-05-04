import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// serve arquivos estáticos da raiz
app.use(express.static(__dirname));

// se você acabar usando a pasta public depois, já fica pronto também
app.use(express.static(path.join(__dirname, "public")));

function buildHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };

  if (process.env.PROF_API_KEY_HEADER && process.env.PROF_API_KEY) {
    headers[process.env.PROF_API_KEY_HEADER] = process.env.PROF_API_KEY;
  }

  if (process.env.PROF_BEARER_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.PROF_BEARER_TOKEN}`;
  }

  return headers;
}

async function professorFetch(pathName, { method = "GET", query = {}, body } = {}) {
  const baseUrl = process.env.PROF_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("PROF_API_BASE_URL não configurada no .env");
  }

  const url = new URL(pathName, baseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.error("Erro na API do professor:", data);
    throw new Error(`Erro ${response.status} ao consultar a API do professor`);
  }

  return data;
}

function extractArray(data, possibleKeys = []) {
  if (Array.isArray(data)) return data;

  const keys = [...possibleKeys, "movies", "results", "data", "items", "reviews"];

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function normalizeMovie(raw, index = 0) {
  const rating = Number(
    raw.rating ??
    raw.vote_average ??
    raw.score ??
    raw.nota ??
    0
  );

  return {
    id: String(raw.id ?? raw.movieId ?? raw._id ?? raw.codigo ?? raw.slug ?? index),
    title: raw.title ?? raw.name ?? raw.nome ?? "Sem título",
    description: raw.description ?? raw.overview ?? raw.sinopse ?? "Sem descrição disponível.",
    image: raw.image ?? raw.poster ?? raw.posterUrl ?? raw.poster_path ?? raw.cover ?? raw.capa ?? "",
    year: raw.year ?? raw.releaseYear ?? raw.release_date?.slice(0, 4) ?? raw.ano ?? "",
    rating: Number.isFinite(rating) ? rating : 0,
    genre: raw.genre ?? raw.category ?? raw.genero ?? "Filme"
  };
}

function normalizeReview(raw, index = 0) {
  const rating = Number(
    raw.rating ??
    raw.score ??
    raw.note ??
    raw.nota ??
    0
  );

  return {
    id: String(raw.id ?? index),
    author: raw.author ?? raw.user ?? raw.nome ?? raw.usuario ?? "Usuário",
    comment: raw.comment ?? raw.review ?? raw.text ?? raw.comentario ?? "Sem comentário.",
    rating: Number.isFinite(rating) ? rating : 0
  };
}

function detectScale(movie, reviews) {
  const values = [
    Number(movie?.rating || 0),
    ...reviews.map((r) => Number(r.rating || 0))
  ].filter((n) => !Number.isNaN(n));

  return values.some((v) => v > 5) ? 10 : 5;
}

function getAverage(movie, reviews) {
  const values = reviews
    .map((r) => Number(r.rating || 0))
    .filter((n) => n > 0);

  if (values.length > 0) {
    return values.reduce((acc, n) => acc + n, 0) / values.length;
  }

  return Number(movie?.rating || 0);
}

function getSampleComments(reviews) {
  return reviews
    .filter((r) => r.comment && r.comment !== "Sem comentário.")
    .slice(0, 2)
    .map((r) => `- ${r.author}: "${r.comment}"`)
    .join("\n");
}

function buildLocalChatReply(message, movie, reviews) {
  const text = String(message || "").toLowerCase();
  const avg = getAverage(movie, reviews);
  const scale = detectScale(movie, reviews);
  const total = reviews.length;
  const comments = getSampleComments(reviews);

  const goodThreshold = scale === 10 ? 7 : 4;
  const midThreshold = scale === 10 ? 5 : 3;

  if (text.includes("sinopse") || text.includes("resumo") || text.includes("sobre o filme")) {
    return `${movie.title}${movie.year ? ` (${movie.year})` : ""} é do gênero ${movie.genre}. Resumo: ${movie.description}`;
  }

  if (
    text.includes("nota") ||
    text.includes("avalia") ||
    text.includes("review") ||
    text.includes("reviews")
  ) {
    if (!total) {
      return `Ainda não encontrei avaliações para ${movie.title}. A nota principal cadastrada do filme é ${movie.rating || "N/D"}.`;
    }

    return `Encontrei ${total} avaliação(ões) para ${movie.title}. A média aproximada está em ${avg.toFixed(1)} de ${scale}. ${
      comments ? `Algumas opiniões:\n${comments}` : ""
    }`;
  }

  if (
    text.includes("vale a pena") ||
    text.includes("recomenda") ||
    text.includes("é bom") ||
    text.includes("assistir")
  ) {
    if (avg >= goodThreshold) {
      return `${movie.title} parece valer a pena sim. A média está em ${avg.toFixed(1)} de ${scale} e as avaliações tendem a ser positivas.`;
    }

    if (avg >= midThreshold) {
      return `${movie.title} divide opiniões. A média está em ${avg.toFixed(1)} de ${scale}. Eu diria que vale testar se você curte ${movie.genre.toLowerCase()}.`;
    }

    return `${movie.title} não está com as melhores avaliações no momento. A média aproximada é ${avg.toFixed(1)} de ${scale}.`;
  }

  return `Vamos falar sobre ${movie.title}. Posso te ajudar com sinopse, nota, avaliações e se vale a pena assistir. ${
    total ? `Agora eu tenho ${total} avaliação(ões) carregadas desse filme.` : "Ainda não tenho avaliações carregadas desse filme."
  }`;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/movies", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const searchParam = process.env.PROF_SEARCH_PARAM || "search";

    const raw = await professorFetch(process.env.PROF_MOVIES_PATH || "/movies", {
      query: search ? { [searchParam]: search } : {}
    });

    const movies = extractArray(raw, ["movies", "results", "data"]).map(normalizeMovie);

    res.json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Não consegui buscar os filmes na API do professor."
    });
  }
});

app.get("/api/movies/:id/reviews", async (req, res) => {
  try {
    const movieId = req.params.id;
    const reviewParam = process.env.PROF_REVIEWS_PARAM || "movieId";

    const raw = await professorFetch(process.env.PROF_REVIEWS_PATH || "/reviews", {
      query: { [reviewParam]: movieId }
    });

    const reviews = extractArray(raw, ["reviews", "data"]).map(normalizeReview);

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Não consegui buscar as avaliações desse filme."
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { pergunta, movie, reviews } = req.body;

    if (!pergunta || !movie) {
      return res.status(400).json({
        resposta: "Pergunta e filme são obrigatórios."
      });
    }

    // Se sua API do professor tiver rota de chat pronta, descomente o bloco abaixo
    // e comente o retorno local logo depois.
    /*
    const raw = await professorFetch(process.env.PROF_CHAT_PATH || "/chat", {
      method: "POST",
      body: {
        pergunta,
        movie,
        reviews
      }
    });

    const respostaApi =
      raw?.resposta ||
      raw?.message ||
      raw?.answer ||
      raw?.output?.[0]?.content?.[0]?.text ||
      "Não consegui interpretar a resposta da API.";

    return res.json({ resposta: respostaApi });
    */

    const respostaLocal = buildLocalChatReply(pergunta, movie, Array.isArray(reviews) ? reviews : []);
    return res.json({ resposta: respostaLocal });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      resposta: "Erro interno no servidor."
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
