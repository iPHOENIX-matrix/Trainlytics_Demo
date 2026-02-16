let hasUnsavedChanges = false;

/* ------------------ MODE + PLAN HELPERS ------------------ */

function getMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") || "view";
}

function getEditingPlanId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("plan");
}

function getCurrentPlanId() {
  const data = getData();
  return getEditingPlanId() || data.activePlanId;
}

/* ------------------ RENDER ------------------ */

function renderPlans() {
  renderPlanStructure();
}

function renderPlanStructure() {

  const data = getData();
  const planId = getCurrentPlanId();
  const plan = data.workoutPlans[planId];

  const container = document.getElementById("planContainer");
  const isEditMode = getMode() === "edit";

  container.style.opacity = 0;
  container.innerHTML = "";

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  days.forEach((day, index) => {

    const dayData = plan.days[day];

    container.innerHTML += `
      <div class="card day-block">

        <div class="day-header-row">
          <div class="day-label">Day ${index + 1}: ${day}</div>

          <div class="day-title">
            ${
              isEditMode
              ? `<input 
                   value="${dayData.name}"
                   placeholder="Day Name"
                   onchange="updateDayName('${day}', this.value)">`
              : `<h3>${dayData.name}</h3>`
            }
          </div>
        </div>

        <div id="groups-${day}"></div>

        ${
          isEditMode
          ? `<button onclick="addGroup('${day}')">+ Add Group</button>`
          : ``
        }

      </div>
    `;

    const groupContainer = document.getElementById(`groups-${day}`);

    if (!dayData.groups || dayData.groups.length === 0) {
      if (!isEditMode) {
        groupContainer.innerHTML = `<p style="opacity:0.5;">No groups added</p>`;
      }
      return;
    }

    dayData.groups.forEach((group, gIndex) => {

      const isUnlocked = isEditMode && !group.locked;

      let groupHTML = `
        <div class="group-block">

          <div class="group-header">
            <div class="group-left">
              ${
                isUnlocked
                ? `<input 
                     value="${group.name}"
                     placeholder="Group Name"
                     onchange="updateGroupName('${day}', ${gIndex}, this.value)">`
                : `<span class="group-name">${group.name}</span>`
              }
              <div class="count-circle">${group.exercises.length}</div>
            </div>
      `;

      if (isEditMode) {
        groupHTML += `
            ${
              group.locked
              ? `<button class="edit-btn"
                   onclick="editGroup('${day}', ${gIndex})">Edit</button>`
              : `<button class="save-btn"
                   onclick="saveGroup('${day}', ${gIndex})">Save</button>`
            }
        `;
      }

      groupHTML += `
          </div>

          <div id="ex-${day}-${gIndex}"></div>
      `;

      if (isUnlocked) {
        groupHTML += `
          <button onclick="addExercise('${day}', ${gIndex})">
            + Add Exercise
          </button>
        `;
      }

      groupHTML += `</div>`;

      groupContainer.innerHTML += groupHTML;

      const exContainer = document.getElementById(`ex-${day}-${gIndex}`);

      group.exercises.forEach((ex, exIndex) => {

        if (isUnlocked) {

          exContainer.innerHTML += `
            <div class="exercise-row">

              <input
                value="${ex.name}"
                placeholder="Exercise Name"
                onchange="updateExercise('${day}', ${gIndex}, ${exIndex}, 'name', this.value)">

              <input
                type="number" min="1"
                value="${ex.sets}"
                onchange="updateExercise('${day}', ${gIndex}, ${exIndex}, 'sets', this.value)">

              <button class="delete-btn"
                onclick="deleteExercise('${day}', ${gIndex}, ${exIndex})">
                Delete
              </button>

            </div>
          `;

        } else {

          exContainer.innerHTML += `
            <p style="margin:6px 0;">
              • ${ex.name} (${ex.sets} sets)
            </p>
          `;

        }

      });

    });

  });

  setTimeout(() => {
    container.style.opacity = 1;
    container.classList.add("fade-in");
  }, 10);

}

/* ------------------ GROUP SYSTEM ------------------ */

function addGroup(day) {
  const data = getData();
  const planId = getCurrentPlanId();

  data.workoutPlans[planId]
    .days[day]
    .groups.push({
      name: "",               // <-- removed default text
      locked: false,
      exercises: []
    });

  hasUnsavedChanges = true;
  saveData(data);
  renderPlanStructure();
}

function updateGroupName(day, gIndex, value) {
  const data = getData();
  const planId = getCurrentPlanId();

  data.workoutPlans[planId]
    .days[day]
    .groups[gIndex]
    .name = value;

  hasUnsavedChanges = true;
  saveData(data);
}

function updateDayName(day, value) {
  const data = getData();
  const planId = getCurrentPlanId();

  data.workoutPlans[planId]
    .days[day]
    .name = value;

  hasUnsavedChanges = true;
  saveData(data);
}

function updateExercise(day, gIndex, exIndex, field, value) {
  const data = getData();
  const planId = getCurrentPlanId();

  const group = data.workoutPlans[planId]
    .days[day]
    .groups[gIndex];

  group.exercises[exIndex][field] =
    field === "sets" ? Number(value) : value;

  hasUnsavedChanges = true;
  saveData(data);
}

function addExercise(day, gIndex) {
  const data = getData();
  const planId = getCurrentPlanId();

  data.workoutPlans[planId]
    .days[day]
    .groups[gIndex]
    .exercises.push({ name: "", sets: 3 }); // <-- removed default text

  hasUnsavedChanges = true;
  saveData(data);
  renderPlanStructure();
}

function deleteExercise(day, gIndex, exIndex) {
  if (!confirm("Delete exercise?")) return;

  const data = getData();
  const planId = getCurrentPlanId();

  data.workoutPlans[planId]
    .days[day]
    .groups[gIndex]
    .exercises.splice(exIndex, 1);

  hasUnsavedChanges = true;
  saveData(data);
  renderPlanStructure();
}

function saveGroup(day, gIndex) {
  const data = getData();
  const planId = getCurrentPlanId();

  data.workoutPlans[planId]
    .days[day]
    .groups[gIndex]
    .locked = true;

  hasUnsavedChanges = false;
  saveData(data);
  renderPlanStructure();
}

function editGroup(day, gIndex) {
  const data = getData();
  const planId = getCurrentPlanId();

  data.workoutPlans[planId]
    .days[day]
    .groups[gIndex]
    .locked = false;

  saveData(data);
  renderPlanStructure();
}

/* ------------------ BACK PROTECTION ------------------ */

window.addEventListener("beforeunload", function (e) {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = "";
  }
});

document.addEventListener("DOMContentLoaded", renderPlans);
