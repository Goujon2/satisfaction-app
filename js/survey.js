/* =====================================================
   survey.js — Logique du formulaire de satisfaction
   ===================================================== */

// ── CONFIG ──────────────────────────────────────────
const CONFIG = {
  endpoint: "https://formspree.io/f/xykleglk",  // ← à remplacer
};

// ── ÉTAT ────────────────────────────────────────────
let selectedRating = null;

// ── SÉLECTION EMOJI ─────────────────────────────────
const emojiOptions = document.querySelectorAll(".emoji-option");

emojiOptions.forEach((option) => {
  option.addEventListener("click", () => {
    emojiOptions.forEach((o) => o.classList.remove("selected"));
    option.classList.add("selected");
    selectedRating = option.dataset.value;
    hideError("rating-error");
    checkFormValidity();
  });
});

// ── CHAMPS TEXTE ─────────────────────────────────────
const firstnameInput = document.getElementById("firstname");
const lastnameInput  = document.getElementById("lastname");
const textarea       = document.getElementById("comment");
const charNum        = document.getElementById("char-num");

firstnameInput.addEventListener("input", () => { hideError("firstname-error"); checkFormValidity(); });
lastnameInput.addEventListener("input",  () => { hideError("lastname-error");  checkFormValidity(); });
textarea.addEventListener("input", () => {
  charNum.textContent = textarea.value.length;
  hideError("comment-error");
  checkFormValidity();
});

// ── VALIDATION EN TEMPS RÉEL ─────────────────────────
const submitBtn = document.getElementById("submit-btn");

function checkFormValidity() {
  const ok =
    selectedRating !== null &&
    firstnameInput.value.trim().length > 0 &&
    lastnameInput.value.trim().length  > 0 &&
    textarea.value.trim().length       > 0;
  submitBtn.disabled = !ok;
}

// Désactiver le bouton au démarrage
submitBtn.disabled = true;

// ── SOUMISSION ───────────────────────────────────────
const form = document.getElementById("survey-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let valid = true;
  if (!selectedRating)              { showError("rating-error");    valid = false; }
  if (!firstnameInput.value.trim()) { showError("firstname-error"); valid = false; }
  if (!lastnameInput.value.trim())  { showError("lastname-error");  valid = false; }
  if (!textarea.value.trim())       { showError("comment-error");   valid = false; }
  if (!valid) return;

  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-label").textContent = "Envoi en cours…";

  const payload = {
    firstname: firstnameInput.value.trim(),
    lastname:  lastnameInput.value.trim(),
    rating:    selectedRating,
    comment:   textarea.value.trim(),
    timestamp: new Date().toLocaleString("fr-FR"),
  };

  try {
    await sendToEmail(payload);
    showSuccess();
  } catch (err) {
    console.error("Erreur envoi :", err);
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-label").textContent = "Envoyer mon avis";
    alert("Une erreur est survenue. Veuillez réessayer.");
  }
});

// ── ENVOI EMAIL ──────────────────────────────────────
async function sendToEmail(payload) {
  const response = await fetch(CONFIG.endpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      subject:     "[Satisfaction] " + payload.firstname + " " + payload.lastname + " — " + ratingLabel(payload.rating),
      message:     formatEmailBody(payload),
      prenom:      payload.firstname,
      nom:         payload.lastname,
      note:        ratingLabel(payload.rating),
      commentaire: payload.comment,
      date:        payload.timestamp,
    }),
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

// ── HELPERS ──────────────────────────────────────────
function ratingLabel(value) {
  var labels = { satisfied: "Satisfait", neutral: "Neutre", unsatisfied: "Insatisfait" };
  return labels[value] || value;
}

function formatEmailBody(p) {
  return "Prénom      : " + p.firstname + "\n" +
         "Nom         : " + p.lastname  + "\n" +
         "Note        : " + ratingLabel(p.rating) + "\n" +
         "Commentaire : " + p.comment   + "\n" +
         "Date        : " + p.timestamp;
}

function showError(id) { document.getElementById(id).classList.add("visible"); }
function hideError(id) { document.getElementById(id).classList.remove("visible"); }


// ── SON DE CONFIRMATION ──────────────────────────────
function playSuccessSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Note 1 — Sol
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523, ctx.currentTime);       // Do
  osc1.frequency.setValueAtTime(659, ctx.currentTime + 0.12); // Mi
  gain1.gain.setValueAtTime(0.18, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.35);

  // Note 2 — accord final plus haut
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(784, ctx.currentTime + 0.22); // Sol
  gain2.gain.setValueAtTime(0.0001, ctx.currentTime + 0.22);
  gain2.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.28);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
  osc2.start(ctx.currentTime + 0.22);
  osc2.stop(ctx.currentTime + 0.55);
}

// ── SUCCÈS ───────────────────────────────────────────
function showSuccess() {
  playSuccessSound();
  document.getElementById("survey-form").hidden    = true;
  document.getElementById("success-screen").hidden = false;
  document.querySelector(".card-header").style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── RESET ────────────────────────────────────────────
function resetForm() {
  selectedRating = null;
  emojiOptions.forEach(function(o) { o.classList.remove("selected"); });
  firstnameInput.value = "";
  lastnameInput.value  = "";
  textarea.value       = "";
  charNum.textContent  = "0";
  submitBtn.disabled   = true;
  submitBtn.querySelector(".btn-label").textContent = "Envoyer mon avis";
  ["rating-error","firstname-error","lastname-error","comment-error"].forEach(hideError);
  document.getElementById("survey-form").hidden    = false;
  document.getElementById("success-screen").hidden = true;
  document.querySelector(".card-header").style.display = "";
}