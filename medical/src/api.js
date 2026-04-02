const BASE_URL = "http://127.0.0.1:8000";

function authHeader(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function handle(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export async function signupUser(username, email, password) {
  return handle(await fetch(`${BASE_URL}/signup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  }));
}

export async function loginUser(username, password) {
  return handle(await fetch(`${BASE_URL}/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }));
}

export async function getProfile(token) {
  return handle(await fetch(`${BASE_URL}/profile`, { headers: authHeader(token) }));
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getUsers(token) {
  return handle(await fetch(`${BASE_URL}/users`, { headers: authHeader(token) }));
}

export async function updateUserRole(token, username, role) {
  return handle(await fetch(`${BASE_URL}/users/${username}/role`, {
    method: "PATCH", headers: authHeader(token), body: JSON.stringify({ role }),
  }));
}

// ─── Medicines ────────────────────────────────────────────────────────────────
export async function getMedicines(token) {
  return handle(await fetch(`${BASE_URL}/medicines`, { headers: authHeader(token) }));
}

export async function getAllMedicines(token) {
  return handle(await fetch(`${BASE_URL}/medicines/all`, { headers: authHeader(token) }));
}

export async function getMedicineById(token, medicineId) {
  return handle(await fetch(`${BASE_URL}/medicines/${medicineId}`, { headers: authHeader(token) }));
}

export async function addMedicine(token, medicine) {
  return handle(await fetch(`${BASE_URL}/medicines`, {
    method: "POST", headers: authHeader(token), body: JSON.stringify(medicine),
  }));
}

export async function updateMedicine(token, medicineId, updates) {
  return handle(await fetch(`${BASE_URL}/medicines/${medicineId}`, {
    method: "PATCH", headers: authHeader(token), body: JSON.stringify(updates),
  }));
}

export async function deactivateMedicine(token, medicineId) {
  return handle(await fetch(`${BASE_URL}/medicines/${medicineId}`, {
    method: "DELETE", headers: authHeader(token),
  }));
}

export async function importMedicinesCSV(token, file) {
  const fd = new FormData(); fd.append("file", file);
  return handle(await fetch(`${BASE_URL}/medicines/import/csv`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
  }));
}

// ─── Bills ────────────────────────────────────────────────────────────────────
export async function createBill(token, bill) {
  return handle(await fetch(`${BASE_URL}/bills`, {
    method: "POST", headers: authHeader(token), body: JSON.stringify(bill),
  }));
}

/**
 * Get bills with optional filters:
 * { patient, doctor, from_date, to_date, min_amount, max_amount, payment_mode, status }
 */
export async function getBills(token, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  return handle(await fetch(`${BASE_URL}/bills?${params}`, { headers: authHeader(token) }));
}

export async function getBillById(token, billId) {
  return handle(await fetch(`${BASE_URL}/bills/${billId}`, { headers: authHeader(token) }));
}

export async function refundBill(token, billId, reason = "Customer return") {
  return handle(await fetch(`${BASE_URL}/bills/${billId}/refund`, {
    method: "POST", headers: authHeader(token), body: JSON.stringify({ reason }),
  }));
}

// ─── Patients ─────────────────────────────────────────────────────────────────
export async function searchPatients(token, query) {
  return handle(await fetch(`${BASE_URL}/patients/search?q=${encodeURIComponent(query)}`, {
    headers: authHeader(token),
  }));
}

export async function getPatientHistory(token, phone) {
  return handle(await fetch(`${BASE_URL}/patients/${phone}/history`, {
    headers: authHeader(token),
  }));
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
export async function getSuppliers(token) {
  return handle(await fetch(`${BASE_URL}/suppliers`, { headers: authHeader(token) }));
}

export async function addSupplier(token, supplier) {
  return handle(await fetch(`${BASE_URL}/suppliers`, {
    method: "POST", headers: authHeader(token), body: JSON.stringify(supplier),
  }));
}

// ─── Purchases ────────────────────────────────────────────────────────────────
export async function getPurchases(token) {
  return handle(await fetch(`${BASE_URL}/purchases`, { headers: authHeader(token) }));
}

export async function createPurchase(token, purchase) {
  return handle(await fetch(`${BASE_URL}/purchases`, {
    method: "POST", headers: authHeader(token), body: JSON.stringify(purchase),
  }));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getDashboardStats(token) {
  return handle(await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeader(token) }));
}

export async function getSalesReport(token, period = "daily") {
  return handle(await fetch(`${BASE_URL}/dashboard/sales-report?period=${period}`, {
    headers: authHeader(token),
  }));
}