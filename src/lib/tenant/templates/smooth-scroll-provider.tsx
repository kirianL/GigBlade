"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type LenisStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => Lenis | null;
  set: (instance: Lenis | null) => void;
};

function createLenisStore(): LenisStore {
  let instance: Lenis | null = null;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => instance,
    set(next) {
      instance = next;
      for (const listener of listeners) listener();
    },
  };
}

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [store] = useState(createLenisStore);
  const lenis = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => null,
  );

  useEffect(() => {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    // Detect touch / mobile devices (including Instagram In-App Browser)
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;

    // Do NOT run virtual scroll interpolation on touch / mobile devices:
    // Native mobile browsers (iOS Safari, Android Chrome) have 120Hz hardware momentum scrolling.
    // Intercepting scroll on touch causes scroll fighting, rubber-band jumps,
    // and layout shifts when the browser navigation bar expands/collapses.
    if (isTouchDevice) {
      return;
    }

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.0,
      wheelMultiplier: 1.0,
      autoRaf: false,
    });

    store.set(instance);

    let rafId: number;
    function raf(time: number) {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      store.set(null);
    };
  }, [store]);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
