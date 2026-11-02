import { HOST_ID } from "./split.js";

// Choix de « qui paie ce plat » : une personne, partage à parts égales,
// ou répartition par unité quand le plat a été commandé plusieurs fois.
export default function ItemSplit({ item, people, assignment, onChange }) {
  const a = assignment ?? { mode: "one", personId: HOST_ID };
  const modes = [
    { id: "one", label: "Une personne" },
    { id: "shared", label: "À partager" },
    ...(item.quantity > 1 ? [{ id: "units", label: "Par unité" }] : []),
  ];

  function setMode(mode) {
    if (mode === a.mode) return;
    if (mode === "one") onChange({ mode, personId: HOST_ID });
    if (mode === "shared") onChange({ mode, peopleIds: people.map((p) => p.id) });
    if (mode === "units") onChange({ mode, units: {} });
  }

  function toggleShared(id) {
    const ids = a.peopleIds.includes(id) ? a.peopleIds.filter((p) => p !== id) : [...a.peopleIds, id];
    if (ids.length > 0) onChange({ ...a, peopleIds: ids });
  }

  function setUnits(id, delta) {
    const units = { ...a.units };
    const used = Object.values(units).reduce((s, n) => s + n, 0);
    const next = (units[id] ?? 0) + delta;
    if (next < 0 || (delta > 0 && used >= item.quantity)) return;
    units[id] = next;
    onChange({ ...a, units });
  }

  const usedUnits = a.mode === "units" ? Object.values(a.units).reduce((s, n) => s + n, 0) : 0;

  return (
    <div className="split">
      <div className="segmented" role="radiogroup" aria-label={`Répartition de ${item.name}`}>
        {modes.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={a.mode === m.id}
            className={a.mode === m.id ? "is-active" : ""}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="chips">
        {a.mode === "one" &&
          people.map((p) => (
            <button
              key={p.id}
              aria-pressed={a.personId === p.id}
              className={`chip ${a.personId === p.id ? "is-on" : ""}`}
              onClick={() => onChange({ mode: "one", personId: p.id })}
            >
              {p.name}
            </button>
          ))}

        {a.mode === "shared" &&
          people.map((p) => (
            <button
              key={p.id}
              aria-pressed={a.peopleIds.includes(p.id)}
              className={`chip ${a.peopleIds.includes(p.id) ? "is-on" : ""}`}
              onClick={() => toggleShared(p.id)}
            >
              {a.peopleIds.includes(p.id) ? "✓ " : ""}
              {p.name}
            </button>
          ))}

        {a.mode === "units" &&
          people.map((p) => (
            <span key={p.id} className="chip chip-units">
              {p.name}
              <button onClick={() => setUnits(p.id, -1)} aria-label={`Une unité de moins pour ${p.name}`}>−</button>
              <b>{a.units[p.id] ?? 0}</b>
              <button onClick={() => setUnits(p.id, 1)} aria-label={`Une unité de plus pour ${p.name}`}>+</button>
            </span>
          ))}
      </div>

      {a.mode === "units" && usedUnits < item.quantity && (
        <p className="split-note">{item.quantity - usedUnits} unité(s) non attribuée(s) : elles reviennent à l'hôte.</p>
      )}
    </div>
  );
}
