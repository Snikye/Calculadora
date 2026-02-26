/* ============================================================
   Calculadora Científica — lógica del cliente
   ============================================================ */

let currentInput = '';
let lastResult = '';
let angleMode = 'DEG'; // DEG | RAD | GRAD
let memory = 0;
let justCalculated = false;

// ── Display helpers ──────────────────────────────────────────

function updateDisplay(value) {
  const display = document.getElementById('display');
  display.textContent = value === '' ? '0' : value;
  display.classList.remove('error');
}

function updateExpression(expr) {
  document.getElementById('expression').textContent = expr;
}

function showError(msg) {
  const display = document.getElementById('display');
  display.textContent = msg;
  display.classList.add('error');
  currentInput = '';
  lastResult = '';
  justCalculated = false;
}

// ── Input builders ───────────────────────────────────────────

function appendText(text) {
  if (justCalculated) {
    // Allow continuing with operators after a result
    const operators = ['+', '-', '*', '/', '^', '%'];
    if (!operators.includes(text[0])) {
      currentInput = '';
    }
    justCalculated = false;
  }
  currentInput += text;
  updateDisplay(formatDisplay(currentInput));
  updateExpression('');
}

function appendFunc(func) {
  if (justCalculated) {
    currentInput = lastResult;
    justCalculated = false;
  }
  currentInput += func;
  updateDisplay(formatDisplay(currentInput));
  updateExpression('');
}

function appendDot() {
  if (justCalculated) {
    currentInput = '0';
    justCalculated = false;
  }
  // Find the last number segment and check it doesn't already have a dot
  const lastNum = currentInput.split(/[\+\-\*\/\^\(\)%]/).pop();
  if (!lastNum.includes('.')) {
    currentInput += currentInput === '' ? '0.' : '.';
    updateDisplay(formatDisplay(currentInput));
  }
}

function toggleSign() {
  if (currentInput === '' || currentInput === '0') return;
  if (currentInput.startsWith('-')) {
    currentInput = currentInput.slice(1);
  } else {
    currentInput = '-' + currentInput;
  }
  updateDisplay(formatDisplay(currentInput));
}

// ── Clear / Delete ───────────────────────────────────────────

function clearAll() {
  currentInput = '';
  lastResult = '';
  justCalculated = false;
  updateDisplay('0');
  updateExpression('');
}

function clearEntry() {
  currentInput = '';
  updateDisplay('0');
}

function deleteLast() {
  if (justCalculated) {
    clearAll();
    return;
  }
  currentInput = currentInput.slice(0, -1);
  updateDisplay(formatDisplay(currentInput));
}

// ── Angle mode ───────────────────────────────────────────────

function setMode(mode) {
  angleMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(mode.toLowerCase() + '-btn').classList.add('active');
}

function toRadians(angle) {
  if (angleMode === 'RAD') return angle;
  if (angleMode === 'GRAD') return angle * Math.PI / 200;
  return angle * Math.PI / 180; // DEG
}

function fromRadians(angle) {
  if (angleMode === 'RAD') return angle;
  if (angleMode === 'GRAD') return angle * 200 / Math.PI;
  return angle * 180 / Math.PI; // DEG
}

// ── Scientific math functions ────────────────────────────────

