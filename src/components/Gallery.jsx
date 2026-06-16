import { useParams, Link } from "react-router-dom";
import { WORKS } from "../data.js";
import { BRAND } from "../brand.js";
import { motifByKey, worksOfMotif, STATS } from "../lib.js";
import MotifIndex from "./MotifIndex.jsx";
import WorkCard from "./WorkCard.jsx";

export default function Gallery({ notFound }) {
  const { key } = useParams();
  const room = key ? motifByKey[key] : null;
  const roomInvalid = key && !room;
  const works = room ? worksOfMotif(key) : WORKS;

  return (
    <>
      {!key && (
        <section className="hero">
          <p className="hero-kicker">
            {BRAND.occasion} {BRAND.org} · {BRAND.projectKicker}
          </p>
          <h1 className="hero-title">{BRAND.projectTitle}</h1>
          <p className="hero-intro">{BRAND.intro}</p>
          <dl className="hero-stats">
            <div>
              <dt>Werke</dt>
              <dd>{STATS.works}</dd>
            </div>
            <div>
              <dt>Räume</dt>
              <dd>{STATS.motifs}</dd>
            </div>
            <div>
              <dt>Teilnehmer:innen</dt>
              <dd>{STATS.people}</dd>
            </div>
          </dl>
          <p className="hero-concert">
            {BRAND.concert.label} · {BRAND.concert.date} · {BRAND.concert.venue}
          </p>
        </section>
      )}

      <MotifIndex active={room ? room.key : null} />

      {(notFound || roomInvalid) && (
        <p className="notice" role="status">
          Diese Seite gibt es nicht. Hier sind alle Werke der Ausstellung.
        </p>
      )}

      <section className="room">
        {room && (
          <header className="room-head" style={{ "--room": room.color }}>
            <span className="room-rule" aria-hidden="true" />
            <h2 className="room-title">{room.title}</h2>
            <p className="room-sub">{room.subtitle}</p>
            <p className="room-count">
              {works.length} {works.length === 1 ? "Werk" : "Werke"}
            </p>
          </header>
        )}

        <div className="grid" data-testid="grid">
          {works.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>

        {room && (
          <p className="back-row">
            <Link to="/" className="textlink">
              ← Alle Räume
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
