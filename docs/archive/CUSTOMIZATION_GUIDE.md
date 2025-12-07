# Quick Customization Guide

## 🆕 New Features (Just Implemented!)

### ✅ Photo Category Filters

Your photos now support categories! Filter by "Nature", "Landscapes", or any custom category.

**How to use:**

```javascript
// In js/desktop.js, openPhotos() function:
{ url: 'your-photo.jpg', caption: 'Description', category: 'Your Category' }
```

Categories are auto-detected and filter buttons are generated automatically!

### ✅ Multiple Wallpapers

Cycle through multiple wallpapers with right-click menu!

**How to add more:**

```javascript
// In js/desktop.js, WALLPAPERS array:
WALLPAPERS: [
    'assets/wallpapers/wallpaper1.jpg',
    'assets/wallpapers/wallpaper2.jpg',
    // Add as many as you want!
],
```

### ✅ YouTube/Vimeo Support

Videos now support YouTube, Vimeo, and MP4 all in one!

**How to add:**

```javascript
// YouTube
{ url: 'https://youtube.com/watch?v=VIDEO_ID', poster: '...', title: '...' }
// Vimeo
{ url: 'https://vimeo.com/123456', poster: '...', title: '...' }
// MP4 (still works)
{ url: 'your-video.mp4', poster: '...', title: '...' }
```

### ✅ Simplified Login

No more confusing password field! Just a clear "Continue" button.

**How to customize:**

```html
<!-- In index.html -->
<h1 class="login-username">Your Name</h1>
<p class="login-subtitle">Your Tagline</p>
```

---

## 🖼️ Creating Your Custom Collage Background

### Step 1: Open the Collage Generator

Open `tools/collage-generator.html` in your browser.

### Step 2: Upload Your Photos

- Click "Choose Files" and select 4-20 of your best photos
- Mix different styles: portraits, landscapes, close-ups, etc.
- The tool shows thumbnails of your uploaded images

### Step 3: Customize the Layout

Try different options:

**Layout Styles:**

- **Grid** - Clean, organized rows and columns
- **Mosaic** - Varied sizes, artistic arrangement
- **Diagonal** - Dynamic angular layout
- **Scattered** - Random, overlapping placement

**Settings:**

- **Columns** - How many images across (2-8)
- **Gap** - Space between images (0-50px)
- **Overlay Opacity** - Darkens image so icons are visible (0-70%)
- **Overlay Color** - Usually black, but try dark blue/purple!
- **Blur** - Softens background (0-20px)

### Step 4: Generate & Download

1. Click **"Generate Collage"** - adjusts in real-time!
2. Happy with it? Click **"Download Wallpaper"**
3. File saves as `portfolio-wallpaper.jpg`

### Step 5: Use Your Wallpaper

1. Move the downloaded file to `assets/wallpapers/`
2. Rename it to `default.jpg` (or keep the name and update the path)
3. If you kept the original name, edit `css/variables.css`:

```css
--wallpaper-url: url('../assets/wallpapers/portfolio-wallpaper.jpg');
```

4. Refresh your portfolio page!

---

## 📸 Adding Your Photography Work

### Local Hosting (Recommended for portfolios)

1. **Create the folder:**

    ```bash
    mkdir -p assets/photos
    ```

2. **Add your images** - name them descriptively:

    ```
    assets/photos/
    ├── sunset-california-2024.jpg
    ├── portrait-studio-work.jpg
    ├── wedding-ceremony.jpg
    ├── street-photography-nyc.jpg
    └── etc.
    ```

3. **Edit `js/desktop.js`** - Find the `openPhotos()` function (around line 181):

```javascript
openPhotos() {
    const photos = [
        {
            url: 'assets/photos/sunset-california-2024.jpg',
            caption: 'Golden Hour - California Coast, 2024'
        },
        {
            url: 'assets/photos/portrait-studio-work.jpg',
            caption: 'Studio Portrait Session'
        },
        {
            url: 'assets/photos/wedding-ceremony.jpg',
            caption: 'Wedding Photography - Brooklyn, NY'
        },
        {
            url: 'assets/photos/street-photography-nyc.jpg',
            caption: 'Street Life - NYC'
        },
        // Add as many as you want!
    ];

    const content = document.createElement('div');
    content.className = 'photos-grid';

    photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.innerHTML = `<img src="${photo.url}" alt="${photo.caption}" loading="lazy">`;
        item.onclick = () => Lightbox.open(photos, index, 'image');
        content.appendChild(item);
    });

    WindowManager.create({
        id: 'photos',
        title: 'Photos',
        icon: this.DESKTOP_ITEMS.find(i => i.id === 'photos').icon,
        content,
        width: 700,
        height: 500
    });
}
```

