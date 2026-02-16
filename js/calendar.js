let currentDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
});

function getTodayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("monthLabel");
  const details = document.getElementById("workoutDetails");

  grid.innerHTML = "";
  details.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.innerText =
    currentDate.toLocaleString("default", { month: "long" }) +
    " " +
    year;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const data = getData();
  const todayStr = getTodayString();

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    grid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.innerText = day;

    const dateString =
      year +
      "-" +
      String(month + 1).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0");

    const dateObj = new Date(dateString);

    if (dateString === todayStr) {
      cell.classList.add("today");
    }

    if (data.workouts && data.workouts[dateString]) {
      cell.classList.add("completed");
    }

    if (dateObj.getDay() === 0) {
      cell.classList.add("rest");
    }

    cell.addEventListener("click", () => {
      showWorkoutDetails(dateString);
    });

    grid.appendChild(cell);
  }
}

function showWorkoutDetails(dateString) {
  const details = document.getElementById("workoutDetails");
  const data = getData();

  details.innerHTML = "";

  const workout = data.workouts?.[dateString];
  const todayStr = getTodayString();

  const dateObj = new Date(dateString);
  const todayObj = new Date(todayStr);

  const isPast = dateObj < todayObj;
  const isFuture = dateObj > todayObj;
  const isRestDay = dateObj.getDay() === 0;

  // 🔹 Rest day
  if (isRestDay) {
    details.innerHTML = `
      <div class="card">
        <h3>${dateString}</h3>
        <p>It's your rest day 🧘 Take rest, enjoy.</p>
      </div>
    `;
    return;
  }

  // 🔹 Past day no workout
  if (isPast && !workout) {
    details.innerHTML = `
      <div class="card">
        <h3>${dateString}</h3>
        <p>No workout recorded ❌</p>
      </div>
    `;
    return;
  }

  // 🔹 Future day
  if (isFuture && !workout) {
    details.innerHTML = `
      <div class="card">
        <h3>${dateString}</h3>
        <p>Wait for the workout day ⏳</p>
      </div>
    `;
    return;
  }

  // 🔹 Today no workout
  if (!workout) {
    details.innerHTML = `
      <div class="card">
        <h3>${dateString}</h3>
        <p>No workout detected</p>
        <button onclick="goToEdit('${dateString}')">
          Start Workout
        </button>
      </div>
    `;
    return;
  }

  // 🔹 Workout exists
  const exercises = workout.exercises || workout;

  let html = `
    <div class="card">
      <h3>${dateString}</h3>
  `;

  for (let exercise in exercises) {
    const ex = exercises[exercise];

    html += `
      <div style="margin-bottom:20px;">
        <h4>${exercise}</h4>
    `;

    // ✅ SPECIAL CASE: TREADMILL
    if (exercise === "Treadmill") {

      if (ex.sets && ex.sets.length) {
        ex.sets.forEach((set, index) => {
          const incline = set.weight || 0;
          const speed = set.reps || 0;

          html += `
            <p>Session ${index + 1}: ${incline}% × ${speed} km/h</p>
          `;
        });
      }

      html += `
        <p><strong>Calories Burned:</strong> ${ex.failure ?? 0} kcal</p>
      `;

    } else {

      // ✅ NORMAL EXERCISES
      if (ex.sets && ex.sets.length) {
        ex.sets.forEach((set, index) => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;

          html += `
            <p>Set ${index + 1}: ${weight} kg × ${reps}</p>
          `;
        });
      }

      html += `
        <p><strong>Failure:</strong> ${ex.failure ?? 0} kg</p>
      `;
    }

    html += `</div>`;
  }

  // 🔐 24 HOUR LOCK SYSTEM
  let isLocked = false;
  let lockMessage = "";

  const lockDuration = 24 * 60 * 60 * 1000;

  if (!workout.savedAt) {
    isLocked = true;
    lockMessage = `
      <p style="color:#ff4d4d; font-weight:bold;">
        🔒 Locked permanently
      </p>
    `;
  } else {

    const diff = Date.now() - workout.savedAt;

    if (diff >= lockDuration) {
      isLocked = true;
      lockMessage = `
        <p style="color:#ff4d4d; font-weight:bold;">
          🔒 Locked permanently
        </p>
      `;
    } else {
      const remaining = lockDuration - diff;

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remaining % (1000 * 60 * 60)) / (1000 * 60)
      );

      lockMessage = `
        <p style="color:#ffc107;">
          ⏳ Locks in: ${hours}h ${minutes}m
        </p>
      `;
    }
  }

  html += lockMessage;

  if (!isLocked) {
    html += `
      <button onclick="goToEdit('${dateString}')">
        Edit Workout
      </button>
    `;
  }

  html += `</div>`;

  details.innerHTML = html;
}

function goToEdit(dateString) {
  window.location.href = `workout.html?edit=${dateString}`;
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}
