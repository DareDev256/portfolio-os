# Next Steps for Portfolio OS

## 1. Media Vault Restoration (Priority)
High-quality media files were removed to enable GitHub hosting. We need to restore them using a web-optimized strategy:

### 📹 Videos
- **Strategy**: Host on YouTube (free, better streaming).
- **Action**: Upload videos to YouTube (Unlisted or Public).
- **Update**: Replace file paths in `data/media.json` with YouTube links.
    - *Example*: `"url": "https://www.youtube.com/watch?v=..."`

### 📸 Photos
- **Strategy**: Optimize locally and push to GitHub.
- **Problem**: Originals were Print Quality (80MB+).
- **Solution**:
    1. Export/Convert photos to **JPG** or **WebP**.
    2. Resize to max **2000px** width.
    3. Compress to **<2MB** each.
    4. Move back into `assets/media/glamour/`, `assets/media/cars/`, etc.
    5. Uncomment `assets/media/` in `.gitignore` (if we decide to track them again) OR just drag-and-drop the optimized assets folder into Vercel/Netlify for deployment.

## 2. Deployment & Domain
- [ ] **Deploy**: Connect GitHub repo to Vercel/Netlify.
- [ ] **Domain**: Purchase/configure `tdotssolutionsz.com` DNS records.
    - See `CONNECT_DOMAIN.md` for specific record values.

## 3. Applications
- [ ] **Links**: Add real links for "Audi Car Wash Tracker" and "Nin Wiki Tools" in `js/desktop.js` once they are deployed.
- [ ] **Connect Form**: Decide on backend (Formspree/EmailJS) or keep `mailto` fallback.
