// Loads GSAP exactly once — first call triggers the dynamic import,
// subsequent calls reuse the same promise.
type Gsap = (typeof import("gsap"))["default"];

let promise: Promise<Gsap> | null = null;

export const getGsap = (): Promise<Gsap> => {
  if (!promise) {
    promise = import("gsap").then((m) => {
      const gsap = m.default;
      gsap.ticker.lagSmoothing(0);
      gsap.config({ force3D: true });
      return gsap;
    });
  }
  return promise;
};
