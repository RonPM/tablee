import { computeSplit, formatEuros, toCents } from "../lib/split.js";
import ItemSplit from "./ItemSplit.jsx";

export default function Basket({
  cart,
  people,
  assignments,
  totals,
  onQuantity,
  onAssign,
  onManageGuests,
  onCheckout,
}) {
  const split = computeSplit(cart, assignments, people);
  const hasGuests = people.length > 1;

  return (
    <aside className="basket" id="basket" aria-labelledby="basket-title">
      <div className="basket-head">
        <h2 id="basket-title">La commande</h2>
        <button className="btn btn-ghost" onClick={onManageGuests}>
          👥 Convives <span className="badge">{people.length - 1}</span>
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="empty">
          <span aria-hidden="true">🍽️</span>
          <p>Votre commande est vide. Ajoutez des plats depuis le menu.</p>
        </div>
      ) : (
        <ul className="basket-items">
          {cart.map((item) => (
            <li key={item.id} className="basket-item">
              <div className="basket-line">
                <span className="dish-emoji small" aria-hidden="true">{item.emoji}</span>
                <span className="basket-name">{item.name}</span>
                <div className="stepper" aria-label={`Quantité de ${item.name}`}>
                  <button onClick={() => onQuantity(item.id, -1)} aria-label="Retirer un">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onQuantity(item.id, 1)} aria-label="Ajouter un">+</button>
                </div>
                <span className="basket-price">{formatEuros(toCents(item.price) * item.quantity)}</span>
              </div>
              {hasGuests && (
                <ItemSplit
                  item={item}
                  people={people}
                  assignment={assignments[item.id]}
                  onChange={(a) => onAssign(item.id, a)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {cart.length > 0 && !hasGuests && (
        <button className="hint" onClick={onManageGuests}>
          Vous commandez à plusieurs ? <strong>Ajoutez vos convives</strong> pour partager l'addition.
        </button>
      )}

      {cart.length > 0 && hasGuests && (
        <div className="shares">
          <h3>Part de chacun</h3>
          <ul>
            {split.rows.map((row) => (
              <li key={row.personId} className={row.total === 0 ? "is-zero" : ""}>
                <span>{row.name}</span>
                <strong>{formatEuros(row.total)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="totals">
        <div><dt>Sous-total</dt><dd>{formatEuros(totals.subtotal)}</dd></div>
        <div><dt>TVA (10 %)</dt><dd>{formatEuros(totals.tax)}</dd></div>
        <div className="grand"><dt>Total</dt><dd>{formatEuros(totals.total)}</dd></div>
      </dl>

      <button className="btn btn-primary btn-block" disabled={cart.length === 0} onClick={onCheckout}>
        Valider la commande
      </button>
    </aside>
  );
}
