function getTodayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function getTargetDate() {
  const params = new URLSearchParams(window.location.search);
  return params.get("edit") || getTodayString();
}

function getWorkoutPlanForDate(dateStr) {
  const data = getData();
  const plan = data.workoutPlans[data.activePlanId];
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return plan.days[days[new Date(dateStr).getDay()]];
}

/* ================= RENDER ================= */

function renderWorkout() {

  const container = document.getElementById("workoutContainer");
  const title = document.getElementById("workoutTitle");
  const dateLabel = document.getElementById("workoutDate");

  const targetDate = getTargetDate();
  const data = getData();
  const todayPlan = getWorkoutPlanForDate(targetDate);

  dateLabel.innerText = new Date(targetDate).toDateString();
  title.innerText = todayPlan.name;
  container.innerHTML = "";

  todayPlan.groups.forEach(group => {

    container.innerHTML += `
      <div class="card">
        <h3>${group.name}</h3>
        <div id="group-${group.name.replace(/\s/g,'')}"></div>
      </div>
    `;

    const groupContainer =
      document.getElementById(`group-${group.name.replace(/\s/g,'')}`);

    group.exercises.forEach(ex => {

      const overrides = data.exerciseOverrides?.[targetDate] || {};
      const displayName = overrides[ex.name] || ex.name;

      groupContainer.innerHTML += generateExerciseCard(
        displayName,
        ex.sets,
        ex.name
      );

    });

  });

  renderOptionalExercises(container);

  restoreDraft();
}

/* ================= OPTIONAL EXERCISES ================= */

function renderOptionalExercises(container) {

  const optionalExercises = [
    { name: "Treadmill", sets: 1, type: "cardio" },
    { name: "Forearms Up", sets: 3 },
    { name: "Forearms Down", sets: 3 }
  ];

  container.innerHTML += `
    <div class="card">
      <h3>Optional Exercises</h3>
      <div id="optionalContainer"></div>
    </div>
  `;

  const optionalContainer = document.getElementById("optionalContainer");

  optionalExercises.forEach(ex => {

    if (ex.type === "cardio") {
      optionalContainer.innerHTML += generateTreadmillCard();
    } else {
      optionalContainer.innerHTML += generateExerciseCard(
        ex.name,
        ex.sets,
        ex.name
      );
    }

  });
}

/* ================= CARD GENERATOR ================= */

