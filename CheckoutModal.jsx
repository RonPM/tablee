import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import { computeSplit, formatEuros } from "../lib/split.js";
import { newOrderId, saveOrder } from "../lib/history.js";

// Étapes : récapitulatif → paiement simulé → confirmation.
export default function CheckoutModal({ cart, people, assignments, onClose, onDone }) {
  const [step, setStep] = useState("summary");
  const [copied, setCopied] = useState(false);
  const orderId = useRef(newOrderId()).current;
  const split = computeSplit(cart, assignments, people);
  const rows = split.rows.filter((r) => r.total > 0);

  useEffect(() => {
    if (step !== "paying") return;
    const timer = setTimeout(() => {
      saveOrder({
        id: orderId,
        date: new Date().toISOString(),
        total: split.total,
        rows: rows.map(({ name, total, lines }) => ({ name, total, lines })),
      });
      setStep("done");
    }, 1500);
    return () => clearTimeout(timer);
    // Le paiement est déclenché une seule fois, à l'entrée dans l'étape « paying ».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function copySummary() {
    const text = [
      `Tablée · commande ${orderId}`,
      "",
      ...rows.map((r) => `${r.name} : ${formatEuros(r.total)} (${r.lines.map((l) => l.name + (l.label ? ` ${l.label}` : "")).join(", ")})`),
      "",
      `Total : ${formatEuros(split.total)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez le récapitulatif :", text);
    }
  }

  const title = { summary: "Récapitulatif", paying: "Paiement", done: "Commande confirmée" }[step];

  return (
    <Modal title={title} onClose={step === "paying" ? null : step === "done" ? onDone : onClose} wide>
      {step === "done" && (
        <div className="success">
          <span aria-hidden="true">✅</span>
          <p>Commande <strong>{orderId}</strong> envoyée au restaurant. Livraison estimée dans 30 min.</p>
        </div>
      )}

      {step === "paying" ? (
        <div className="paying">
          <div className="spinner" aria-hidden="true" />
          <p>Paiement en cours…</p>
        </div>
      ) : (
        <>
          <ul className="receipt">
            {rows.map((row) => (
              <li key={row.personId} className="receipt-person">
                <div className="receipt-head">
                  <strong>{row.name}</strong>
                  <strong>{formatEuros(row.total)}</strong>
                </div>
                <ul>
                  {row.lines.map((line, i) => (
                    <li key={i}>
                      <span>{line.emoji} {line.name} {line.label && <em>{line.label}</em>}</span>
                      <span>{formatEuros(line.cents)}</span>
                    </li>
                  ))}
                  <li className="receipt-tax">
                    <span>TVA</span>
                    <span>{formatEuros(row.tax)}</span>
                  </li>
                </ul>
              </li>
            ))}
          </ul>

          <div className="receipt-total">
            <span>Total de la commande</span>
            <strong>{formatEuros(split.total)}</strong>
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={copySummary}>
              {copied ? "Copié ✓" : "Copier le récapitulatif"}
            </button>
            {step === "summary" ? (
              <button className="btn btn-primary" onClick={() => setStep("paying")}>
                Payer {formatEuros(split.total)}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onDone}>Nouvelle commande</button>
            )}
          </div>

          {step === "summary" && (
            <p className="demo-note">
              Démo : le paiement est simulé. Aucune donnée bancaire n'est demandée ni transmise.
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
