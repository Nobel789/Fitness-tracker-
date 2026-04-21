const elements = {
  goalList: document.getElementById("goalList"),
  addStepGlobal: document.getElementById("addStepGlobal"),
  openGoalDialog: document.getElementById("openGoalDialog"),
  stepDialog: document.getElementById("stepDialog"),
  stepForm: document.getElementById("stepForm"),
  stepDialogTitle: document.getElementById("stepDialogTitle"),
  stepDialogSubmit: document.getElementById("stepDialogSubmit"),
  stepError: document.getElementById("stepError"),
  stepDetail: document.getElementById("stepDetail"),
  stepGoal: document.getElementById("stepGoal"),
  resetApp: document.getElementById("resetApp"),
  emptyState: document.getElementById("emptyState"),
  goalDialog: document.getElementById("goalDialog"),
  goalDialogForm: document.getElementById("goalDialogForm"),
  goalDialogTitle: document.getElementById("goalDialogTitle"),
  goalDialogSubmit: document.getElementById("goalDialogSubmit"),
  goalDialogError: document.getElementById("goalDialogError"),
  goalDialogTitleInput: document.getElementById("goalDialogTitleInput"),
  goalDialogReasonInput: document.getElementById("goalDialogReasonInput"),
  goalDialogDateInput: document.getElementById("goalDialogDateInput"),
  totalGoals: document.getElementById("totalGoals"),
  stepsComplete: document.getElementById("stepsComplete"),
  nextMilestone: document.getElementById("nextMilestone"),
};

const STORAGE_KEY = "pulsepath-goals";
const LIMITS = {
  minText: 3,
  maxTitle: 60,
  maxReason: 90,
  maxStep: 90,
};

const state = {
  goals: loadGoals(),
  goalDialogMode: "add",
  stepDialogMode: "add",
  editingGoalId: "",
  editingStepGoalId: "",
  editingStepId: "",
};

function loadGoals() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.goals));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateProgress(goal) {
  if (!goal.steps.length) return 0;
  const completed = goal.steps.filter((step) => step.completed).length;
  return Math.round((completed / goal.steps.length) * 100);
}

function validateGoalInput(title, reason, targetDate) {
  if (title.length < LIMITS.minText || title.length > LIMITS.maxTitle) {
    return `Goal title must be ${LIMITS.minText}-${LIMITS.maxTitle} characters.`;
  }

  if (reason.length < LIMITS.minText || reason.length > LIMITS.maxReason) {
    return `Reason must be ${LIMITS.minText}-${LIMITS.maxReason} characters.`;
  }

  if (!targetDate) return "Target date is required.";

  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return "Target date is invalid.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (target < today) return "Target date cannot be in the past.";

  return "";
}

function validateStepInput(detail) {
  if (detail.length < LIMITS.minText || detail.length > LIMITS.maxStep) {
    return `Step detail must be ${LIMITS.minText}-${LIMITS.maxStep} characters.`;
  }

  return "";
}

function setFormError(element, message) {
  element.textContent = message;
}

function createButton({ label, className = "ghost", action, goalId, stepId }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  if (goalId) button.dataset.goalId = goalId;
  if (stepId) button.dataset.stepId = stepId;
  button.textContent = label;
  return button;
}

