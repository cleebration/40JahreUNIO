import { Link } from "react-router-dom";
import { MOTIFS } from "../data.js";
import { countByMotif, STATS } from "../lib.js";

export default function MotifIndex({ active }) {
  const counts = countByMotif();
  return (
    <nav className="motif-index" aria-label="Ausstellungsräume">
      <Link
        to="/"
        className={"chip chip-all" + (!active ? " is-active" : "")}
        data-testid="motif-filter"
      >
        <span className="chip-name">Alle Räume</span>
        <span className="chip-count">{STATS.works}</span>
      </Link>
      {MOTIFS.map((m, i) => (
        <Link
          key={m.key}
          to={`/raum/${m.key}`}
          className={"chip" + (active === m.key ? " is-active" : "")}
          style={{ "--room": m.color }}
          data-testid="motif-filter"
        >
          <span className="chip-no">{String(i + 1).padStart(2, "0")}</span>
          <span className="chip-name">{m.title}</span>
          <span className="chip-count">{counts[m.key] || 0}</span>
        </Link>
      ))}
    </nav>
  );
}
