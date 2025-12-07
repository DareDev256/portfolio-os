    # Wallpaper Setup

## Default Wallpaper

By default the site now uses a lightweight dark ombre gradient (no image).

If you want an image as the default, place it in this folder as `default.jpg` and either:

- Right‑click the desktop → Next/Random Wallpaper to switch to it, or
- Update `js/state.js` `wallpaper` to `'assets/wallpapers/default.jpg'`.

Recommended specifications for images:

- **Format:** JPG or PNG
- **Resolution:** 1920x1080 or higher
- **Aspect Ratio:** 16:9 (works best)
- **File Size:** Under 500KB for fast loading

## Using External URLs

The project currently uses Unsplash images as placeholders. You can:

1. **Use your own images:** Place them in this folder and update the path in `css/variables.css`
2. **Keep external URLs:** The current setup works fine with external image URLs

## Changing the Default Wallpaper

- Gradients: set `--wallpaper-url` in `css/variables.css` to any CSS gradient, or use the token `'gradient:dark-ombre'` in `js/state.js`.
- Images: set the wallpaper via the context menu or by updating `js/state.js` to a relative path like `'assets/wallpapers/default.jpg'`.

## Adding More Wallpapers

The context menu includes a "Change Wallpaper" option that cycles through preset wallpapers.

To add more wallpapers, edit the `WALLPAPERS` array in `js/desktop.js` and add either image URLs/paths or gradient tokens (e.g. `'gradient:dark-ombre'`).
