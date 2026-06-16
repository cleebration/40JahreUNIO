import { useState } from "react";
import { motifByKey } from "../lib.js";

// Zeigt das Bild; solange keines in public/werke/ liegt, ein bewusst gestalteter
// Platzhalter in der Raumfarbe (damit die Galerie auch ohne Bilder „fertig“ wirkt).
export default function Frame({ work }) {
  const [error, setError] = useState(false);
  const m = motifByKey[work.motif];
  const showImg = work.image && !error;
  // leichte Höhenvariation für den Salon-Hang im Platzhalter-Zustand
  const ratios = [1.0, 1.25, 0.8, 1.4, 1.1, 0.9];
  const ratio = ratios[work.id % ratios.length];

  return (
    <div className="frame" data-testid="frame">
      <div className="mat">
        {showImg ? (
          <img
            className="art"
            src={work.image}
            alt={`${work.name}: ${work.titel || work.motifTitle}`}
            loading="lazy"
            onError={() => setError(true)}
          />
        ) : (
          <div
            className="art art-placeholder"
            style={{
              "--room": m?.color || "#888",
              paddingTop: `${ratio * 100}%`,
            }}
            role="img"
            aria-label={`${work.name}: ${work.titel || work.motifTitle} (Bild folgt)`}
          >
            <span className="ph-title">{work.titel || work.motifTitle}</span>
            <span className="ph-note">Bild folgt</span>
          </div>
        )}
      </div>
    </div>
  );
}
