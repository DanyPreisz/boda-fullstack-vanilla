import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#gift-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/gifts");
  document.querySelector("#reserved").textContent = data.reserved;
  document.querySelector("#count").textContent = data.count;
  listEl.innerHTML = "";
  data.gifts.forEach((gift) => {
    const li = document.createElement("li");
    li.className = "item";
    const text = document.createElement("span");
    text.className = gift.reserved ? "done" : "";
    text.textContent = `${gift.name}${gift.note ? ` \u00b7 ${gift.note}` : ""}${gift.by ? ` \u00b7 ${gift.by}` : ""}`;
    const reserve = document.createElement("button");
    reserve.type = "button";
    reserve.className = "ghost";
    reserve.textContent = gift.reserved ? "Liberar" : "Reservar";
    reserve.addEventListener("click", async () => {
      const by = gift.reserved ? "" : (window.prompt("Reservado por", "") || "");
      await api(`/api/gifts/${gift.id}/reserve`, { method: "POST", body: JSON.stringify({ by }) });
      await refresh();
    });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/gifts/${gift.id}`, { method: "DELETE" }); await refresh(); });
    li.append(text, reserve, del);
    listEl.append(li);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/gifts", { method: "POST", body: JSON.stringify({ name: document.querySelector("#name").value.trim(), note: document.querySelector("#note").value.trim() }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
