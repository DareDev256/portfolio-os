# Admin Dashboard - Complete Usage Guide

## 🎛️ Overview

The Admin Dashboard is a comprehensive content management system built directly into Passion OS. Edit desktop icons, manage projects, organize media, customize themes, and export/import all your data - all without leaving the OS interface.

---

## 🚀 Quick Start

### Opening the Admin Dashboard

1. **From Desktop**: Open Settings → Content Editor
2. **From Start Menu**: Launch "Admin Dashboard"
3. **Via URL**: Navigate to `/settings` route (if routing is enabled)

The dashboard opens in a 900×700px window with 5 main tabs.

---

## 📑 Tab 1: Desktop Items

**Purpose**: Configure the icons that appear on your desktop

### Features

✅ **Add Icon**: Create new desktop shortcuts
✅ **Edit Icon**: Change label, emoji, color, and action
✅ **Delete Icon**: Remove unwanted icons
✅ **Reorder Icons**: Drag to rearrange (visual indicator)

### Fields

| Field      | Description                          | Example          |
| ---------- | ------------------------------------ | ---------------- |
| **ID**     | Unique identifier                    | `media-vault`    |
| **Label**  | Display text (uppercase recommended) | `MEDIA_VAULT`    |
| **Icon**   | Single emoji or 2-char symbol        | `📁`             |
| **Color**  | Hex color for glow effects           | `#00f0ff`        |
| **Action** | Function to call on click            | `openMediaVault` |

### Available Actions

- `openMediaVault` - Open Media Vault window
- `openApplications` - Open Applications/Projects window
- `openShell` - Open Terminal window
- `openAbout` - Open About window
- `openContact` - Open Contact form
- `openResume` - Open Resume/CV
- `openSettings` - Open Settings panel

### Workflow

1. Click **"Add Icon"** button
2. Fill in the form fields
3. Preview icon in the card header (shows emoji + color)
4. Click **"Save Desktop Items"**
5. **Refresh the page** to see changes on desktop

### Reset to Default

Click **"Reset to Default"** to restore original desktop icons (clears localStorage).

⚠️ **Warning**: This action cannot be undone.

---

## 📦 Tab 2: Projects

**Purpose**: Manage your portfolio projects displayed in the Applications window

### Features

✅ **Add Project**: Create new portfolio entries
✅ **Edit Project**: Update title, description, tech stack, tags
✅ **Delete Project**: Remove projects from portfolio
✅ **Filter by Tags**: Projects auto-filter in Applications window

### Fields

| Field              | Description                   | Format                       |
| ------------------ | ----------------------------- | ---------------------------- |
| **Title**          | Project name                  | `E-Commerce Platform`        |
| **Description**    | Brief summary (2-3 sentences) | `A full-stack...`            |
| **Technologies**   | Comma-separated tech list     | `React, Node.js, MongoDB`    |
| **Tags**           | Comma-separated categories    | `Web, Fullstack, E-Commerce` |
| **Demo URL**       | Live demo link (optional)     | `https://demo.example.com`   |
| **Repository URL** | GitHub/GitLab link (optional) | `https://github.com/...`     |

### Tag System

Tags enable filtering in the Applications window. Common tags:

- `Web`, `Mobile`, `Desktop`
- `Frontend`, `Backend`, `Fullstack`
- `AI/ML`, `DevOps`, `Security`
- `E-Commerce`, `SaaS`, `Social`

### Workflow

1. Click **"Add Project"** button
2. Fill in all fields (title required, others optional)
3. Tags appear as colored chips in card header
4. Click **"Save Projects"** to update localStorage
5. Open **Applications** window to preview instantly

### Export

Click **"Export projects.json"** to download a file:

- Save to `data/projects.json` for production deployment
- Backup before making major changes
- Share with other instances of Passion OS

---

## 🖼️ Tab 3: Media

**Purpose**: Organize images and videos for the Media Vault

### Features

✅ **Add Image**: Create image entries with captions
✅ **Add Video**: Add video URLs (YouTube, Vimeo, etc.)
✅ **Preview Thumbnails**: See image previews in admin
✅ **Categorize Media**: Group images by category

### Image Fields

