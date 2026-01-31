const goalForm = document.getElementById("goalForm");
const goalList = document.getElementById("goalList");
const addStepGlobal = document.getElementById("addStepGlobal");
const stepDialog = document.getElementById("stepDialog");
const stepForm = document.getElementById("stepForm");
const stepDetail = document.getElementById("stepDetail");
const stepGoal = document.getElementById("stepGoal");
const resetApp = document.getElementById("resetApp");

const totalGoals = document.getElementById("totalGoals");
const stepsComplete = document.getElementById("stepsComplete");
const nextMilestone = document.getElementById("nextMilestone");

const STORAGE_KEY = "pulsepath-goals";

let goals = loadGoals();

function loadGoals() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateProgress(goal) {
  if (goal.steps.length === 0) {
    return 0;
  }
  const completed = goal.steps.filter((step) => step.completed).length;
  return Math.round((completed / goal.steps.length) * 100);
}

function renderGoals() {
  goalList.innerHTML = "";
  stepGoal.innerHTML = "";

  if (goals.length === 0) {
    goalList.innerHTML =
      '<div class="goal-card"><p class="muted">No goals yet. Add one to get started.</p></div>';
  }

  goals.forEach((goal) => {
    const progress = calculateProgress(goal);

    const card = document.createElement("article");
    card.className = "goal-card";

    card.innerHTML = `
      <header>
        <div>
          <h3>${goal.title}</h3>
          <p class="goal-meta">${goal.reason}</p>
        </div>
        <span class="tag">Due ${formatDate(goal.targetDate)}</span>
      </header>
      <div>
        <p class="goal-meta">${progress}% complete</p>
        <div class="goal-progress"><span style="width: ${progress}%"></span></div>
      </div>
      <div class="step-list"></div>
      <button class="ghost" data-goal-id="${goal.id}">Remove goal</button>
    `;

    const stepsContainer = card.querySelector(".step-list");

    if (goal.steps.length === 0) {
      stepsContainer.innerHTML =
        '<p class="goal-meta">No steps yet. Add the first step.</p>';
    } else {
      goal.steps.forEach((step) => {
        const stepItem = document.createElement("div");
        stepItem.className = `step-item ${step.completed ? "completed" : ""}`;
        stepItem.innerHTML = `
          <input type="checkbox" ${step.completed ? "checked" : ""} data-goal-id="${goal.id}" data-step-id="${step.id}" />
          <p class="step-text">${step.detail}</p>
          <button class="ghost" data-remove-step="${step.id}" data-goal-id="${goal.id}">Remove</button>
        `;
        stepsContainer.appendChild(stepItem);
      });
    }

    goalList.appendChild(card);

    const option = document.createElement("option");
    option.value = goal.id;
    option.textContent = goal.title;
    stepGoal.appendChild(option);
  });

  updateInsights();
}

function updateInsights() {
  totalGoals.textContent = goals.length;

  const allSteps = goals.flatMap((goal) => goal.steps);
  const completedSteps = allSteps.filter((step) => step.completed).length;
  stepsComplete.textContent = `${completedSteps} / ${allSteps.length || 0}`;

  const nextGoal = goals
    .filter((goal) => calculateProgress(goal) < 100)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))[0];

  nextMilestone.textContent = nextGoal
    ? `${nextGoal.title} • ${calculateProgress(nextGoal)}%`
    : goals.length
    ? "All goals complete"
    : "Add a goal";
}

function addGoal(title, reason, targetDate) {
  goals.unshift({
    id: crypto.randomUUID(),
    title,
    reason,
    targetDate,
    steps: [],
  });
  saveGoals();
  renderGoals();
}

function addStep(goalId, detail) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return;

  goal.steps.push({
    id: crypto.randomUUID(),
    detail,
    completed: false,
  });

  saveGoals();
  renderGoals();
}

function toggleStep(goalId, stepId) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return;
  const step = goal.steps.find((item) => item.id === stepId);
  if (!step) return;

  step.completed = !step.completed;
  saveGoals();
  renderGoals();
}

function removeStep(goalId, stepId) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return;
  goal.steps = goal.steps.filter((item) => item.id !== stepId);
  saveGoals();
  renderGoals();
}

function removeGoal(goalId) {
  goals = goals.filter((goal) => goal.id !== goalId);
  saveGoals();
  renderGoals();
}

function openStepDialog() {
  if (goals.length === 0) {
    alert("Add a goal before adding steps.");
    return;
  }
  stepDetail.value = "";
  stepDialog.showModal();
}

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addGoal(
    document.getElementById("goalTitle").value.trim(),
    document.getElementById("goalReason").value.trim(),
    document.getElementById("goalDate").value
  );
  goalForm.reset();
});

addStepGlobal.addEventListener("click", openStepDialog);

stepForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addStep(stepGoal.value, stepDetail.value.trim());
  stepDialog.close();
});

resetApp.addEventListener("click", () => {
  if (confirm("Reset all goals and steps?")) {
    goals = [];
    saveGoals();
    renderGoals();
  }
});

goalList.addEventListener("click", (event) => {
  const target = event.target;
  if (target.matches("button[data-goal-id]")) {
    removeGoal(target.dataset.goalId);
  }

  if (target.matches("button[data-remove-step]")) {
    removeStep(target.dataset.goalId, target.dataset.removeStep);
  }
});

goalList.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("input[type='checkbox']")) {
    toggleStep(target.dataset.goalId, target.dataset.stepId);
  }
});

renderGoals();
