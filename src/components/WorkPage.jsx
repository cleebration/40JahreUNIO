import { useParams, Link } from "react-router-dom";
import { WORKS } from "../data.js";
import { motifByKey, worksOfMotif } from "../lib.js";
import Frame from "./Frame.jsx";

export default function WorkPage() {
  const { slug } = useParams();
  const work = WORKS.find((w) => w.slug === slug);

  if (!work) {
    return (
      <section className="workpage">
        <p className="notice" role="status">
          Dieses Werk wurde nicht gefunden.
        </p>
        <Link to="/" className="textlink">
          ← Zur Ausstellung
        </Link>
      </section>
    );
  }

  const m = motifByKey[work.motif];
  const roomWorks = worksOfMotif(work.motif);
  const idx = roomWorks.findIndex((w) => w.id === work.id);
  const prev = roomWorks[idx - 1];
  const next = roomWorks[idx + 1];

  return (
    <section className="workpage" style={{ "--room": m?.color }}>
      <p className="crumbs">
        <Link to="/" className="textlink">
          Ausstellung
        </Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/raum/${work.motif}`} className="textlink">
          {work.motifTitle}
        </Link>
      </p>

      <div className="work-layout">
        <div className="work-art">
          <Frame work={work} />
        </div>

        <aside className="work-label">
          <span className="wl-room" style={{ "--room": m?.color }}>
            {work.motifTitle}
          </span>
          <h1 className="wl-name">{work.name}</h1>
          {work.titel ? <p className="wl-title">„{work.titel}“</p> : null}
          <dl className="wl-facts">
            <div>
              <dt>Jahrgang</dt>
              <dd>{work.jahr}</dd>
            </div>
            <div>
              <dt>Technik</dt>
              <dd>{work.technik || "—"}</dd>
            </div>
            <div>
              <dt>Motiv</dt>
              <dd>
                {work.motifTitle}
                {m?.subtitle ? <span className="wl-it"> · {m.subtitle}</span> : null}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <nav className="work-nav" aria-label="Weitere Werke in diesem Raum">
        {prev ? (
          <Link to={`/werk/${prev.slug}`} className="work-nav-link prev">
            ← {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/werk/${next.slug}`} className="work-nav-link next">
            {next.name} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="back-row">
        <Link to="/" className="textlink">
          ← Zur Ausstellung
        </Link>
      </p>
    </section>
  );
}
