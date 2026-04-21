const STORAGE_KEY = "mindTrackData.v1";

const defaultState = {
  settings: { worryStart: "18:00", worryMins: 30 },
  entries: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return {
      settings: { ...defaultState.settings, ...(parsed.settings || {}) },
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch (err) {
    console.warn("Failed to load state, starting fresh:", err);
    return structuredClone(defaultState);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function isoDay(ts) {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function fmtDateLong(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function addEntry(type, fields) {
  state.entries.unshift({
    id: uid(),
    type,
    createdAt: Date.now(),
    fields,
  });
  saveState(state);
}

function removeEntry(id) {
  state.entries = state.entries.filter((e) => e.id !== id);
  saveState(state);
}

// -------- Tabs --------
const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");

function showTab(name) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  views.forEach((v) => v.classList.toggle("active", v.id === name));
  if (name === "today") renderToday();
  if (name === "worry") renderWorry();
  if (name === "history") renderHistory();
}

tabs.forEach((t) =>
  t.addEventListener("click", () => showTab(t.dataset.tab))
);

document.querySelectorAll(".quick").forEach((b) => {
  b.addEventListener("click", () => showTab(b.dataset.goto));
});

// -------- Today --------
function renderToday() {
  document.getElementById("todayDate").textContent = fmtDateLong(Date.now());

  const today = isoDay(Date.now());
  const todays = state.entries.filter((e) => isoDay(e.createdAt) === today);
  const list = document.getElementById("todayList");
  list.innerHTML = "";
  document.getElementById("todayEmpty").hidden = todays.length > 0;
  todays.forEach((e) => list.appendChild(renderEntry(e)));

  renderChart7();
}

function renderChart7() {
  const chart = document.getElementById("chart7");
  chart.innerHTML = "";
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  const byDay = {};
  state.entries
    .filter((e) => e.type === "thought")
    .forEach((e) => {
      const key = isoDay(e.createdAt);
      const v = Number(e.fields.intensity);
      if (!Number.isFinite(v)) return;
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(v);
    });
  days.forEach((d) => {
    const key = d.toISOString().slice(0, 10);
    const vals = byDay[key] || [];
    const avg =
      vals.length === 0 ? 0 : Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const dayEl = document.createElement("div");
    dayEl.className = "day";
    dayEl.innerHTML = `
      <span class="val">${vals.length ? avg : ""}</span>
      <div class="bar"><div class="fill" style="height:${avg}%"></div></div>
      <span class="label">${d.toLocaleDateString(undefined, { weekday: "short" })[0]}</span>
    `;
    chart.appendChild(dayEl);
  });
}

// -------- Thought form --------
const intensityInput = document.querySelector('#thoughtForm [name="intensity"]');
const intensityOut = document.getElementById("intensityOut");
intensityInput.addEventListener("input", () => {
  intensityOut.textContent = intensityInput.value;
});

document.getElementById("thoughtForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  addEntry("thought", {
    situation: f.situation.value.trim(),
    feeling: f.feeling.value.trim(),
    intensity: Number(f.intensity.value),
    thought: f.thought.value.trim(),
  });
  f.reset();
  intensityOut.textContent = "50";
  showTab("today");
});

// -------- Worry --------
function renderWorry() {
  document.getElementById("worryStart").value = state.settings.worryStart;
  document.getElementById("worryMins").value = state.settings.worryMins;
  const note = document.getElementById("worryNote");
  note.textContent = `Worry time: ${state.settings.worryStart} for ${state.settings.worryMins} min.`;

  const parked = state.entries.filter((e) => e.type === "worry_capture");
  const list = document.getElementById("parkedList");
  list.innerHTML = "";
  parked.slice(0, 20).forEach((e) => list.appendChild(renderEntry(e)));
}

document.getElementById("saveWorryTime").addEventListener("click", () => {
  state.settings.worryStart = document.getElementById("worryStart").value || "18:00";
  state.settings.worryMins = Number(document.getElementById("worryMins").value) || 30;
  saveState(state);
  renderWorry();
});

document.getElementById("worryCaptureForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const worry = f.worry.value.trim();
  if (!worry) return;
  addEntry("worry_capture", { worry });
  f.reset();
  renderWorry();
});

