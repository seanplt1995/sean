const planForm = document.querySelector('#workout-form');
const planList = document.querySelector('#plan-list');
const clearPlanBtn = document.querySelector('#clear-plan');

const timerDisplay = document.querySelector('#timer-display');
const startTimerBtn = document.querySelector('#start-timer');
const stopTimerBtn = document.querySelector('#stop-timer');

const logForm = document.querySelector('#log-form');
const historyList = document.querySelector('#history-list');

const STORAGE_KEYS = {
  plan: 'workout-plan',
  logs: 'workout-logs'
};

let timerId = null;
let remainSeconds = 0;

const read = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function fmt(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderPlan() {
  const plans = read(STORAGE_KEYS.plan);
  planList.innerHTML = plans
    .map(
      (p, i) => `
      <li>
        <div>
          <strong>${p.exercise}</strong>
          <small>${p.sets} 组 × ${p.reps} 次，休息 ${p.rest} 秒</small>
        </div>
        <button class="ghost" data-index="${i}" data-type="remove-plan">删除</button>
      </li>`
    )
    .join('');
}

function renderLogs() {
  const logs = read(STORAGE_KEYS.logs);
  historyList.innerHTML = logs
    .map(
      (l) => `
      <li>
        <div>
          <strong>${l.date}</strong>
          <small>${l.duration} 分钟 · 强度：${l.mood}</small>
        </div>
      </li>`
    )
    .join('');
}

planForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = {
    exercise: document.querySelector('#exercise').value.trim(),
    sets: Number(document.querySelector('#sets').value),
    reps: Number(document.querySelector('#reps').value),
    rest: Number(document.querySelector('#rest').value)
  };

  if (!entry.exercise) return;

  const plans = read(STORAGE_KEYS.plan);
  plans.push(entry);
  write(STORAGE_KEYS.plan, plans);
  planForm.reset();
  renderPlan();
});

planList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-type="remove-plan"]');
  if (!button) return;
  const index = Number(button.dataset.index);
  const plans = read(STORAGE_KEYS.plan);
  plans.splice(index, 1);
  write(STORAGE_KEYS.plan, plans);
  renderPlan();
});

clearPlanBtn.addEventListener('click', () => {
  write(STORAGE_KEYS.plan, []);
  renderPlan();
});

startTimerBtn.addEventListener('click', () => {
  const defaultRest = Number(document.querySelector('#rest').value) || 60;
  remainSeconds = defaultRest;
  timerDisplay.textContent = fmt(remainSeconds);

  clearInterval(timerId);
  timerId = setInterval(() => {
    remainSeconds -= 1;
    timerDisplay.textContent = fmt(Math.max(remainSeconds, 0));

    if (remainSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      alert('休息结束，开始下一组！');
    }
  }, 1000);
});

stopTimerBtn.addEventListener('click', () => {
  clearInterval(timerId);
  timerId = null;
  remainSeconds = 0;
  timerDisplay.textContent = '00:00';
});

logForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const item = {
    date: document.querySelector('#date').value,
    duration: Number(document.querySelector('#duration').value),
    mood: document.querySelector('#mood').value
  };

  if (!item.date || !item.duration) return;

  const logs = read(STORAGE_KEYS.logs);
  logs.unshift(item);
  write(STORAGE_KEYS.logs, logs.slice(0, 20));
  logForm.reset();
  renderLogs();
});

renderPlan();
renderLogs();