function factorial(n) {
  n = Math.floor(n);
  if (n < 0) throw new Error('Factorial de negativo');
  if (n > 170) return Infinity;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// Build a safe math scope with all supported functions
function buildScope() {
  return {
    sin: x => Math.sin(toRadians(x)),
    cos: x => Math.cos(toRadians(x)),
    tan: x => Math.tan(toRadians(x)),
    asin: x => fromRadians(Math.asin(x)),
    acos: x => fromRadians(Math.acos(x)),
    atan: x => fromRadians(Math.atan(x)),
    sinh: x => Math.sinh(x),
    cosh: x => Math.cosh(x),
    tanh: x => Math.tanh(x),
    log: x => Math.log10(x),
    ln: x => Math.log(x),
    sqrt: x => Math.sqrt(x),
    cbrt: x => Math.cbrt(x),
    abs: x => Math.abs(x),
    fact: x => factorial(x),
    exp: x => Math.exp(x),
    PI: Math.PI,
    E: Math.E,
  };
}

// ── Expression evaluator ─────────────────────────────────────

function prepareExpression(expr) {
  const scope = buildScope();

  let e = expr
    .replace(/π/g, '(' + Math.PI + ')')
    .replace(/\be\b/g, '(' + Math.E + ')')
    // implicit multiplication: 2π → 2*π, )( → )*(, 3sin → 3*sin, etc.
    .replace(/(\d)([\(a-zA-Z])/g, '$1*$2')
    .replace(/\)(\d)/g, ')*$1')
    .replace(/\)\(/g, ')*(')
    // percent: x% → x/100
    .replace(/(\d+\.?\d*)%/g, '($1/100)')
    // power: x^y → Math.pow(x,y) — handle via custom evaluator
    .replace(/\^/g, '**');

  return { e, scope };
}

function evaluate(expr) {
  const { e, scope } = prepareExpression(expr);

  // Build a function that has access to the math scope
  const fnArgs = Object.keys(scope);
  const fnVals = Object.values(scope);

  // eslint-disable-next-line no-new-func
  const fn = new Function(...fnArgs, '"use strict"; return (' + e + ');');
  return fn(...fnVals);
}

// ── Calculate ────────────────────────────────────────────────

function calculate() {
  if (currentInput.trim() === '') return;

  const rawExpr = currentInput;
  updateExpression(rawExpr + ' =');

  try {
    let result = evaluate(rawExpr);

    if (typeof result !== 'number' || isNaN(result)) {
      showError('Error');
      return;
    }
    if (!isFinite(result)) {
      showError(result > 0 ? 'Infinito' : '-Infinito');
      return;
    }

    // Round floating-point noise
    const rounded = parseFloat(result.toPrecision(12));
    const displayVal = formatNumber(rounded);

    lastResult = String(rounded);
    currentInput = String(rounded);
    justCalculated = true;

    updateDisplay(displayVal);
  } catch (err) {
    showError('Error de sintaxis');
  }
}

// ── Memory ───────────────────────────────────────────────────

function memoryAdd() {
  const val = parseFloat(currentInput || lastResult || '0');
  if (!isNaN(val)) memory += val;
}

function memorySubtract() {
  const val = parseFloat(currentInput || lastResult || '0');
  if (!isNaN(val)) memory -= val;
}

function memoryRecall() {
  currentInput = String(memory);
  justCalculated = false;
  updateDisplay(formatNumber(memory));
}

function memoryClear() {
  memory = 0;
}

// ── Formatting helpers ───────────────────────────────────────

function formatDisplay(expr) {
  return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e');
}

function formatNumber(num) {
  if (Number.isInteger(num) && Math.abs(num) < 1e15) return String(num);
  // Use exponential for very large/small numbers
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-7 && num !== 0)) {
    return num.toExponential(8).replace(/\.?0+e/, 'e');
  }
  // Trim trailing zeros from decimal
  return parseFloat(num.toPrecision(12)).toString();
}

// ── Keyboard support ─────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') appendText(e.key);
  else if (e.key === '.') appendDot();
  else if (e.key === '+') appendText('+');
  else if (e.key === '-') appendText('-');
  else if (e.key === '*') appendText('*');
  else if (e.key === '/') { e.preventDefault(); appendText('/'); }
  else if (e.key === '^') appendText('^');
  else if (e.key === '%') appendText('%');
  else if (e.key === '(') appendText('(');
  else if (e.key === ')') appendText(')');
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace') deleteLast();
  else if (e.key === 'Escape') clearAll();
});
