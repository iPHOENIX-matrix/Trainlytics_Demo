function renderPlanButtons() {

  const data = getData();
  const container = document.getElementById("planButtons");
  container.innerHTML = "";

  Object.values(data.workoutPlans).forEach(plan => {

    const isActive = plan.id === data.activePlanId;

    container.innerHTML += `
      <div class="card">

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px; flex-wrap:wrap;">

          <h3 style="margin:0;">
            ${plan.name}
            ${isActive ? "(Current Plan)" : ""}
          </h3>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">

            ${
              isActive
              ? `<button 
                   style="background:#34c759;">
                   Activated
                 </button>`
              : `<button onclick="activatePlan('${plan.id}')">
                   Activate
                 </button>`
            }

            ${
              isActive
              ? `<button disabled
                   style="opacity:0.6; cursor:not-allowed;">
                   Edit
                 </button>`
              : `<button onclick="editPlan('${plan.id}')">
                   Edit
                 </button>`
            }

            ${
              isActive
              ? `<button class="delete-btn"
                   disabled
                   style="opacity:0.6; cursor:not-allowed;">
                   Delete
                 </button>`
              : `<button class="delete-btn"
                   onclick="deletePlan('${plan.id}')">
                   Delete
                 </button>`
            }

          </div>

        </div>

      </div>
    `;
  });
}

/* -------- ACTIVATE -------- */

function activatePlan(planId) {

  const data = getData();
  data.activePlanId = planId;
  saveData(data);

  renderPlanButtons();
}

/* -------- EDIT -------- */

function editPlan(planId) {

  // Do NOT change activePlanId here
  window.location.href = `workout-plan.html?mode=edit&plan=${planId}`;
}


/* -------- DELETE -------- */

function deletePlan(planId) {

  const data = getData();

  if (planId === data.activePlanId) {
    alert("Active plan cannot be deleted.");
    return;
  }

  if (!confirm("Are you sure you want to delete this plan?")) return;

  delete data.workoutPlans[planId];

  saveData(data);

  renderPlanButtons();
}

/* -------- CREATE -------- */

function createNewPlan() {

  const name = prompt("Enter Plan Name");
  if (!name) return;

  const id = "plan" + Date.now();
  const data = getData();

  const blankDays = {
    Monday: { name: "Day 1", groups: [] },
    Tuesday: { name: "Day 2", groups: [] },
    Wednesday: { name: "Day 3", groups: [] },
    Thursday: { name: "Day 4", groups: [] },
    Friday: { name: "Day 5", groups: [] },
    Saturday: { name: "Day 6", groups: [] },
    Sunday: { name: "Day 7", groups: [] }
  };

  data.workoutPlans[id] = {
    id,
    name,
    days: blankDays
  };

  saveData(data);

  renderPlanButtons();
}

document.addEventListener("DOMContentLoaded", renderPlanButtons);
