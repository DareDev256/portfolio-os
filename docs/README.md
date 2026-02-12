# Passion OS Documentation Index

---

title: Documentation Index
version: 3.8.2
last_updated: 2026-02-12

---

<!-- AI Context: Central navigation hub for all Passion OS documentation.
     Purpose: Help users and AI find the right documentation quickly
     Entry point: Start here for documentation discovery -->

## Welcome to Passion OS Documentation

Complete documentation for **Passion OS v3.8.2** - a vanilla JavaScript portfolio operating system with cyberpunk aesthetics.

---

## Quick Start

**New to Passion OS?** Start here:

1. 📘 **[Main README](../README.md)** - Project overview and quick start
2. 📖 **[Documentation Guide](../DOCUMENTATION.md)** - Complete user guide
3. 🎨 **[Admin Dashboard Guide](../ADMIN_DASHBOARD_GUIDE.md)** - No-code content editor

**For developers:**

1. 🏗️ **[Architecture](ARCHITECTURE.md)** - System design and module structure
2. 📝 **[Changelog](../CHANGELOG.md)** - Development history
3. ✅ **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and debugging

---

## Documentation Structure

### Core Documentation (Root Level)

| Document                                                | Purpose                            | Audience          | Size       |
| ------------------------------------------------------- | ---------------------------------- | ----------------- | ---------- |
| [README.md](../README.md)                               | Project overview, quick start      | Everyone          | ~80 lines  |
| [DOCUMENTATION.md](../DOCUMENTATION.md)                 | Complete user guide, customization | Users, Developers | ~600 lines |
| [CHANGELOG.md](../CHANGELOG.md)                         | Development history, version notes | Developers, AI    | ~400 lines |
| [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) | Admin dashboard usage              | Users             | ~800 lines |

### Technical Documentation (docs/)

| Document                                 | Purpose                            | Audience          | Size       |
| ---------------------------------------- | ---------------------------------- | ----------------- | ---------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)       | System architecture, module design | Developers, AI    | ~300 lines |
| [GLOSSARY.md](GLOSSARY.md)               | Terminology reference              | Everyone          | ~150 lines |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues & solutions          | Users, Developers | ~500 lines |

### Archive (docs/archive/)

Old documentation preserved for reference. Not actively maintained.

---

## Documentation by Role

### I'm a User (Non-Developer)

**Getting started:**

1. [README.md](../README.md) - Understand what Passion OS is
2. [DOCUMENTATION.md](../DOCUMENTATION.md) § Quick Start - Set up and deploy
3. [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) - Customize your portfolio

**Customizing content:**