| Field        | Description              | Example                   |
| ------------ | ------------------------ | ------------------------- |
| **URL/Path** | Relative or absolute URL | `assets/media/photo1.jpg` |
| **Category** | Grouping tag             | `Nature`, `Portraits`     |
| **Caption**  | Image description        | `Sunset in California`    |

### Video Fields

| Field          | Description               | Example                           |
| -------------- | ------------------------- | --------------------------------- |
| **Video URL**  | YouTube/Vimeo/direct link | `https://youtube.com/watch?v=...` |
| **Title**      | Video name                | `Project Demo`                    |
| **Poster URL** | Thumbnail image           | `assets/media/thumb.jpg`          |

### Supported Formats

**Images**: JPG, PNG, GIF, WebP, SVG
**Videos**: YouTube, Vimeo, direct MP4/WebM links

### Workflow - Images

1. Upload images to `assets/media/` folder (or use external URLs)
2. Click **"Add Image"** in admin
3. Enter image path: `assets/media/photo.jpg`
4. Add category and caption
5. Click **"Save Media"**
6. Open **Media Vault** to see images organized by category

### Workflow - Videos

1. Get YouTube/Vimeo URL
2. Click **"Add Video"** in admin
3. Paste video URL
4. Add title and optional poster image
5. Click **"Save Media"**
6. Videos appear in Media Vault with embedded players

### Export

Click **"Export media.json"** to download:

```json
{
    "images": [
        {
            "url": "assets/media/photo1.jpg",
            "caption": "Description",
            "category": "Nature"
        }
    ],
    "videos": [
        {
            "url": "https://youtube.com/...",
            "title": "My Video",
            "poster": "thumb.jpg"
        }
    ]
}
```

---

## 🎨 Tab 4: Theme

**Purpose**: Customize the visual appearance of Passion OS

### Color Palette

**5 Neon Colors** - The cyberpunk color scheme:

| Color            | Default   | Usage                           |
| ---------------- | --------- | ------------------------------- |
| **Neon Cyan**    | `#00f0ff` | Primary UI, borders, icons      |
| **Neon Magenta** | `#ff00aa` | Projects, secondary accents     |
| **Neon Green**   | `#00ff88` | Success states, active elements |
| **Neon Purple**  | `#aa00ff` | Tertiary accents                |
| **Neon Orange**  | `#ffaa00` | Warnings, highlights            |

### How to Change Colors

1. Click any color picker
2. Choose new color (hex value updates automatically)
3. Click **"Apply Colors"**
4. Colors update **immediately** across entire OS
5. Changes persist in localStorage

### Reset Colors

Click **"Reset to Default"** and refresh to restore original cyberpunk palette.

### Wallpaper Controls

**Current Wallpaper Preview**: Shows active background in 150px preview box

**Actions**:

- **Next Wallpaper**: Cycle through preset wallpapers
- **Random**: Jump to random wallpaper

Wallpapers cycle through:

1. Hexagon Grid Pattern
2. Circuit Board
3. Neon City
4. Matrix Code
5. Cyberpunk Skyline

### Visual Effects

Toggle effects on/off instantly:

| Effect               | Description          | Performance Impact |
| -------------------- | -------------------- | ------------------ |
| **Particle Effects** | Floating particles   | Medium             |
| **Aurora Fog**       | Animated fog overlay | Low                |
| **Hologram Ring**    | Rotating glyph ring  | Medium             |
| **UI Sounds**        | Click/hover sounds   | None               |

Disable effects for better performance on older devices.

---

## 💾 Tab 5: Import / Export

**Purpose**: Backup, restore, and manage all your data

### Export All Data

**What's Included**:

- Desktop items
- Projects
- Media (images + videos)
- Theme colors
- Visual effects settings
- Current wallpaper

**How to Export**:

1. Click **"Export Complete Backup"**
2. File downloads: `passion-os-backup-2025-11-27.json`
3. Store safely for disaster recovery

**Backup Format**:

```json
{
  "version": "1.0",
  "timestamp": "2025-11-27T00:00:00.000Z",
  "desktopItems": [...],
  "projects": [...],
  "media": {...},
  "theme": {...}
}
```

### Import Data

