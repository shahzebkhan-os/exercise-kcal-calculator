// ---- 1. PDF-BASED KCAL/MIN DATA ------------------------------------
// Values below are based on the charts in your uploaded PDF.
// Where exact decimals weren’t perfectly visible, treat as approximate
// and update them yourself if needed.
const pdfExerciseData = {
  // TOP 10 – Jeremy (page 2)
  sprints: {
    jeremy: 15.14,
    kevin: 16.28, // from Kevin top-10 chart
    baseWeightKg: 80 // assumed base, used only if you want scaling later
  },
  devils_press: {
    jeremy: 14.47,
    kevin: 15.35,
    baseWeightKg: 80
  },
  boxing: {
    jeremy: 13.53,
    kevin: 16.61,
    baseWeightKg: 80
  },
  burpees: {
    jeremy: 12.56,
    kevin: 12.59,
    baseWeightKg: 80
  },
  assault_bike: {
    jeremy: 12.18,
    kevin: 13.56,
    baseWeightKg: 80
  },
  squat_jumps: {
    jeremy: 12.12,
    kevin: 8.33,
    baseWeightKg: 80
  },
  jump_ins: {
    jeremy: 11.77,
    kevin: 12.4,
    baseWeightKg: 80
  },

  // Low intensity examples (Jeremy page 4, Kevin page 11) – values approximate
  incline_walking: {
    jeremy: 7.44, // Jeremy incline walking 3.5 mph, 6% incline
    kevin: 6.13,  // Kevin incline walking 3 mph, 2% incline
    baseWeightKg: 80
  },
  elliptical: {
    jeremy: 6.77,
    kevin: 8.96,
    baseWeightKg: 80
  },
  stairmaster: {
    jeremy: 7.91,
    kevin: 9.55,
    baseWeightKg: 80
  }

  // You can continue filling in more exercises from other pages if you like.
};

// ---- 2. TREADMILL MET DATA -----------------------------------------
const treadmillSpeedsToMET = [
  { speed: 4.8, met: 3.5 },
  { speed: 5.5, met: 4.3 },
  { speed: 6.5, met: 6.0 },
  { speed: 8.0, met: 8.3 },
  { speed: 9.7, met: 9.8 },
  { speed: 11.0, met: 11.0 },
  { speed: 12.0, met: 12.5 },
  { speed: 14.0, met: 14.5 }
];

function getMetForSpeed(speedKmH) {
  // simple nearest-speed lookup
  let closest = treadmillSpeedsToMET[0];
  let minDiff = Math.abs(speedKmH - closest.speed);
  for (const s of treadmillSpeedsToMET) {
    const diff = Math.abs(speedKmH - s.speed);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return closest.met;
}

function getTreadmillCaloriesPerMinute(weightKg, speedKmH, inclinePercent) {
  let met = getMetForSpeed(speedKmH);
  const inclineCorrection = inclinePercent * 0.5;
  const correctedMet = met + inclineCorrection;

  // kcal / min = MET × 3.5 × weight(kg) / 200
  return (correctedMet * 3.5 * weightKg) / 200;
}

// ---- 3. DOM REFERENCES ---------------------------------------------
const profileSelect = document.getElementById("profileSelect");
const exerciseSelect = document.getElementById("exerciseSelect");
const weightInput = document.getElementById("weightInput");
const durationInput = document.getElementById("durationInput");
const durationValue = document.getElementById("durationValue");
const speedInput = document.getElementById("speedInput");
const speedValue = document.getElementById("speedValue");
const inclineInput = document.getElementById("inclineInput");
const inclineValue = document.getElementById("inclineValue");
const treadmillControls = document.getElementById("treadmillControls");
const kcalPerMinEl = document.getElementById("kcalPerMin");
const totalKcalEl = document.getElementById("totalKcal");
const resetBtn = document.getElementById("resetBtn");

// ---- 4. CHART INITIALISATION ---------------------------------------
const ctx = document.getElementById("kcalChart");
let kcalChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Total kcal burned",
        data: [],
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 0
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: "Time (minutes)" }
      },
      y: {
        title: { display: true, text: "Calories burned" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: { display: false }
    }
  }
});

// ---- 5. CALCULATION CORE -------------------------------------------
function getCaloriesPerMinute() {
  const profile = profileSelect.value;
  const exercise = exerciseSelect.value;
  const weightKg = parseFloat(weightInput.value) || 75;
  const speedKmH = parseFloat(speedInput.value) || 8;
  const inclinePct = parseFloat(inclineInput.value) || 0;

  if (exercise === "treadmill") {
    return getTreadmillCaloriesPerMinute(weightKg, speedKmH, inclinePct);
  }

  // PDF-based exercises
  const ref = pdfExerciseData[exercise];
  if (!ref) return 0;

  if (profile === "jeremy" || profile === "kevin") {
    // use the reference kcal/min for the chosen person
    return ref[profile] || 0;
  }

  // custom: scale by weight relative to assumed base weight
  const base = ref.jeremy; // you could choose jeremy/kevin or average
  const baseWeight = ref.baseWeightKg || 80;
  return base * (weightKg / baseWeight);
}

function recalcAndRender() {
  const duration = parseInt(durationInput.value, 10) || 30;
  const kcalPerMin = getCaloriesPerMinute();
  const totalKcal = kcalPerMin * duration;

  kcalPerMinEl.textContent = `${kcalPerMin.toFixed(2)} kcal`;
  totalKcalEl.textContent = `${totalKcal.toFixed(0)} kcal`;

  const labels = [];
  const data = [];
  for (let t = 1; t <= duration; t++) {
    labels.push(t);
    data.push(kcalPerMin * t);
  }

  kcalChart.data.labels = labels;
  kcalChart.data.datasets[0].data = data;
  kcalChart.update();
}

// ---- 6. UI UPDATES & EVENT HANDLERS --------------------------------
function updateVisibility() {
  const isTreadmill = exerciseSelect.value === "treadmill";
  treadmillControls.style.display = isTreadmill ? "block" : "none";
}

durationInput.addEventListener("input", () => {
  durationValue.textContent = `${durationInput.value} min`;
  recalcAndRender();
});

speedInput.addEventListener("input", () => {
  speedValue.textContent = `${speedInput.value} km/h`;
  recalcAndRender();
});

inclineInput.addEventListener("input", () => {
  inclineValue.textContent = `${inclineInput.value}%`;
  recalcAndRender();
});

exerciseSelect.addEventListener("change", () => {
  updateVisibility();
  recalcAndRender();
});

profileSelect.addEventListener("change", recalcAndRender);
weightInput.addEventListener("input", recalcAndRender);

resetBtn.addEventListener("click", () => {
  profileSelect.value = "custom";
  exerciseSelect.value = "treadmill";
  weightInput.value = 75;
  durationInput.value = 30;
  speedInput.value = 8.0;
  inclineInput.value = 0;
  durationValue.textContent = "30 min";
  speedValue.textContent = "8.0 km/h";
  inclineValue.textContent = "0%";
  updateVisibility();
  recalcAndRender();
});

// ---- 7. INITIAL RENDER ---------------------------------------------
updateVisibility();
recalcAndRender();
