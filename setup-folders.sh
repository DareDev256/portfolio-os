#!/bin/bash

# Portfolio OS - Folder Setup Script
# This creates all necessary folders for your content

echo "🚀 Setting up Portfolio OS folders..."

# Create directory structure
mkdir -p assets/photos
mkdir -p assets/videos
mkdir -p assets/wallpapers
mkdir -p resume
mkdir -p data
mkdir -p tools

echo "✅ Created folders:"
echo "   - assets/photos/     (add your photography work here)"
echo "   - assets/videos/     (add your video files and posters here)"
echo "   - assets/wallpapers/ (add your wallpaper images here)"
echo "   - resume/            (add resume.pdf here)"
echo ""
echo "📝 Next steps:"
echo "   1. Open tools/collage-generator.html to create your background"
echo "   2. Add your photos to assets/photos/"
echo "   3. Add your videos to assets/videos/"
echo "   4. Edit data/projects.json with your projects"
echo "   5. Edit js/desktop.js to link your photos and videos"
echo ""
echo "📖 See CUSTOMIZATION_GUIDE.md for detailed instructions!"
echo ""
echo "✨ Setup complete! Have fun building your portfolio!"
