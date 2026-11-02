// Calcul du partage de l'addition.
// Tous les montants sont manipulés en centimes (entiers) pour éviter
// les erreurs d'arrondi des nombres à virgule flottante.

export const TAX_RATE = 0.1;
export const HOST_ID = "host";

export const toCents = (euros) => Math.round(euros * 100);

export function formatEuros(cents) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// Répartit `total` centimes entre des poids, en garantissant que la somme
// des parts vaut exactement `total` (méthode du plus fort reste).
export function allocate(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const parts = exact.map(Math.floor);
  let rest = total - parts.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0; k++, rest--) parts[order[k % order.length].i] += 1;
  return parts;
}

// Indique qui paie quoi pour une ligne du panier.
// Retourne une liste de { personId, cents, label }.
export function shareLine(item, assignment) {
  const lineCents = toCents(item.price) * item.quantity;
  const a = assignment ?? { mode: "one", personId: HOST_ID };

  if (a.mode === "shared" && a.peopleIds?.length > 0) {
    const parts = allocate(lineCents, a.peopleIds.map(() => 1));
    return a.peopleIds.map((personId, i) => ({
      personId,
      cents: parts[i],
      label: `1/${a.peopleIds.length}`,
    }));
  }

  if (a.mode === "units") {
    const shares = [];
    let assigned = 0;
    for (const [personId, units] of Object.entries(a.units ?? {})) {
      const n = Math.min(units, item.quantity - assigned);
      if (n <= 0) continue;
      assigned += n;
      shares.push({ personId, cents: toCents(item.price) * n, label: `×${n}` });
    }
    const left = item.quantity - assigned;
    if (left > 0) {
      shares.push({ personId: HOST_ID, cents: toCents(item.price) * left, label: `×${left}` });
    }
    return shares;
  }

  return [{ personId: a.personId ?? HOST_ID, cents: lineCents, label: "" }];
}

export function computeTotals(cart) {
  const subtotal = cart.reduce((s, item) => s + toCents(item.price) * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, tax, total: subtotal + tax };
}

// Calcule la part de chaque convive.
// Garanties : pour chaque convive, sous-total + taxe = total affiché,
// et la somme des parts est égale au total de la commande, au centime près.
export function computeSplit(cart, assignments, people) {
  const totals = computeTotals(cart);
  const ids = people.map((p) => p.id);
  const lines = Object.fromEntries(ids.map((id) => [id, []]));
  const subtotals = Object.fromEntries(ids.map((id) => [id, 0]));

  for (const item of cart) {
    for (const share of shareLine(item, assignments[item.id])) {
      const id = share.personId in subtotals ? share.personId : HOST_ID;
      subtotals[id] += share.cents;
      lines[id].push({ name: item.name, emoji: item.emoji, cents: share.cents, label: share.label });
    }
  }

  const taxes = allocate(totals.tax, ids.map((id) => subtotals[id]));
  const rows = people.map((p, i) => ({
    personId: p.id,
    name: p.name,
    lines: lines[p.id],
    subtotal: subtotals[p.id],
    tax: taxes[i],
    total: subtotals[p.id] + taxes[i],
  }));

  return { ...totals, rows };
}

// Ajoute un suffixe aux prénoms en double : « Léa », « Léa (2) ».
export function uniqueName(name, existing) {
  const base = name.trim();
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}
