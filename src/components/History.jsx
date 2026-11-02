import { useState } from "react";
import { loadOrders } from "../lib/history.js";
import { formatEuros } from "../lib/split.js";

export default function History({ onBack }) {
  const [orders] = useState(loadOrders);

  return (
    <main className="history">
      <div className="history-head">
        <h1>Mes commandes</h1>
        <button className="btn btn-ghost" onClick={onBack}>← Retour au menu</button>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <span aria-hidden="true">🧾</span>
          <p>Aucune commande pour l'instant.</p>
        </div>
      ) : (
        <ul className="history-list">
          {orders.map((order) => (
            <li key={order.id} className="history-card">
              <div className="receipt-head">
                <strong>{order.id}</strong>
                <strong>{formatEuros(order.total)}</strong>
              </div>
              <p className="muted">
                {new Date(order.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <ul className="history-shares">
                {order.rows.map((row) => (
                  <li key={row.name}>
                    <span>{row.name}</span>
                    <span>{formatEuros(row.total)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
