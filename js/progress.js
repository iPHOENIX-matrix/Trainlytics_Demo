function renderProgress() {

  const data = getData();

  document.getElementById("totalWorkouts").innerText =
    Object.keys(data.workouts || {}).length;
}

document.addEventListener("DOMContentLoaded", renderProgress);