function createStepElement(goalId, step) {
  const stepItem = document.createElement("div");
  stepItem.className = `step-item ${step.completed ? "completed" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = step.completed;
  checkbox.dataset.action = "toggle-step";
  checkbox.dataset.goalId = goalId;
  checkbox.dataset.stepId = step.id;

  const stepText = document.createElement("p");
  stepText.className = "step-text";
  stepText.textContent = step.detail;

  const editButton = createButton({
    label: "Edit",
    action: "edit-step",
    goalId,
    stepId: step.id,
  });

  const removeButton = createButton({
    label: "Remove",
    action: "remove-step",
    goalId,
    stepId: step.id,
  });

  stepItem.append(checkbox, stepText, editButton, removeButton);
  return stepItem;
}

function createGoalCard(goal) {
  const progress = calculateProgress(goal);

  const card = document.createElement("article");
  card.className = "goal-card";

  const cardHeader = document.createElement("header");
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = goal.title;
  const reason = document.createElement("p");
  reason.className = "goal-meta";
  reason.textContent = goal.reason;
  titleWrap.append(title, reason);

  const actions = document.createElement("div");
  actions.className = "goal-actions";
  const dueTag = document.createElement("span");
  dueTag.className = "tag";
  dueTag.textContent = `Due ${formatDate(goal.targetDate)}`;
  const editGoalButton = createButton({
    label: "Edit",
    action: "edit-goal",
    goalId: goal.id,
  });
  actions.append(dueTag, editGoalButton);

  cardHeader.append(titleWrap, actions);

  const progressWrap = document.createElement("div");
  const progressText = document.createElement("p");
  progressText.className = "goal-meta";
  progressText.textContent = `${progress}% complete`;
  const progressTrack = document.createElement("div");
  progressTrack.className = "goal-progress";
  const progressBar = document.createElement("span");
  progressBar.style.width = `${progress}%`;
  progressTrack.append(progressBar);
  progressWrap.append(progressText, progressTrack);

  const stepsContainer = document.createElement("div");
  stepsContainer.className = "step-list";
  if (!goal.steps.length) {
    const noSteps = document.createElement("p");
    noSteps.className = "goal-meta";
    noSteps.textContent = "No steps yet. Add the first step.";
    stepsContainer.append(noSteps);
  } else {
    goal.steps.forEach((step) => stepsContainer.append(createStepElement(goal.id, step)));
  }

  const removeGoalButton = createButton({
    label: "Remove goal",
    action: "remove-goal",
    goalId: goal.id,
  });

  card.append(cardHeader, progressWrap, stepsContainer, removeGoalButton);
  return card;
}

function updateInsights() {
  elements.totalGoals.textContent = state.goals.length;

  const allSteps = state.goals.flatMap((goal) => goal.steps);
  const completedSteps = allSteps.filter((step) => step.completed).length;
  elements.stepsComplete.textContent = `${completedSteps} / ${allSteps.length || 0}`;

  const nextGoal = state.goals
    .filter((goal) => calculateProgress(goal) < 100)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))[0];

  elements.nextMilestone.textContent = nextGoal
    ? `${nextGoal.title} • ${calculateProgress(nextGoal)}%`
    : state.goals.length
      ? "All goals complete"
      : "Add a goal";
}

function renderGoalOptions(selectedGoalId = "") {
  elements.stepGoal.innerHTML = "";

  state.goals.forEach((goal) => {
    const option = document.createElement("option");
    option.value = goal.id;
    option.textContent = goal.title;
    elements.stepGoal.append(option);
  });

  if (selectedGoalId) {
    elements.stepGoal.value = selectedGoalId;
  }
}

function renderGoals() {
  elements.goalList.innerHTML = "";

  const hasGoals = state.goals.length > 0;
  elements.emptyState.hidden = hasGoals;
  elements.addStepGlobal.disabled = !hasGoals;

  if (hasGoals) {
    state.goals.forEach((goal) => {
      elements.goalList.append(createGoalCard(goal));
    });
  }

  renderGoalOptions();
  updateInsights();
}

function addGoal(title, reason, targetDate) {
  state.goals.unshift({
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
  const goal = state.goals.find((item) => item.id === goalId);
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
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;

  const step = goal.steps.find((item) => item.id === stepId);
  if (!step) return;

  step.completed = !step.completed;
  saveGoals();
  renderGoals();
}

function removeStep(goalId, stepId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;

  goal.steps = goal.steps.filter((step) => step.id !== stepId);
  saveGoals();
  renderGoals();
}

function removeGoal(goalId) {
  state.goals = state.goals.filter((goal) => goal.id !== goalId);
  saveGoals();
  renderGoals();
}

function openGoalDialogAdd() {
  state.goalDialogMode = "add";
  state.editingGoalId = "";

  elements.goalDialogTitle.textContent = "Add a goal";
  elements.goalDialogSubmit.textContent = "Save goal";
  elements.goalDialogTitleInput.value = "";
  elements.goalDialogReasonInput.value = "";
  elements.goalDialogDateInput.value = "";
  setFormError(elements.goalDialogError, "");

  elements.goalDialog.showModal();
}

function openGoalDialogEdit(goalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;

  state.goalDialogMode = "edit";
  state.editingGoalId = goalId;

  elements.goalDialogTitle.textContent = "Edit goal";
  elements.goalDialogSubmit.textContent = "Save changes";
  elements.goalDialogTitleInput.value = goal.title;
  elements.goalDialogReasonInput.value = goal.reason;
  elements.goalDialogDateInput.value = goal.targetDate;
  setFormError(elements.goalDialogError, "");

  elements.goalDialog.showModal();
}

function openStepDialogAdd(goalId = "") {
  if (!state.goals.length) {
    alert("Add a goal before adding steps.");
    return;
  }

  state.stepDialogMode = "add";
  state.editingStepGoalId = "";
  state.editingStepId = "";

  elements.stepDialogTitle.textContent = "Add a step";
  elements.stepDialogSubmit.textContent = "Save step";
  elements.stepDetail.value = "";
  setFormError(elements.stepError, "");
  renderGoalOptions(goalId || state.goals[0].id);

  elements.stepDialog.showModal();
}

function openStepDialogEdit(goalId, stepId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;

  const step = goal.steps.find((item) => item.id === stepId);
  if (!step) return;

  state.stepDialogMode = "edit";
  state.editingStepGoalId = goalId;
  state.editingStepId = stepId;

  elements.stepDialogTitle.textContent = "Edit step";
  elements.stepDialogSubmit.textContent = "Save changes";
  elements.stepDetail.value = step.detail;
  setFormError(elements.stepError, "");
  renderGoalOptions(goalId);

  elements.stepDialog.showModal();
}

function handleStepFormSubmit(event) {
  event.preventDefault();

  const detail = elements.stepDetail.value.trim();
  const validation = validateStepInput(detail);
  if (validation) {
    setFormError(elements.stepError, validation);
    return;
  }

  if (state.stepDialogMode === "add") {
    const added = addStep(elements.stepGoal.value, detail);
    if (!added) {
      setFormError(elements.stepError, "Select a goal to assign this step.");
      return;
    }
  } else {
    const goal = state.goals.find((item) => item.id === state.editingStepGoalId);
    if (!goal) return;

    const step = goal.steps.find((item) => item.id === state.editingStepId);
    if (!step) return;

    step.detail = detail;
    saveGoals();
    renderGoals();
  }

  if (elements.stepDialog.open) {
    elements.stepDialog.close();
  }
}

function handleGoalFormSubmit(event) {
  event.preventDefault();

  const title = elements.goalDialogTitleInput.value.trim();
  const reason = elements.goalDialogReasonInput.value.trim();
  const targetDate = elements.goalDialogDateInput.value;
  const validation = validateGoalInput(title, reason, targetDate);

  if (validation) {
    setFormError(elements.goalDialogError, validation);
    return;
  }

  if (state.goalDialogMode === "add") {
    addGoal(title, reason, targetDate);
  } else {
    const goal = state.goals.find((item) => item.id === state.editingGoalId);
    if (!goal) return;

    goal.title = title;
    goal.reason = reason;
    goal.targetDate = targetDate;

    saveGoals();
    renderGoals();
  }

  if (elements.goalDialog.open) {
    elements.goalDialog.close();
  }
}

function handleGoalListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, goalId, stepId } = button.dataset;

  switch (action) {
    case "remove-goal":
      removeGoal(goalId);
      break;
    case "edit-goal":
      openGoalDialogEdit(goalId);
      break;
    case "edit-step":
      openStepDialogEdit(goalId, stepId);
      break;
    case "remove-step":
      removeStep(goalId, stepId);
      break;
    default:
      break;
  }
}

function handleGoalListChange(event) {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement)) return;
  if (checkbox.dataset.action !== "toggle-step") return;

  toggleStep(checkbox.dataset.goalId, checkbox.dataset.stepId);
}

function bindEvents() {
  elements.openGoalDialog.addEventListener("click", openGoalDialogAdd);
  elements.addStepGlobal.addEventListener("click", () => openStepDialogAdd());

  elements.stepForm.addEventListener("submit", handleStepFormSubmit);
  elements.goalDialogForm.addEventListener("submit", handleGoalFormSubmit);

  elements.resetApp.addEventListener("click", () => {
    if (confirm("Reset all goals and steps?")) {
      state.goals = [];
      saveGoals();
      renderGoals();
    }
  });

  elements.goalList.addEventListener("click", handleGoalListClick);
  elements.goalList.addEventListener("change", handleGoalListChange);
}

function initApp() {
  bindEvents();
  renderGoals();
}

initApp();