**Restore from Backup**:

1. Click **"Import Backup File"**
2. Select your `.json` backup file
3. Confirms before overwriting current data
4. Click **OK** to proceed
5. **Refresh page** to see restored content

⚠️ **Warning**: Import overwrites ALL current data. Export first to avoid data loss.

### Export Individual Files

Need just one data type? Export separately:

- **Export Desktop Items** → `desktop-items.json`
- **Export Projects** → `projects.json`
- **Export Media** → `media.json`

Use these to:

- Replace files in `data/` folder for production
- Share specific content with collaborators
- Version control individual data sets

### Danger Zone

**Clear All Data**:

- Deletes everything from localStorage
- Resets to factory defaults
- Requires **two confirmations**
- **Cannot be undone** - export first!

---

## 🔄 Data Flow & Persistence

### How Data is Stored

```
localStorage (Browser)
├── desktopItems       → Desktop icon configuration
├── projects.json      → Portfolio projects array
├── media.json         → Images and videos object
└── themeColors        → Custom color palette
```

### Priority Order

1. **localStorage** (user edits) - highest priority
2. **data/projects.json** (default) - fallback
3. **data/media.json** (default) - fallback
4. **Hard-coded defaults** - last resort

### Production Workflow

**For Live Deployment**:

1. Edit content in Admin Dashboard
2. Click **"Export"** for each data type
3. Replace files in `data/` folder:
    - `data/projects.json`
    - `data/media.json`
4. Commit to Git and deploy
5. Users see new content without localStorage

**For Local Development**:

Just save in Admin Dashboard - changes persist in localStorage automatically.

---

## 🎯 Common Workflows

### Workflow 1: Adding a New Project

```
1. Open Admin Dashboard
2. Go to "Projects" tab
3. Click "Add Project"
4. Fill in:
   - Title: "My Awesome App"
   - Description: "A cool app that does X"
   - Technologies: "React, Firebase, Tailwind"
   - Tags: "Web, Frontend"
   - Demo: "https://myapp.com"
   - Repo: "https://github.com/me/myapp"
5. Click "Save Projects"
6. Open Applications window
7. Filter by "Web" tag
8. See your new project!
```

### Workflow 2: Customizing Theme Colors

```
1. Open Admin Dashboard
2. Go to "Theme" tab
3. Change "Neon Cyan" to #00ffcc
4. Change "Neon Magenta" to #ff0055
5. Click "Apply Colors"
6. See instant preview across OS
7. Changes saved automatically
```

### Workflow 3: Creating Complete Backup

```
1. Open Admin Dashboard
2. Go to "Import/Export" tab
3. Click "Export Complete Backup"
4. File downloads to ~/Downloads/
5. Upload to cloud storage
6. Safe to experiment - can restore anytime!
```

### Workflow 4: Migrating to Production

```
# Local development
1. Edit content in Admin Dashboard
2. Export projects.json
3. Export media.json
4. Export desktop-items.json (if customized)

# Production deployment
5. Replace data/projects.json with export
6. Replace data/media.json with export
7. git add data/
8. git commit -m "Update portfolio content"
9. git push
10. Deploy to hosting (Vercel/Netlify/etc.)
```

---

## 🎨 UI/UX Features

### Tabbed Interface

- **5 Tabs**: Desktop Items, Projects, Media, Theme, Import/Export
- **Active Indicator**: Cyan underline + glow
- **Keyboard Nav**: Tab/Shift+Tab to switch tabs
- **Smooth Transitions**: 200ms fade between sections

### Card System

- **Collapsible Cards**: Each item in its own card
- **Hover Effects**: Cyan border glow on hover
- **Delete Confirmation**: Red trash icon with hover state
- **Drag Handles**: ⋮⋮ icon for future drag-reorder

### Form Validation

- **Required Fields**: Title for projects (others optional)
- **URL Validation**: Demo/Repo fields validate URL format
- **Color Pickers**: Native HTML5 color input
- **Live Preview**: Icon colors/emojis preview instantly

### Responsive Design

- **Desktop**: 900×700px window, 2-column grids
- **Mobile**: Single column, touch-friendly buttons
- **Tablet**: Adaptive grid (switches at 768px)

