// Historique des commandes, conservé dans le navigateur (localStorage).
// Aucune donnée de paiement n'y est jamais enregistrée.
const KEY = "tablee:orders";

export function loadOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrder(order) {
  try {
    localStorage.setItem(KEY, JSON.stringify([order, ...loadOrders()].slice(0, 20)));
  } catch {
    // Stockage indisponible (navigation privée) : l'historique est simplement ignoré.
  }
}

export function newOrderId() {
  return `TB-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}
