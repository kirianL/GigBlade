"use client";

import { useRef, useState, useEffect } from "react";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

export function GallerySection({ site }: SiteTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const heroPhoto = site.profile.heroPhoto ?? site.profile.photos?.[0];
  const items = (site.profile.photos ?? [])
    .filter((url) => url !== heroPhoto)
    .map((url, index) => ({
      url,
      title: `${site.profile.displayName}, foto ${index + 1}`,
    }));

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
  const didDrag = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only engage drag on mouse, let native touch handle mobile
    if (e.pointerType !== "mouse") return;
    isDragging.current = true;
    didDrag.current = false;
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
    if (Math.abs(deltaX) > 5) didDrag.current = true;
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

  const openPhoto = (index: number) => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    setSelectedIndex(index);
    dialogRef.current?.showModal();
  };

  if (items.length === 0) return null;

  return (
    <>
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
                className="pressable site-icon w-9 h-9 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-[var(--site-fg)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--site-fg)] disabled:hover:border-[var(--site-card-border)]"
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
                className="pressable site-icon w-9 h-9 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-[var(--site-fg)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--site-fg)] disabled:hover:border-[var(--site-card-border)]"
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
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[var(--site-surface)] border border-[var(--site-card-border)] transition-[border-color] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:border-[color-mix(in_srgb,var(--site-fg)_40%,transparent)]">
              <img
                src={item.url}
                alt={item.title}
                loading="lazy"
                draggable={false}
                className="site-gallery-photo w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <button
                type="button"
                onClick={() => openPhoto(index)}
                className="absolute inset-0 cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
                aria-label={`Ampliar ${item.title}`}
              />

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
    <dialog
      ref={dialogRef}
      aria-label={`Galería de ${site.profile.displayName}`}
      className="m-auto max-h-[100dvh] w-full max-w-none bg-transparent p-0 text-white backdrop:bg-black/90"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="relative flex min-h-[100dvh] items-center justify-center p-4 sm:p-10">
        <img
          src={items[selectedIndex].url}
          alt={items[selectedIndex].title}
          className="max-h-[calc(100dvh-5rem)] max-w-full object-contain"
        />
        <form method="dialog">
          <button
            className="pressable absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/60 text-xl"
            aria-label="Cerrar galería"
          >
            ×
          </button>
        </form>
        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((selectedIndex - 1 + items.length) % items.length)
              }
              className="pressable absolute left-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60"
              aria-label="Foto anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex((selectedIndex + 1) % items.length)}
              className="pressable absolute right-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60"
              aria-label="Foto siguiente"
            >
              →
            </button>
          </>
        ) : null}
      </div>
    </dialog>
    </>
  );
}
