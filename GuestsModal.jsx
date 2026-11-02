import { useState } from "react";
import Modal from "./Modal.jsx";

export default function GuestsModal({ guests, max, onAdd, onRemove, onClose }) {
  const [name, setName] = useState("");
  const full = guests.length >= max;

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name);
    setName("");
  }

  return (
    <Modal title="Qui est à table ?" onClose={onClose}>
      <p className="muted">Ajoutez les personnes qui partagent la commande. Vous êtes l'hôte : c'est vous qui réglez, chacun vous rembourse sa part.</p>

      <form className="guest-form" onSubmit={submit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom du convive"
          maxLength={24}
          disabled={full}
          aria-label="Prénom du convive"
          autoFocus
        />
        <button className="btn btn-primary" disabled={!name.trim() || full}>Ajouter</button>
      </form>
      {full && <p className="split-note">Maximum {max} convives.</p>}

      <ul className="guest-list">
        <li className="guest is-host">Moi <span>hôte</span></li>
        {guests.map((g) => (
          <li key={g.id} className="guest">
            {g.name}
            <button onClick={() => onRemove(g.id)} aria-label={`Retirer ${g.name}`}>✕</button>
          </li>
        ))}
      </ul>

      <button className="btn btn-secondary btn-block" onClick={onClose}>Terminé</button>
    </Modal>
  );
}
