# Passion OS v2.56

**A cyberpunk-inspired portfolio operating system built with vanilla JavaScript—no frameworks, no dependencies.**

Interactive desktop environment featuring draggable windows, smooth animations, visual effects, and complete content management.

---

## Features

### Core OS

- 🖥️ **Desktop Environment** - Icon-based launcher with context menus
- 🪟 **Window Manager** - Drag, resize, minimize, maximize with animations
- 🎨 **Visual Effects** - Particles, aurora, glyphs (toggle-able)
- 🌐 **Client-Side Routing** - Deep linkable URLs (`/about`, `/work`)
- 📱 **Mobile Responsive** - Auto-detects and adapts to mobile devices
- 🎯 **Command Palette** - Quick launcher (Cmd+K)

### Content

- 📸 **Photo Gallery** - Lightbox viewer with keyboard navigation
- 🎬 **Video Player** - MP4, YouTube, Vimeo embed support
- 💼 **Portfolio Projects** - Filterable showcase with tech tags
- 📄 **Resume Viewer** - PDF display
- 📧 **Contact Form** - EmailJS/Formspree integration
- 🎛️ **Admin Dashboard** - No-code content editor

### Technical

- 💾 **State Persistence** - localStorage-based settings
- 🎭 **Dark/Light Themes** - With wallpaper cycling
- ⌨️ **Keyboard Navigation** - Full accessibility support
- 🔊 **Sound Effects** - Toggle-able audio feedback
- 🔒 **Boot Sequence** - Authentic OS-style login flow

---

## Quick Start

### 1. Install & Run

```bash
# Clone repository
git clone https://github.com/yourusername/passion-os.git
cd passion-os

# Install dependencies (Vite dev server)
npm install

# Run dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### 2. Customize Content

**Easy Way** (No coding):

1. Click Settings → Content Editor
2. Use Admin Dashboard to manage icons, projects, media, themes
3. Export your data for backup

**Advanced Way** (Manual editing):

- See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed customization guide

---

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, animations, gradients
- **JavaScript (ES6)** - Modules, async/await
- **localStorage** - Client-side persistence
- **History API** - Client-side routing
- **Vite** - Development server (optional)

**Zero Dependencies** - 100% vanilla JavaScript, no frameworks.

---

## Documentation

| Document                                             | Purpose                             |
| ---------------------------------------------------- | ----------------------------------- |
| [DOCUMENTATION.md](DOCUMENTATION.md)                 | Complete user guide & customization |
| [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) | No-code content editor guide        |
| [CHANGELOG.md](CHANGELOG.md)                         | Development history & version notes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System architecture for developers  |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)   | Common issues & solutions           |
| [docs/GLOSSARY.md](docs/GLOSSARY.md)                 | Terminology reference               |
| [docs/README.md](docs/README.md)                     | Documentation index                 |

---

## Deployment

### GitHub Pages

```bash
git push origin main
# Enable Pages in repo Settings → Pages → Select branch
```

### Netlify/Vercel

1. Connect your GitHub repository
2. Deploy (no build command needed!)
3. Done ✅

### Traditional Hosting

Upload all files to your web server via FTP/SFTP.

---

## Browser Support

- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

Requires ES6 module support. No IE11.

---

## License

MIT License - Free to use for your own portfolio.

---

**Built with ❤️ using vanilla JavaScript**

No frameworks. No dependencies. Just web standards.
