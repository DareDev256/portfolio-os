# Passion OS - Troubleshooting Guide

---

title: Passion OS Troubleshooting
version: 2.56
last_updated: 2025-11-27
type: support

---

<!-- AI Context: Common issues and solutions for Passion OS.
     Purpose: Quick reference for debugging and fixing problems
     Related: DOCUMENTATION.md (usage), ARCHITECTURE.md (technical details) -->

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [Login & Boot Issues](#login--boot-issues)
4. [Window Management Issues](#window-management-issues)
5. [Desktop & Icons Issues](#desktop--icons-issues)
6. [Routing Issues](#routing-issues)
7. [Visual Effects Issues](#visual-effects-issues)
8. [Mobile & Responsive Issues](#mobile--responsive-issues)
9. [Admin Dashboard Issues](#admin-dashboard-issues)
10. [Data & Storage Issues](#data--storage-issues)
11. [Performance Issues](#performance-issues)
12. [Browser Compatibility](#browser-compatibility)
13. [Deployment Issues](#deployment-issues)
14. [Debugging Tools](#debugging-tools)

---

## Quick Diagnostics

### Is the Problem in My Code or the System?

Try **Safe Mode** first: `http://localhost:5173/?safe=1`

**Safe Mode disables:**

- All visual effects (FX, Aurora, Glyphs)
- Boot sequence animation
- Warp tunnel effect

**If problem persists in Safe Mode**: Issue is in core system (Desktop, Windows, Router, etc.)

**If problem disappears in Safe Mode**: Issue is in visual effects modules

### Console Error Checking

Open browser DevTools (F12) and check Console tab:

```javascript
// Look for errors like:
// ❌ Uncaught ReferenceError: Desktop is not defined
// ❌ Uncaught TypeError: Cannot read property 'init' of undefined
// ❌ Failed to load module script
```

**Common error types:**

- **Module errors**: Check import paths in `js/main.js`
- **Reference errors**: Check module initialization order
- **Type errors**: Check if data exists before accessing properties

---

## Installation Issues

### Issue: "Cannot find module" errors

**Symptom**: Browser console shows `Failed to load module script: "js/desktop.js"`

**Cause**: Incorrect file paths or missing files

**Solution**:

1. Verify all files exist:

```bash
ls -la js/
# Should show: main.js, state.js, desktop.js, windows.js, etc.
```

2. Check `index.html` script tag:

```html
<!-- ✅ Correct -->
<script type="module" src="/js/main.js"></script>

<!-- ❌ Wrong -->
<script src="/js/main.js"></script>
<!-- Missing type="module" -->
```

3. Ensure dev server is serving from project root:

```bash
# Run from /Users/t./Documents/Website/
npm run dev
```

---

### Issue: Blank white page on load

**Symptom**: Page loads but nothing appears, no errors in console

**Cause 1**: CSS files not loading

**Solution**:

```bash
# Verify CSS files exist
ls -la css/
# Should show: reset.css, variables.css, styles.css, windows.css, admin.css
```

**Cause 2**: JavaScript disabled in browser

**Solution**: Enable JavaScript in browser settings

**Cause 3**: Server not running

**Solution**:

```bash
# Start dev server
npm run dev
# Navigate to http://localhost:5173
```

---

### Issue: Vite dev server won't start

**Symptom**: `npm run dev` fails

**Solution**:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (needs 14+)
node --version

# Try alternative port if 5173 is busy
npm run dev -- --port 3000
```

---

## Login & Boot Issues

### Issue: Stuck on lock screen

**Symptom**: Clicking "INITIALIZE" button does nothing

**Cause**: Event listener not attached

**Solution**:

1. Check console for errors
2. Verify `js/login.js` is loaded:

```javascript
// In console:
typeof Login;
// Should return: "object"
```

3. Check button ID in `index.html`:

```html
<!-- Must match -->
<button id="loginButton" class="cyber-button">INITIALIZE</button>
```

**File**: `js/login.js` lines 50-70

---

### Issue: Boot sequence freezes mid-animation

**Symptom**: Boot messages stop appearing halfway through

**Cause**: JavaScript error during boot

**Solution**:

1. Check console for errors
2. Try Safe Mode: `?safe=1` (skips boot animation)
3. Check `js/boot.js` for typos

**File**: `js/boot.js`

---

### Issue: Desktop doesn't appear after boot

**Symptom**: Boot completes but desktop stays hidden

**Cause**: Desktop initialization failed

**Solution**:

```javascript
// In console, manually initialize:
Desktop.init();

// Check if Desktop exists:
typeof Desktop;
// Should return: "object"
```

Check `js/login.js` lines 80-100 for Desktop.init() call.

---

## Window Management Issues

### Issue: Windows won't open

**Symptom**: Clicking desktop icons does nothing

**Cause**: WindowManager not initialized

**Solution**:

```javascript
// In console:
WindowManager.init();

// Test window:
WindowManager.open({
    id: 'test',
    title: 'Test Window',
    content: '<p>Hello World</p>',
    width: 400,
    height: 300,
});
```

**File**: `js/windows.js`

---

### Issue: Can't drag windows

**Symptom**: Windows appear but can't be moved

**Cause**: Drag event listeners not attached

**Solution**:

1. Check if windows have `.window-titlebar` element
2. Verify `js/windows.js` setupDrag() method is called
3. Test in console:

```javascript
// Get window element
const win = document.querySelector('.window');
console.log(win.querySelector('.window-titlebar')); // Should exist
```

**File**: `js/windows.js` lines 200-300 (drag logic)

---

### Issue: Windows appear off-screen

**Symptom**: Window opens but not visible

**Cause**: Saved position out of viewport bounds

**Solution**:

```javascript
// Clear saved window positions
localStorage.removeItem('windowStates');

// Refresh page
location.reload();
```

**Alternative**: Resize browser window (triggers auto-reposition)

**File**: `js/main.js` lines 84-107 (resize handler)

---

### Issue: Window minimize/maximize broken

**Symptom**: Buttons don't work or animation glitches

**Cause**: CSS transition conflict or missing classes

**Solution**:

1. Check CSS is loaded:

```javascript
// In console:
getComputedStyle(document.querySelector('.window')).transition;
// Should return transition values
```

2. Verify classes in `css/windows.css`:

```css
.window.minimized {
    opacity: 0;
    transform: scale(0.3) translateY(100vh);
}
.window.visible {
    opacity: 1;
    transform: scale(1);
}
```

**File**: `css/windows.css` lines 30-60

---

### Issue: Z-index problems (windows stack incorrectly)

**Symptom**: Clicking window doesn't bring it to front

**Cause**: Z-index not updating on click

**Solution**:

```javascript
// Check z-index is incrementing:
State.currentZIndex; // Should be > 100

// Manually focus window:
const win = State.getWindow('about');
if (win && win.element) {
    win.element.style.zIndex = State.getNextZIndex();
}
```

**File**: `js/state.js` lines 149-156

---

## Desktop & Icons Issues

### Issue: Desktop icons don't appear

**Symptom**: Desktop loads but no icons visible

**Cause 1**: DESKTOP_ITEMS array empty or malformed

**Solution**:

```javascript
// Check in console:
Desktop.DESKTOP_ITEMS;
// Should return array of icon objects

// Manually regenerate icons:
Desktop.renderIcons();
```

**File**: `js/desktop.js` lines 10-45

**Cause 2**: localStorage overrides with empty array

**Solution**:

```javascript
// Clear custom icons:
localStorage.removeItem('desktopItems');
location.reload();
```

---

### Issue: Icon context menu doesn't appear

**Symptom**: Right-click on icon shows browser menu instead of custom menu

**Cause**: Context menu event not preventing default

**Solution**:
Check `js/desktop.js` for `e.preventDefault()` in contextmenu listener:

```javascript
// File: js/desktop.js lines 159-163
icon.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // ← Must be present
    this.showIconContextMenu(e.clientX, e.clientY, item);
});
```

---

### Issue: Wallpaper won't change

**Symptom**: Selecting wallpaper from context menu does nothing

**Cause**: CSS variable not updating or wrong path

**Solution**:

```javascript
// Check current wallpaper:
localStorage.getItem('wallpaper');

// Manually set wallpaper:
State.setWallpaper('assets/wallpapers/wallpaper1.jpg');

// Check CSS variable:
getComputedStyle(document.documentElement).getPropertyValue('--wallpaper-url');
```

**File**: `js/state.js` lines 88-122 (wallpaper logic)

**Common mistake**: Forgetting `../ `prefix for paths in CSS

---

## Routing Issues

### Issue: Routes don't work (URL changes but window doesn't open)

**Symptom**: Navigating to `/about` doesn't open About window

**Cause**: Router not initialized

**Solution**:

```javascript
// Check if Router exists:
typeof Router;
// Should return: "object"

// Manually init:
Router.init();

// Test route:
Router.navigate('/about');
```

**File**: `js/router.js`

---

### Issue: Browser back button doesn't work

**Symptom**: Clicking back button in browser doesn't close windows

**Cause**: popstate listener not registered

**Solution**:
Check `js/router.js` for popstate listener:

```javascript
// File: js/router.js lines 40-50
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.route) {
        const handler = this.routes.get(e.state.route);
        if (handler) handler();
    }
});
```

---

### Issue: Deep links don't work (direct URL navigation fails)

**Symptom**: Sharing `http://example.com/about` loads desktop but doesn't open window

**Cause**: Router.init() called before Desktop.init()

**Solution**:
Ensure initialization order in `js/login.js`:

```javascript
// File: js/login.js ~line 90
Desktop.init(); // ← First
WindowManager.init(); // ← Second
Router.init(); // ← Third (after Desktop exists)
```

---

## Visual Effects Issues

### Issue: FX/Aurora/Glyphs effects not appearing

**Symptom**: Enabling effects in Settings does nothing

**Cause 1**: Effects disabled in Safe Mode

**Solution**: Remove `?safe=1` from URL

**Cause 2**: Module not initialized

**Solution**:

```javascript
// Check modules exist:
(typeof FX, typeof Aurora, typeof Glyphs);
// All should return: "object"

// Manually enable:
FX.init();
FX.setEnabled(true);

Aurora.init();
Aurora.setEnabled(true);

Glyphs.init();
Glyphs.setEnabled(true);
```

---

### Issue: Keyboard shortcuts (Alt+X/A/G) don't work

**Symptom**: Pressing Alt+X doesn't toggle FX

**Cause**: Event listener not registered

**Solution**:
Check `js/main.js` lines 64-72 for keydown listener:

```javascript
document.addEventListener('keydown', (e) => {
    if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const k = e.key.toLowerCase();
        if (k === 'x') {
            State.toggleFx();
            e.preventDefault();
        }
        if (k === 'a') {
            State.toggleAurora();
            e.preventDefault();
        }
        if (k === 'g') {
            State.toggleGlyphs();
            e.preventDefault();
        }
    }
});
```

---

### Issue: Effects cause lag/poor performance

**Symptom**: Browser slows down with effects enabled

**Solution**:

1. **Disable all effects**: Use Safe Mode (`?safe=1`)
2. **Reduce particle count**: Edit `js/fx.js` and reduce particle count
3. **Disable specific effects**:

```javascript
// Disable only Aurora (most intensive):
Aurora.setEnabled(false);

// Keep FX and Glyphs:
FX.setEnabled(true);
Glyphs.setEnabled(true);
```

**Alternative**: Use lighter wallpaper (gradients instead of images)

---

## Mobile & Responsive Issues

### Issue: Mobile detection not working

**Symptom**: Opening on mobile shows desktop layout

**Cause**: Mobile.js not initialized or detection logic failing

**Solution**:

```javascript
// Check if Mobile exists:
typeof Mobile;
// Should return: "object"

// Force mobile mode:
Mobile.init();

// Check detection:
Mobile.isMobile();
// Should return: true on mobile
```

**File**: `js/mobile.js` lines 9-18

---

### Issue: Windows too large on mobile

**Symptom**: Windows overflow screen on small devices

**Cause**: Mobile CSS not injected

**Solution**:
Verify `js/mobile.js` injects responsive CSS:

```javascript
// File: js/mobile.js lines 25-100
// Check if <style id="mobile-styles"> exists in <head>
document.getElementById('mobile-styles');
// Should exist on mobile
```

**Manual fix**: Add to `css/styles.css`:

```css
@media (max-width: 768px) {
    .window {
        width: 100vw !important;
        height: 100vh !important;
        top: 0 !important;
        left: 0 !important;
    }
}
```

---

### Issue: Touch events not working on mobile

**Symptom**: Can't interact with windows on touch devices

**Cause**: Mouse events only (no touch event handlers)

**Solution**: This is expected. Window dragging uses `mousedown` which mobile browsers translate to touch. If still not working:

1. Disable hover effects (may block touch):

```javascript
// In js/mobile.js, hover effects should be disabled on mobile
```

2. Check viewport meta tag exists in `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

## Admin Dashboard Issues

### Issue: Admin Dashboard won't open

**Symptom**: Settings → Content Editor does nothing

**Cause**: Admin.js not loaded

**Solution**:

```javascript
// Check if AdminDashboard exists:
typeof AdminDashboard;
// Should return: "object"

// Manually open:
Desktop.openAdminDashboard();
```

Verify `js/admin.js` is imported in `js/desktop.js`:

```javascript
import { AdminDashboard } from './admin.js';
```

---

### Issue: Changes in Admin Dashboard don't save

**Symptom**: Editing desktop items/projects doesn't persist on reload

**Cause**: localStorage not updating

**Solution**:

```javascript
// Check if data is being saved:
localStorage.getItem('desktopItems');
localStorage.getItem('projects.json');

// Should return JSON strings

// Manually save:
const items = [
    /* your desktop items */
];
localStorage.setItem('desktopItems', JSON.stringify(items));
```

**File**: `js/admin.js` saveDesktopItems() method

---

### Issue: Admin Dashboard tabs don't switch

**Symptom**: Clicking tab does nothing

**Cause**: Tab click handler not attached

**Solution**:

```javascript
// Check tabs exist:
document.querySelectorAll('.admin-tab').length;
// Should be > 0

// Check active class:
document.querySelector('.admin-tab.active');
// Should exist
```

**File**: `js/admin.js` lines 100-200

---

### Issue: Import/Export not working

**Symptom**: Export button doesn't download file

**Cause**: Browser blocking download or data empty

**Solution**:

1. Check browser allows downloads
2. Verify data exists before export:

```javascript
// In console:
AdminDashboard.exportAllData();
// Should return object with desktopItems, projects, media, theme
```

3. For import, check file is valid JSON:

```javascript
// Test file parsing:
const fileContent = '{"desktopItems": [...]}';
JSON.parse(fileContent); // Should not throw error
```

---

## Data & Storage Issues

### Issue: localStorage quota exceeded

**Symptom**: Error: "QuotaExceededError: DOM Exception 22"

**Cause**: Too much data in localStorage (limit ~5-10MB)

**Solution**:

```javascript
// Check storage usage:
let total = 0;
for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
    }
}
console.log(`Storage used: ${(total / 1024).toFixed(2)} KB`);

// Clear large items:
localStorage.removeItem('media.json'); // Often largest
```

**Alternative**: Use external JSON files instead of localStorage for large datasets

---

### Issue: Data lost after clearing browser cache

**Symptom**: All customizations gone after clearing cache

**Cause**: localStorage cleared with cache

**Solution** (Prevention):

1. **Export data regularly** via Admin Dashboard → Import/Export
2. **Use external JSON files**:
    - Store projects in `data/projects.json` (not localStorage)
    - Store media in `data/media.json` (not localStorage)

3. **Backup localStorage**:

```javascript
// Export all localStorage to JSON file:
const backup = {};
for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
        backup[key] = localStorage[key];
    }
}
console.log(JSON.stringify(backup, null, 2));
// Copy output and save to file
```

---

### Issue: Projects/Media not loading

**Symptom**: Applications or Photos window is empty

**Cause 1**: Both localStorage and JSON files are empty

**Solution**:

```javascript
// Check both sources:
localStorage.getItem('projects.json'); // Check localStorage
// Also check data/projects.json file exists

// Manually set projects:
const projects = [
    {
        title: 'Test Project',
        description: 'Test',
        tech: ['JavaScript'],
        tags: ['Web'],
        demo: '',
        repo: '',
    },
];
localStorage.setItem('projects.json', JSON.stringify(projects));
```

**Cause 2**: JSON parsing error

**Solution**:

```javascript
// Test JSON parsing:
const data = localStorage.getItem('projects.json');
try {
    JSON.parse(data);
} catch (e) {
    console.error('Invalid JSON:', e);
    // Fix or remove corrupted data:
    localStorage.removeItem('projects.json');
}
```

---

## Performance Issues

### Issue: Slow initial load

**Symptom**: Page takes >5 seconds to load

**Cause**: Large images or too many assets

**Solution**:

1. **Optimize wallpapers**:
    - Resize to max 1920x1080
    - Use WebP format instead of JPG/PNG
    - Compress images (TinyPNG, ImageOptim)

2. **Use gradients** instead of images:

```javascript
State.setWallpaper('gradient:dark-ombre');
```

3. **Lazy load modules**:
    - Move non-critical imports inside functions
    - Load Admin.js only when Admin Dashboard opened

---

### Issue: Window animations stutter

**Symptom**: Windows open/close with janky animations

**Cause**: Non-GPU-accelerated CSS or browser repaint

**Solution**:

1. **Use transform instead of top/left**:

```css
/* ✅ Good (GPU-accelerated) */
.window {
    transform: translate(100px, 100px);
}

/* ❌ Bad (CPU-based) */
.window {
    left: 100px;
    top: 100px;
}
```

2. **Enable hardware acceleration**:

```css
.window {
    will-change: transform, opacity;
    transform: translateZ(0); /* Force GPU layer */
}
```

**File**: `css/windows.css`

---

### Issue: Memory leak (page gets slower over time)

**Symptom**: After opening/closing many windows, page becomes sluggish

**Cause**: Event listeners or DOM elements not cleaned up

**Solution**:

1. **Check window cleanup**:

```javascript
// Verify windows are removed from State:
State.getAllWindows().length;
// Should match number of open windows (not include closed ones)
```

2. **Reload page** to reset state

3. **Report issue** if memory keeps growing (check DevTools Memory tab)

---

## Browser Compatibility

### Issue: Doesn't work in Internet Explorer

**Symptom**: Blank page or errors in IE

**Cause**: IE doesn't support ES6 modules

**Solution**: **Not supported.** Passion OS requires modern browser:

- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+ (Chromium-based)

**No IE support planned.** Use modern browser.

---

### Issue: Safari-specific issues

**Symptom**: Works in Chrome but not Safari

**Common Safari issues**:

1. **Date parsing errors**:

```javascript
// ❌ Doesn't work in Safari:
new Date('2025-11-27');

// ✅ Works everywhere:
new Date('2025/11/27');
```

2. **CSS backdrop-filter**:

```css
/* Add -webkit- prefix for Safari: */
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
```

3. **Audio autoplay blocked**:
    - Safari blocks autoplay audio
    - Wait for user interaction before AudioFX.bootChime()

---

### Issue: Firefox-specific issues

**Symptom**: Works in Chrome but not Firefox

**Common Firefox issues**:

1. **CSS scrollbar styling**:
    - Firefox uses different scrollbar properties
    - Use `scrollbar-width` and `scrollbar-color`

2. **Window drag performance**:
    - Firefox may be slower with transform animations
    - Consider using `will-change` CSS property

---

## Deployment Issues

### Issue: Works locally but not on deployed site

**Symptom**: Production site shows blank page or errors

**Cause 1**: Absolute paths not resolving

**Solution**:
Check paths in `index.html`:

```html
<!-- ✅ Good (relative) -->
<script type="module" src="/js/main.js"></script>

<!-- ❌ Bad (localhost-specific) -->
<script type="module" src="http://localhost:5173/js/main.js"></script>
```

**Cause 2**: MIME type errors (GitHub Pages)

**Solution**:
Ensure `.js` files served with `Content-Type: application/javascript`

Add `.nojekyll` file to root if using GitHub Pages:

```bash
touch .nojekyll
```

**Cause 3**: Case-sensitive file paths

**Solution**:
Linux servers are case-sensitive. Check filename casing:

```javascript
// ❌ Won't work if actual file is Desktop.js:
import { Desktop } from './desktop.js';

// ✅ Correct:
import { Desktop } from './Desktop.js'; // Match exact casing
```

---

### Issue: Service worker not updating

**Symptom**: Changes don't appear even after hard refresh

**Cause**: Service worker caching old files

**Solution**:

```javascript
// Unregister service worker:
navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
});

// Hard refresh:
// Chrome/Firefox: Ctrl+Shift+R or Cmd+Shift+R
// Safari: Cmd+Option+R
```

---

### Issue: CORS errors when loading JSON files

**Symptom**: `data/projects.json` won't load, CORS error in console

**Cause**: Opening `index.html` directly (file:// protocol)

**Solution**:
**Must use a dev server** (can't open file directly):

```bash
# Use Vite:
npm run dev

# Or use Python simple server:
python3 -m http.server 8000

# Or use Node http-server:
npx http-server -p 8000
```

---

## Debugging Tools

### Console Commands for Debugging

```javascript
// === State Inspection ===
State; // View entire state
State.getAllWindows(); // List all open windows
State.theme; // Current theme
State.wallpaper; // Current wallpaper
localStorage; // View all stored data

// === Module Status ===
typeof Desktop; // "object" if loaded
typeof WindowManager; // "object" if loaded
typeof Router; // "object" if loaded
typeof Mobile; // "object" if loaded
typeof AdminDashboard; // "object" if loaded

// === Manual Initialization ===
Desktop.init(); // Reinitialize Desktop
WindowManager.init(); // Reinitialize WindowManager
Router.init(); // Reinitialize Router
Mobile.init(); // Reinitialize Mobile detection

// === Testing Windows ===
WindowManager.open({
    id: 'test',
    title: 'Test Window',
    content: '<h1>Hello</h1>',
    width: 600,
    height: 400,
});

// === Clear State ===
State.clearAllStates(); // Reset all localStorage
localStorage.clear(); // Nuclear option (clears everything)
location.reload(); // Refresh page

// === Test Routes ===
Router.navigate('/about'); // Test routing
Router.routes; // View all registered routes

// === Visual Effects ===
FX.setEnabled(true); // Enable particle FX
Aurora.setEnabled(true); // Enable aurora
Glyphs.setEnabled(true); // Enable glyphs
AudioFX.setEnabled(true); // Enable sound

// === Performance Monitoring ===
performance.now(); // Current timestamp
performance.memory; // Memory usage (Chrome only)
```

---

### Browser DevTools Tips

1. **Network Tab**:
    - Check if all JS/CSS files loaded (200 status)
    - Look for 404 errors (missing files)

2. **Console Tab**:
    - Check for JavaScript errors
    - Test module availability (`typeof Desktop`)

3. **Application Tab** (Chrome):
    - View localStorage under "Storage"
    - Check Service Worker status

4. **Performance Tab**:
    - Record session to find performance bottlenecks
    - Look for long tasks or excessive repaints

5. **Elements Tab**:
    - Inspect window elements (check z-index, transforms)
    - Verify classes are applied (`.visible`, `.minimized`, etc.)

---

### Safe Mode Checklist

If nothing else works, try Safe Mode:

```
http://localhost:5173/?safe=1
```

**Safe Mode disables**: FX, Aurora, Glyphs, Boot animation, Warp effect

**If problem persists in Safe Mode**:

1. Check console for errors
2. Verify all core files loaded (main.js, state.js, desktop.js, windows.js)
3. Test window opening: `WindowManager.open({id:'test', title:'Test', content:'<p>Test</p>'})`
4. Check localStorage is enabled in browser

**If problem disappears in Safe Mode**:

- Issue is in visual effects modules (fx.js, aurora.js, glyphs.js, warp.js)
- Try enabling effects one by one to isolate culprit

---

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Try Safe Mode** (`?safe=1`)
3. **Check browser console** for errors
4. **Try in different browser** (isolate browser-specific issues)
5. **Clear localStorage** and test with fresh state
6. **Check file paths** and permissions

### Information to Include in Bug Reports

```
**Environment**:
- OS: macOS / Windows / Linux
- Browser: Chrome 120 / Firefox 115 / Safari 17
- Passion OS Version: 2.56
- URL: http://localhost:5173 or deployed URL

**Steps to Reproduce**:
1. Open Admin Dashboard
2. Click "Export All Data"
3. Nothing happens

**Expected Behavior**:
Should download JSON file

**Actual Behavior**:
No file downloads, no errors in console

**Console Errors**:
(Paste any errors from browser console)

**Screenshots**:
(If applicable)
```

---

## Related Documentation

- **User Guide**: [DOCUMENTATION.md](../DOCUMENTATION.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Terminology**: [GLOSSARY.md](GLOSSARY.md)
- **Development History**: [CHANGELOG.md](../CHANGELOG.md)
- **Admin Guide**: [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md)

---

**Troubleshooting Guide Version**: 2.56

**Last Updated**: November 2025

**Total Issues Documented**: 50+

---

<!-- AI Parsing Notes:
- Problem → Cause → Solution format for quick scanning
- Console commands for debugging
- File references with line numbers
- Browser DevTools guidance
- Safe Mode as first diagnostic step
-->
