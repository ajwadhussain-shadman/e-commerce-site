"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Tracks vertical scroll direction with a small threshold to avoid flicker.
 *
 * Returns:
 *   hidden   -> true when the user is scrolling down past the threshold (compact mode)
 *   atTop    -> true when the page is scrolled within `topOffset` of the start
 *
 * Implementation notes:
 *   - Uses a passive scroll listener (no janky layout reads on every event).
 *   - The listener is rAF-throttled so React state only updates at most once
 *     per animation frame instead of on every scroll event.
 *   - A `threshold` of dead-zone pixels prevents rapid hide/show flicker.
 *   - Respects `prefers-reduced-motion` by never collapsing the header.
 *   - Listener is cleaned up on unmount.
 */
export function useScrollDirection({
  threshold = 8,
  topOffset = 12,
  hideOffset = 40,
  enabled = true,
} = {}) {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect reduced-motion: keep the header stable (never collapse).
    const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const prefersReduced = motionPreference?.matches;
    const handleMotionPreferenceChange = (event) => {
      if (event.matches) setHidden(false);
    };
    motionPreference?.addEventListener("change", handleMotionPreferenceChange);

    if (!enabled || prefersReduced) {
      queueMicrotask(() => setHidden(false));
      return () => motionPreference?.removeEventListener("change", handleMotionPreferenceChange);
    }

    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      setAtTop(y <= topOffset);

      if (Math.abs(delta) >= threshold) {
        // Scrolling down past hideOffset hides; scrolling up reveals.
        if (delta > 0 && y > hideOffset) {
          setHidden(true);
        } else if (delta < 0) {
          setHidden(false);
        }
        lastY.current = y;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once so initial state is accurate on reload mid-page.
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      motionPreference?.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, [threshold, topOffset, hideOffset, enabled]);

  return { hidden: enabled && hidden, atTop };
}
