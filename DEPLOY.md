# Deploying Portfolio OS

Your Portfolio OS is a static web application (HTML, CSS, JS), which makes it incredibly easy and free to deploy.

## Option 1: Netlify Drop (Easiest & Fastest)
**Perfect for "tonight" deployment.**

1.  **Build**: You don't need a build step. Your project is ready as-is.
2.  **Go to Netlify**: Visit [app.netlify.com/drop](https://app.netlify.com/drop).
3.  **Drag & Drop**: Drag your entire project folder (`/Users/t./Documents/Website`) onto the target area.
4.  **Done**: Netlify will upload and give you a live URL (e.g., `https://your-site.netlify.app`) in seconds.
5.  **Note**: This is a **manual snapshot**. It does *not* auto-update. To update, you must drag and drop the folder again.

## Option 1.5: Netlify + GitHub (Auto-Updates)
**Recommended for continuous development.**

1.  Push your code to GitHub.
2.  Log in to Netlify and click "Add new site" > "Import from an existing project".
3.  Connect to GitHub and select your repository.
4.  **Done**: Now, every time you save and push code to GitHub, Netlify will **automatically redeploy** your site.

## Option 2: Vercel CLI
**Better for long-term updates.**

1.  **Install CLI**: Run `npm i -g vercel` in your terminal.
2.  **Deploy**: Run `vercel` in your project folder.
    *   Follow the prompts (accept defaults).
3.  **Done**: You'll get a production URL.

## Option 3: GitHub Pages
1.  **Push**: Push your code to a GitHub repository.
2.  **Settings**: Go to Repo Settings > Pages.
3.  **Source**: Select `main` branch and `/` root.
4.  **Save**: Your site will be live at `https://username.github.io/repo-name`.

## Post-Deployment Checklist
- [ ] **Test Audio**: Browsers block auto-playing audio. Users must interact with the page first (click "INITIALIZE") for the startup sound to play.
- [ ] **Test Videos**: Ensure your local video files (`assets/media/...`) were uploaded correctly.
- [ ] **Custom Domain**: Update your DNS settings (A record / CNAME) to point to your host.
