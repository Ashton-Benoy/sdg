// Static building readings are grouped by room so each screen can reuse them.

const loads = [
  { name: "Lab 1", type: "Air conditioning", icon: "❄", power: 570, average: 440, energy: 3.2 },
  { name: "Computer Lab", type: "Computers & screens", icon: "▣", power: 310, average: 335, energy: 2.1 },
  { name: "Classroom 1", type: "Lighting", icon: "☼", power: 185, average: 210, energy: 1.2 },
  { name: "Lab 2", type: "Air conditioning", icon: "❄", power: 245, average: 230, energy: 0.9 },
  { name: "Lighting", type: "Corridor lights", icon: "✧", power: 98, average: 125, energy: 0.6 },
  { name: "AC Unit", type: "Common area", icon: "❄", power: 165, average: 150, energy: 0.4 }
];

const startingReadings = [350, 380, 425, 510, 470, 390, 410, 435, 395, 450, 480, 420];
const olderHistory = [
  { time: "9:40 AM", room: "Lab 2", power: 365, energy: "0.31", status: "Normal" },
  { time: "9:30 AM", room: "Computer Lab", power: 405, energy: "0.34", status: "Normal" },
  { time: "9:20 AM", room: "Classroom 1", power: 295, energy: "0.25", status: "Normal" },
  { time: "9:10 AM", room: "Lab 1", power: 475, energy: "0.40", status: "Normal" }
];

