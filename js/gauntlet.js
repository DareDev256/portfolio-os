/**
 * Gauntlet — Cinematic scroll-triggered reveal for About window stages
 *
 * Observes `.gauntlet-reveal` elements inside scrollable `.window-content`
 * containers. When a stage enters the viewport it gets the `--visible`
 * class, triggering CSS perspective transforms and staggered child reveals.
 * Also drives the SVG signature stroke-draw animation.
 */
import { createRevealSystem } from './dom-helpers.js';

export const Gauntlet = createRevealSystem({
    selector: '.gauntlet-reveal',
    activeClass: 'gauntlet-reveal--visible',
    threshold: 0.2,
    onReveal(entry) {
        const sig = entry.target.querySelector('.gauntlet-sig');
        if (sig) sig.classList.add('gauntlet-sig--drawn');
    },
});
