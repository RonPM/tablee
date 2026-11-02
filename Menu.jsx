import { useState } from "react";
import { CATEGORIES, MENU } from "./menu.js";
import { formatEuros, toCents } from "./split.js";

export default function Menu({ cart, onAdd }) {
  const [category, setCategory] = useState("all");
  const dishes = category === "all" ? MENU : MENU.filter((d) => d.category === category);
  const quantityOf = (id) => cart.find((item) => item.id === id)?.quantity ?? 0;

  return (
    <section className="menu" aria-labelledby="menu-title">
      <div className="hero">
        <h1 id="menu-title">Le menu du jour</h1>
        <p>Ajoutez les plats de toute la table, puis dites qui a pris quoi : Tablée calcule la part de chacun.</p>
      </div>

      <div className="tabs" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            className={`tab ${category === c.id ? "is-active" : ""}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="dish-grid">
        {dishes.map((dish) => {
          const qty = quantityOf(dish.id);
          return (
            <li key={dish.id} className="dish">
              <span className="dish-emoji" aria-hidden="true">{dish.emoji}</span>
              <div className="dish-body">
                <h3>{dish.name}</h3>
                <p>{dish.description}</p>
                <div className="dish-footer">
                  <span className="price">{formatEuros(toCents(dish.price))}</span>
                  <button className="btn btn-add" onClick={() => onAdd(dish.id)}>
                    {qty > 0 ? `Ajouter · ${qty}` : "Ajouter"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
