/**
 * Project status derivation.
 *
 * Extracted from the Applications renderer because the rule it encodes was
 * wrong in a way nobody could see: status was derived purely from whether a
 * project had a `demo` URL, so anything shipped as a library or CLI rather
 * than a hosted page was labelled ARCHIVED. That marked 9 of 21 projects dead,
 * including the most-adopted open-source project on the site.
 *
 * An explicit `status` on the project record now wins; the demo heuristic is
 * only the fallback for records that never set one.
 */

export const STATUS_ARCHIVED = 'ARCHIVED';
export const STATUS_LIVE = 'LIVE';

/**
 * @param {{status?: string, demo?: string|null}} project
 * @returns {string} display status
 */
export function deriveStatus(project) {
    if (!project) return STATUS_ARCHIVED;
    if (project.status) return project.status;
    return project.demo ? STATUS_LIVE : STATUS_ARCHIVED;
}

/**
 * Only ARCHIVED gets the muted treatment. Derived separately so a future
 * status ("BETA", "PAUSED") does not accidentally inherit the dead styling.
 * @param {{status?: string, demo?: string|null}} project
 */
export function statusClass(project) {
    return deriveStatus(project) === STATUS_ARCHIVED ? 'lab-notes__status--archived' : '';
}
