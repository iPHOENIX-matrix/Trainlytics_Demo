function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function calculateWorkoutIndex(startDate) {
  const start = startDate ? new Date(startDate) : new Date();
  const today = new Date();

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return ((diffDays % 7) + 7) % 7;
}

