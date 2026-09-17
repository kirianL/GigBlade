"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  scaleInitial?: number;
};

// Custom ease-out curve from Emil Kowalski: cubic-bezier(0.23, 1, 0.32, 1)
const EMIL_EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function SiteReveal({
  children,
  className = "",
  delay = 0,
  yOffset = 20,
  scaleInitial = 0.97,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        transform: `translateY(${yOffset}px) scale(${scaleInitial})`,
      }}
      whileInView={{
        opacity: 1,
        transform: "translateY(0px) scale(1)",
      }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay,
        ease: EMIL_EASE_OUT,
      }}
    >
      {children}
    </motion.div>
  );
}
