let modo = "gemini";

const input = document.getElementById("chatInput");
const btn = document.getElementById("sendBtn");
const chat = document.getElementById("chatMessages");

function setModo(m) {
  modo = m;
  alert("Modo: " + m);
}

function addMsg(text, type) {
  const div = document.createElement("div");
  div.classList.add("msg", type);
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const text = input.value;
  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  addMsg("Pensando...", "bot");

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pergunta: text,
      modo: modo
    })
  });

  const data = await res.json();

  document.querySelectorAll(".bot").forEach(m => {
    if (m.innerText === "Pensando...") m.remove();
  });

  addMsg(data.resposta, "bot");
}

btn.onclick = send;

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") send();
});