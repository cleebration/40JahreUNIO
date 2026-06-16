import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Gallery from "./components/Gallery.jsx";
import WorkPage from "./components/WorkPage.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      try {
        window.scrollTo(0, 0);
      } catch {
        /* jsdom: no-op */
      }
    }
  }, [pathname]);
  return null;
}

export function AppRoutes() {
  return (
    <div className="app">
      <ScrollToTop />
      <Header />
      <main id="inhalt">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/raum/:key" element={<Gallery />} />
          <Route path="/werk/:slug" element={<WorkPage />} />
          <Route path="*" element={<Gallery notFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
