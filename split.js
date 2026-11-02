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

// Répartit un montant selon une règle simple : une personne, ou partage à parts égales.
// Retourne une liste de { personId, cents, share } où share vaut 1 (entier) ou 1/n.
function splitAmount(cents, rule) {
  if (rule?.mode === "shared" && rule.peopleIds?.length > 0) {
    const n = rule.peopleIds.length;
    const parts = allocate(cents, rule.peopleIds.map(() => 1));
    return rule.peopleIds.map((personId, i) => ({ personId, cents: parts[i], n }));
  }
  return [{ personId: rule?.personId ?? HOST_ID, cents, n: 1 }];
}

// Indique qui paie quoi pour une ligne du panier.
// Trois règles possibles :
//  - { mode: "one", personId }       : toute la ligne pour une personne ;
//  - { mode: "shared", peopleIds }   : toute la ligne partagée à parts égales ;
//  - { mode: "perUnit", units: [] }  : une règle (one ou shared) par unité,
//    par exemple un kombucha partagé à 3 et un autre pour une seule personne.
// Retourne une liste de { personId, cents, label }, avec une ligne par personne
// et par type de part (unités entières, 1/3, 1/2…).
export function shareLine(item, assignment) {
  const unitCents = toCents(item.price);
  const a = assignment ?? { mode: "one", personId: HOST_ID };

  if (a.mode !== "perUnit") {
    return splitAmount(unitCents * item.quantity, a).map(({ personId, cents, n }) => ({
      personId,
      cents,
      label: n > 1 ? `1/${n}` : item.quantity > 1 ? `×${item.quantity}` : "",
    }));
  }

  const merged = new Map();
  for (let i = 0; i < item.quantity; i++) {
    for (const { personId, cents, n } of splitAmount(unitCents, a.units?.[i])) {
      const key = `${personId}|${n}`;
      const entry = merged.get(key) ?? { personId, cents: 0, n, count: 0 };
      entry.cents += cents;
      entry.count += 1;
      merged.set(key, entry);
    }
  }
  return [...merged.values()].map(({ personId, cents, n, count }) => ({
    personId,
    cents,
    label: n > 1 ? (count > 1 ? `${count} × 1/${n}` : `1/${n}`) : count > 1 || item.quantity > 1 ? `×${count}` : "",
  }));
}

// Retire un convive d'une règle de répartition ; ses parts reviennent à l'hôte.
export function removePerson(rule, personId) {
  if (!rule) return rule;
  if (rule.mode === "perUnit") {
    return { ...rule, units: rule.units.map((u) => removePerson(u, personId)) };
  }
  if (rule.mode === "shared") {
    const peopleIds = rule.peopleIds.filter((id) => id !== personId);
    return peopleIds.length ? { ...rule, peopleIds } : { mode: "one", personId: HOST_ID };
  }
  return rule.personId === personId ? { mode: "one", personId: HOST_ID } : rule;
}

// Adapte une règle « par unité » quand la quantité change.
export function resizeRule(rule, quantity) {
  if (rule?.mode !== "perUnit") return rule;
  if (quantity <= 1) return rule.units[0] ?? { mode: "one", personId: HOST_ID };
  const units = rule.units.slice(0, quantity);
  while (units.length < quantity) units.push({ mode: "one", personId: HOST_ID });
  return { ...rule, units };
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
