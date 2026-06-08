"use client";

import { useState, useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

/**
 * Animates from the previous value to a new `value` whenever `value` changes.
 * Returns the current animated number (rounded integer).
 *
 * Uses Framer Motion's `animate()` under the hood so it integrates naturally
 * with the rest of the NILAM animation system.
 *
 * F3: respects `prefers-reduced-motion` — when the user has requested reduced
 * motion, the count jumps instantly to the target value with no animation.
 *
 * F4: tracks the live animated value in `displayRef` so each new animation
 * starts from the *current* displayed value (not a stale state snapshot),
 * preventing the "jump-back to stale start" snap on rapid slider drags.
 *
 * @param value       Target number to animate toward.
 * @param durationMs  Animation duration in milliseconds (default 400).
 */
export function useCountUp(value: number, durationMs = 400): number {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);

  // F4: track the live animated value independently of React state to avoid
  // stale-closure start-value on fast successive calls.
  const displayRef = useRef(value);

  useEffect(() => {
    // F3: honour prefers-reduced-motion — jump immediately, skip animation.
    if (shouldReduceMotion) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    // F4: start from the current live value, not the stale `display` state.
    const from = displayRef.current;

    const controls = animate(from, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (latest) => {
        const rounded = Math.round(latest);
        displayRef.current = rounded;
        setDisplay(rounded);
      },
    });

    return () => {
      controls.stop();
    };
    // `display` is intentionally omitted — we only retarget when `value` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, shouldReduceMotion]);

  return display;
}
