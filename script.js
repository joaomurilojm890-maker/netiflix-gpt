const moviesGrid = document.getElementById("moviesGrid");
const drawer = document.getElementById("drawer");
const closeDrawer = document.getElementById("closeDrawer");
const selectedMovieInfo = document.getElementById("selectedMovieInfo");
const reviewsList = document.getElementById("reviewsList");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

const state = {
  movies: [],
  selectedMovie: null,
  selectedReviews: []
};

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.resposta || "Erro na requisição.");
  }

  return data;
}

function getMovieCard(movie) {
  return `
    <article class="card">
      ${
        movie.image
          ? `<img class="poster" src="${escapeHtml(movie.image)}" alt="${escapeHtml(movie.title)}" />`
          : `<div class="poster-fallback">${escapeHtml(movie.title)}</div>`
      }

      <div class="card-body">
        <h3>${escapeHtml(movie.title)}</h3>

        <div class="meta">
          <span>${movie.year ? escapeHtml(movie.year) : "Ano N/D"}</span>
          <span>⭐ ${movie.rating || "N/D"}</span>
          <span>${escapeHtml(movie.genre || "Filme")}</span>
        </div>

        <p class="description">
          ${escapeHtml(movie.description || "Sem descrição disponível.").slice(0, 120)}...
        </p>

        <button data-movie-id="${escapeHtml(movie.id)}">Conversar</button>
      </div>
    </article>
  `;
}

function renderMovies() {
  if (!state.movies.length) {
    moviesGrid.innerHTML = `
      <div class="empty-state">
        Nenhum filme encontrado. Revise os caminhos da API no .env se isso acontecer sempre.
      </div>
    `;
    return;
  }

  moviesGrid.innerHTML = state.movies.map(getMovieCard).join("");
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  div.innerHTML = `
    <strong>${role === "bot" ? "Assistente" : "Você"}</strong>
    <div>${escapeHtml(text).replace(/\n/g, "<br>")}</div>
  `;

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderSelectedMovie(movie) {
  selectedMovieInfo.innerHTML = `
    <div class="selected-movie">
      ${
        movie.image
          ? `<img src="${escapeHtml(movie.image)}" alt="${escapeHtml(movie.title)}" />`
          : ""
      }

      <div class="movie-mini-card">
        <h3>${escapeHtml(movie.title)}</h3>
        <p><strong>Ano:</strong> ${escapeHtml(movie.year || "N/D")}</p>
        <p><strong>Nota:</strong> ${escapeHtml(String(movie.rating || "N/D"))}</p>
        <p><strong>Gênero:</strong> ${escapeHtml(movie.genre || "Filme")}</p>
        <p><strong>Descrição:</strong> ${escapeHtml(movie.description || "Sem descrição disponível.")}</p>
      </div>
    </div>
  `;
}

function renderReviews() {
  if (!state.selectedReviews.length) {
    reviewsList.innerHTML = `<p>Nenhuma avaliação encontrada para esse filme.</p>`;
    return;
  }

  reviewsList.innerHTML = state.selectedReviews
    .map(
      (review) => `
        <div class="review-item">
          <div class="review-author">${escapeHtml(review.author)}</div>
          <div class="review-score">⭐ ${escapeHtml(String(review.rating || "N/D"))}</div>
          <div>${escapeHtml(review.comment || "Sem comentário.")}</div>
        </div>
      `
    )
    .join("");
}

async function loadMovies(search = "") {
  moviesGrid.innerHTML = `<div class="empty-state">Carregando filmes...</div>`;

  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    state.movies = await fetchJSON(`/api/movies${query}`);
    renderMovies();
  } catch (error) {
    moviesGrid.innerHTML = `
      <div class="empty-state">
        Erro ao carregar filmes: ${escapeHtml(error.message)}
      </div>
    `;
  }
}

async function openMovie(movieId) {
  const movie = state.movies.find((m) => String(m.id) === String(movieId));
  if (!movie) return;

  state.selectedMovie = movie;
  state.selectedReviews = [];

  renderSelectedMovie(movie);
  reviewsList.innerHTML = `<p>Carregando avaliações...</p>`;
  chatMessages.innerHTML = "";

  addMessage(
    "bot",
    `Oi! Vamos falar sobre "${movie.title}". Você pode perguntar sobre sinopse, avaliações, nota e se vale a pena assistir.`
  );

  drawer.classList.add("open");

  try {
    state.selectedReviews = await fetchJSON(`/api/movies/${movieId}/reviews`);
    renderReviews();
  } catch (error) {
    reviewsList.innerHTML = `<p>Erro ao carregar avaliações: ${escapeHtml(error.message)}</p>`;
  }
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || !state.selectedMovie) return;

  addMessage("user", message);
  chatInput.value = "";

  try {
    const data = await fetchJSON("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pergunta: message,
        movie: state.selectedMovie,
        reviews: state.selectedReviews
      })
    });

    addMessage("bot", data.resposta || "Não consegui responder agora.");
  } catch (error) {
    addMessage("bot", `Erro ao responder: ${error.message}`);
  }
}

moviesGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-movie-id]");
  if (!button) return;

  openMovie(button.dataset.movieId);
});

closeDrawer.addEventListener("click", () => {
  drawer.classList.remove("open");
});

sendChatBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadMovies(searchInput.value.trim());
});

loadMovies();
