# Passion OS - Complete Documentation

---

title: Passion OS Documentation
version: 2.56
last_updated: 2025-11-27
modules: [desktop, windows, admin, routing, mobile]

---

<!-- AI Context: Complete customization and setup guide for Passion OS.
     Related files: js/desktop.js, data/projects.json, data/media.json
     Dependencies: Admin Dashboard (ADMIN_DASHBOARD_GUIDE.md) -->

## Table of Contents

1. [Quick Start](#quick-start)
2. [Customization Methods](#customization-methods)
3. [Desktop Items](#desktop-items)
4. [Projects & Applications](#projects--applications)
5. [Media Library](#media-library)
6. [Themes & Wallpapers](#themes--wallpapers)
7. [Resume Setup](#resume-setup)
8. [Contact Form](#contact-form)
9. [Manual Code Editing (Advanced)](#manual-code-editing-advanced)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

1. **Clone or download** this repository
2. **Open `index.html`** in a modern web browser
3. That's it! No build tools or installation required.

### Two Ways to Customize

#### Option A: Admin Dashboard (Recommended)

Visual interface for non-technical users:

1. Open Passion OS
2. Click **Settings** → **Content Editor**
3. Edit desktop items, projects, media, themes
4. Click **Save** and refresh page

👉 **See**: [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) for complete guide

#### Option B: Manual Editing (Advanced)

Direct code editing for developers:

- Edit `data/projects.json` for projects
- Edit `data/media.json` for images/videos
- Edit `js/desktop.js` for desktop items
- Edit `css/variables.css` for theme colors

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

```
/Users/t./Documents/Website/
├── index.html                 # Main HTML file
├── css/
│   ├── reset.css             # CSS reset
│   ├── variables.css         # CSS custom properties (theme colors)
│   ├── styles.css            # Main styles
│   ├── windows.css           # Window system styles
│   └── admin.css             # Admin dashboard styles
├── js/
│   ├── main.js               # Entry point
│   ├── state.js              # State management & localStorage
│   ├── windows.js            # Window manager
│   ├── desktop.js            # Desktop items & context menu
│   ├── admin.js              # Admin dashboard
│   ├── router.js             # Client-side routing
│   ├── mobile.js             # Mobile detection
│   ├── startmenu.js          # Start menu
│   ├── lightbox.js           # Photo/video lightbox
│   └── login.js              # Lock/login screens
├── data/
│   ├── projects.json         # Projects data
│   └── media.json            # Media library data
├── assets/
│   ├── wallpapers/           # Wallpaper images
│   └── media/                # Local images/videos
└── resume/
    └── resume.pdf            # Your resume
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

### GitHub Pages

1. Push to GitHub repository
2. Go to Settings → Pages
3. Select branch (usually `main`) and save
4. Site live at `https://username.github.io/repo-name`

### Netlify

1. Sign up at [netlify.com](https://www.netlify.com/)
2. Connect your GitHub repository
3. Deploy settings:
    - **Build command:** (leave empty)
    - **Publish directory:** (leave empty or `.`)
4. Click "Deploy"

### Vercel

1. Sign up at [vercel.com](https://vercel.com/)
2. Import repository
3. Deploy (no configuration needed)

### Traditional Hosting

Upload all files to your web server via FTP/SFTP.

**Important**: Ensure `index.html` is at the root.

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

- 🎛️ [Admin Dashboard Guide](ADMIN_DASHBOARD_GUIDE.md) - Visual content editor
- ✅ [Feature Verification](FEATURE_VERIFICATION.md) - Testing checklist
- 📜 [Changelog](CHANGELOG.md) - Development history
- 🏗️ [Architecture](docs/ARCHITECTURE.md) - System design
- 📖 [Glossary](docs/GLOSSARY.md) - Terminology reference
- 🔧 [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues

### Keyboard Shortcuts

- **Enter**: Activate focused element / Continue from lock screen
- **ESC**: Close active window, lightbox, or start menu
- **Arrow Keys**: Navigate in lightbox or start menu
- **Tab**: Navigate between interactive elements
- **Right-click**: Open context menu

### Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

Modern browsers with ES6+ support required.

---

**Need more help?** Check the [Admin Dashboard Guide](ADMIN_DASHBOARD_GUIDE.md) or [Troubleshooting](docs/TROUBLESHOOTING.md).

**For development history**, see [CHANGELOG.md](CHANGELOG.md).
