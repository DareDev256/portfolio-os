"""blackcat_texture.py: Black Cat 4 soles for the anime Monarch's texture (4.73.0).

    python3 tools/studio/blackcat_texture.py <basecolor.png> <shoe-uv.json> <out.png>

shoe-uv.json lists the UV polygons of the faces skinned to the foot and toe bones
(build_monarch_anime.py --dump-shoe-uv=PATH writes it). Inside them, light low-saturation
texels (the white soles from the design sheet) become graphite and the rest of the shoe
darkens to near-black: the all-black Black Cat colourway. No logos are drawn.
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, uvjson, out = sys.argv[1:4]
d = json.load(open(uvjson))
W, H = d['size']
img = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
mask = Image.new('L', (W, H), 0)
draw = ImageDraw.Draw(mask)
for poly in d['polys']:
    draw.polygon([(u * W, (1 - v) * H) for u, v in poly], fill=255)
m = np.asarray(mask.filter(ImageFilter.MaxFilter(13))) > 0
rgb = img[..., :3]
light = m & (rgb.mean(axis=2) > 70) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 60)
img[light, :3] = (28, 28, 32)
rest = m & ~light
img[rest, :3] = rgb[rest] * 0.7
if not light.any():
    raise SystemExit('blackcat_texture: REFUSED: no light sole texels found inside the shoe UVs')
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save(out)
print(f'blackcat_texture: {int(light.sum())} sole texels to graphite, {int(rest.sum())} shoe texels darkened -> {out}')
