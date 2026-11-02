import { useMemo, useState } from "react";
import { MENU } from "./data/menu.js";
import { HOST_ID, computeTotals, formatEuros, uniqueName } from "./lib/split.js";
import Header from "./components/Header.jsx";
import Menu from "./components/Menu.jsx";
import Basket from "./components/Basket.jsx";
import GuestsModal from "./components/GuestsModal.jsx";
import CheckoutModal from "./components/CheckoutModal.jsx";
import History from "./components/History.jsx";

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
    setCart((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...MENU.find((dish) => dish.id === id), quantity: 1 }];
    });
  }

  function changeQuantity(id, delta) {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
    if (delta < 0) {
      // Une répartition par unité peut dépasser la nouvelle quantité : on la réinitialise.
      setAssignments((current) =>
        current[id]?.mode === "units" ? { ...current, [id]: { mode: "one", personId: HOST_ID } } : current,
      );
    }
  }

  function addGuest(name) {
    if (!name.trim() || guests.length >= MAX_GUESTS) return;
    const finalName = uniqueName(name, people.map((p) => p.name));
    setGuests((current) => [...current, { id: crypto.randomUUID(), name: finalName }]);
  }

  function removeGuest(id) {
    setGuests((current) => current.filter((g) => g.id !== id));
    setAssignments((current) => {
      const next = {};
      for (const [itemId, a] of Object.entries(current)) {
        if (a.mode === "one" && a.personId === id) continue;
        if (a.mode === "shared") {
          const peopleIds = a.peopleIds.filter((pid) => pid !== id);
          next[itemId] = peopleIds.length ? { ...a, peopleIds } : { mode: "one", personId: HOST_ID };
        } else if (a.mode === "units") {
          const units = { ...a.units };
          delete units[id];
          next[itemId] = { ...a, units };
        } else {
          next[itemId] = a;
        }
      }
      return next;
    });
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
