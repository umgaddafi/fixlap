import { useEffect, type RefObject } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * High-visibility, accessible scroll-reveal hook.
 * Triggers distinct, unmistakable dynamic animations when elements enter the viewport.
 * If user scrolls back up above the section, it cleanly resets so the animation
 * plays vividly whenever scrolled back into view.
 */
export function useScrollReveal(
  containerRef?: RefObject<HTMLElement | null>,
  options: ScrollRevealOptions = {}
) {
  useEffect(() => {
    // 1. Accessibility check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = containerRef?.current ?? document;
    
    const selector = '.scroll-reveal-card, .scroll-reveal-header, .scroll-reveal-banner';
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    // 2. Observer with rootMargin offset (-65px) so animation starts when card is
    // noticeably inside the user's field of view.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          } else if (entry.boundingClientRect.top > 0) {
            // Only reset when element is below the viewport (user scrolled back up),
            // allowing the user to experience the animation repeatedly on scroll down.
            entry.target.classList.remove('is-revealed');
          }
        });
      },
      {
        threshold: options.threshold ?? 0.12,
        rootMargin: options.rootMargin ?? '0px 0px -65px 0px',
      }
    );

    // 3. Queue observation
    const rafId = requestAnimationFrame(() => {
      elements.forEach((el) => observer.observe(el));
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [containerRef, options.threshold, options.rootMargin]);
}
