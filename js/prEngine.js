function updatePR(exercise, failureWeight) {
  const data = getData();
  if (!data.pr[exercise] || failureWeight > data.pr[exercise]) {
    data.pr[exercise] = failureWeight;
    saveData(data);
    return true;
  }
  return false;
}
