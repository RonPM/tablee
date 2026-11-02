import { useMemo, useState } from "react";
import { MENU } from "./menu.js";
import { HOST_ID, computeTotals, formatEuros, removePerson, resizeRule, uniqueName } from "./split.js";
import Header from "./Header.jsx";
import Menu from "./Menu.jsx";
import Basket from "./Basket.jsx";
import GuestsModal from "./GuestsModal.jsx";
import CheckoutModal from "./CheckoutModal.jsx";
import History from "./History.jsx";

const HOST = { id: HOST_ID, name: "Moi" };
const MAX_GUESTS = 20;

export default function App() {
  const [view, setView] = useState("menu");
  const [cart, setCart] = useState([]);
  const [guests, setGuests] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const people = useMemo(() => [HOST, ...guests], [guests]);
  const totals = computeTotals(cart);
  const itemCount = cart.reduce((n, item) => n + item.quantity, 0);

  function addItem(id) {
    if (cart.some((item) => item.id === id)) {
      changeQuantity(id, 1);
    } else {
      setCart((current) => [...current, { ...MENU.find((dish) => dish.id === id), quantity: 1 }]);
    }
  }

  function changeQuantity(id, delta) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    const quantity = item.quantity + delta;
    setCart((current) =>
      current
        .map((i) => (i.id === id ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    );
    // Une répartition par unité suit la nouvelle quantité.
    setAssignments((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = resizeRule(current[id], quantity);
      return next;
    });
  }

  function addGuest(name) {
    if (!name.trim() || guests.length >= MAX_GUESTS) return;
    const finalName = uniqueName(name, people.map((p) => p.name));
    setGuests((current) => [...current, { id: crypto.randomUUID(), name: finalName }]);
  }

  function removeGuest(id) {
    setGuests((current) => current.filter((g) => g.id !== id));
    setAssignments((current) =>
      Object.fromEntries(Object.entries(current).map(([itemId, rule]) => [itemId, removePerson(rule, id)])),
    );
  }

  function resetOrder() {
    setCart([]);
    setAssignments({});
    setCheckoutOpen(false);
  }

  return (
    <div className="app">
      <Header
        view={view}
        onNavigate={setView}
        itemCount={itemCount}
      />

      {view === "history" ? (
        <History onBack={() => setView("menu")} />
      ) : (
        <main className="layout">
          <Menu cart={cart} onAdd={addItem} />
          <Basket
            cart={cart}
            people={people}
            assignments={assignments}
            totals={totals}
            onQuantity={changeQuantity}
            onAssign={(id, a) => setAssignments((current) => ({ ...current, [id]: a }))}
            onManageGuests={() => setGuestsOpen(true)}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </main>
      )}

      {view === "menu" && itemCount > 0 && (
        <a className="mobile-bar" href="#basket">
          <span>Voir la commande · {itemCount}</span>
          <strong>{formatEuros(totals.total)}</strong>
        </a>
      )}

      {guestsOpen && (
        <GuestsModal
          guests={guests}
          max={MAX_GUESTS}
          onAdd={addGuest}
          onRemove={removeGuest}
          onClose={() => setGuestsOpen(false)}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          people={people}
          assignments={assignments}
          onClose={() => setCheckoutOpen(false)}
          onDone={resetOrder}
        />
      )}
    </div>
  );
}
