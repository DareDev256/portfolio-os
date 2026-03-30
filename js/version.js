/**
 * Single source of truth for the application version.
 * Every JS module that displays the version imports from here.
 * HTML references (title, top bar) are synced manually on bumps
 * but login.js, boot sequence, and typewriter all read this constant.
 */
export const VERSION = '3.55.0';
