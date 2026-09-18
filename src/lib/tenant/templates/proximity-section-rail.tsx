"use client";

import { useEffect, useRef, useState } from "react";

type RailSection = {
  id: string;
  label: string;
};

export function ProximitySectionRail({
  sections,
}: {
  sections: RailSection[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const dashRefs = useRef(new Map<string, HTMLSpanElement>());

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const anchor = window.innerHeight * 0.42;
      let closest = sections[0]?.id;
      let distance = Number.POSITIVE_INFINITY;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        const nextDistance =
          rect.top <= anchor && rect.bottom >= anchor
            ? 0
            : Math.min(Math.abs(rect.top - anchor), Math.abs(rect.bottom - anchor));
        if (nextDistance < distance) {
          distance = nextDistance;
          closest = section.id;
        }
      }
      setActiveId(closest);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections]);

  const resetDashes = () => {
    for (const dash of dashRefs.current.values()) {
      dash.style.transform = "";
    }
  };

  return (
    <nav
      aria-label="Navegación rápida por secciones"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
      onPointerMove={(event) => {
        for (const dash of dashRefs.current.values()) {
          const rect = dash.getBoundingClientRect();
          const distance = Math.abs(event.clientY - (rect.top + rect.height / 2));
          const scale = 1 + Math.max(0, 1 - distance / 44) * 1.6;
          dash.style.transform = `scaleX(${scale})`;
        }
      }}
      onPointerLeave={resetDashes}
    >
      <div className="flex flex-col items-end gap-2 py-3">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={activeId === section.id ? "location" : undefined}
            aria-label={`Ir a ${section.label}`}
            title={section.label}
            className="group flex h-3 w-12 items-center justify-end"
          >
            <span
              ref={(node) => {
                if (node) dashRefs.current.set(section.id, node);
                else dashRefs.current.delete(section.id);
              }}
              className={`site-section-dash block h-px origin-right ${
                activeId === section.id
                  ? "w-8 bg-(--site-fg)"
                  : "w-5 bg-(--site-muted)"
              }`}
            />
          </a>
        ))}
      </div>
    </nav>
  );
}
