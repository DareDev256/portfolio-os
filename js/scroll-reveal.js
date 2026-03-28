/**
 * Scroll Reveal — Cinematic viewport-triggered animations for window content
 *
 * Uses IntersectionObserver to animate `.scroll-reveal` elements as they
 * enter scrollable `.window-content` containers. A MutationObserver on
 * #windowsContainer auto-wires new windows without manual hookup.
 *
 * Variants: data-reveal="fade-up" (default) | "fade-left" | "scale"
 * Stagger:  data-reveal-delay="0..6" (80ms increments)
 */
import { createRevealSystem } from './dom-helpers.js';

export const ScrollReveal = createRevealSystem({
    selector: '.scroll-reveal',
    activeClass: 'scroll-reveal--visible',
    threshold: 0.15,
});
