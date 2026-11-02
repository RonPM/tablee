export default function Header({ view, onNavigate, itemCount }) {
  return (
    <header className="header">
      <button className="brand" onClick={() => onNavigate("menu")} aria-label="Tablée, retour au menu">
        <Logo />
        <span className="brand-name">Tablée</span>
      </button>
      <p className="tagline">Commandez ensemble, payez chacun sa part</p>
      <nav className="header-nav">
        <button
          className={`nav-link ${view === "history" ? "is-active" : ""}`}
          onClick={() => onNavigate(view === "history" ? "menu" : "history")}
        >
          {view === "history" ? "Menu" : "Mes commandes"}
        </button>
        <a className="basket-pill" href="#basket" aria-label={`${itemCount} article(s) dans la commande`}>
          🛍️ <span>{itemCount}</span>
        </a>
      </nav>
    </header>
  );
}

// Logo : une assiette vue de dessus, partagée en trois parts.
function Logo() {
  return (
    <svg className="logo" viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--green)" />
          <stop offset="1" stopColor="var(--blue)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M20 9v11l9.5 5.5M20 20l-9.5 5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