function generateExerciseCard(exercise, setCount, originalExercise = null) {

  let setsHTML = "";

  for (let i = 1; i <= setCount; i++) {
    setsHTML += `
      <div class="set-row">
        <span>Set ${i}</span>

        <div class="input-with-unit">
          <input type="number"
            class="weight"
            placeholder="Weight"
            oninput="liveUpdate('${exercise}')">
          <span class="unit-label">kg</span>
        </div>

        <div class="input-with-unit">
          <input type="number"
            class="reps"
            placeholder="Reps"
            oninput="liveUpdate('${exercise}')">
          <span class="unit-label">reps</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="exercise-card" data-exercise="${exercise}">
      <h4>${exercise}</h4>

      ${setsHTML}

      <div class="failure-display">
        Failure: <span class="failure-value">0</span> kg
      </div>

      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="save-btn"
          onclick="saveExercise('${exercise}')">Save</button>

        <button class="edit-btn"
          style="display:none;"
          onclick="editExercise('${exercise}')">Edit</button>

        <button class="edit-btn"
          onclick="replaceExercise('${originalExercise || exercise}')">
          Replace
        </button>
      </div>
    </div>
  `;
}

/* ================= TREADMILL CARD ================= */

function generateTreadmillCard() {

  return `
    <div class="exercise-card" data-exercise="Treadmill">
      <h4>Treadmill</h4>

      <div class="set-row">
        <span>Incline</span>
        <input type="number"
          class="weight"
          placeholder="%"
          oninput="liveUpdate('Treadmill')">
      </div>

      <div class="set-row">
        <span>Speed</span>
        <input type="number"
          class="reps"
          placeholder="km/h"
          oninput="liveUpdate('Treadmill')">
      </div>

      <div class="set-row">
        <span>Calories</span>
        <input type="number"
          class="extra"
          placeholder="kcal"
          oninput="liveUpdateTreadmillCalories()">
      </div>

      <div class="failure-display">
        Calories: <span class="failure-value">0</span>
      </div>

      <div style="margin-top:12px; display:flex; gap:10px;">
        <button class="save-btn"
          onclick="saveExercise('Treadmill')">Save</button>

        <button class="edit-btn"
          style="display:none;"
          onclick="editExercise('Treadmill')">Edit</button>
      </div>
    </div>
  `;
}

/* ================= REPLACE ================= */

function replaceExercise(originalExercise) {

  const newName = prompt("Replace with which exercise?");
  if (!newName) return;

  const date = getTargetDate();
  const data = getData();

  if (!data.exerciseOverrides[date]) {
    data.exerciseOverrides[date] = {};
  }

  data.exerciseOverrides[date][originalExercise] = newName;

  saveData(data);
  renderWorkout();
}

/* ================= LIVE UPDATE ================= */

function liveUpdate(exercise) {

  const date = getTargetDate();
  const data = getData();

  const card = document.querySelector(`[data-exercise="${exercise}"]`);
  if (!card) return;

  const weightInputs = card.querySelectorAll(".weight");
  const repInputs = card.querySelectorAll(".reps");

  if (!data.liveDraft) data.liveDraft = {};
  if (!data.liveDraft[date]) data.liveDraft[date] = {};

  const sets = [];
  let maxWeight = 0;

  weightInputs.forEach((input, index) => {
    const weight = Number(input.value) || 0;
    const reps = Number(repInputs[index]?.value) || 0;
    sets.push({ weight, reps });
    if (weight > maxWeight) maxWeight = weight;
  });

  let failureValue = maxWeight;

  if (exercise === "Treadmill") {

    const calorieInput = card.querySelector(".extra");
    const calories = Number(calorieInput?.value) || 0;

    if (sets.length > 0) {
      sets[0].calories = calories;
    }

    failureValue = calories;
  }

  data.liveDraft[date][exercise] = { sets, failure: failureValue };
  saveData(data);

  card.querySelector(".failure-value").innerText = failureValue;
}

/* ================= CALORIE LIVE ================= */

function liveUpdateTreadmillCalories() {

  const date = getTargetDate();
  const data = getData();

  const card = document.querySelector('[data-exercise="Treadmill"]');
  if (!card) return;

  const calorieInput = card.querySelector(".extra");
  const calories = Number(calorieInput.value) || 0;

  card.querySelector(".failure-value").innerText = calories;

  if (!data.liveDraft) data.liveDraft = {};
  if (!data.liveDraft[date]) data.liveDraft[date] = {};

  if (!data.liveDraft[date]["Treadmill"]) {
    data.liveDraft[date]["Treadmill"] = { sets: [{}], failure: 0 };
  }

  data.liveDraft[date]["Treadmill"].failure = calories;

  if (!data.liveDraft[date]["Treadmill"].sets[0]) {
    data.liveDraft[date]["Treadmill"].sets[0] = {};
  }

  data.liveDraft[date]["Treadmill"].sets[0].calories = calories;

  saveData(data);
}

/* ================= SAVE ================= */

function saveExercise(exercise) {

  const date = getTargetDate();
  const data = getData();

  if (!data.workouts) data.workouts = {};
  if (!data.workouts[date]) {
    data.workouts[date] = {
      exercises: {},
      savedAt: Date.now()
    };
  }

  const draft = data.liveDraft?.[date]?.[exercise];
  if (!draft) return;

  data.workouts[date].exercises[exercise] = draft;

  if (!data.pr) data.pr = {};
  if (exercise !== "Treadmill") {
    if (!data.pr[exercise] || draft.failure > data.pr[exercise]) {
      data.pr[exercise] = draft.failure;
    }
  }

  saveData(data);

  lockExerciseUI(exercise);

  alert("Saved Successfully ✅");
}

/* ================= LOCK / EDIT ================= */

function editExercise(exercise) {
  unlockExerciseUI(exercise);
}

function lockExerciseUI(exercise) {

  const card = document.querySelector(`[data-exercise="${exercise}"]`);
  if (!card) return;

  card.querySelectorAll("input").forEach(input => {
    input.disabled = true;
  });

  card.querySelector(".save-btn").style.display = "none";
  card.querySelector(".edit-btn").style.display = "inline-block";
}

function unlockExerciseUI(exercise) {

  const card = document.querySelector(`[data-exercise="${exercise}"]`);
  if (!card) return;

  card.querySelectorAll("input").forEach(input => {
    input.disabled = false;
  });

  card.querySelector(".save-btn").style.display = "inline-block";
  card.querySelector(".edit-btn").style.display = "none";
}

/* ================= RESTORE ================= */

function restoreDraft() {

  const date = getTargetDate();
  const data = getData();
  const draft = data.liveDraft?.[date];
  const saved = data.workouts?.[date]?.exercises;

  if (!draft) return;

  Object.keys(draft).forEach(exercise => {

    const card = document.querySelector(`[data-exercise="${exercise}"]`);
    if (!card) return;

    const weightInputs = card.querySelectorAll(".weight");
    const repInputs = card.querySelectorAll(".reps");

    draft[exercise].sets.forEach((set, i) => {

      if (weightInputs[i]) weightInputs[i].value = set.weight || 0;
      if (repInputs[i]) repInputs[i].value = set.reps || 0;

      if (exercise === "Treadmill") {
        const calorieInput = card.querySelector(".extra");
        if (calorieInput)
          calorieInput.value =
            set.calories || draft[exercise].failure || 0;
      }

    });

    card.querySelector(".failure-value").innerText =
      draft[exercise].failure;

    if (saved && saved[exercise]) {
      lockExerciseUI(exercise);
    }
  });
}

document.addEventListener("DOMContentLoaded", renderWorkout);
