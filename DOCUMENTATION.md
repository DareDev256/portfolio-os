# Passion OS - Complete Documentation

---

title: Passion OS Documentation
version: 3.16.6
last_updated: 2026-02-17
modules: 44 ES modules, 24 stylesheets, 13 test suites

---

<!-- AI Context: Complete customization and setup guide for Passion OS v3.16.6.
     Related files: js/desktop.js, data/projects.json, data/media.json
     Entry point: js/main.js
     Dependencies: Admin Dashboard (ADMIN_DASHBOARD_GUIDE.md)
     Architecture: docs/ARCHITECTURE.md -->

## Table of Contents

1. [Quick Start](#quick-start)
2. [Desktop Apps](#desktop-apps)
3. [Keyboard Shortcuts & Easter Eggs](#keyboard-shortcuts--easter-eggs)
4. [Customization Methods](#customization-methods)
5. [Desktop Items](#desktop-items)
6. [Projects & Applications](#projects--applications)
7. [Media Library](#media-library)
8. [Themes & Wallpapers](#themes--wallpapers)
9. [Resume Setup](#resume-setup)
10. [Contact Form](#contact-form)
11. [Manual Code Editing (Advanced)](#manual-code-editing-advanced)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

Node.js 18+ and npm 9+.

### Installation

```bash
git clone https://github.com/DareDev256/portfolio-os.git
cd portfolio-os
npm install
npm run dev
```

Open `http://localhost:5173`. Click the lock screen to enter.

### Two Ways to Customize

#### Option A: Admin Dashboard (Console-Only)

The admin dashboard is hidden from the UI for security. Access it from the browser console:

```javascript
Admin.open()
```

This opens a visual editor for desktop items, projects, media, and themes.

See [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) for the complete guide.

#### Option B: Manual Editing (Advanced)

Direct code editing for developers:

- Edit `data/projects.json` for projects
- Edit `data/media.json` for images/videos
- Edit `js/desktop.js` for desktop items and app launchers
- Edit `css/variables.css` for theme colors

---

## Desktop Apps

Passion OS ships with **21 desktop applications**, each launched from the icon grid. Apps are lazy-loaded — zero bytes until opened.

| App | Description |
|-----|-------------|
| **ABOUT_ME.exe** | Bio, role, location, color-coded skills grid |
| **RESUME** | PDF viewer with download button |
| **CONNECT** | Contact form with validation and input length limits |
| **LINKEDIN** | Opens LinkedIn profile (external) |
| **SKILLS_MATRIX** | Interactive force-directed skills graph (spring physics, drag nodes) |
| **GITHUB_OPS** | Live GitHub API integration with response validation |
| **PORTFOLIO** | Curated 5-project showcase with tech badges and live demo links |
| **APPLICATIONS** | 17 real projects across 4 categories with DEPLOYED/SOURCE badges |
| **DEV_TERMINAL** | Fake terminal with 18 commands (`neofetch`, `cowsay`, `matrix`, etc.) |
| **Vibe_Coder.exe** | Browser-based game (external deployed project) |
| **IMG_GEN.ai** | AI image generation tool (external deployed project) |
| **TYPEMASTER** | Typing speed game (external deployed project) |
| **SHOWCASE.mp4** | Featured video in lightbox viewer |
| **MUSIC_VIDEOS** | Music video portfolio (external) |
| **SETTINGS** | Theme, wallpaper, sound, cursor trail toggles |
| **NOTES** | Sticky notes with 5 color themes, localStorage persistence, auto-save |
| **FOCUS_TIMER** | Pomodoro timer with canvas ring, 3 presets (25/50/90 min), session stats |
| **CALC.exe** | Calculator with keyboard input, expression chaining, glass UI |
| **WEATHER** | Live weather via Open-Meteo API with geolocation and 3-day forecast |
| **SYS_MONITOR** | Live FPS graph, heap usage, DOM count, network info, uptime |

### Adding a New Desktop App

The fastest way to add an app is with `createLazyWindow()`:

```javascript
// In js/desktop.js — add to DESKTOP_ITEMS array:
{ id: 'my-app', label: 'MY_APP', icon: myAppSvg, color: '#00f0ff', action: () => this.openMyApp() }

// Then create the launcher using the lazy-load helper:
openMyApp: createLazyWindow({
    id: 'my-app',
    title: 'My App',
    icon: myAppSvg,
    width: 600,
    height: 400,
    module: () => import('./my-app.js'),
    init: (mod, el) => mod.init(el),
    cleanup: (mod) => mod.destroy(),
})
```

This pattern handles import, cleanup lifecycle, and pre-load close safety automatically.

---

## Keyboard Shortcuts & Easter Eggs

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts overlay |
| `Cmd+K` / `Ctrl+K` | Open command palette (fuzzy-search across all apps) |
| `ESC` | Close active overlay (priority: modal > lightbox > tour > window) |
| `Arrow Left` / `Arrow Right` | Navigate lightbox images |
| `Tab` / `Shift+Tab` | Cycle focus within trapped overlays |
| `Arrow Up` / `Arrow Down` + `Enter` | Navigate and select in command palette |
| `Ctrl+Shift+V` | System info easter egg |
| `Up Up Down Down Left Right Left Right B A` | Konami code |
| Triple-click desktop | Glitch pulse effect |
| Type `418` | I'm a teapot |

### Toast Notifications

The system uses a non-blocking notification queue. All user-facing feedback (settings toggles, easter eggs, session completions) routes through it:

- **4 types**: success, error, warning, info
- **Auto-dismiss** with progress bar, **hover-to-pause**
- **Max 4 visible**, oldest evicted when full
- **`aria-live` polite** region for screen readers
- **`prefers-reduced-motion`** respected

### Command Palette

Press `Cmd+K` / `Ctrl+K` to open the Spotlight-style launcher. It fuzzy-searches across all 21 desktop apps and 4 system toggles (theme, cursor trail, sound, interactions). Full keyboard navigation with arrow keys and Enter.

---

## Customization Methods

### Method 1: Admin Dashboard (Easy)

**Best for**: Non-technical users, quick updates, visual editing

**Features**:

- Visual desktop item editor
- Project CRUD operations
- Media library manager
- Theme customizer with color pickers
- Import/export backups

**How to use**: See [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md)

### Method 2: File Editing (Advanced)

**Best for**: Developers, bulk updates, version control

**Features**:

- Direct JSON editing
- Faster for many changes
- Git-friendly (track changes)
- Deployable to production

**How to use**: Continue reading below

---

## Desktop Items

Desktop Items are the icons on your desktop (MEDIA_VAULT, APPLICATIONS, etc.).

### Using Admin Dashboard

1. Open Settings → Content Editor
2. Go to "Desktop Items" tab
3. Click "Add Icon" or edit existing
4. Fill in:
    - **ID**: Unique identifier (e.g., `my-app`)
    - **Label**: Display text (e.g., `MY_APP`)
    - **Icon**: Single emoji (e.g., `🚀`)
    - **Color**: Hex color (e.g., `#00f0ff`)
    - **Action**: Function to call (select from dropdown)
5. Click "Save Desktop Items"
6. Refresh page

### Manual Editing

Edit `js/desktop.js` lines 10-45, `DESKTOP_ITEMS` array:

```javascript
// File: js/desktop.js
DESKTOP_ITEMS: [
    {
        id: 'my-app',
        label: 'MY_APP',
        icon: '🚀',
        color: '#00f0ff',
        action: () => this.openMyApp()
    },
    // Add more items...
],
```

Then create the corresponding function:

```javascript
// File: js/desktop.js
openMyApp() {
    const content = document.createElement('div');
    content.innerHTML = '<h1>My App Content</h1>';

    WindowManager.create({
        id: 'my-app',
        title: 'My App',
        icon: '🚀',
        content,
        width: 600,
        height: 400
    });
}
```

**Common Actions**:

- `openMediaVault()` - Opens Media Vault
- `openApplications()` - Opens Projects
- `openShell()` - Opens Terminal
- `openAbout()` - Opens About page
- `openContact()` - Opens Contact form
- `openResume()` - Opens Resume
- `openSettings()` - Opens Settings

---

## Projects & Applications

Projects appear in the Applications window with filtering by tags.

### Using Admin Dashboard

1. Open Settings → Content Editor
2. Go to "Projects" tab
3. Click "Add Project"
4. Fill in:
    - **Title**: Project name (required)
    - **Description**: Brief summary
    - **Technologies**: Comma-separated (e.g., `React, Node.js, MongoDB`)
    - **Tags**: Categories (e.g., `Web, Fullstack`)
    - **Demo URL**: Live demo link
    - **Repository URL**: GitHub/GitLab link
5. Click "Save Projects"
6. Open Applications window to preview

### Manual Editing

Edit `data/projects.json`:

```json
[
    {
        "title": "E-Commerce Platform",
        "description": "Full-stack online store with Stripe integration, inventory management, and admin dashboard.",
        "tech": ["React", "Node.js", "PostgreSQL", "Stripe"],
        "tags": ["Web", "Fullstack"],
        "demo": "https://demo.yourstore.com",
        "repo": "https://github.com/username/ecommerce"
    },
    {
        "title": "Weather Dashboard",
        "description": "Real-time weather app with interactive maps and location-based alerts.",
        "tech": ["Vue.js", "OpenWeather API", "Chart.js"],
        "tags": ["Web", "Frontend"],
        "demo": "https://weather.yoursite.com",
        "repo": null
    }
]
```

**Tag System**:
Tags automatically create filter buttons in the Applications window.

Common tags:

- `Web`, `Mobile`, `Desktop`
- `Frontend`, `Backend`, `Fullstack`
- `AI/ML`, `DevOps`, `Security`
- `E-Commerce`, `SaaS`, `Social`

**File Location**: `data/projects.json`

---

## Media Library

Manage images and videos for the Media Vault.

### Using Admin Dashboard

1. Open Settings → Content Editor
2. Go to "Media" tab

**For Images**:

1. Click "Add Image"
2. Fill in:
    - **URL/Path**: `assets/media/photo.jpg` or external URL
    - **Category**: Grouping tag (e.g., `Nature`, `Portraits`)
    - **Caption**: Image description
3. Click "Save Media"

**For Videos**:

1. Click "Add Video"
2. Fill in:
    - **Video URL**: YouTube, Vimeo, or direct MP4 link
    - **Title**: Video name
    - **Poster URL**: Thumbnail image
3. Click "Save Media"

### Manual Editing

Edit `data/media.json`:

```json
{
    "images": [
        {
            "url": "assets/media/sunset.jpg",
            "caption": "Golden Hour - California Coast, 2024",
            "category": "Nature"
        },
        {
            "url": "https://images.unsplash.com/photo-123",
            "caption": "Portrait Session",
            "category": "Portraits"
        }
    ],
    "videos": [
        {
            "url": "https://youtube.com/watch?v=VIDEO_ID",
            "title": "Project Demo",
            "poster": "assets/media/demo-thumb.jpg"
        },
        {
            "url": "https://vimeo.com/123456",
            "title": "Commercial Reel 2024",
            "poster": "assets/media/reel-thumb.jpg"
        },
        {
            "url": "assets/media/video.mp4",
            "title": "Self-hosted Video",
            "poster": "assets/media/video-poster.jpg"
        }
    ]
}
```

**Supported Video Formats**:

- YouTube: `https://youtube.com/watch?v=VIDEO_ID`
- Vimeo: `https://vimeo.com/VIDEO_ID`
- Direct MP4: `assets/media/video.mp4`
- Direct WebM: `assets/media/video.webm`

**Local File Organization**:

```
assets/
└── media/
    ├── sunset.jpg
    ├── portrait.jpg
    ├── demo-thumb.jpg
    ├── video.mp4
    └── video-poster.jpg
```

**Image Optimization Tips**:

- Format: JPG for photos, PNG for graphics, WebP for modern browsers
- Resolution: 1920px width recommended
- File size: Under 500KB per image
- Use tools: TinyPNG, ImageOptim, Squoosh

**File Location**: `data/media.json`

---

## Themes & Wallpapers

Customize colors, wallpapers, and visual effects.

### Using Admin Dashboard

1. Open Settings → Content Editor
2. Go to "Theme" tab

**Change Colors**:

1. Click any color picker (Cyan, Magenta, Green, Purple, Orange)
2. Choose new color
3. Click "Apply Colors"
4. Colors update immediately and persist

**Change Wallpaper**:

- Click "Next Wallpaper" to cycle through presets
- Click "Random" for random wallpaper

**Toggle Effects**:

- Particle Effects (floating particles)
- Aurora Fog (animated fog overlay)
- Hologram Ring (rotating glyph ring)
- UI Sounds (click/hover sounds)

### Manual Editing

#### Change Theme Colors

Edit `css/variables.css`:

```css
/* File: css/variables.css lines 5-15 */
:root {
    --neon-cyan: #00f0ff; /* Primary UI color */
    --neon-magenta: #ff00aa; /* Secondary accents */
    --neon-green: #00ff88; /* Success states */
    --neon-purple: #aa00ff; /* Tertiary accents */
    --neon-orange: #ffaa00; /* Warnings */
}
```

#### Change Default Wallpaper

Edit `css/variables.css`:

```css
/* File: css/variables.css line 30 */
--wallpaper-url: url('../assets/wallpapers/your-image.jpg');
```

Or use a gradient:

```css
--wallpaper-url: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

#### Add More Wallpapers

Edit `js/desktop.js` lines 350-360, `WALLPAPERS` array:

```javascript
// File: js/desktop.js
WALLPAPERS: [
    'gradient:dark-ombre',
    'assets/wallpapers/wallpaper1.jpg',
    'assets/wallpapers/wallpaper2.jpg',
    'https://images.unsplash.com/photo-123',
    // Add more...
],
```

**Wallpaper Specifications**:

- **Format:** JPG or PNG
- **Resolution:** 1920x1080 or higher
- **Aspect Ratio:** 16:9 recommended
- **File Size:** Under 500KB for fast loading

**File Locations**:

- Theme colors: `css/variables.css`
- Wallpaper presets: `js/desktop.js` lines 350-360
- Wallpaper files: `assets/wallpapers/`

---

## Resume Setup

Add your PDF resume to the portfolio.

### Method 1: PDF File

1. Place your PDF in `resume/` folder as `resume.pdf`
2. Opens in browser or downloads (browser-dependent)

### Method 2: Inline Viewer (Optional)

Edit `js/desktop.js` in `openResume()` function (around line 450):

```javascript
// File: js/desktop.js lines 450-475
openResume() {
    const content = document.createElement('div');
    content.style.height = '100%';
    content.innerHTML = `
        <iframe
            src="resume/resume.pdf"
            style="width:100%; height:100%; border:none;"
            title="Resume PDF Viewer"
        ></iframe>
        <div style="padding:20px; text-align:center;">
            <a href="resume/resume.pdf" download class="project-link">
                Download Resume (PDF)
            </a>
        </div>
    `;

    WindowManager.create({
        id: 'resume',
        title: 'Resume',
        icon: this.DESKTOP_ITEMS.find(i => i.id === 'resume').icon,
        content,
        width: 800,
        height: 600
    });
}
```

**Note**: PDF iframe may not work in all browsers. Download button always works.

**File Location**: `resume/resume.pdf`

---

## Contact Form

Configure the contact form to receive messages.

### Option A: Admin Dashboard

1. Open Settings → Content Editor
2. Go to "Projects" tab (contact info is global)
3. Your email is used for `mailto:` links

### Option B: EmailJS (Recommended)

1. Sign up at [emailjs.com](https://www.emailjs.com/)
2. Add EmailJS SDK to `index.html` before `</body>`:

```html
<!-- File: index.html before </body> -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>
    emailjs.init('YOUR_PUBLIC_KEY');
</script>
```

3. Edit `js/desktop.js` in `openContact()` function (around line 500):

```javascript
// File: js/desktop.js lines 500-530
// Uncomment EmailJS section:
emailjs
    .send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        from_name: form.querySelector('[name="name"]').value,
        from_email: form.querySelector('[name="email"]').value,
        message: form.querySelector('[name="message"]').value,
    })
    .then(
        () => alert('Message sent successfully!'),
        (error) => alert('Failed to send: ' + error.text)
    );
```

### Option C: Formspree

1. Sign up at [formspree.io](https://formspree.io/)
2. Edit `js/desktop.js` in `openContact()` function:

```javascript
// File: js/desktop.js lines 500-530
// Uncomment Formspree section:
fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    body: new FormData(form),
    headers: { Accept: 'application/json' },
}).then((response) => {
    if (response.ok) alert('Message sent!');
    else alert('Failed to send message.');
});
```

**File Location**: `js/desktop.js` lines 500-530 (openContact function)

---

## Manual Code Editing (Advanced)

For developers who want full control.

### File Structure

See the full architecture tree in [README.md](README.md#architecture) or [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Key directories:

```
├── index.html                 # Single-page entry
├── js/                        # 44 ES modules (zero framework imports)
│   ├── main.js                # Boot orchestrator
│   ├── desktop.js             # Icon grid, app launchers, createLazyWindow
│   ├── windows.js             # Window manager (drag, resize, z-index)
│   ├── state.js               # localStorage + CustomEvent bus
│   ├── sanitize.js            # DOMPurify wrapper (XSS protection)
│   ├── notifications.js       # Toast notification queue
│   ├── command-palette.js     # Cmd+K fuzzy-search launcher
│   ├── dom-helpers.js         # Shared utilities (el, openExternal, loadJSON, saveJSON)
│   ├── interactions/          # Cursor trails, easter eggs, micro-animations
│   └── ...                    # 35 more modules (see Architecture docs)
├── css/                       # 24 modular stylesheets
│   ├── variables.css          # Design tokens (colors, spacing, fonts)
│   └── ...                    # Component-scoped styles
├── tests/                     # 201 vitest tests across 13 suites
├── data/                      # JSON data files (projects, media)
├── public/assets/             # SVG icons, wallpapers
└── resume/                    # PDF resume
```

### Key Files Reference

| File                 | Purpose                       | Common Edits                                      |
| -------------------- | ----------------------------- | ------------------------------------------------- |
| `js/desktop.js`      | Desktop items, window content | Lines 10-45 (DESKTOP_ITEMS), 350-360 (WALLPAPERS) |
| `data/projects.json` | Project portfolio             | Entire file                                       |
| `data/media.json`    | Media library                 | Entire file                                       |
| `css/variables.css`  | Theme colors, wallpaper       | Lines 5-15 (colors), line 30 (wallpaper)          |
| `js/desktop.js`      | About content                 | Lines 400-430 (openAbout function)                |
| `js/desktop.js`      | Contact form                  | Lines 500-530 (openContact function)              |
| `js/desktop.js`      | Resume setup                  | Lines 450-475 (openResume function)               |

### Adding Custom Windows

1. **Add Desktop Item** in `js/desktop.js` DESKTOP_ITEMS array
2. **Create Function** in `js/desktop.js`:

```javascript
// File: js/desktop.js
openCustom() {
    const content = document.createElement('div');
    content.className = 'custom-content';
    content.innerHTML = `
        <h2 class="window-section-header">My Custom Section</h2>
        <p>Your content here...</p>
    `;

    WindowManager.create({
        id: 'custom',
        title: 'Custom Window',
        icon: '⭐',
        content,
        width: 700,
        height: 500
    });
}
```

3. **Add Styling** in `css/windows.css` or `css/styles.css`:

```css
/* File: css/styles.css */
.custom-content {
    padding: 20px;
    line-height: 1.6;
}
```

### State Management

Window positions, sizes, and states are saved to localStorage automatically.

**Clear All States** (for debugging):

```javascript
// Run in browser console
State.clearAllStates();
location.reload();
```

**Manually Access State**:

```javascript
// Get all windows
const windows = State.getAllWindows();

// Get specific window
const window = State.getWindow('about');

// Update window state
State.updateWindow('about', { x: 100, y: 100 });
```

**File Location**: `js/state.js`

---

## Deployment

The project uses **Vite** for builds. Always run `npm run build` first — it outputs to `dist/`.

### Vercel (Recommended)

Passion OS deploys to Vercel with security headers configured in `vercel.json` (CSP, HSTS, COOP, COEP, CORP, X-Frame-Options, Permissions-Policy, and more).

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com/) for automatic deploys on push.

### Netlify

1. Sign up at [netlify.com](https://www.netlify.com/)
2. Connect your GitHub repository
3. Deploy settings:
    - **Build command:** `npm run build`
    - **Publish directory:** `dist`
4. Click "Deploy"

**Note:** You'll need to replicate the security headers from `vercel.json` into a Netlify `_headers` file.

### GitHub Pages

1. Run `npm run build`
2. Deploy the `dist/` folder to your `gh-pages` branch
3. Site live at `https://username.github.io/repo-name`

**Note:** SPA routing requires a 404 fallback. Add `dist/404.html` as a copy of `dist/index.html`.

---

## Troubleshooting

### Desktop items don't appear

**Solution**:

1. Check `js/desktop.js` DESKTOP_ITEMS array for syntax errors
2. Open browser console (F12) → Console tab for errors
3. Ensure icon emoji is valid (single character or emoji)

### Projects don't show in Applications

**Solution**:

1. Check `data/projects.json` is valid JSON (use [JSONLint](https://jsonlint.com/))
2. Ensure each project has a `title` (required field)
3. Clear localStorage: `State.clearAllStates()` in console
4. Refresh page

### Images don't load

**Solution**:

1. Check file paths are correct (case-sensitive!)
2. Ensure images exist in `assets/media/` folder
3. For external URLs, check CORS permissions
4. Use browser DevTools → Network tab to debug

### Theme colors don't persist

**Solution**:

1. Click "Apply Colors" after changing in Admin Dashboard
2. Check browser localStorage isn't disabled
3. Test in incognito mode
4. Clear browser cache and try again

### Admin Dashboard won't open

**Solution**:

1. Check `js/admin.js` is loaded (view source)
2. Check `css/admin.css` is linked in `index.html`
3. Open browser console for JavaScript errors
4. Try refreshing page (Ctrl+R / Cmd+R)

### Contact form doesn't work

**Solution**:

1. If using EmailJS/Formspree, verify API keys are correct
2. Check network requests in DevTools → Network tab
3. Verify email service is configured properly
4. Test with `mailto:` first (always works)

### PDF resume doesn't display

**Solution**:

1. Ensure `resume/resume.pdf` exists
2. Try download button instead of inline viewer
3. Some browsers block PDFs in iframes (security feature)
4. Use Chrome/Firefox for best PDF support

### Performance issues

**Solution**:

1. Optimize images (use TinyPNG, ImageOptim)
2. Reduce image file sizes to <500KB each
3. Limit projects to <50 entries
4. Disable visual effects in Settings → Theme
5. Use external CDN for images

### Mobile view issues

**Solution**:

1. Check viewport meta tag exists in `index.html`
2. Test in DevTools → Device Toolbar (Ctrl+Shift+M)
3. Windows auto-resize to full screen on mobile
4. Ensure touch events work (no hover-only interactions)

### Windows stuck offscreen

**Solution**:

```javascript
// Run in browser console
State.clearAllStates();
location.reload();
```

### Can't delete desktop item

**Solution**:

1. Use Admin Dashboard → Desktop Items tab
2. Click trash icon (red button)
3. Click "Save Desktop Items"
4. Refresh page

### Import backup fails

**Solution**:

1. Ensure JSON file is valid (check syntax)
2. File must be from Admin Dashboard export
3. Try individual exports instead of complete backup
4. Check browser console for specific error

---

## Quick Reference

### Common File Paths

- **Projects**: `data/projects.json`
- **Media**: `data/media.json`
- **Desktop Items**: `js/desktop.js` lines 10-45
- **Theme Colors**: `css/variables.css` lines 5-15
- **Wallpapers**: `js/desktop.js` lines 350-360
- **About Content**: `js/desktop.js` lines 400-430
- **Contact Form**: `js/desktop.js` lines 500-530
- **Resume**: `resume/resume.pdf`

### Related Documentation

| Document | Description |
|----------|-------------|
| [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) | No-code content editor (console-only) |
| [EASTER_EGGS_GUIDE.md](EASTER_EGGS_GUIDE.md) | All hidden easter eggs and secret interactions |
| [CHANGELOG.md](CHANGELOG.md) | Full version history from v1.0 to present |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture — all 44 modules, dependency graph, init sequence |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Terminology and codebase glossary |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | 50+ common issues and solutions |

### Browser Support

Chrome 61+ · Firefox 60+ · Safari 11+ · Edge 79+

### Development Commands

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run test      # Run 201 vitest tests
npm run lint      # ESLint
npm run format    # Prettier
```

---

**Need more help?** Check the [Troubleshooting](docs/TROUBLESHOOTING.md) guide or open a browser console and run `Admin.open()` for the visual editor.

**For development history**, see [CHANGELOG.md](CHANGELOG.md).