document.getElementById("worrySessionForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  addEntry("worry_session", { notes: f.notes.value.trim() });
  f.reset();
  showTab("today");
});

// -------- Talkback --------
document.getElementById("talkbackForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  addEntry("talkback", {
    thought: f.thought.value.trim(),
    validity: f.validity.value.trim(),
    utility: f.utility.value.trim(),
    compassion: f.compassion.value.trim(),
    reframe: f.reframe.value.trim(),
  });
  f.reset();
  showTab("today");
});

// -------- History --------
function renderHistory() {
  const filter = document.getElementById("historyFilter").value;
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  const filtered =
    filter === "all"
      ? state.entries
      : state.entries.filter((e) => e.type === filter);
  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "muted small";
    li.textContent = "No entries yet.";
    list.appendChild(li);
    return;
  }
  filtered.forEach((e) => list.appendChild(renderEntry(e)));
}

document.getElementById("historyFilter").addEventListener("change", renderHistory);

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mind-track-${isoDay(Date.now())}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importInput").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.entries)) throw new Error("Invalid file");
    const keep = confirm(
      "Import will merge with your existing entries (duplicates by id kept once). Continue?"
    );
    if (!keep) return;
    const map = new Map(state.entries.map((x) => [x.id, x]));
    parsed.entries.forEach((x) => {
      if (x && x.id && !map.has(x.id)) map.set(x.id, x);
    });
    state.entries = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    if (parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
    saveState(state);
    renderHistory();
    renderToday();
    alert("Imported.");
  } catch (err) {
    alert("Import failed: " + err.message);
  } finally {
    e.target.value = "";
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Delete ALL entries and settings? This cannot be undone.")) return;
  state = structuredClone(defaultState);
  saveState(state);
  renderHistory();
  renderToday();
});

// -------- Entry rendering --------
const TYPE_LABEL = {
  thought: "Thought",
  worry_capture: "Parked worry",
  worry_session: "Worry session",
  talkback: "Talk-back",
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderEntry(e) {
  const li = document.createElement("li");
  li.className = "entry";
  const label = TYPE_LABEL[e.type] || e.type;
  let body = "";
  if (e.type === "thought") {
    const f = e.fields;
    body = `
      <div class="row"><strong>Feeling</strong>${escapeHtml(f.feeling)} · ${f.intensity}/100</div>
      <div class="row"><strong>Situation</strong>${escapeHtml(f.situation)}</div>
      <div class="row"><strong>Thought</strong>${escapeHtml(f.thought)}</div>
    `;
  } else if (e.type === "worry_capture") {
    body = `<div>${escapeHtml(e.fields.worry)}</div>`;
  } else if (e.type === "worry_session") {
    body = `<div>${escapeHtml(e.fields.notes)}</div>`;
  } else if (e.type === "talkback") {
    const f = e.fields;
    body = `
      <div class="row"><strong>Thought</strong>${escapeHtml(f.thought)}</div>
      ${f.validity ? `<div class="row"><strong>Valid?</strong>${escapeHtml(f.validity)}</div>` : ""}
      ${f.utility ? `<div class="row"><strong>Useful?</strong>${escapeHtml(f.utility)}</div>` : ""}
      ${f.compassion ? `<div class="row"><strong>To a friend?</strong>${escapeHtml(f.compassion)}</div>` : ""}
      <div class="row"><strong>Instead</strong>${escapeHtml(f.reframe)}</div>
    `;
  }
  li.innerHTML = `
    <button class="remove" title="Delete" aria-label="Delete entry">&times;</button>
    <div class="meta">
      <span class="badge">${label}</span>
      <span>${fmtDateLong(e.createdAt)} · ${fmtTime(e.createdAt)}</span>
    </div>
    <div class="body">${body}</div>
  `;
  li.querySelector(".remove").addEventListener("click", () => {
    if (!confirm("Delete this entry?")) return;
    removeEntry(e.id);
    renderToday();
    renderHistory();
    renderWorry();
  });
  return li;
}

// -------- Init --------
renderToday();
