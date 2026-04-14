#!/usr/bin/env python3
"""
Screenshot all live client & demo sites for the portfolio panel.
Saves thumbnails to public/thumbnails/ for use in SERVICES.exe.
"""

import os
import time
from playwright.sync_api import sync_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "thumbnails")

SITES = [
    # Client work
    ("edsonlegal", "https://www.edsonlegal.com/"),
    ("musthavefrenchies", "https://musthavefrenchies-site.vercel.app"),
    ("savv4x", "https://savv4x-website.vercel.app"),
    ("syreneffect", "https://syreneffect-site.vercel.app"),
    ("dancehallprincess", "https://dancehall-princess-canada.vercel.app"),
    # Industry demos
    ("demo-restaurant", "https://tdots-demo-restaurant.vercel.app"),
    ("demo-barbershop", "https://tdots-demo-barbershop.vercel.app"),
    ("demo-contractor", "https://tdots-demo-contractor.vercel.app"),
    ("demo-starter", "https://tdots-demo-starter.vercel.app"),
]

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Screenshotting {len(SITES)} sites → {OUTPUT_DIR}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=2,
        )
        page = context.new_page()

        for name, url in SITES:
            print(f"  {name} → {url}")
            try:
                page.goto(url, wait_until="networkidle", timeout=20000)
                time.sleep(1.5)
                # Dismiss any popups/modals
                page.evaluate("document.querySelectorAll('[class*=modal],[class*=popup],[class*=cookie],[class*=banner]').forEach(e => e.remove())")
                time.sleep(0.5)
                path = os.path.join(OUTPUT_DIR, f"{name}.png")
                page.screenshot(path=path, type="png")
                print(f"    ✓ saved")
            except Exception as e:
                print(f"    ✗ {e}")

        browser.close()

    print(f"\nDone — {len(os.listdir(OUTPUT_DIR))} thumbnails saved")

if __name__ == "__main__":
    main()
