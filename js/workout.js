function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

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

  if (!data.recoveryChoice) {
    data.recoveryChoice = {};
  }

  const isRestDay = !todayPlan || todayPlan.groups.length === 0;

  dateLabel.innerText = new Date(targetDate).toDateString();
  container.innerHTML = "";

  /* ================= REST DAY ================= */

  if (isRestDay) {

    title.innerText = todayPlan?.name || "Rest";

    hideLoader();
    return; // 🔥 THIS STOPS EVERYTHING BELOW

  }

  /* ================= NORMAL WORKOUT ================= */

  title.innerHTML = `
    <span id="workoutTitleText">${todayPlan.name}</span>
    <button onclick="editWorkoutTitle()" style="margin-left:10px;">
      Edit
    </button>
    <button onclick="triggerChangePlan()" style="margin-left:10px;">
      Change Plan
    </button>
  `;

  todayPlan.groups.forEach(group => {

    container.innerHTML += `
      <div class="card">
        <h3>${group.name}</h3>

        <div id="group-${group.name.replace(/\s/g,'')}"></div>

        <button onclick="addExerciseToExistingGroup('${group.name}')">
          + Add Exercise
        </button>
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

    // render session-added exercises for this group
    const additions = data.sessionAdditions?.[targetDate]?.groups
      ?.find(g => g.name === group.name);

    if (additions) {

      additions.exercises.forEach(ex => {

        groupContainer.innerHTML += generateExerciseCard(
          ex.name,
          ex.sets,
          ex.name
        );

      });

}

  });

  // Render session additions
  const additions = data.sessionAdditions?.[targetDate];

  if (additions?.groups) {

    additions.groups.forEach(group => {

      container.innerHTML += `
        <div class="card">
          <h3>${group.name} (Added)</h3>
          <div id="group-added-${group.name.replace(/\s/g,'')}"></div>

          <button onclick="addExerciseToSessionGroup('${group.name}')">
            Add Exercise
          </button>
        </div>
      `;

      const groupContainer =
        document.getElementById(`group-added-${group.name.replace(/\s/g,'')}`);

      group.exercises.forEach(ex => {

        groupContainer.innerHTML += generateExerciseCard(
          ex.name,
          ex.sets,
          ex.name
        );

      });

    });

  }

  renderOptionalExercises(container);

  container.innerHTML += `
    <div class="card">
      <button onclick="addSessionGroup()">
        + Add Muscle Group
      </button>
    </div>
  `;

  restoreDraft();
  hideLoader();
}

function addSessionGroup() {

  const groupName = prompt("Enter Muscle Group Name:");
  if (!groupName) return;

  const date = getTargetDate();
  const data = getData();

  // ✅ CRITICAL FIX: ensure sessionAdditions exists
  if (!data.sessionAdditions) {
    data.sessionAdditions = {};
  }

  if (!data.sessionAdditions[date]) {
    data.sessionAdditions[date] = {
      groups: []
    };
  }

  data.sessionAdditions[date].groups.push({
    name: groupName,
    exercises: []
  });

  saveData(data);

  renderWorkout();
}

function addExerciseToSessionGroup(groupName) {

  const exerciseName = prompt("Exercise name:");
  if (!exerciseName) return;

  const date = getTargetDate();
  const data = getData();

  // ✅ ensure safe access
  if (!data.sessionAdditions) return;
  if (!data.sessionAdditions[date]) return;

  const group = data.sessionAdditions[date].groups
    .find(g => g.name === groupName);

  if (!group) return;

  group.exercises.push({
    name: exerciseName,
    sets: 3
  });

  saveData(data);

  renderWorkout();
}

function addExerciseToExistingGroup(groupName) {

  const exerciseName = prompt("Exercise name:");
  if (!exerciseName) return;

  const date = getTargetDate();
  const data = getData();

  if (!data.sessionAdditions) {
    data.sessionAdditions = {};
  }

  if (!data.sessionAdditions[date]) {
    data.sessionAdditions[date] = {
      groups: []
    };
  }

  // find or create group addition entry
  let group = data.sessionAdditions[date].groups
    .find(g => g.name === groupName);

  if (!group) {

    group = {
      name: groupName,
      exercises: []
    };

    data.sessionAdditions[date].groups.push(group);
  }

  group.exercises.push({
    name: exerciseName,
    sets: 3
  });

  saveData(data);

  renderWorkout();
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

        <span>${i}</span>

        <div class="input-with-unit">

          <input type="number"
                 class="weight"
                 placeholder="kg"
                 oninput="liveUpdate('${exercise}')">

        </div>

        <div class="input-with-unit">

          <input type="number"
                 class="reps"
                 placeholder="reps"
                 oninput="liveUpdate('${exercise}')">

        </div>

      </div>

    `;
  }

  return `

    <div class="exercise-card" data-exercise="${exercise}">

      <div style="display:flex;
                  justify-content:space-between;
                  align-items:center;
                  margin-bottom:8px;">

        <h4 style="margin:0;">${exercise}</h4>

      </div>


      ${setsHTML}


      <div class="failure-display">

        <small>Failure</small><br>

        <span class="failure-value">0</span>

      </div>


      <div style="display:flex;
                  gap:8px;
                  margin-top:10px;
                  flex-wrap:wrap;">

        <button class="save-btn"
                onclick="saveExercise('${exercise}')">

          Save

        </button>


        <button class="edit-btn"
                style="display:none;"
                onclick="editExercise('${exercise}')">

          Edit

        </button>


        <button class="edit-btn"
                onclick="replaceExercise('${originalExercise || exercise}')">

          Replace

        </button>


        <button class="delete-btn"
                onclick="deleteExercise(this)">

          Delete

        </button>

      </div>

    </div>

  `;
}

