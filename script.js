function abrirChat() {
  document.getElementById("home").classList.remove("ativa");
  document.getElementById("chat").classList.add("ativa");
}

function enviar() {
  let input = document.getElementById("pergunta");
  let texto = input.value.toLowerCase();
  let chat = document.getElementById("chatBox");

  if (texto === "") return;

  chat.innerHTML += `<div class="user">${texto}</div>`;

  let resposta = gerarResposta(texto);

  chat.innerHTML += `<div class="bot">${resposta}</div>`;

  input.value = "";
  chat.scrollTop = chat.scrollHeight;
}

function gerarResposta(texto) {

  const categorias = {
    acao: ["ação", "luta", "tiro", "explosão"],
    terror: ["terror", "medo", "horror"],
    comedia: ["comédia", "engraçado", "rir"],
    aventura: ["aventura", "explorar"],
    romance: ["romance", "amor", "casal"],
    ficcao: ["ficção", "espaço", "futuro", "tecnologia"],
    drama: ["drama", "triste", "emocionante"],
    animacao: ["animação", "desenho", "infantil"]
  };

  const filmes = {
    acao: ["John Wick", "Velozes e Furiosos", "Missão Impossível", "Mad Max"],
    terror: ["Invocação do Mal", "It: A Coisa", "Annabelle", "A Freira"],
    comedia: ["As Branquelas", "Gente Grande", "Se Beber Não Case", "Todo Mundo em Pânico"],
    aventura: ["Jumanji", "Indiana Jones", "Piratas do Caribe", "Jurassic Park"],
    romance: ["Titanic", "Diário de uma Paixão", "Como Eu Era Antes de Você", "A Culpa é das Estrelas"],
    ficcao: ["Interestelar", "Matrix", "Avatar", "Star Wars"],
    drama: ["Forrest Gump", "À Espera de um Milagre", "Clube da Luta", "Coringa"],
    animacao: ["Toy Story", "Shrek", "Frozen", "Rei Leão"]
  };

  const respostasInicio = [
    "Boa escolha! 👀",
    "Tenho ótimas sugestões 😎",
    "Olha só isso 👇",
    "Você pode gostar de:"
  ];

  let intro = respostasInicio[Math.floor(Math.random() * respostasInicio.length)];

  for (let cat in categorias) {
    for (let palavra of categorias[cat]) {
      if (texto.includes(palavra)) {
        return `${intro} ${filmes[cat].join(", ")} 🎬`;
      }
    }
  }

  if (texto.includes("mais") || texto.includes("outro")) {
    return "Claro! Mais sugestões: Batman, Gladiador, Homem-Aranha, Transformers 🦸";
  }

  if (texto.includes("não gostei")) {
    return "Tranquilo 😄 quer tentar outro tipo? ação, comédia, romance, ficção...";
  }

  if (texto.includes("oi") || texto.includes("olá")) {
    return "Oi! 😄 Quer ajuda pra escolher um filme?";
  }

  return "Hmm... não entendi 🤔 tenta falar: ação, comédia, terror, romance, ficção, drama ou animação 🎬";
}