- [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Desktop Items - Add/edit icons
- [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Projects - Manage portfolio projects
- [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Media - Add photos/videos
- [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Theme - Customize colors/wallpaper

**Troubleshooting:**

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [GLOSSARY.md](GLOSSARY.md) - Understand terminology

---

### I'm a Developer

**Understanding the codebase:**

1. [README.md](../README.md) - Quick overview
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture, module dependencies
3. [CHANGELOG.md](../CHANGELOG.md) - See what's been implemented and how

**Working with the code:**

- [ARCHITECTURE.md](ARCHITECTURE.md) § Module Architecture - Understand 38 modules
- [ARCHITECTURE.md](ARCHITECTURE.md) § Data Flow - localStorage → State → UI
- [ARCHITECTURE.md](ARCHITECTURE.md) § Extension Points - How to add features
- [GLOSSARY.md](GLOSSARY.md) - Standardized terminology
- [DOCUMENTATION.md](../DOCUMENTATION.md) § Manual Code Editing - File-by-file guide

**Testing & debugging:**

- Run `npm run test` — 97 vitest tests across 8 suites
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Debugging guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) § Debugging Tools - Console commands

**Contributing:**

- [CHANGELOG.md](../CHANGELOG.md) - See development phases
- [ARCHITECTURE.md](ARCHITECTURE.md) § Extension Points - Add features correctly

---

### I'm an AI (Codex, Claude, Gemini, etc.)

**Parsing documentation:**

All documentation follows AI-friendly standards:

- ✅ YAML frontmatter with metadata (title, version, date, type)
- ✅ HTML comment AI context blocks (purpose, related files)
- ✅ File references with exact paths and line numbers
- ✅ Code examples with language tags
- ✅ Consistent heading hierarchy (H1 → H2 → H3)
- ✅ Cross-references with relative links

**Key files for context:**

| File                                     | Contains                              | Primary Use                      |
| ---------------------------------------- | ------------------------------------- | -------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)       | System design, module map, data flow  | Understand codebase structure    |
| [DOCUMENTATION.md](../DOCUMENTATION.md)  | Usage patterns, customization points  | Help users customize             |
| [CHANGELOG.md](../CHANGELOG.md)          | Implementation history, code changes  | See what exists and how it works |
| [GLOSSARY.md](GLOSSARY.md)               | Term definitions, file references     | Standardize vocabulary           |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common errors, solutions              | Debug issues                     |

**Code location index:**

- **Entry point**: `js/main.js`
- **State management**: `js/state.js`
- **Desktop logic**: `js/desktop.js` lines 10-45 (icons), 350-360 (wallpapers)
- **Window management**: `js/windows.js`
- **Routing**: `js/router.js`
- **Admin**: `js/admin.js`
- **Data**: `data/projects.json`, `data/media.json`

**Initialization order**: main.js → state.js → boot.js → login.js → desktop.js + windows.js + router.js

---

## Documentation by Task

### How do I...

#### ...set up Passion OS?

→ [README.md](../README.md) § Quick Start
→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Quick Start

#### ...add desktop icons?

→ [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Desktop Items Editor (easy)
→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Desktop Items (advanced)

#### ...add portfolio projects?

→ [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Projects Manager (easy)
→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Projects & Applications (advanced)

#### ...add photos or videos?

→ [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Media Manager (easy)
→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Media Library (advanced)

#### ...change colors or theme?

→ [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) § Theme Customizer (easy)
→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Themes & Wallpapers (advanced)

#### ...customize wallpapers?

→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Wallpapers & Cycling

#### ...upload my resume?

→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Resume Setup

#### ...deploy to production?

→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Deployment

#### ...understand the architecture?

→ [ARCHITECTURE.md](ARCHITECTURE.md) § System Overview
→ [ARCHITECTURE.md](ARCHITECTURE.md) § Module Architecture

#### ...add a new window/app?

→ [ARCHITECTURE.md](ARCHITECTURE.md) § Extension Points
→ [DOCUMENTATION.md](../DOCUMENTATION.md) § Manual Code Editing

#### ...add a new route?

→ [ARCHITECTURE.md](ARCHITECTURE.md) § Extension Points § Add a New Route

#### ...debug issues?

→ [TROUBLESHOOTING.md](TROUBLESHOOTING.md) § Quick Diagnostics
→ [TROUBLESHOOTING.md](TROUBLESHOOTING.md) § Debugging Tools

#### ...understand a term?

→ [GLOSSARY.md](GLOSSARY.md) (alphabetical reference)

#### ...see what's been implemented?

→ [CHANGELOG.md](../CHANGELOG.md) (reverse chronological)

#### ...run the tests?

→ `npm run test` — 97 vitest tests across 8 suites

---

## File Reference Map

### Project Structure

```
/Users/t./Documents/Website/
│
├── README.md                      # Project overview (80 lines)
├── DOCUMENTATION.md               # Complete user guide (600 lines)
├── CHANGELOG.md                   # Development history (400 lines)
├── ADMIN_DASHBOARD_GUIDE.md       # Admin usage (800 lines)
├── FEATURE_VERIFICATION.md        # Testing guide (400 lines)
│
├── docs/                          # Technical documentation
│   ├── README.md                 # This file (docs index)
│   ├── ARCHITECTURE.md           # System architecture (300 lines)
│   ├── GLOSSARY.md               # Terminology (150 lines)
│   ├── TROUBLESHOOTING.md        # Common issues (500 lines)
│   └── archive/                  # Old documentation (deprecated)
│
├── index.html                     # Main HTML entry point
│
├── js/                            # JavaScript modules (38 files)
│   ├── main.js                   # Entry point
│   ├── state.js                  # State management + CustomEvent bus
│   ├── desktop.js                # Desktop manager
│   ├── windows.js                # Window manager
│   ├── sanitize.js               # DOMPurify wrapper
│   ├── dom-helpers.js            # Shared DOM utilities
│   ├── interactions/             # 7 interaction sub-modules
│   └── ...                       # (See ARCHITECTURE.md for all 38)
│
├── css/                           # Stylesheets (18 files)
│   ├── variables.css             # Design tokens
│   ├── styles.css                # Core layout
│   ├── glass.css                 # Glassmorphism
│   └── ...                       # (See README.md for full tree)
│
├── tests/                         # 8 test suites, 97 tests
│   └── *.test.js                 # vitest + jsdom
│
├── data/                          # JSON data files
│   ├── projects.json             # Portfolio projects (optional)
│   └── media.json                # Photos/videos (optional)
│
└── assets/                        # Static assets
    ├── wallpapers/               # Background images
    ├── sounds/                   # Audio files
    └── resume/                   # PDF resume
```

---

## Reading Order

### For New Users

1. [README.md](../README.md) - Overview (5 min)
2. [DOCUMENTATION.md](../DOCUMENTATION.md) § Quick Start (10 min)
3. [ADMIN_DASHBOARD_GUIDE.md](../ADMIN_DASHBOARD_GUIDE.md) (30 min)
4. [DOCUMENTATION.md](../DOCUMENTATION.md) § Deployment (10 min)

**Total**: ~55 minutes to get started

---

### For Developers

1. [README.md](../README.md) - Overview (5 min)
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System design (30 min)
3. [CHANGELOG.md](../CHANGELOG.md) - Implementation history (20 min)
4. [DOCUMENTATION.md](../DOCUMENTATION.md) § Manual Code Editing (30 min)
5. [GLOSSARY.md](GLOSSARY.md) - Terminology (15 min)

**Total**: ~1 hour 40 minutes to understand codebase

---

### For AI Context Loading

**Recommended order for maximum understanding:**

1. [ARCHITECTURE.md](ARCHITECTURE.md) - System overview, module map (priority 1)
2. [GLOSSARY.md](GLOSSARY.md) - Terminology standardization (priority 1)
3. [CHANGELOG.md](../CHANGELOG.md) - What exists and how it was built (priority 2)
4. [DOCUMENTATION.md](../DOCUMENTATION.md) - Usage patterns (priority 2)
5. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues (priority 3)

**Token budget**: ~15,000 tokens for all core documentation

---

## Version Information

| Component     | Version | Last Updated |
| ------------- | ------- | ------------ |
| Passion OS    | 3.8.2   | Feb 2026     |
| Documentation | 3.8.2   | Feb 2026     |

---

## Documentation Standards

All Passion OS documentation follows these standards:

### 1. Frontmatter (YAML)

```yaml
---
title: Document Title
version: 3.8.2
last_updated: 2026-02-12
type: guide | reference | technical
---
```

### 2. AI Context Blocks

```html
<!-- AI Context: Brief description of document purpose
     Related files: Key files referenced in this doc
     Dependencies: What to read first -->
```

### 3. File References

```markdown
**File**: `js/desktop.js` lines 10-45
```

### 4. Code Examples

````markdown
```javascript
// Example code with language tag
const example = 'code';
```
````

### 5. Cross-References

```markdown
**Related**: [ARCHITECTURE.md](ARCHITECTURE.md) § Module Architecture
```

---

## Need Help?

### Documentation Issues

- **Missing information**: Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Unclear explanation**: Check [GLOSSARY.md](GLOSSARY.md) for term definitions
- **Need examples**: Check [DOCUMENTATION.md](../DOCUMENTATION.md) § Manual Code Editing

### Technical Issues

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) first
2. Try Safe Mode: `http://localhost:5173/?safe=1`
3. Check browser console for errors
4. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) § Getting Help

---

## Contributing to Documentation

When adding or updating documentation:

1. **Follow standards** - Use frontmatter, AI context blocks, file references
2. **Update this index** - Add new documents to appropriate sections
3. **Cross-reference** - Link to related documents
4. **Include examples** - Show code snippets with file paths
5. **Test links** - Verify all cross-references work

---

## Archive

Old documentation is preserved in `docs/archive/`:

- `CUSTOMIZATION_GUIDE.md` → Merged into DOCUMENTATION.md
- `IMPLEMENTATION_SUMMARY.md` → Merged into CHANGELOG.md
- `IMPLEMENTATION_SUMMARY_PHASE3.md` → Merged into CHANGELOG.md
- `assets/wallpapers/WALLPAPER_SETUP.md` → Merged into DOCUMENTATION.md
- `resume/PLACEHOLDER.md` → Deprecated

**Archive policy**: Files moved to archive are kept for reference but not actively maintained.

---

**Documentation Index Version**: 3.8.2

**Last Updated**: February 2026

**Total Documentation Files**: 7 core + 3 technical + 5 archived

---

<!-- AI Parsing Notes:
- Central navigation hub for all documentation
- Organized by role (User, Developer, AI)
- Organized by task ("How do I...")
- Reading order suggestions for different audiences
- File reference map for quick location lookup
- Documentation standards reference
-->
