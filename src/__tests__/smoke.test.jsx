import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App.jsx";
import { WORKS, MOTIFS } from "../data.js";
import { countByMotif } from "../lib.js";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe("Daten", () => {
  it("hat 121 Werke", () => {
    expect(WORKS.length).toBe(121);
  });
  it("hat eindeutige Slugs", () => {
    const slugs = WORKS.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("jedes Werk verweist auf ein gültiges Motiv", () => {
    const keys = new Set(MOTIFS.map((m) => m.key));
    for (const w of WORKS) expect(keys.has(w.motif)).toBe(true);
  });
});

describe("Galerie", () => {
  it("zeigt alle Werke und einen Filter pro Raum", () => {
    renderAt("/");
    expect(screen.getAllByTestId("work-card").length).toBe(WORKS.length);
    // 10 Räume + 'Alle Räume'
    expect(screen.getAllByTestId("motif-filter").length).toBe(MOTIFS.length + 1);
  });
});

describe("Klick: Raum filtern", () => {
  it("Klick auf einen Raum reduziert die Galerie auf dessen Werke", () => {
    const counts = countByMotif();
    const room = MOTIFS.find((m) => m.key === "gnom");
    renderAt("/");
    const filter = screen
      .getAllByTestId("motif-filter")
      .find((el) => within(el).queryByText(room.title));
    expect(filter).toBeTruthy();
    fireEvent.click(filter);
    expect(screen.getAllByTestId("work-card").length).toBe(counts[room.key]);
  });
});

describe("Klick: Werk öffnen", () => {
  it("Klick auf eine Karte öffnet die Werkseite mit Name und Zurück-Link", () => {
    renderAt("/");
    const first = screen.getAllByTestId("work-card")[0];
    const expectedName = WORKS[0].name;
    fireEvent.click(first);
    // Werkseite zeigt den Namen als Überschrift
    expect(screen.getByRole("heading", { name: expectedName })).toBeTruthy();
    // und einen Zurück-Link zur Ausstellung
    expect(screen.getByText("← Zur Ausstellung")).toBeTruthy();
  });
});

describe("Unbekannte Route", () => {
  it("zeigt einen Hinweis statt eines leeren Bildschirms", () => {
    renderAt("/gibt-es-nicht");
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getAllByTestId("work-card").length).toBe(WORKS.length);
  });
});
