const STORAGE_KEY = "trainlytics-data";

/* ---------------- GLOBAL LOADER FIX (ONE PLACE) ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  if (!loader) return;

  // Small delay so page renders first
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 300);
  }, 100);
});

/* ---------------- DATA ENGINE ---------------- */

function getData() {

  let data = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (!data) {
    data = createFreshData();
  }

  if (!data.workoutPlans) {
    data.workoutPlans = getDefaultPlans();
  }

  if (!data.activePlanId) {
    data.activePlanId = Object.keys(data.workoutPlans)[0];
  }

  // Safe settings init (future-proof)
  if (!data.settings) {
    data.settings = { unit: "kg" };
  }

  // ✅ NEW: Exercise override safety init
  if (!data.exerciseOverrides) {
    data.exerciseOverrides = {};
  }

  saveData(data);
  return data;
}


function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createFreshData() {
  return {
    workoutPlans: getDefaultPlans(),
    activePlanId: "planA",
    settings: { unit: "kg" }
  };
}

function getDefaultPlans() {
  return {
    planA: {
      id: "planA",
      name: "Plan A",
      days: getInitialPlanStructure()
    }
  };
}

function getInitialPlanStructure() {

  return {
    Monday: {
      name: "Push A",
      groups: [
        buildGroup("Chest", [
          "Flat Bench Dumbbell Press",
          "Decline Dumbbell Press",
          "Dumbbell Pullover",
          "Flat Dumbbell Fly"
        ]),
        buildGroup("Shoulders", [
          "Shoulder Press",
          "Shoulder Fly"
        ]),
        buildGroup("Triceps", [
          "Tricep Rope Pull Down",
          "Overhead Tricep Rope Press"
        ])
      ]
    },

    Tuesday: {
      name: "Pull A",
      groups: [
        buildGroup("Back", [
          "Lat Pull Down",
          "Cable Seated Row",
          "Tripod Row",
          "Close Grip Lat Pull Down",
          "Face Rope Pull"
        ]),
        buildGroup("Biceps", [
          "Rope Machine Bicep Press",
          "Seated Bicep Curls",
          "Arnold Curls"
        ])
      ]
    },

    Wednesday: {
      name: "Legs",
      groups: [
        buildGroup("Legs", [
          "Squats",
          "Leg Press",
          "Leg Curls",
          "Calf Raises"
        ]),
        buildGroup("Core", [
          "Abdomen Machine In-Out",
          "Abdomen Machine Out-In"
        ])
      ]
    },

    Thursday: {
      name: "Push B",
      groups: [
        buildGroup("Chest", [
          "Barbel Bench Press",
          "Incline Dumbbell Press",
          "Lower Dumbbell Fly"
        ]),
        buildGroup("Shoulders", [
          "Shoulder Machine",
          "Barbel Shoulder Pull Over",
          "Shrugs"
        ]),
        buildGroup("Triceps", [
          "Tricep Rope Pull Down",
          "Incline Rope Tricep Press",
          "Reverse Grip Pushdown"
        ])
      ]
    },

    Friday: {
      name: "Pull B",
      groups: [
        buildGroup("Back", [
          "Mid Grip Lat Pull Down",
          "Wide Grip Seated Cable Row",
          "T Bar Row",
          "Reverse Pec Deck"
        ]),
        buildGroup("Biceps", [
          "Hammer Curls",
          "Preacher Curls",
          "Dumbbell Curls"
        ])
      ]
    },

    Saturday: {
      name: "Core + Arms",
      groups: [
        buildGroup("Core", [
          "Cable Abs Crunch",
          "Dumbbell Side Shrugs",
          "Incline Bench Abs Crunch",
          "Hyperextension"
        ]),
        buildGroup("Arms", [
          "Incline Seated Bicep Curl",
          "Cable Curl",
          "Under Grip Rope Curl",
          "Over Grip Rope Curl"
        ])
      ]
    },

    Sunday: {
      name: "Rest",
      groups: []
    }
  };
}

function buildGroup(groupName, exerciseNames) {
  return {
    name: groupName,
    locked: false,
    exercises: exerciseNames.map(name => ({
      name,
      sets: 3
    }))
  };
}
