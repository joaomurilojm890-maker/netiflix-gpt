function abrirChat() {
  document.getElementById("home").classList.remove("ativa");
  document.getElementById("chat").classList.add("ativa");
}

async function enviar() {
  let input = document.getElementById("pergunta");
  let texto = input.value;
  let chat = document.getElementById("chatBox");

  if (!texto) return;

  chat.innerHTML += `<div class="user">${texto}</div>`;

  try {
    let res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pergunta: texto })
    });

    let data = await res.json();

    console.log(data); // 👈 ajuda ver erro no F12

    let resposta = "Não consegui responder 😢";

    // 🔥 tentativa de pegar resposta da Azure
    if (data.output) {
      let item = data.output.find(o => o.content);
      if (item && item.content[0]) {
        resposta = item.content[0].text;
      }
    }

    chat.innerHTML += `<div class="bot">${resposta}</div>`;

  } catch (erro) {
    chat.innerHTML += `<div class="bot">Erro na conexão 😢</div>`;
  }

  input.value = "";
  chat.scrollTop = chat.scrollHeight;
}