---

## 🐛 Troubleshooting

### Problem: Changes don't appear on desktop

**Solution**:

- Click "Save Desktop Items"
- **Refresh the entire page** (Ctrl+R / Cmd+R)
- Desktop items only reload on page refresh

### Problem: Projects don't show in Applications

**Solution**:

1. Ensure project has a **title** (required field)
2. Click "Save Projects"
3. Close Applications window
4. Re-open Applications
5. Check tag filters (click "All" to see everything)

### Problem: Media images don't load

**Solution**:

- Check URL/path is correct (case-sensitive)
- For local files, ensure they're in `assets/media/`
- For external URLs, check CORS permissions
- Use browser DevTools → Network tab to debug

### Problem: Theme colors reset on refresh

**Solution**:

- Click "Apply Colors" after changing
- Check browser localStorage isn't cleared
- Try incognito/private mode to test
- localStorage survives normal refreshes

### Problem: Import fails with error

**Solution**:

- Ensure JSON file is valid (check syntax)
- File must be from Admin Dashboard export
- Check file isn't corrupted
- Try exporting fresh backup and re-importing

### Problem: Can't delete desktop item

**Solution**:

- Click the trash icon (🗑️ red button)
- Item removes from list immediately
- Click "Save Desktop Items" to persist
- Refresh page to see on desktop

---

## 💡 Pro Tips

### Tip 1: Use Keyboard Shortcuts

- **Cmd/Ctrl + S**: Save current tab (browser default)
- **Tab**: Navigate between form fields
- **Enter**: Submit forms
- **ESC**: Close admin window

### Tip 2: Organize with Tags

Projects support multiple tags for powerful filtering:

```
Tags: "Web, Frontend, React, E-Commerce, Featured"
```

Users can filter by any tag in Applications window.

### Tip 3: Color Consistency

Use color picker to extract hex codes from your brand:

1. Upload logo to media
2. Use browser color picker extension
3. Copy hex codes
4. Apply to theme
5. Maintain consistent brand colors!

### Tip 4: Backup Before Experiments

Always export before trying risky changes:

```
1. Export Complete Backup
2. Make experimental changes
3. If you like it: keep it
4. If not: Import backup to restore
```

### Tip 5: Version Control Your Data

Track content changes over time:

```bash
# In your project repo
git add data/projects.json
git add data/media.json
git commit -m "Add new portfolio project"
git push
```

### Tip 6: Test on Mobile

After editing:

1. Open mobile view (DevTools)
2. Check icon sizes
3. Verify text readability
4. Test touch targets (buttons)

---

## 📊 Data Limits

| Item             | Recommended Limit | Hard Limit                  |
| ---------------- | ----------------- | --------------------------- |
| Desktop Icons    | 8-12 items        | None (performance degrades) |
| Projects         | 20-50 projects    | 1000 (localStorage ~5MB)    |
| Images           | 50-100 images     | 500 (performance)           |
| Videos           | 10-20 videos      | 100 (UX)                    |
| Backup File Size | <1MB              | 5MB (localStorage limit)    |

### localStorage Limits

- Most browsers: **5-10MB** per domain
- Exceeding limit causes quota errors
- Solution: Use fewer images or external hosting

---

## 🚀 Advanced Usage

### Custom Actions for Desktop Items

Want a custom action? Edit `js/desktop.js`:

```javascript
// Add this function
openCustomWindow() {
    WindowManager.create({
        id: 'custom',
        title: 'My Custom Window',
        content: document.createElement('div'),
        width: 600,
        height: 400
    });
}
```

Then select `openCustomWindow` in Admin Dashboard action dropdown.

### Bulk Import Projects from JSON

Have 50 projects in a JSON file? Import programmatically:

```javascript
// In browser console
const projects = await fetch('/my-projects.json').then((r) => r.json());
localStorage.setItem('projects.json', JSON.stringify(projects));
location.reload();
```

### Sync Across Devices

Export on Device A:

1. Export Complete Backup
2. Upload to cloud (Dropbox, Drive)

Import on Device B:

1. Download from cloud
2. Import Backup File
3. Refresh page

---

## 🔐 Security & Privacy

