import { Link } from "react-router-dom";
import Frame from "./Frame.jsx";
import { motifByKey } from "../lib.js";

export default function WorkCard({ work }) {
  const m = motifByKey[work.motif];
  return (
    <Link
      to={`/werk/${work.slug}`}
      className="card"
      data-testid="work-card"
      style={{ "--room": m?.color }}
    >
      <Frame work={work} />
      <div className="label">
        <div className="label-name">{work.name}</div>
        <div className="label-meta">
          <span className="label-year">{work.jahr}</span>
          <span className="label-dot">·</span>
          <span className="label-room">{work.motifTitle}</span>
        </div>
        {work.titel ? <div className="label-title">„{work.titel}“</div> : null}
        <div className="label-tech">{work.technik}</div>
      </div>
    </Link>
  );
}
