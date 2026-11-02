import { HOST_ID } from "../lib/split.js";

const HOST_RULE = { mode: "one", personId: HOST_ID };

// Choix de « qui paie ce plat ».
// - Une personne / À partager : la règle s'applique à toutes les unités du plat.
// - Unité par unité (si le plat est commandé plusieurs fois) : chaque unité a sa
//   propre règle, par exemple un kombucha partagé à 3 et un autre pour une personne.
export default function ItemSplit({ item, people, assignment, onChange }) {
  const rule = assignment ?? HOST_RULE;
  const perUnit = rule.mode === "perUnit";

  function setWholeMode(mode) {
    if (mode === "perUnit") {
      if (perUnit) return;
      // On part de la règle actuelle, recopiée sur chaque unité.
      onChange({ mode: "perUnit", units: Array.from({ length: item.quantity }, () => rule) });
      return;
    }
    if (perUnit || mode !== rule.mode) {
      onChange(mode === "shared" ? { mode, peopleIds: people.map((p) => p.id) } : HOST_RULE);
    }
  }

  function setUnit(index, unitRule) {
    const units = rule.units.map((u, i) => (i === index ? unitRule : u));
    onChange({ ...rule, units });
  }

  return (
    <div className="split">
      <Segmented
        label={`Répartition de ${item.name}`}
        value={perUnit ? "perUnit" : rule.mode}
        options={[
          { id: "one", label: "Une personne" },
          { id: "shared", label: "À partager" },
          ...(item.quantity > 1 ? [{ id: "perUnit", label: "Unité par unité" }] : []),
        ]}
        onChange={setWholeMode}
      />

      {perUnit ? (
        <ol className="units">
          {rule.units.map((unitRule, i) => (
            <li key={i} className="unit">
              <div className="unit-head">
                <span className="unit-name">{item.emoji} n°{i + 1}</span>
                <Segmented
                  small
                  label={`Répartition de ${item.name} n°${i + 1}`}
                  value={unitRule.mode}
                  options={[
                    { id: "one", label: "Une personne" },
                    { id: "shared", label: "À partager" },
                  ]}
                  onChange={(mode) =>
                    mode !== unitRule.mode &&
                    setUnit(i, mode === "shared" ? { mode, peopleIds: people.map((p) => p.id) } : HOST_RULE)
                  }
                />
              </div>
              <PeoplePicker people={people} rule={unitRule} onChange={(r) => setUnit(i, r)} />
            </li>
          ))}
        </ol>
      ) : (
        <PeoplePicker people={people} rule={rule} onChange={onChange} />
      )}
    </div>
  );
}

function Segmented({ label, value, options, onChange, small = false }) {
  return (
    <div className={`segmented ${small ? "is-small" : ""}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          className={value === o.id ? "is-active" : ""}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Choix des personnes : une seule (boutons radio) ou plusieurs (cases à cocher).
function PeoplePicker({ people, rule, onChange }) {
  if (rule.mode === "shared") {
    const toggle = (id) => {
      const ids = rule.peopleIds.includes(id) ? rule.peopleIds.filter((p) => p !== id) : [...rule.peopleIds, id];
      if (ids.length > 0) onChange({ ...rule, peopleIds: ids });
    };
    return (
      <div className="chips">
        {people.map((p) => {
          const on = rule.peopleIds.includes(p.id);
          return (
            <button key={p.id} aria-pressed={on} className={`chip ${on ? "is-on" : ""}`} onClick={() => toggle(p.id)}>
              {on ? "✓ " : ""}
              {p.name}
            </button>
          );
        })}
        <span className="split-note">{rule.peopleIds.length > 1 ? `Partagé à ${rule.peopleIds.length}` : "Une seule personne cochée"}</span>
      </div>
    );
  }

  return (
    <div className="chips">
      {people.map((p) => (
        <button
          key={p.id}
          aria-pressed={rule.personId === p.id}
          className={`chip ${rule.personId === p.id ? "is-on" : ""}`}
          onClick={() => onChange({ mode: "one", personId: p.id })}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