### Data Storage

- **All data stored in browser localStorage**
- **Never sent to external servers**
- **Completely offline-capable**
- **Cleared on browser cache clear**

### Best Practices

✅ **DO**:

- Export backups regularly
- Store backups in secure cloud storage
- Use version control for data files
- Test imports on staging environment

❌ **DON'T**:

- Store sensitive data in localStorage
- Share backup files publicly
- Include API keys or passwords
- Rely solely on localStorage (no backup = data loss)

---

## 📱 Keyboard Shortcuts (Future)

Planned keyboard shortcuts:

- `Cmd+N`: New project/item
- `Cmd+S`: Save current tab
- `Cmd+E`: Export current tab
- `Cmd+I`: Import data
- `Cmd+Z`: Undo last change
- `Cmd+/`: Search/filter

---

## 🎓 Best Practices

### Content Guidelines

**Desktop Icons**:

- Use UPPERCASE_LABELS for consistency
- Pick distinct emojis (avoid repeats)
- Choose contrasting colors
- Limit to 8-12 icons for clean UI

**Projects**:

- Write concise descriptions (2-3 sentences)
- List 3-5 key technologies
- Use 2-4 relevant tags
- Always include demo OR repo link

**Media**:

- Optimize images (<500KB each)
- Use consistent aspect ratios
- Add descriptive captions
- Organize with category tags

**Theme**:

- Maintain color contrast (accessibility)
- Test colors on both dark/light backgrounds
- Use color psychology (cyan = tech, magenta = creative)
- Backup theme before experimenting

---

## 📞 Support & Resources

### Related Documentation

For more detailed information, see:

| Document                                                                                | Purpose                              |
| --------------------------------------------------------------------------------------- | ------------------------------------ |
| [README.md](README.md)                                                                  | Project overview & quick start       |
| [DOCUMENTATION.md](DOCUMENTATION.md)                                                    | Complete user guide & customization  |
| [DOCUMENTATION.md § Manual Code Editing](DOCUMENTATION.md#manual-code-editing-advanced) | File-by-file editing reference       |
| [CHANGELOG.md](CHANGELOG.md)                                                            | Development history & version notes  |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                            | System architecture (for developers) |
| [docs/GLOSSARY.md](docs/GLOSSARY.md)                                                    | Terminology reference                |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)                                      | Common issues & solutions            |
| [FEATURE_VERIFICATION.md](FEATURE_VERIFICATION.md)                                      | Testing checklist                    |

**Advanced Customization**: See [DOCUMENTATION.md § Manual Code Editing](DOCUMENTATION.md#manual-code-editing-advanced) for direct file editing without using the Admin Dashboard.

**Troubleshooting**: If Admin Dashboard features aren't working, see [docs/TROUBLESHOOTING.md § Admin Dashboard Issues](docs/TROUBLESHOOTING.md#admin-dashboard-issues).

**Terminology**: Confused by a term? Check [docs/GLOSSARY.md](docs/GLOSSARY.md) for definitions.

### Getting Help

**Issue Tracker**: https://github.com/anthropics/claude-code/issues
**Discussions**: Use GitHub Discussions for questions

### Quick Reference

**File Locations**:

- Admin code: `js/admin.js`
- Admin styles: `css/admin.css`
- Projects data: `data/projects.json` or `localStorage['projects.json']`
- Media data: `data/media.json` or `localStorage['media.json']`
- Desktop items: `js/desktop.js` lines 10-45 or `localStorage.desktopItems`

**See also**: [docs/ARCHITECTURE.md § File Organization](docs/ARCHITECTURE.md#file-organization) for complete project structure.

---

## ✨ What's Next

### Planned Features

- [ ] Drag-and-drop reordering (desktop items)
- [ ] Image upload via file picker
- [ ] Live preview without refresh
- [ ] Undo/redo system
- [ ] Keyboard shortcuts
- [ ] Search/filter in admin
- [ ] Batch operations
- [ ] Export to CSV/Excel
- [ ] Import from Notion/Airtable

---

**Status**: ✅ Admin Dashboard v1.0 Complete

Open the dashboard from **Settings → Content Editor** and start customizing your Passion OS!
