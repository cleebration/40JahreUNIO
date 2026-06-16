// jsdom implementiert window.scrollTo nicht – für Tests harmlos stubben.
if (typeof window !== "undefined") {
  window.scrollTo = () => {};
}
