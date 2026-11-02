import { describe, expect, it } from "vitest";
import { allocate, computeSplit, computeTotals, uniqueName, HOST_ID } from "./split.js";

const people = [
  { id: HOST_ID, name: "Moi" },
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];

const pizza = { id: "pizza", name: "Pizza", price: 13, quantity: 1 };
const salmon = { id: "salmon", name: "Saumon", price: 18.5, quantity: 1 };
const fries = { id: "fries", name: "Frites", price: 4.5, quantity: 3 };

describe("allocate", () => {
  it("répartit sans perdre de centime", () => {
    const parts = allocate(1300, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b)).toBe(1300);
    expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1);
  });

  it("renvoie zéro partout si aucun poids", () => {
    expect(allocate(500, [0, 0])).toEqual([0, 0]);
  });
});

describe("computeSplit", () => {
  it("la somme des parts est égale au total de la commande", () => {
    const cart = [pizza, salmon];
    const assignments = {
      pizza: { mode: "shared", peopleIds: [HOST_ID, "a", "b"] },
      salmon: { mode: "one", personId: "a" },
    };
    const split = computeSplit(cart, assignments, people);
    const sum = split.rows.reduce((s, r) => s + r.total, 0);
    expect(sum).toBe(split.total);
    expect(split.total).toBe(computeTotals(cart).total);
  });

  it("chaque ligne est cohérente : sous-total + taxe = total", () => {
    const cart = [pizza, salmon, fries];
    const assignments = { pizza: { mode: "shared", peopleIds: ["a", "b"] } };
    for (const row of computeSplit(cart, assignments, people).rows) {
      expect(row.subtotal + row.tax).toBe(row.total);
    }
  });

  it("attribue à l'hôte les plats non assignés et les unités restantes", () => {
    const cart = [fries];
    const assignments = { fries: { mode: "units", units: { a: 1 } } };
    const rows = computeSplit(cart, assignments, people).rows;
    expect(rows.find((r) => r.personId === "a").subtotal).toBe(450);
    expect(rows.find((r) => r.personId === HOST_ID).subtotal).toBe(900);
  });

  it("renvoie à l'hôte la part d'un convive supprimé", () => {
    const cart = [salmon];
    const assignments = { salmon: { mode: "one", personId: "ghost" } };
    const rows = computeSplit(cart, assignments, people).rows;
    expect(rows.find((r) => r.personId === HOST_ID).subtotal).toBe(1850);
  });
});

describe("uniqueName", () => {
  it("numérote les prénoms en double", () => {
    expect(uniqueName("Léa", ["Léa"])).toBe("Léa (2)");
    expect(uniqueName("Léa", ["Léa", "Léa (2)"])).toBe("Léa (3)");
    expect(uniqueName(" Tom ", [])).toBe("Tom");
  });
});