function deleteExercise(button) {

  const confirmDelete = confirm("Are you sure you want to delete this exercise?");
  if (!confirmDelete) return;

  const card = button.closest(".exercise-card");
  card?.remove();
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

function loadCustomWorkoutBuilder() {

  document.getElementById("recoveryModal")?.remove();
  hideLoader();

  const container = document.getElementById("workoutContainer");
  container.innerHTML = "";

  document.getElementById("workoutTitle").innerText =
    "Custom Workout";

  document.getElementById("workoutDate").innerText =
    new Date(getTargetDate()).toDateString();

  container.innerHTML = `
    <div class="card">
      <h3>Custom Workout</h3>
      <div id="customGroup"></div>
      <button onclick="addCustomExercise()">Add Exercise</button>
    </div>
  `;
}

function startEmptyWorkout() {

  const workoutName = prompt("Enter Workout Name:");
  if (!workoutName) return;

  document.getElementById("recoveryModal")?.remove();
  hideLoader();

  const container = document.getElementById("workoutContainer");
  container.innerHTML = "";

  document.getElementById("workoutTitle").innerHTML = `
    <span id="workoutTitleText">${workoutName}</span>

    <button onclick="editWorkoutTitle()" style="margin-left:10px;">
      Edit
    </button>

    <button onclick="triggerChangePlan()" style="margin-left:10px;">
      Change Plan
    </button>
  `;

  const data = getData();
  const date = getTargetDate();

  if (!data.customWorkouts) data.customWorkouts = {};

  data.customWorkouts[date] = {
    title: workoutName,
    groups: []
  };

saveData(data);

  document.getElementById("workoutDate").innerText =
    new Date(getTargetDate()).toDateString();

  container.innerHTML = `
    <div id="customGroups"></div>

    <div class="card">
      <button onclick="addCustomGroup()">+ Add Group</button>
    </div>
  `;

}

function editWorkoutTitle() {

  const titleElement = document.getElementById("workoutTitleText");
  const newTitle = prompt("Enter Workout Name:", titleElement.innerText);
  if (!newTitle) return;

  titleElement.innerText = newTitle;

  const data = getData();
  const date = getTargetDate();

  if (data.customWorkouts?.[date]) {
    data.customWorkouts[date].title = newTitle;
    saveData(data);
  }
}

let customGroupCounter = 0;

function addCustomGroup() {

  const groupName = prompt("Enter Group Name:");
  if (!groupName) return;

  const data = getData();
  const date = getTargetDate();

  if (!data.customWorkouts?.[date]) return;

  // ✅ Save to data FIRST
  data.customWorkouts[date].groups.push({
    name: groupName,
    exercises: []
  });

  saveData(data);

  const groupsContainer = document.getElementById("customGroups");
  const groupId = "group" + Date.now();

  // ✅ Then render UI
  groupsContainer.innerHTML += `
    <div class="card" id="${groupId}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 class="group-title">${groupName}</h3>
        <button onclick="editGroupName('${groupId}')">Edit</button>
      </div>

      <div class="group-exercises"></div>

      <div style="margin-top:16px;display:flex;gap:10px;">
        <button onclick="addExerciseToGroup('${groupId}')">
          Add Exercise
        </button>

        <button class="delete-btn"
          onclick="removeGroup('${groupId}')">
          Delete Group
        </button>
      </div>
    </div>
  `;
}

function editGroupName(groupId) {

  const groupCard = document.getElementById(groupId);
  const titleElement = groupCard.querySelector(".group-title");

  const newName = prompt("Enter new group name:", titleElement.innerText);
  if (!newName) return;

  titleElement.innerText = newName;
}

function addExerciseToGroup(groupId) {

  const groupCard = document.getElementById(groupId);
  const exerciseContainer =
    groupCard.querySelector(".group-exercises");

  const name = prompt("Exercise name?");
  if (!name) return;

  exerciseContainer.innerHTML += generateExerciseCard(name, 3, name);

  const data = getData();
  const date = getTargetDate();

  const groupIndex = [...document.querySelectorAll("#customGroups .card")]
    .findIndex(card => card.id === groupId);

  data.customWorkouts[date].groups[groupIndex].exercises.push({
    name,
    sets: 3
  });

  saveData(data);
}

function removeGroup(groupId) {

  const confirmDelete = confirm("Are you sure you want to delete this group?");
  if (!confirmDelete) return;

  const data = getData();
  const date = getTargetDate();

  const groupCards = [...document.querySelectorAll("#customGroups .card")];
  const groupIndex = groupCards.findIndex(card => card.id === groupId);

  if (groupIndex > -1) {
    data.customWorkouts[date].groups.splice(groupIndex, 1);
    saveData(data);
  }

  document.getElementById(groupId)?.remove();
}

function addCustomExercise() {

  const group = document.getElementById("customGroup");

  const name = prompt("Exercise name?");
  if (!name) return;

  group.innerHTML += generateExerciseCard(name, 3, name);
}

function restoreCustomWorkout() {

  hideLoader();

  const data = getData();
  const date = getTargetDate();

  if (!data.customWorkouts || !data.customWorkouts[date]) {
    renderWorkout();
    return;
  }

  const workout = data.customWorkouts[date];

  const container = document.getElementById("workoutContainer");
  container.innerHTML = "";

  document.getElementById("workoutTitle").innerHTML = `
    <span id="workoutTitleText">${workout.title}</span>

    <button onclick="editWorkoutTitle()" style="margin-left:10px;">
      Edit
    </button>

    <button onclick="triggerChangePlan()" style="margin-left:10px;">
      Change Plan
    </button>
  `;

  document.getElementById("workoutDate").innerText =
    new Date(date).toDateString();

  container.innerHTML = `
    <div id="customGroups"></div>
    <div class="card">
      <button onclick="addCustomGroup()">+ Add Group</button>
    </div>
  `;

  workout.groups.forEach(group => {
    addCustomGroupFromRestore(group.name, group.exercises);
  });
}

function addCustomGroupFromRestore(name, exercises) {

  customGroupCounter++;

  const groupsContainer = document.getElementById("customGroups");
  const groupId = "group" + Date.now() + Math.random();

  groupsContainer.innerHTML += `
    <div class="card" id="${groupId}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 class="group-title">${name}</h3>
        <button onclick="editGroupName('${groupId}')">Edit</button>
      </div>

      <div class="group-exercises"></div>

      <div style="margin-top:16px;display:flex;gap:10px;">
        <button onclick="addExerciseToGroup('${groupId}')">
          Add Exercise
        </button>

        <button class="delete-btn"
          onclick="removeGroup('${groupId}')">
          Delete Group
        </button>
      </div>
    </div>
  `;

  const groupCard = document.getElementById(groupId);
  const exerciseContainer = groupCard.querySelector(".group-exercises");

  exercises.forEach(ex => {
    exerciseContainer.innerHTML += generateExerciseCard(ex.name, ex.sets, ex.name);
  });
}

document.addEventListener("DOMContentLoaded", () => {

  const date = getTargetDate();
  const plan = getWorkoutPlanForDate(date);

  if (!plan || plan.groups.length === 0) {
    renderWorkout();
    return;
  }

  const data = getData();

  if (!data.planOverride) {
    data.planOverride = {};
  }

  if (!data.recoveryChoice) {
    data.recoveryChoice = {};
  }

  // ✅ PRIORITY 1: planOverride
  if (data.planOverride[date]) {

    if (data.planOverride[date] === "__CUSTOM__") {
      restoreCustomWorkout();
      return;
    }

    overrideWorkoutForToday(data.planOverride[date]);
    return;
  }

  // ✅ PRIORITY 2: custom workout
  if (data.customWorkouts?.[date]) {
    restoreCustomWorkout();
    return;
  }

  // ✅ PRIORITY 3: recovery modal
  const missedCount = countMissedWorkouts();

  if (missedCount > 0 && !data.recoveryChoice[date]) {
    showRecoveryModal(missedCount);
    return;
  }

  // ✅ PRIORITY 4: normal workout
  renderWorkout();

});
