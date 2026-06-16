import { Link } from "react-router-dom";
import { useState } from "react";
import { BRAND } from "../brand.js";

export default function Header() {
  const [logoOk, setLogoOk] = useState(true);
  return (
    <header className="site-head">
      <a className="skip" href="#inhalt">
        Zum Inhalt springen
      </a>
      <Link to="/" className="brand" aria-label={`${BRAND.org} – Startseite`}>
        {logoOk ? (
          <img
            className="brand-logo"
            src={BRAND.logo}
            alt=""
            onError={() => setLogoOk(false)}
          />
        ) : null}
        <span className="brand-text">
          <span className="brand-occasion">{BRAND.occasion}</span>
          <span className="brand-org">{BRAND.org}</span>
        </span>
      </Link>
      <span className="head-meta">{BRAND.orgFull}</span>
    </header>
  );
}