### Using Cloud Storage (Better for large galleries)

If you have many photos, use Cloudinary, ImgBB, or AWS S3:

```javascript
const photos = [
    {
        url: 'https://res.cloudinary.com/yourcloud/image/upload/v123/photo1.jpg',
        caption: 'Description',
    },
    // etc.
];
```

---

## 🎥 Adding Your Video Work

### Self-Hosted Videos

1. **Create the folder:**

    ```bash
    mkdir -p assets/videos
    ```

2. **Add your videos:**
    - MP4 format recommended (best browser support)
    - Also create poster images (thumbnails) for each video

    ```
    assets/videos/
    ├── commercial-reel-2024.mp4
    ├── commercial-reel-2024-poster.jpg
    ├── wedding-highlight.mp4
    ├── wedding-highlight-poster.jpg
    └── etc.
    ```

3. **Edit `js/desktop.js`** - Find `openVideos()` (around line 210):

```javascript
openVideos() {
    const videos = [
        {
            url: 'assets/videos/commercial-reel-2024.mp4',
            poster: 'assets/videos/commercial-reel-2024-poster.jpg',
            title: 'Commercial Reel 2024'
        },
        {
            url: 'assets/videos/wedding-highlight.mp4',
            poster: 'assets/videos/wedding-highlight-poster.jpg',
            title: 'Wedding Highlight - Smith Family'
        },
        {
            url: 'assets/videos/short-film.mp4',
            poster: 'assets/videos/short-film-poster.jpg',
            title: 'Short Film: "Reflections"'
        }
    ];

    // ... rest stays the same
}
```

### YouTube/Vimeo Embeds (Alternative)

If your videos are on YouTube/Vimeo, you can modify the lightbox to embed them. Let me know if you want this!

---

## 💻 Adding Your Apps/Projects

Simply edit `data/projects.json`:

```json
[
    {
        "title": "Fitness Tracker App",
        "description": "React Native mobile app for iOS and Android with 5,000+ active users. Features workout tracking, nutrition logging, and progress analytics.",
        "tech": ["React Native", "Firebase", "Redux", "Expo"],
        "tags": ["Mobile", "App"],
        "demo": "https://apps.apple.com/app/your-app",
        "repo": "https://github.com/yourusername/fitness-app"
    },
    {
        "title": "E-Commerce Platform",
        "description": "Full-stack online store with Stripe integration, inventory management, and admin dashboard.",
        "tech": ["React", "Node.js", "PostgreSQL", "Stripe"],
        "tags": ["Web", "Fullstack"],
        "demo": "https://demo.yourstore.com",
        "repo": "https://github.com/yourusername/ecommerce"
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

**Tags** automatically create filter buttons:

- Common: `"Web"`, `"Mobile"`, `"App"`, `"Fullstack"`, `"Frontend"`, `"Backend"`
- Custom: `"AI/ML"`, `"Design"`, `"Game"`, `"IoT"`, etc.

---

## 🎨 Pro Tips

### For Photography Portfolios:

1. **Optimize images** - Use tools like TinyPNG or ImageOptim
2. **Consistent sizing** - 1920px wide is good for full-screen
3. **WebP format** - Modern, smaller file size (change extensions in code)
4. **Categories** - Create separate windows for different types:
    ```javascript
    // Modify desktop.js to add "Wedding Photos", "Portraits", "Commercial" as separate icons
    ```

### For Video Work:

1. **Compress videos** - Use HandBrake or similar
2. **Create good posters** - First frame or custom thumbnail
3. **Consider Vimeo** - Better player, privacy options
4. **File size** - Keep under 50MB per video if self-hosting

### For Developers:

1. **Screenshot your apps** - Add to project descriptions
2. **Live demos** - Deploy to Netlify/Vercel
3. **Case studies** - Expand descriptions with problem/solution
4. **GitHub stats** - Add stars/forks if impressive

---

## 🚀 Quick Checklist

- [ ] Generate custom collage background
- [ ] Add your photos to `assets/photos/`
- [ ] Update photo gallery in `js/desktop.js`
- [ ] Add your videos to `assets/videos/`
- [ ] Update video gallery in `js/desktop.js`
- [ ] Edit `data/projects.json` with your apps
- [ ] Update About section with your bio
- [ ] Configure contact form with your email
- [ ] Add your resume PDF
- [ ] Test everything!
- [ ] Deploy to the web

Need help with any of these? Just ask!
