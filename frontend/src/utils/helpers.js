// ─── Currency formatting ──────────────────────────────────────────────────────
export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(amount));
};

export const formatINRDecimal = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(Number(amount));
};

// ─── Date formatting ──────────────────────────────────────────────────────────
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// ─── Category colors (consistent across charts) ───────────────────────────────
const CAT_COLORS = {
  food: '#f97316', transport: '#3b82f6', utilities: '#8b5cf6',
  entertainment: '#ec4899', health: '#10b981', education: '#f59e0b',
  shopping: '#06b6d4', rent: '#ef4444', investment: '#7c3aed',
  salary: '#22c55e', freelance: '#a78bfa', other: '#64748b',
};
export const getCategoryColor = (cat) =>
  CAT_COLORS[cat?.toLowerCase()] || CAT_COLORS.other;

// ─── EMI Calculator  P*r*(1+r)^n / ((1+r)^n - 1) ────────────────────────────
export const calcEMI = (principal, annualRate, months) => {
  if (!principal || !months) return 0;
  if (annualRate === 0) return Math.round(principal / months);
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
};

// ─── SIP Future Value  P * [(1+r)^n - 1] / r * (1+r) ────────────────────────
export const calcSIPFV = (monthly, annualReturn, years) => {
  if (!monthly || !years) return 0;
  const r = annualReturn / 12 / 100;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
};

// ─── Indian Income Tax (FY 2024-25) ──────────────────────────────────────────
export const calcOldRegimeTax = (grossIncome, deductions = 0) => {
  const taxable = Math.max(0, grossIncome - deductions - 50000); // std deduction 50k
  let tax = 0;
  if (taxable <= 250000) tax = 0;
  else if (taxable <= 500000)  tax = (taxable - 250000) * 0.05;
  else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
  else                         tax = 112500 + (taxable - 1000000) * 0.30;
  return Math.round(tax * 1.04); // 4% cess
};

export const calcNewRegimeTax = (grossIncome) => {
  const taxable = Math.max(0, grossIncome - 75000); // std deduction 75k
  let tax = 0;
  if (taxable <= 300000)       tax = 0;
  else if (taxable <= 700000)  tax = (taxable - 300000) * 0.05;
  else if (taxable <= 1000000) tax = 20000 + (taxable - 700000) * 0.10;
  else if (taxable <= 1200000) tax = 50000 + (taxable - 1000000) * 0.15;
  else if (taxable <= 1500000) tax = 80000 + (taxable - 1200000) * 0.20;
  else                         tax = 140000 + (taxable - 1500000) * 0.30;
  return Math.round(tax * 1.04);
};

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const pct = (val, total) =>
  total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
