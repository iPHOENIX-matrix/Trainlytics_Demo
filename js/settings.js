function toggleUnit() {
  const data = getData();

  if (!data.settings) data.settings = {};
  data.settings.unit = data.settings.unit === "lbs" ? "kg" : "lbs";

  saveData(data);
  alert("Unit changed to " + data.settings.unit);
}

function resetData() {
  localStorage.removeItem("trainlytics-data");
  location.reload();
}

function goToPlanManager() {
  window.location.href = "manage-plans.html";
}
