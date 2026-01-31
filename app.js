const goalList = document.getElementById("goalList");
const addStepGlobal = document.getElementById("addStepGlobal");
const openGoalDialog = document.getElementById("openGoalDialog");
const stepDialog = document.getElementById("stepDialog");
const stepForm = document.getElementById("stepForm");
const stepDialogTitle = document.getElementById("stepDialogTitle");
const stepDialogSubmit = document.getElementById("stepDialogSubmit");
const stepError = document.getElementById("stepError");
const stepDetail = document.getElementById("stepDetail");
const stepGoal = document.getElementById("stepGoal");
const resetApp = document.getElementById("resetApp");
const emptyState = document.getElementById("emptyState");
const goalDialog = document.getElementById("goalDialog");
const goalDialogForm = document.getElementById("goalDialogForm");
const goalDialogTitle = document.getElementById("goalDialogTitle");
const goalDialogSubmit = document.getElementById("goalDialogSubmit");
const goalDialogError = document.getElementById("goalDialogError");
const goalDialogTitleInput = document.getElementById("goalDialogTitleInput");
const goalDialogReasonInput = document.getElementById("goalDialogReasonInput");
const goalDialogDateInput = document.getElementById("goalDialogDateInput");

const totalGoals = document.getElementById("totalGoals");
const stepsComplete = document.getElementById("stepsComplete");
const nextMilestone = document.getElementById("nextMilestone");

const STORAGE_KEY = "pulsepath-goals";
const MIN_TEXT = 3;
const MAX_TITLE = 60;
const MAX_REASON = 90;
const MAX_STEP = 90;

let goals = loadGoals();
let editingGoalId = "";
let editingStepGoalId = "";
let editingStepId = "";
let stepDialogMode = "add";
let goalDialogMode = "add";

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

function validateGoalInput(title, reason, targetDate) {
  if (title.length < MIN_TEXT || title.length > MAX_TITLE) {
    return `Goal title must be ${MIN_TEXT}-${MAX_TITLE} characters.`;
  }
  if (reason.length < MIN_TEXT || reason.length > MAX_REASON) {
    return `Reason must be ${MIN_TEXT}-${MAX_REASON} characters.`;
  }
  if (!targetDate) {
    return "Target date is required.";
  }
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) {
    return "Target date is invalid.";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (target < today) {
    return "Target date cannot be in the past.";
  }
  return "";
}

function validateStepInput(detail) {
  if (detail.length < MIN_TEXT || detail.length > MAX_STEP) {
    return `Step detail must be ${MIN_TEXT}-${MAX_STEP} characters.`;
  }
  return "";
}

function setFormError(element, message) {
  if (!element) return;
  element.textContent = message;
}

function renderGoals() {
  goalList.innerHTML = "";
  stepGoal.innerHTML = "";

  if (goals.length === 0) {
    emptyState.hidden = false;
    addStepGlobal.disabled = true;
  }
  if (goals.length > 0) {
    emptyState.hidden = true;
    addStepGlobal.disabled = false;
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
        <div class="goal-actions">
          <span class="tag">Due ${formatDate(goal.targetDate)}</span>
          <button class="ghost" data-edit-goal="${goal.id}">Edit</button>
        </div>
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
          <button class="ghost" data-edit-step="${step.id}" data-goal-id="${goal.id}">Edit</button>
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
  return true;
}

function addStep(goalId, detail) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return false;

  goal.steps.push({
    id: crypto.randomUUID(),
    detail,
    completed: false,
  });

  saveGoals();
  renderGoals();
  return true;
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
  return true;
}

function openGoalDialogAdd() {
  goalDialogMode = "add";
  editingGoalId = "";
  goalDialogTitle.textContent = "Add a goal";
  goalDialogSubmit.textContent = "Save goal";
  goalDialogTitleInput.value = "";
  goalDialogReasonInput.value = "";
  goalDialogDateInput.value = "";
  setFormError(goalDialogError, "");
  goalDialog.showModal();
}

function openGoalDialogEdit(goalId) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return;
  goalDialogMode = "edit";
  editingGoalId = goalId;
  goalDialogTitle.textContent = "Edit goal";
  goalDialogSubmit.textContent = "Save changes";
  goalDialogTitleInput.value = goal.title;
  goalDialogReasonInput.value = goal.reason;
  goalDialogDateInput.value = goal.targetDate;
  setFormError(goalDialogError, "");
  goalDialog.showModal();
}

function openStepDialogAdd() {
  if (goals.length === 0) {
    alert("Add a goal before adding steps.");
    return;
  }
  stepDialogMode = "add";
  editingStepGoalId = "";
  editingStepId = "";
  stepDialogTitle.textContent = "Add a step";
  stepDialogSubmit.textContent = "Save step";
  stepDetail.value = "";
  setFormError(stepError, "");
  stepDialog.showModal();
}

function openStepDialogEdit(goalId, stepId) {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return;
  const step = goal.steps.find((item) => item.id === stepId);
  if (!step) return;
  stepDialogMode = "edit";
  editingStepGoalId = goalId;
  editingStepId = stepId;
  stepDialogTitle.textContent = "Edit step";
  stepDialogSubmit.textContent = "Save changes";
  stepDetail.value = step.detail;
  setFormError(stepError, "");
  stepDialog.showModal();
}

function syncStepGoalSelection(goalId) {
  if (!goalId) return;
  stepGoal.value = goalId;
}

openGoalDialog.addEventListener("click", openGoalDialogAdd);
addStepGlobal.addEventListener("click", openStepDialogAdd);

stepForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const detail = stepDetail.value.trim();
  const validation = validateStepInput(detail);
  if (validation) {
    setFormError(stepError, validation);
    return;
  }

  if (stepDialogMode === "add") {
    const added = addStep(stepGoal.value, detail);
    if (!added) {
      setFormError(stepError, "Select a goal to assign this step.");
      return;
    }
  } else {
    const goal = goals.find((item) => item.id === editingStepGoalId);
    if (!goal) return;
    const step = goal.steps.find((item) => item.id === editingStepId);
    if (!step) return;
    step.detail = detail;
    saveGoals();
    renderGoals();
  }

  if (stepDialog.open) {
    stepDialog.close();
  }
});

goalDialogForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = goalDialogTitleInput.value.trim();
  const reason = goalDialogReasonInput.value.trim();
  const targetDate = goalDialogDateInput.value;
  const validation = validateGoalInput(title, reason, targetDate);
  if (validation) {
    setFormError(goalDialogError, validation);
    return;
  }

  if (goalDialogMode === "add") {
    addGoal(title, reason, targetDate);
  } else {
    const goal = goals.find((item) => item.id === editingGoalId);
    if (!goal) return;
    goal.title = title;
    goal.reason = reason;
    goal.targetDate = targetDate;
    saveGoals();
    renderGoals();
  }

  if (goalDialog.open) {
    goalDialog.close();
  }
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

  if (target.matches("button[data-edit-goal]")) {
    openEditGoalDialog(target.dataset.editGoal);
  }

  if (target.matches("button[data-edit-step]")) {
    openEditStepDialog(target.dataset.goalId, target.dataset.editStep);
  }
});

goalList.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("input[type='checkbox']")) {
    toggleStep(target.dataset.goalId, target.dataset.stepId);
  }
});

renderGoals();
