/**
 * Tests for the scientific calculator logic (Node.js built-in test runner).
 * Covers the core evaluate() function and helpers extracted from calculator.js.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

// ── Re-implement the pure math core used in calculator.js ────────────────────
// (Duplicated here to run server-side without a DOM)

function factorial(n) {
  n = Math.floor(n);
  if (n < 0) throw new Error('Factorial de negativo');
  if (n > 170) return Infinity;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function toRadians(angle, mode) {
  if (mode === 'RAD') return angle;
  if (mode === 'GRAD') return angle * Math.PI / 200;
  return angle * Math.PI / 180;
}

function fromRadians(angle, mode) {
  if (mode === 'RAD') return angle;
  if (mode === 'GRAD') return angle * 200 / Math.PI;
  return angle * 180 / Math.PI;
}

function buildScope(mode = 'DEG') {
  return {
    sin: x => Math.sin(toRadians(x, mode)),
    cos: x => Math.cos(toRadians(x, mode)),
    tan: x => Math.tan(toRadians(x, mode)),
    asin: x => fromRadians(Math.asin(x), mode),
    acos: x => fromRadians(Math.acos(x), mode),
    atan: x => fromRadians(Math.atan(x), mode),
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

function evaluate(expr, mode = 'DEG') {
  let e = expr
    .replace(/π/g, '(' + Math.PI + ')')
    .replace(/\be\b/g, '(' + Math.E + ')')
    .replace(/(\d)([\(a-zA-Z])/g, '$1*$2')
    .replace(/\)(\d)/g, ')*$1')
    .replace(/\)\(/g, ')*(')
    .replace(/(\d+\.?\d*)%/g, '($1/100)')
    .replace(/\^/g, '**');

  const scope = buildScope(mode);
  const fnArgs = Object.keys(scope);
  const fnVals = Object.values(scope);
  // eslint-disable-next-line no-new-func
  const fn = new Function(...fnArgs, '"use strict"; return (' + e + ');');
  return fn(...fnVals);
}

function formatNumber(num) {
  if (Number.isInteger(num) && Math.abs(num) < 1e15) return String(num);
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-7 && num !== 0)) {
    return num.toExponential(8).replace(/\.?0+e/, 'e');
  }
  return parseFloat(num.toPrecision(12)).toString();
}

const EPS = 1e-9;
function approxEqual(a, b) {
  return Math.abs(a - b) < EPS;
}

// ── Basic arithmetic ─────────────────────────────────────────────────────────

test('suma básica', () => {
  assert.equal(evaluate('2+3'), 5);
});

test('resta básica', () => {
  assert.equal(evaluate('10-4'), 6);
});

test('multiplicación básica', () => {
  assert.equal(evaluate('6*7'), 42);
});

test('división básica', () => {
  assert.equal(evaluate('15/3'), 5);
});

test('operaciones combinadas con precedencia', () => {
  assert.equal(evaluate('2+3*4'), 14);
});

test('paréntesis', () => {
  assert.equal(evaluate('(2+3)*4'), 20);
});

// ── Powers & roots ───────────────────────────────────────────────────────────

test('potencia cuadrada', () => {
  assert.equal(evaluate('5^2'), 25);
});

test('potencia cúbica', () => {
  assert.equal(evaluate('2^3'), 8);
});

test('raíz cuadrada', () => {
  assert.ok(approxEqual(evaluate('sqrt(9)'), 3));
});

test('raíz cúbica', () => {
  assert.ok(approxEqual(evaluate('cbrt(27)'), 3));
});

test('raíz n-ésima (2^(1/4))', () => {
  assert.ok(approxEqual(evaluate('2^(1/4)'), Math.pow(2, 0.25)));
});

// ── Trigonometry DEG ─────────────────────────────────────────────────────────

test('sin(0) = 0', () => {
  assert.ok(approxEqual(evaluate('sin(0)'), 0));
});

test('sin(90) = 1 en grados', () => {
  assert.ok(approxEqual(evaluate('sin(90)'), 1));
});

test('cos(0) = 1', () => {
  assert.ok(approxEqual(evaluate('cos(0)'), 1));
});

test('cos(180) = -1 en grados', () => {
  assert.ok(approxEqual(evaluate('cos(180)'), -1));
});

test('tan(45) = 1 en grados', () => {
  assert.ok(approxEqual(evaluate('tan(45)'), 1));
});

// ── Trigonometry RAD ─────────────────────────────────────────────────────────

test('sin(π/2) = 1 en radianes', () => {
  assert.ok(approxEqual(evaluate('sin(π/2)', 'RAD'), 1));
});

test('cos(π) = -1 en radianes', () => {
  assert.ok(approxEqual(evaluate('cos(π)', 'RAD'), -1));
});

// ── Inverse trig ─────────────────────────────────────────────────────────────

test('asin(1) = 90 en grados', () => {
  assert.ok(approxEqual(evaluate('asin(1)'), 90));
});

test('acos(1) = 0 en grados', () => {
  assert.ok(approxEqual(evaluate('acos(1)'), 0));
});

test('atan(1) = 45 en grados', () => {
  assert.ok(approxEqual(evaluate('atan(1)'), 45));
});

// ── Hyperbolic ───────────────────────────────────────────────────────────────

test('sinh(0) = 0', () => {
  assert.ok(approxEqual(evaluate('sinh(0)'), 0));
});

test('cosh(0) = 1', () => {
  assert.ok(approxEqual(evaluate('cosh(0)'), 1));
});

test('tanh(0) = 0', () => {
  assert.ok(approxEqual(evaluate('tanh(0)'), 0));
});

// ── Logarithms ───────────────────────────────────────────────────────────────

test('log(100) = 2', () => {
  assert.ok(approxEqual(evaluate('log(100)'), 2));
});

test('ln(e) = 1', () => {
  assert.ok(approxEqual(evaluate('ln(e)'), 1));
});

test('exp(1) = e', () => {
  assert.ok(approxEqual(evaluate('exp(1)'), Math.E));
});

// ── Constants ────────────────────────────────────────────────────────────────

test('π correcto', () => {
  assert.ok(approxEqual(evaluate('π'), Math.PI));
});

test('e correcto', () => {
  assert.ok(approxEqual(evaluate('e'), Math.E));
});

// ── Factorial ────────────────────────────────────────────────────────────────

test('0! = 1', () => {
  assert.equal(factorial(0), 1);
});

test('1! = 1', () => {
  assert.equal(factorial(1), 1);
});

test('5! = 120', () => {
  assert.equal(factorial(5), 120);
});

test('10! = 3628800', () => {
  assert.equal(factorial(10), 3628800);
});

test('fact() via evaluate', () => {
  assert.equal(evaluate('fact(6)'), 720);
});

// ── Absolute value ───────────────────────────────────────────────────────────

test('abs(-5) = 5', () => {
  assert.equal(evaluate('abs(-5)'), 5);
});

test('abs(5) = 5', () => {
  assert.equal(evaluate('abs(5)'), 5);
});

// ── Percentage ───────────────────────────────────────────────────────────────

test('50% = 0.5', () => {
  assert.ok(approxEqual(evaluate('50%'), 0.5));
});

test('100+10% = 100.1', () => {
  assert.ok(approxEqual(evaluate('100+10%'), 100.1));
});

// ── Implicit multiplication ───────────────────────────────────────────────────

test('2(3) = 6', () => {
  assert.equal(evaluate('2(3)'), 6);
});

// ── Format number ─────────────────────────────────────────────────────────────

test('formatNumber integer', () => {
  assert.equal(formatNumber(42), '42');
});

test('formatNumber decimal', () => {
  assert.equal(formatNumber(3.14159), '3.14159');
});

test('formatNumber large uses exponential', () => {
  assert.ok(formatNumber(1.5e15).includes('e'));
});
