/* =====================================================
   RECOVERY ENGINE
   Handles missed workout detection + plan switching
===================================================== */

function countMissedWorkouts() {

    const data = getData();
    const todayStr = getTargetDate();
    const today = new Date(todayStr);
  
    const plan = data.workoutPlans[data.activePlanId];
  
    let missed = 0;
    let cursor = new Date(today);
  
    // Start checking from yesterday
    cursor.setDate(cursor.getDate() - 1);
  
    while (true) {
  
      const dateStr = cursor.toISOString().split("T")[0];
      const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][cursor.getDay()];
      const dayPlan = plan.days[dayName];
  
      // STOP if rest day
      if (!dayPlan || dayPlan.groups.length === 0) break;
  
      const done = data.workouts?.[dateStr];
  
      if (!done) {
        missed++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  
    return missed;
  }
  
  /* ================= RECOVERY MODAL ================= */
  
  function showRecoveryModal(missedCount) {
  
    // Safety: do NOT show on rest day
    const todayPlan = getWorkoutPlanForDate(getTargetDate());
    if (!todayPlan || todayPlan.groups.length === 0) {
      renderWorkout();
      return;
    }
  
    const modal = document.createElement("div");
    modal.id = "recoveryModal";
  
    modal.innerHTML = `
      <div class="recovery-card">
        <h2>You missed gym for ${missedCount} day(s)</h2>
  
        <button onclick="handleRecovery('continue')">
          Continue with Original Plan
        </button>
  
        <button onclick="handleRecovery('choose')">
          Choose Plan
        </button>
  
        <button onclick="handleRecovery('custom')">
          Create Custom Workout
        </button>
      </div>
    `;
  
    document.body.appendChild(modal);
  }
  
  function handleRecovery(option) {
  
    document.getElementById("recoveryModal")?.remove();
  
    if (option === "continue") {
      renderWorkout();
    }
  
    if (option === "choose") {
      showPlanChooser();
    }
  
    if (option === "custom") {
      startEmptyWorkout();
    }
  }
  
  /* ================= LOAD SPECIFIC WORKOUT ================= */
  
  function loadSpecificWorkout(dateStr) {
  
    const plan = getWorkoutPlanForDate(dateStr);
    if (!plan) return;
  
    overrideWorkoutForToday(plan);
  }
  
  /* ================= OVERRIDE WORKOUT ================= */
  
  function overrideWorkoutForToday(plan) {
  
    hideLoader();
  
    const container = document.getElementById("workoutContainer");
    container.innerHTML = "";
  
    document.getElementById("workoutTitle").innerText =
      plan.name + " • Recovery Mode";
  
    document.getElementById("workoutDate").innerText =
      new Date(getTargetDate()).toDateString();
  
    plan.groups.forEach(group => {
  
      container.innerHTML += `
        <div class="card">
          <h3>${group.name}</h3>
          <div id="group-${group.name.replace(/\s/g,'')}"></div>
        </div>
      `;
  
      const groupContainer =
        document.getElementById(`group-${group.name.replace(/\s/g,'')}`);
  
      group.exercises.forEach(ex => {
        groupContainer.innerHTML += generateExerciseCard(
          ex.name,
          ex.sets,
          ex.name
        );
      });
  
    });
  
    renderOptionalExercises(container);
    restoreDraft();
  }
  
  /* ================= PLAN CHOOSER ================= */
  
  function showPlanChooser() {
  
    const plan = getData().workoutPlans[getData().activePlanId];
  
    const modal = document.createElement("div");
    modal.id = "recoveryModal";
  
    let buttons = "";
  
    Object.values(plan.days).forEach(day => {
      if (day.groups.length > 0) {
        buttons += `
          <button onclick="selectPlanWorkout('${day.name}')">
            ${day.name}
          </button>
        `;
      }
    });
  
    modal.innerHTML = `
      <div class="recovery-card">
        <h2>Select Workout</h2>
        ${buttons}
      </div>
    `;
  
    document.body.appendChild(modal);
  }
  
  function selectPlanWorkout(workoutName) {
  
    const plan = getData().workoutPlans[getData().activePlanId];
  
    const selectedDay = Object.values(plan.days)
      .find(day => day.name === workoutName);
  
    if (!selectedDay) return;
  
    document.getElementById("recoveryModal")?.remove();
  
    overrideWorkoutForToday(selectedDay);
  }
  
  /* ================= CHANGE PLAN ================= */
  
  function triggerChangePlan() {
  
    const todayPlan = getWorkoutPlanForDate(getTargetDate());
  
    // Do NOT allow plan switching on rest day
    if (!todayPlan || todayPlan.groups.length === 0) {
      return;
    }
  
    const data = getData();
    const date = getTargetDate();
    const hasCustom = data.customWorkouts?.[date];
  
    const modal = document.createElement("div");
    modal.id = "recoveryModal";
  
    let buttons = `
      <button onclick="renderWorkout()">
        Continue with Original Plan
      </button>
  
      <button onclick="showPlanChooser()">
        Choose Plan
      </button>
    `;
  
    if (hasCustom) {
      buttons += `
        <button onclick="restoreCustomWorkout()">
          Continue Ongoing Custom Plan
        </button>
      `;
    }
  
    buttons += `
      <button onclick="startEmptyWorkout()">
        Create New Custom Plan
      </button>
    `;
  
    modal.innerHTML = `
      <div class="recovery-card">
        <h2>Change Workout Plan</h2>
        ${buttons}
      </div>
    `;
  
    document.body.appendChild(modal);
  }