const state = {
  selectedRoom: "All buildings",
  threshold: 500,
  readings: startingReadings.slice(),
  readingIndex: 0,
  range: "hour",
  period: "today",
  historyRoom: "All rooms",
  selectedDate: new Date(),
  dailyGoal: 13.5,
  electricityRate: 0.18,
  currency: "USD",
  savedTips: new Set(),
  plannerCompleted: new Set(),
  showOlder: false,
  lastUpdated: new Date()
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const pageNames = { dashboard: "Overview", monitoring: "Live monitoring", history: "Energy history", prediction: "Predictions", recommendations: "Recommendations", sustainability: "Sustainability", planner: "Energy planner", costs: "Cost estimator" };
const pageTitles = {
  dashboard: ["Good morning, Jordan", "Here’s what’s happening with your energy today."],
  monitoring: ["Live monitoring", "A closer look at every monitored load."],
  history: ["Energy history", "See how your building’s usage changes over time."],
  prediction: ["Energy predictions", "Use recent patterns to prepare for what’s next."],
  recommendations: ["Energy recommendations", "Simple opportunities to make your building more efficient."],
  sustainability: ["Building sustainability", "See the energy and carbon impact behind today's readings."],
  planner: ["Energy planner", "Turn practical ideas into a focused daily action plan."],
  costs: ["Energy cost estimator", "Plan electricity spend using a rate you set from your utility bill."]
};

function getVisibleLoads() {
  if (state.selectedRoom === "All buildings") return loads;
  return loads.filter((load) => load.name === state.selectedRoom);
}

function getCurrentPower() {
  const visible = getVisibleLoads();
  if (visible.length === 1) return visible[0].power;
  return state.readings[state.readings.length - 1];
}

function getPrediction() {
  const recent = state.readings.slice(-4);
  const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const direction = recent[recent.length - 1] - recent[0];
  return Math.round(average + direction * 0.25);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function setPage(page) {
  if (!pageNames[page]) return;
  $$(".page-view").forEach((view) => view.classList.toggle("active", view.id === `page-${page}`));
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
  $("#breadcrumb-page").textContent = pageNames[page];
  $("#page-title").textContent = pageTitles[page][0];
  $("#page-subtitle").textContent = pageTitles[page][1];
  const dateLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(state.selectedDate).toUpperCase();
  $("#page-eyebrow").innerHTML = `${dateLabel} <span class="eyebrow-line"></span> ${pageNames[page].toUpperCase()}`;
  history.replaceState(null, "", `#${page}`);
  renderPage(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPage(page) {
  if (page === "dashboard") renderDashboard();
  if (page === "monitoring") renderMonitoring();
  if (page === "history") renderHistory();
  if (page === "prediction") renderPrediction();
  if (page === "recommendations") renderRecommendations();
  if (page === "sustainability") renderSustainability();
  if (page === "planner") renderPlanner();
  if (page === "costs") renderCosts();
}

function renderDashboard() {
  const power = getCurrentPower();
  const predicted = getPrediction();
  const status = power > state.threshold ? "High usage" : "Normal usage";
  $("#current-power").textContent = power;
  $("#chart-current").textContent = power;
  $("#predicted-power").textContent = predicted;
  const dailyEnergy = state.selectedRoom === "All buildings" ? (state.period === "yesterday" ? "7.6" : "8.4") : (getVisibleLoads()[0].energy * (state.period === "yesterday" ? 0.9 : 1)).toFixed(1);
  $("#today-energy").textContent = dailyEnergy;
  $("#energy-label").textContent = state.period === "today" ? "Energy today" : "Energy selected day";
  $("#active-loads").textContent = String(getVisibleLoads().length).padStart(2, "0");
  const goalPercent = Math.min(100, Math.round(Number(dailyEnergy) / state.dailyGoal * 100));
  $("#goal-value").textContent = state.dailyGoal.toFixed(1);
  $("#goal-percent").textContent = `${goalPercent}%`;
  $("#goal-progress").style.width = `${goalPercent}%`;
  $("#power-status").textContent = status;
  $("#last-seen").textContent = "Updated just now";
  $("#footer-time").textContent = "just now";
  $(".status-pill").classList.toggle("high", power > state.threshold);
  $(".status-pill").classList.toggle("normal", power <= state.threshold);
  renderAlert(power);
  renderLoadList();
  drawUsageChart();
}

function renderAlert(power) {
  const panel = $(".alert-panel");
  const highLoad = loads.find((load) => load.power > state.threshold);
  const high = power > state.threshold || (state.selectedRoom === "All buildings" && highLoad);
  panel.classList.toggle("is-clear", !high);
  $("#alert-empty").classList.toggle("hidden", high);
  $("#alert-count").textContent = high ? "1" : "0";
  $("#threshold-display").textContent = `${state.threshold} W`;
  $("#alert-current").textContent = `${highLoad ? highLoad.power : power} W`;
  if (high) {
    const subject = state.selectedRoom === "All buildings" && highLoad ? highLoad.name : state.selectedRoom;
    $(".alert-body h3").textContent = `${subject} is using more energy`;
    $(".alert-body p").innerHTML = `Current power is above your <b>${state.threshold} W</b> threshold.`;
  }
}

function renderLoadList() {
  const visible = getVisibleLoads().slice(0, 3);
  const maximum = Math.max(...visible.map((load) => load.power), 1);
  $("#load-list").innerHTML = visible.map((load) => `
    <div class="load-row">
      <div class="load-name"><span class="load-icon">${load.icon}</span><span>${load.name}<small>${load.type}</small></span></div>
      <div class="load-power">${load.power}<small>W</small></div>
      <div class="load-bar"><span style="width:${Math.round(load.power / maximum * 100)}%"></span></div>
      <div class="load-status"><i></i> Active</div>
    </div>`).join("");
}

function drawUsageChart() {
  const svg = $("#usage-chart");
  let values = state.readings.slice(-12);
  if (state.range === "day") values = [280, 330, 360, 425, 510, 470, 390, 410, 435, 395, 450, getCurrentPower()];
  if (state.range === "week") values = [260, 340, 320, 460, 390, 500, 430, 380, 410, 480, 420, getCurrentPower()];
  svg.innerHTML = makeChart(values, 740, 210, "chart");
  const labels = state.range === "hour" ? ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"]
    : state.range === "day" ? ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  $(".chart-x-labels").innerHTML = labels.map((label) => `<span>${label}</span>`).join("");
}

function makeChart(values, width, height, prefix) {
  const left = 4, right = width - 4, top = 8, bottom = height - 8;
  const xStep = (right - left) / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => ({ x: left + index * xStep, y: bottom - Math.max(0, Math.min(value, 600)) / 600 * (bottom - top) }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const area = `${path} L${right} ${bottom} L${left} ${bottom} Z`;
  const last = points[points.length - 1];
  let grid = "";
  for (let index = 0; index < 5; index += 1) {
    const y = top + index * (bottom - top) / 4;
    grid += `<line class="history-grid" x1="0" y1="${y}" x2="${width}" y2="${y}"/>`;
  }
  const gradient = `<defs><linearGradient id="${prefix}-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7db787" stop-opacity=".27"/><stop offset="1" stop-color="#7db787" stop-opacity="0"/></linearGradient></defs>`;
  return `${gradient}${grid}<path class="${prefix}-area" d="${area}" style="fill:url(#${prefix}-gradient)"/><path class="${prefix}-path" d="${path}"/><line class="chart-focus" x1="${last.x}" y1="${last.y}" x2="${last.x}" y2="${bottom}"/><circle class="${prefix}-point chart-dot" cx="${last.x}" cy="${last.y}" r="4"/>`;
}

function renderMonitoring() {
  const visible = getVisibleLoads();
  const total = visible.reduce((sum, load) => sum + load.power, 0);
  $("#monitor-summary").innerHTML = `
    <div class="monitor-summary-card"><span>Live power draw</span><strong>${total}<small>W</small></strong><em>↗ 4.8% from average</em></div>
    <div class="monitor-summary-card"><span>Energy used today</span><strong>${state.selectedRoom === "All buildings" ? "8.4" : visible[0].energy}<small>kWh</small></strong><em>Across ${visible.length} monitored load${visible.length === 1 ? "" : "s"}</em></div>
    <div class="monitor-summary-card"><span>Reading status</span><strong>Reference data</strong><em>Values update every 10 seconds</em></div>`;
  const search = $("#load-search").value.trim().toLowerCase();
  const filtered = visible.filter((load) => `${load.name} ${load.type}`.toLowerCase().includes(search));
  $("#monitor-table").innerHTML = filtered.map((load) => `
    <tr><td><div class="room-cell"><span class="room-mini">${load.icon}</span><span class="room-name">${load.name}<small>${load.type}</small></span></div></td>
    <td class="power-cell">${load.power} W</td><td class="${load.power > load.average ? "change-positive" : "change-negative"}">${load.power > load.average ? "↗" : "↘"} ${Math.abs(Math.round((load.power - load.average) / load.average * 100))}%</td>
    <td><span class="table-status ${load.power > state.threshold ? "high" : ""}">${load.power > state.threshold ? "High usage" : "Normal"}</span></td><td>${formatTime(state.lastUpdated)}</td></tr>`).join("") || `<tr><td colspan="5">No matching loads found.</td></tr>`;
}

function getHistoryRows() {
  const power = state.readings.slice(-6).reverse();
  const base = power.map((value, index) => ({ time: ["10:50 AM", "10:40 AM", "10:30 AM", "10:20 AM", "10:10 AM", "10:00 AM"][index], room: ["Lab 1", "Computer Lab", "Lab 2", "Classroom 1", "Lighting", "Lab 1"][index], power: value, energy: (value / 1000 * (10 / 60)).toFixed(2), status: value > state.threshold ? "High" : "Normal" }));
  return (state.showOlder ? base.concat(olderHistory) : base).filter((row) => state.historyRoom === "All rooms" || row.room === state.historyRoom);
}

function renderHistory() {
  const rows = getHistoryRows();
  const power = getVisibleLoads().reduce((sum, load) => sum + load.power, 0);
  const periodFactor = state.period === "week" ? 7 : state.period === "yesterday" ? .9 : 1;
  const energy = (state.selectedRoom === "All buildings" ? 8.4 : getVisibleLoads()[0].energy) * periodFactor;
  $("#history-total").innerHTML = `${energy.toFixed(1)} <small>kWh</small>`;
  $("#history-summary").innerHTML = `
    <div class="history-stat"><span>TOTAL ENERGY</span><b>${energy.toFixed(1)} <small>kWh</small></b><em>↗ 8.0% vs. prior period</em></div>
    <div class="history-stat"><span>AVERAGE POWER</span><b>${Math.round(power / Math.max(getVisibleLoads().length, 1))} <small>W</small></b><em>Across selected loads</em></div>
    <div class="history-stat"><span>PEAK USAGE</span><b>2:30 <small>PM</small></b><em>570 W · Lab 1</em></div>
    <div class="history-stat"><span>LOWEST USAGE</span><b>6:00 <small>AM</small></b><em>185 W · Classroom 1</em></div>`;
  const chartValues = state.period === "week" ? [275, 330, 395, 350, 465, 430, 510, 420, 475, 380, 440, power] : [280, 310, 380, 420, 515, 465, 390, 435, 460, 410, 495, power];
  $("#history-chart").innerHTML = makeChart(chartValues, 900, 240, "history");
  $("#history-table").innerHTML = rows.map((row) => `<tr><td>${row.time}</td><td>${row.room}</td><td class="power-cell">${row.power} W</td><td>${row.energy} kWh</td><td><span class="table-status ${row.status === "High" ? "high" : ""}">${row.status}</span></td></tr>`).join("") || `<tr><td colspan="5">No readings match this room.</td></tr>`;
  $("#history-count").textContent = `Showing ${rows.length} reading${rows.length === 1 ? "" : "s"}`;
  $("#show-more-history").textContent = state.showOlder ? "Show fewer readings ↑" : "Show older readings ↓";
}

function renderPrediction() {
  const current = getCurrentPower();
  const predicted = getPrediction();
  const change = ((predicted - current) / current * 100).toFixed(1);
  $("#forecast-power").textContent = predicted;
  $(".current-tag b").textContent = `${current} W`;
  $(".next-tag b").textContent = `${predicted} W`;
  $("#forecast-direction").textContent = `${predicted >= current ? "↗ +" : "↘ "}${change}% from current usage`;
  $("#forecast-direction").style.color = predicted >= current ? "#559365" : "#648b6c";
  $("#forecast-explanation").textContent = predicted >= current ? "Recent readings are trending upward. Usage may rise if the current pattern continues." : "Recent readings are trending downward. Usage may ease if this pattern continues.";
  const recent = state.readings.slice(-5);
  const max = Math.max(...recent, 1);
  $("#trend-readings").innerHTML = recent.map((value, index) => `<div class="trend-item"><b>${value} W</b><i style="height:${Math.max(13, value / max * 45)}px"></i><span>${["10:10", "10:20", "10:30", "10:40", "Now"][index]}</span></div>`).join("");
}

function renderRecommendations() {
  const highLoad = loads.find((load) => load.power > state.threshold);
  const alert = $("#recommendation-alert");
  alert.classList.toggle("hidden", !highLoad);
  if (highLoad) alert.innerHTML = `<span>!</span><span><b>${highLoad.name} is above your ${state.threshold} W alert threshold.</b> Consider checking equipment that may be running unnecessarily.</span>`;
  const cards = [
    { id: "lighting", icon: "☼", tag: highLoad && highLoad.name === "Lighting" ? "HIGH USAGE" : "QUICK WIN", title: "Switch off unused lights", text: "Lighting is a simple place to start. Turn off lights in empty rooms or make better use of daylight.", saving: "0.8 kWh", className: "featured" },
    { id: "cooling", icon: "❄", tag: "COMFORT + SAVINGS", title: "Check the cooling schedule", text: "Review whether the AC is needed in every space right now. A small schedule adjustment can add up.", saving: "1.1 kWh", className: "" },
    { id: "equipment", icon: "▣", tag: "GOOD HABIT", title: "Power down idle equipment", text: "Screens and computers can draw power when nobody is using them. Enable sleep settings where possible.", saving: "0.5 kWh", className: "" }
  ];
  $("#recommendation-grid").innerHTML = cards.map((card) => {
    const saved = state.savedTips.has(card.id);
    return `<article class="recommendation-card ${card.className}"><div class="rec-top"><span class="rec-icon">${card.icon}</span><span class="rec-tag ${card.tag === "HIGH USAGE" ? "urgent" : ""}">${card.tag}</span></div><h3>${card.title}</h3><p>${card.text}</p><div class="rec-saving">✳ Potential daily saving <b>${card.saving}</b></div><button class="rec-action ${saved ? "saved" : ""}" data-tip-id="${card.id}" aria-label="${saved ? "Remove saved tip" : "Save tip"}" title="${saved ? "Remove from checklist" : "Save to checklist"}">${saved ? "✓" : "↗"}</button></article>`;
  }).join("");
}

function selectedEnergy() {
  if (state.selectedRoom === "All buildings") return state.period === "yesterday" ? 7.6 : state.period === "week" ? 56.8 : 8.4;
  const load = getVisibleLoads()[0];
  return load ? load.energy * (state.period === "yesterday" ? 0.9 : state.period === "week" ? 7 : 1) : 0;
}

function renderSustainability() {
  const energy = selectedEnergy();
  const actions = [
    { room: "Cooling", title: "Tune the cooling schedule", energy: 1.1, color: "cooling" },
    { room: "Lighting", title: "Switch off unneeded lights", energy: 0.8, color: "lighting" },
    { room: "Equipment", title: "Enable sleep mode on idle devices", energy: 0.5, color: "equipment" }
  ];
  const progress = Math.min(100, Math.round(energy / state.dailyGoal * 100));
  $("#impact-energy").textContent = energy.toFixed(1);
  $("#carbon-today").textContent = (energy * 0.42).toFixed(2);
  $("#carbon-savings").textContent = (2.4 * 0.42).toFixed(2);
  $("#carbon-progress").style.width = `${progress}%`;
  $("#carbon-target-label").textContent = `${progress}% of your ${state.dailyGoal.toFixed(1)} kWh daily energy target`;
  $("#impact-breakdown").innerHTML = actions.map((action) => `<div class="impact-row"><div class="impact-row-copy"><span>${action.room}</span><b>${action.title}</b></div><div class="impact-bar"><i class="${action.color}" style="width:${Math.round(action.energy / 1.1 * 100)}%"></i></div><strong>${action.energy.toFixed(1)} <small>kWh</small></strong></div>`).join("");
}

const plannerActions = [
  { id: "cooling", icon: "❄", title: "Adjust the cooling schedule", detail: "Raise the setpoint by 1° when the room is occupied.", saving: 1.1 },
  { id: "lighting", icon: "☼", title: "Switch off unused lighting", detail: "Check empty rooms and make use of daylight.", saving: 0.8 },
  { id: "equipment", icon: "▣", title: "Enable sleep mode on idle devices", detail: "Reduce standby draw on screens and computers.", saving: 0.5 }
];

function renderPlanner() {
  const completed = state.plannerCompleted.size;
  const savings = plannerActions.filter((action) => state.plannerCompleted.has(action.id)).reduce((total, action) => total + action.saving, 0);
  $("#planner-progress").textContent = `${completed} of ${plannerActions.length} complete`;
  $("#planner-savings").textContent = savings.toFixed(1);
  $("#planner-carbon").textContent = (savings * 0.42).toFixed(2);
  $("#planner-message").textContent = completed === plannerActions.length ? "Your energy plan is complete." : completed ? "You're making progress." : "Small steps make a real difference.";
  $("#planner-list").innerHTML = plannerActions.map((action) => {
    const done = state.plannerCompleted.has(action.id);
    return `<article class="planner-action ${done ? "completed" : ""}"><span class="planner-action-icon">${action.icon}</span><div class="planner-action-copy"><b>${action.title}</b><p>${action.detail}</p><small>Potential saving · ${action.saving.toFixed(1)} kWh / day</small></div><button type="button" class="planner-check ${done ? "is-done" : ""}" data-planner-id="${action.id}" aria-pressed="${done}" aria-label="${done ? "Mark incomplete" : "Mark complete"}">${done ? "✓ Done" : "Mark done"}</button></article>`;
  }).join("");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: state.currency, maximumFractionDigits: 2 }).format(amount);
}

function renderCosts() {
  const allPeriodEnergy = selectedEnergy();
  const periodMultiplier = state.period === "week" ? 7 : state.period === "yesterday" ? 0.9 : 1;
  const dailyEnergy = allPeriodEnergy / periodMultiplier;
  const savings = plannerActions.filter((action) => state.plannerCompleted.has(action.id)).reduce((total, action) => total + action.saving, 0);
  const cost = allPeriodEnergy * state.electricityRate;
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: state.currency, maximumFractionDigits: 2 });
  const symbol = new Intl.NumberFormat("en-US", { style: "currency", currency: state.currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value || state.currency;
  $("#cost-period-label").textContent = state.period === "week" ? "ESTIMATED COST — 7 DAYS" : state.period === "yesterday" ? "ESTIMATED COST YESTERDAY" : "ESTIMATED COST TODAY";
  $("#cost-total").textContent = formatter.format(cost);
  $("#cost-month").textContent = formatter.format(dailyEnergy * 30 * state.electricityRate);
  $("#cost-savings").textContent = formatter.format(savings * state.electricityRate);
  $("#cost-currency-symbol").textContent = symbol;
  $("#cost-rate-caption").textContent = `${formatter.format(state.electricityRate)} / kWh`;
  const visibleLoads = getVisibleLoads();
  const largestCost = Math.max(...visibleLoads.map((load) => load.energy * periodMultiplier * state.electricityRate), 0.001);
  $("#cost-breakdown").innerHTML = visibleLoads.map((load) => {
    const loadEnergy = load.energy * periodMultiplier;
    const loadCost = loadEnergy * state.electricityRate;
    return `<div class="cost-row"><div><b>${load.name}</b><small>${load.type} · ${loadEnergy.toFixed(1)} kWh</small></div><div class="cost-bar"><i style="width:${Math.max(3, Math.round(loadCost / largestCost * 100))}%"></i></div><strong>${formatter.format(loadCost)}</strong></div>`;
  }).join("");
}

function advanceReadings() {
  state.readingIndex += 1;
  const sequence = [350, 380, 425, 510, 470, 390, 410, 435, 395, 450, 480, 420, 530, 455, 400];
  const value = sequence[state.readingIndex % sequence.length];
  state.readings.push(value);
  if (state.readings.length > 18) state.readings.shift();
  loads[0].power = state.readingIndex % 4 === 0 ? 520 : 570;
  loads[1].power = 295 + state.readingIndex % 5 * 8;
  loads[2].power = 175 + state.readingIndex % 4 * 6;
  state.lastUpdated = new Date();
  const activePage = document.querySelector(".page-view.active")?.id.replace("page-", "");
  renderPage(activePage || "dashboard");
  $("#last-seen").textContent = "Updated just now";
  $("#footer-time").textContent = "just now";
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function exportCsv(kind) {
  const headings = kind === "history" ? ["Time", "Room / load", "Power (W)", "Energy (kWh)", "Status"] : kind === "impact" || kind === "costs" ? ["Metric", "Value", "Unit"] : ["Room / load", "Equipment", "Power (W)", "Average (W)", "Status", "Last reading"];
  const rows = kind === "history"
    ? getHistoryRows().map((row) => [row.time, row.room, row.power, row.energy, row.status])
    : kind === "impact" ? [["Energy used", selectedEnergy().toFixed(1), "kWh"], ["Estimated emissions", (selectedEnergy() * 0.42).toFixed(2), "kg CO2"], ["Potential emissions reduction", (2.4 * 0.42).toFixed(2), "kg CO2/day"]]
      : kind === "costs" ? [["Energy used", selectedEnergy().toFixed(1), "kWh"], ["Electricity rate", state.electricityRate.toFixed(3), `${state.currency}/kWh`], ["Estimated period cost", formatCurrency(selectedEnergy() * state.electricityRate), state.currency], ["30-day projection", formatCurrency(selectedEnergy() / (state.period === "week" ? 7 : state.period === "yesterday" ? 0.9 : 1) * 30 * state.electricityRate), state.currency]]
      : getVisibleLoads().map((load) => [load.name, load.type, load.power, load.average, load.power > state.threshold ? "High usage" : "Normal", formatTime(state.lastUpdated)]);
  const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [headings, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const file = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wattwise-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  const exportLabel = kind === "costs" ? "cost estimate rows" : kind === "impact" ? "impact metrics" : kind === "history" ? "history rows" : "monitoring rows";
  showToast(`${rows.length} ${exportLabel} exported as CSV.`);
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    setPage(pageButton.dataset.page);
  }
  const rangeButton = event.target.closest(".range-button");
  if (rangeButton) {
    $$(".range-button").forEach((button) => button.classList.toggle("active", button === rangeButton));
    state.range = rangeButton.dataset.range;
    drawUsageChart();
  }
  if (event.target.closest("#refresh-data")) { advanceReadings(); showToast("Energy readings refreshed."); }
  const exportButton = event.target.closest("[data-export]");
  if (exportButton) exportCsv(exportButton.dataset.export);
  const plannerButton = event.target.closest("[data-planner-id]");
  if (plannerButton) {
    const id = plannerButton.dataset.plannerId;
    if (state.plannerCompleted.has(id)) state.plannerCompleted.delete(id);
    else state.plannerCompleted.add(id);
    renderPlanner();
    showToast(state.plannerCompleted.has(id) ? "Action added to your completed plan." : "Action moved back to your plan.");
  }
  if (event.target.closest("#planner-reset")) {
    state.plannerCompleted.clear();
    renderPlanner();
    showToast("Your daily action plan has been reset.");
  }
  if (event.target.closest("#goal-setting")) {
    $("#goal-input").value = state.dailyGoal.toFixed(1);
    $("#goal-modal").classList.remove("hidden");
    $("#goal-input").focus();
  }
  if (event.target.closest("[data-close-goal]") || event.target.id === "goal-modal") $("#goal-modal").classList.add("hidden");
  if (event.target.closest("#alert-setting")) {
    $("#threshold-input").value = state.threshold;
    $("#threshold-modal").classList.remove("hidden");
    $("#threshold-input").focus();
  }
  if (event.target.closest("#show-more-history")) {
    state.showOlder = !state.showOlder;
    renderHistory();
  }
  const tipButton = event.target.closest(".rec-action");
  if (tipButton) {
    const tipId = tipButton.dataset.tipId;
    if (state.savedTips.has(tipId)) { state.savedTips.delete(tipId); showToast("Tip removed from your checklist."); }
    else { state.savedTips.add(tipId); showToast("Tip saved to your checklist."); }
    renderRecommendations();
  }
  if (event.target.closest(".date-button")) {
    const picker = $("#date-picker");
    if (picker.showPicker) picker.showPicker(); else picker.click();
  }
  if (event.target.closest(".icon-button")) showToast("No new notifications.");
  if (event.target.closest(".more-button")) showToast("Jordan Davis - Facility manager.");
  if (event.target.closest(".dots-button")) $("#alert-setting").click();
  if (event.target.closest("#threshold-close, #threshold-cancel") || event.target.id === "threshold-modal") $("#threshold-modal").classList.add("hidden");
});

$("#threshold-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const newThreshold = Number($("#threshold-input").value);
  if (!Number.isFinite(newThreshold) || newThreshold < 1) return;
  state.threshold = Math.round(newThreshold);
  $(".alert-setting-value").textContent = `${state.threshold} W`;
  $("#threshold-modal").classList.add("hidden");
  renderDashboard();
  renderMonitoring();
  renderRecommendations();
  showToast(`Alert threshold set to ${state.threshold} W.`);
});

$("#goal-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const goal = Number($("#goal-input").value);
  if (!Number.isFinite(goal) || goal <= 0) return;
  state.dailyGoal = goal;
  $("#goal-modal").classList.add("hidden");
  renderDashboard();
  showToast(`Daily energy goal set to ${goal.toFixed(1)} kWh.`);
});

$("#date-picker").addEventListener("change", (event) => {
  if (!event.target.value) return;
  state.selectedDate = new Date(`${event.target.value}T12:00:00`);
  const isToday = state.selectedDate.toDateString() === new Date().toDateString();
  state.period = isToday ? "today" : "yesterday";
  $("#history-period").value = state.period;
  $("#date-label").textContent = isToday ? `Today, ${state.selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : state.selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const page = document.querySelector(".page-view.active")?.id.replace("page-", "") || "dashboard";
  setPage(page);
});

$("#room-select").addEventListener("change", (event) => {
  state.selectedRoom = event.target.value;
  renderPage(document.querySelector(".page-view.active")?.id.replace("page-", ""));
});

$("#load-search").addEventListener("input", renderMonitoring);
$("#history-room").addEventListener("change", (event) => { state.historyRoom = event.target.value; renderHistory(); });
$("#history-period").addEventListener("change", (event) => { state.period = event.target.value; renderHistory(); });
$("#cost-currency").addEventListener("change", (event) => {
  const sampleRates = { USD: 0.18, EUR: 0.17, GBP: 0.15, INR: 7.5 };
  state.currency = event.target.value;
  state.electricityRate = sampleRates[state.currency] || 0.18;
  $("#cost-rate").value = state.electricityRate;
  renderCosts();
});
$("#cost-rate").addEventListener("input", (event) => {
  const rate = Number(event.target.value);
  if (!Number.isFinite(rate) || rate <= 0) return;
  state.electricityRate = rate;
  renderCosts();
});
window.addEventListener("hashchange", () => setPage(location.hash.slice(1) || "dashboard"));

setPage(location.hash.slice(1) || "dashboard");
setInterval(advanceReadings, 10000);

