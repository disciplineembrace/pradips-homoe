#!/usr/bin/env python3
"""Generate optimized logo variants from the uploaded source PNG."""
import os
from PIL import Image

SRC = '/home/z/my-project/upload/InShot_20260804_015215263.png'
OUT_DIR = '/home/z/my-project/public'

# Open source
src = Image.open(SRC).convert('RGBA')
print(f"Source: {src.size} {src.mode}")

# 1. Full logo - PNG, optimized (for header, login, etc.)
# Max 400x400, keep aspect ratio
logo = src.copy()
logo.thumbnail((400, 400), Image.LANCZOS)
logo.save(f'{OUT_DIR}/logo.png', 'PNG', optimize=True)
print(f"logo.png: {logo.size}")

# 2. Logo@2x for retina
logo2x = src.copy()
logo2x.thumbnail((800, 800), Image.LANCZOS)
logo2x.save(f'{OUT_DIR}/logo@2x.png', 'PNG', optimize=True)
print(f"logo@2x.png: {logo2x.size}")

# 3. Favicon 32x32
fav32 = src.copy()
fav32.thumbnail((32, 32), Image.LANCZOS)
fav32.save(f'{OUT_DIR}/favicon-32.png', 'PNG', optimize=True)
print(f"favicon-32.png: {fav32.size}")

# 4. Favicon 16x16
fav16 = src.copy()
fav16.thumbnail((16, 16), Image.LANCZOS)
fav16.save(f'{OUT_DIR}/favicon-16.png', 'PNG', optimize=True)
print(f"favicon-16.png: {fav16.size}")

# 5. Apple touch icon 180x180 (with white background - apple icons need solid bg)
apple = Image.new('RGBA', (180, 180), (255, 255, 255, 255))
apple_icon = src.copy()
apple_icon.thumbnail((180, 180), Image.LANCZOS)
# Center
offset = ((180 - apple_icon.width) // 2, (180 - apple_icon.height) // 2)
apple.paste(apple_icon, offset, apple_icon)
apple.convert('RGB').save(f'{OUT_DIR}/apple-touch-icon.png', 'PNG', optimize=True)
print(f"apple-touch-icon.png: {apple.size}")

# 6. Android PWA icon 192x192
pwa192 = src.copy()
pwa192.thumbnail((192, 192), Image.LANCZOS)
pwa192.save(f'{OUT_DIR}/icon-192.png', 'PNG', optimize=True)
print(f"icon-192.png: {pwa192.size}")

# 7. Android PWA icon 512x512
pwa512 = src.copy()
pwa512.thumbnail((512, 512), Image.LANCZOS)
pwa512.save(f'{OUT_DIR}/icon-512.png', 'PNG', optimize=True)
print(f"icon-512.png: {pwa512.size}")

# 8. Favicon ICO (multi-size)
fav_ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
fav_ico_imgs = []
for s in fav_ico_sizes:
    im = src.copy()
    im.thumbnail(s, Image.LANCZOS)
    fav_ico_imgs.append(im)
fav_ico_imgs[0].save(f'{OUT_DIR}/favicon.ico', format='ICO', sizes=fav_ico_sizes, append_images=fav_ico_imgs[1:])
print(f"favicon.ico: created with sizes {fav_ico_sizes}")

# 9. OG image 1200x630 (for social sharing)
og = Image.new('RGBA', (1200, 630), (23, 59, 45, 255))  # Deep green bg matching theme
og_icon = src.copy()
og_icon.thumbnail((400, 400), Image.LANCZOS)
# Center
ox = (1200 - og_icon.width) // 2
oy = (630 - og_icon.height) // 2
og.paste(og_icon, (ox, oy), og_icon)
og.convert('RGB').save(f'{OUT_DIR}/og-image.png', 'PNG', optimize=True)
print(f"og-image.png: {og.size}")

print("\n=== All logo variants generated ===")
# Print sizes
for f in sorted(os.listdir(OUT_DIR)):
    fp = f'{OUT_DIR}/{f}'
    if os.path.isfile(fp):
        sz = os.path.getsize(fp)
        print(f"  {f}: {sz/1024:.1f} KB")
