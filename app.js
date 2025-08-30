const MASTERY_STREAK = 3;
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let flashcards = JSON.parse(localStorage.getItem("flashcards")) || [];
let currentCard = 0;
let flipped = false;
let timerInterval;
let totalSeconds = parseInt(localStorage.getItem("timeSpent")) || 0;

// DOM elements
const notesList = document.getElementById("notes");
const addNoteBtn = document.getElementById("add-note");
const titleInput = document.getElementById("note-title");
const contentInput = document.getElementById("note-content");

const studyBtn = document.getElementById("study-mode");
const cardDiv = document.getElementById("card");
const cardText = document.getElementById("card-text");
const flipBtn = document.getElementById("flip");
const nextBtn = document.getElementById("next");
const correctBtn = document.getElementById("correct");
const wrongBtn = document.getElementById("wrong");

const perCardStats = document.getElementById("per-card-stats");
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");
const toggleThemeBtn = document.getElementById("toggle-theme");
const timerDisplay = document.getElementById("timer");
const syncStatus = document.getElementById("sync-status");

// theme toggle
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") document.body.classList.add("dark");
toggleThemeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};

// render notes
function renderNotes() {
  notesList.innerHTML = "";
  notes.forEach((n) => {
    const li = document.createElement("li");
    li.textContent = `${n.title}: ${n.content.substring(0, 30)}...`;
    const makeFlashBtn = document.createElement("button");
    makeFlashBtn.textContent = "Make Flashcard";
    makeFlashBtn.onclick = () => {
      if (flashcards.find(fc => fc.q === n.title && fc.a === n.content)) {
        alert("Flashcard already exists."); return;
      }
      flashcards.push({
        q: n.title,
        a: n.content,
        stats: { attempts: 0, correct: 0, streak: 0, mastered: false }
      });
      persistAll(); renderProgress(); alert("Flashcard created!");
    };
    li.appendChild(makeFlashBtn);
    notesList.appendChild(li);
  });
  localStorage.setItem("notes", JSON.stringify(notes));
}

addNoteBtn.onclick = () => {
  const t = titleInput.value.trim();
  const c = contentInput.value.trim();
  if (!t || !c) return alert("Enter both title & content");
  notes.push({ title: t, content: c });
  titleInput.value = ""; contentInput.value = "";
  persistAll(); renderNotes();
};

// study mode
studyBtn.onclick = () => {
  if (flashcards.length === 0) return alert("No flashcards created!");
  currentCard = 0; flipped = false;
  cardDiv.classList.remove("hidden");
  showCard(); startTimer();
};
flipBtn.onclick = () => { flipped = !flipped; showCard(); };
nextBtn.onclick = () => { nextCard(); };
correctBtn.onclick = () => { updateScore(true); };
wrongBtn.onclick = () => { updateScore(false); };

function nextCard() {
  currentCard = (currentCard + 1) % flashcards.length;
  flipped = false; showCard();
}
function showCard() {
  const fc = flashcards[currentCard];
  cardText.textContent = flipped ? fc.a : fc.q;
  perCardStats.textContent =
    `${fc.stats.correct} correct / ${fc.stats.attempts} attempts${fc.stats.mastered ? " (mastered)" : ""}`;
}

// scoring
function updateScore(isCorrect) {
  const fc = flashcards[currentCard];
  fc.stats.attempts += 1;
  if (isCorrect) {
    fc.stats.correct += 1;
    fc.stats.streak = (fc.stats.streak || 0) + 1;
    if (!fc.stats.mastered && fc.stats.streak >= MASTERY_STREAK) fc.stats.mastered = true;
  } else {
    fc.stats.streak = 0;
  }
  persistAll(); renderProgress(); showCard();
}

// progress bar
function renderProgress() {
  if (flashcards.length === 0) { progressBar.style.width = "0%"; progressLabel.textContent = "Mastery: 0%"; return; }
  const masteredCount = flashcards.filter(fc => fc.stats?.mastered).length;
  const pct = Math.round((masteredCount / flashcards.length) * 100);
  progressBar.style.width = `${pct}%`;
  progressLabel.textContent = `Mastery: ${pct}% (${masteredCount}/${flashcards.length})`;
}

// timer
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    totalSeconds++; localStorage.setItem("timeSpent", totalSeconds); updateTimerDisplay();
  }, 1000);
}
function updateTimerDisplay() {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  timerDisplay.textContent = `Time Spent: ${hrs}h ${mins}m ${secs}s`;
}

// persistence
function persistAll() {
  localStorage.setItem("notes", JSON.stringify(notes));
  localStorage.setItem("flashcards", JSON.stringify(flashcards));
}

// boot
renderNotes(); renderProgress(); updateTimerDisplay();
syncStatus.textContent = "Offline"; // until Firebase added
