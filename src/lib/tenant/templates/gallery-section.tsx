"use client";

import { useRef, useState, useEffect } from "react";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

const DEFAULT_GALLERY = [
  { url: "/images/dj/dj-hero.jpg", title: "Club Residency", tag: "LIVE SET" },
  { url: "/images/dj/dj-portrait.jpg", title: "Studio & Analog Gear", tag: "PRODUCER" },
  { url: "/images/dj/dj-gear.jpg", title: "Vinyl Sessions & Mixing", tag: "ANALOG" },
  { url: "/images/dj/dj-crowd.jpg", title: "Festival Stage", tag: "AFTERHOURS" },
];

export function GallerySection({ site }: SiteTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Determine photo items
  const customPhotos = site.profile.photos;
  const items =
    customPhotos && customPhotos.length > 0
      ? customPhotos.map((url, i) => ({
          url,
          title: `${site.profile.displayName} — 0${i + 1}`,
          tag: `GALLERY 0${i + 1}`,
        }))
      : DEFAULT_GALLERY;

  const updateScrollState = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate active index based on scroll position
    const cardWidth = el.firstElementChild?.clientWidth || 280;
    const index = Math.round(scrollLeft / (cardWidth + 16));
    setActiveIndex(Math.min(index, items.length - 1));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [items.length]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth || 320;
    const delta = direction === "left" ? -(cardWidth + 16) : cardWidth + 16;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Drag-to-scroll support for desktop mouse users
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only engage drag on mouse, let native touch handle mobile
    if (e.pointerType !== "mouse") return;
    isDragging.current = true;
    startX.current = e.clientX;
    if (containerRef.current) {
      scrollStart.current = containerRef.current.scrollLeft;
      containerRef.current.style.cursor = "grabbing";
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const deltaX = e.clientX - startX.current;
    containerRef.current.scrollLeft = scrollStart.current - deltaX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current && containerRef.current) {
      isDragging.current = false;
      containerRef.current.style.cursor = "grab";
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture release safety
      }
    }
  };

  return (
    <section
      id="galeria"
      data-component="gallery"
      className="relative w-full py-16 sm:py-24 px-5 sm:px-8 md:px-12 max-w-7xl mx-auto overflow-hidden"
    >
      <SiteReveal>
        {/* Gallery Header with Navigation Controls and Index */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>
            <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-[var(--site-fg)] uppercase leading-[0.85]">
              Momentos & Cabina
            </h2>
          </div>

          {/* Navigation Arrows & Counter */}
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-[var(--site-muted)] uppercase tracking-wider">
              <span className="text-[var(--site-fg)] font-bold">
                {String(activeIndex + 1).padStart(2, "0")}
              </span>{" "}
              / {String(items.length).padStart(2, "0")}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByAmount("left")}
                disabled={!canScrollLeft}
                aria-label="Foto anterior"
                className="pressable w-9 h-9 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-[var(--site-fg)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--site-accent)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount("right")}
                disabled={!canScrollRight}
                aria-label="Foto siguiente"
                className="pressable w-9 h-9 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-[var(--site-fg)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--site-accent)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </SiteReveal>

      {/* Horizontal Carousel Track with touch-pan-y guard */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="no-scrollbar flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-2 cursor-grab select-none touch-pan-y-guard"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-none w-[78vw] sm:w-[50vw] md:w-[36vw] lg:w-[28vw] max-w-sm snap-start group"
          >
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[var(--site-surface)] border border-[var(--site-card-border)] group-hover:border-[var(--site-card-hover)] transition-colors duration-300">
              <img
                src={item.url}
                alt={item.title}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />



              {/* Photo Title */}
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-sm font-medium text-white tracking-wide truncate">
                  {item.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
