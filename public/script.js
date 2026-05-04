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
      <div class="poster-fallback">${escapeHtml(movie.title)}</div>
      <div class="card-body">
        <h3>${escapeHtml(movie.title)}</h3>
        <button data-id="${movie.id}">Abrir</button>
      </div>
    </article>
  `;
}

function renderMovies() {
  moviesGrid.innerHTML = state.movies.map(getMovieCard).join("");
}

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetchJSON(`/api/movies?search=${searchInput.value}`);
  state.movies = res;
  renderMovies();
});