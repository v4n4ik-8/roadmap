// ===== Helpers for LocalStorage =====
const STORAGE_PREFIX = 'roadmap_v1_';
const STEP_KEY = (step) => `${STORAGE_PREFIX}step_${step}`;
const CODE_KEY = `${STORAGE_PREFIX}code`; // store code from the mini-IDE

// ===== DOM =====
const checkboxes = document.querySelectorAll('.step-checkbox');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const resetBtn = document.getElementById('reset-progress');
const steps = document.querySelectorAll('.step');

// IDE elements (Step 1)
const codeArea = document.getElementById('code');
one = document.getElementById('output');
const runBtn = document.getElementById('run');
const resetCodeBtn = document.getElementById('reset-code');

// ===== Init =====
initCheckboxes();
initProgress();
initAccordions();
initIDE();

// ===== Checkboxes & Progress =====
function initCheckboxes() {
  checkboxes.forEach((cb) => {
    const step = cb.dataset.step;
    const saved = localStorage.getItem(STEP_KEY(step));
    if (saved === 'true') cb.checked = true;

    cb.addEventListener('change', () => {
      localStorage.setItem(STEP_KEY(step), cb.checked);
      updateProgress();
    });
  });
}

function initProgress() {
  updateProgress();
  resetBtn.addEventListener('click', () => {
    if (!confirm('Точно очистить весь прогресс?')) return;
    // reset steps
    checkboxes.forEach((cb) => {
      cb.checked = false;
      localStorage.setItem(STEP_KEY(cb.dataset.step), false);
    });
    // reset code
    localStorage.removeItem(CODE_KEY);
    defaultCode();
    updateProgress();
  });
}

function updateProgress() {
  const total = checkboxes.length;
  const done = [...checkboxes].filter((c) => c.checked).length;
  const percent = Math.round((done / total) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = `${percent}% выполнено`;
}

// ===== Accordion toggle =====
function initAccordions() {
  steps.forEach((step) => {
    const header = step.querySelector('.step-header');
    const toggleBtn = step.querySelector('.toggle');

    const toggle = () => {
      step.classList.toggle('open');
      toggleBtn.textContent = step.classList.contains('open') ? '▴' : '▾';
    };

    header.addEventListener('click', (e) => {
      // avoid toggling when clicking on the checkbox
      if ((e.target).closest('input[type="checkbox"]').length) return;
      toggle();
    });
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });
  });
}

// ===== Mini IDE (Skulpt) =====
function initIDE() {
  if (!codeArea) return; // safety

  // restore saved code
  const savedCode = localStorage.getItem(CODE_KEY);
  if (savedCode !== null) {
    codeArea.value = savedCode;
  }

  runBtn.addEventListener('click', runPython);
  resetCodeBtn.addEventListener('click', () => {
    defaultCode();
    runPython();
  });

  // autosave on input
  codeArea.addEventListener('input', () => {
    localStorage.setItem(CODE_KEY, codeArea.value);
  });
}

function defaultCode() {
  codeArea.value = 'print("Hello, World!")';
  localStorage.setItem(CODE_KEY, codeArea.value);
}

function runPython() {
  const prog = codeArea.value;
  one.innerText = '';

  function outf(text) {
    one.innerText += text;
  }

  function builtinRead(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles['files'][x] === undefined) {
      throw new Error(`File not found: ${x}`);
    }
    return Sk.builtinFiles['files'][x];
  }

  Sk.configure({ output: outf, read: builtinRead });
  const promise = Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, prog, true));

  promise.catch((err) => {
    one.innerText += '\n' + err.toString();
  });
}