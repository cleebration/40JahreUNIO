import { BRAND } from "../brand.js";

export default function Footer() {
  return (
    <footer className="site-foot">
      <div className="foot-row">
        <div>
          <div className="foot-strong">{BRAND.orgFull}</div>
          <div className="foot-soft">
            {BRAND.concert.label} · {BRAND.concert.date} · {BRAND.concert.venue}
          </div>
        </div>
        <div className="foot-right">
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          <span className="foot-soft">{BRAND.domain}</span>
        </div>
      </div>
      <p className="foot-fine">
        Alle Werke wurden 2019 von den Teilnehmer:innen zum Wettbewerb eingereicht.
        Rechte an den Bildern liegen bei den jeweiligen Urheber:innen.
      </p>
    </footer>
  );
}
