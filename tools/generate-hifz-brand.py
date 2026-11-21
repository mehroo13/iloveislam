#!/usr/bin/env python3
"""Generate the Hifz brand assets (rebrand 2026-11-21).

Mark: emerald rounded square, gold eight-point star, white open book.
Renders every icon the site wires up: favicon.ico/.png, apple-touch-icon,
PWA 192/512, logo.png/logo2.png, og-image.png, and the /optimized/*.webp
copies. Run: python3 tools/generate-hifz-brand.py
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
OPT = os.path.join(PUBLIC, "optimized")
EMERALD = (11, 61, 46, 255)
EMERALD_DARK = (7, 45, 34, 255)
GOLD = (201, 162, 39, 255)
GOLD_LIGHT = (231, 217, 168, 255)
WHITE = (255, 255, 255, 255)

DEJAVU_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def star_points(cx, cy, r_outer, r_inner, points=8, rot=-math.pi / 2):
    pts = []
    for i in range(points * 2):
        r = r_outer if i % 2 == 0 else r_inner
        a = rot + i * math.pi / points
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def draw_mark(draw, size):
    """Draw the Hifz mark centred in a `size` x `size` image. Returns nothing."""
    s = size / 512.0
    # Emerald rounded square background
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(112 * s), fill=EMERALD)
    # Gold eight-point star, centred slightly above middle
    draw.polygon(star_points(size * 0.5, size * 0.46, 200 * s, 82 * s), fill=GOLD)
    # White open book, lower half
    book = [
        (126 * s, 296 * s), (256 * s, 336 * s), (386 * s, 296 * s),
        (386 * s, 396 * s), (256 * s, 436 * s), (126 * s, 396 * s),
    ]
    draw.polygon(book, fill=WHITE)
    # Spine + page lines in emerald
    draw.line([(256 * s, 336 * s), (256 * s, 436 * s)], fill=EMERALD, width=max(2, int(9 * s)))
    draw.line([(150 * s, 322 * s), (232 * s, 352 * s)], fill=(11, 61, 46, 90), width=max(2, int(5 * s)))
    draw.line([(280 * s, 352 * s), (362 * s, 322 * s)], fill=(11, 61, 46, 90), width=max(2, int(5 * s)))


def make_icon(size, path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(img), size)
    img.save(path)
    print("wrote", path)


def make_og():
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), EMERALD_DARK)
    d = ImageDraw.Draw(img, "RGBA")
    # Large faint gold star at right — drawn on its own layer so the
    # alpha actually blends (ImageDraw on the base image ignores it).
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(overlay).polygon(star_points(1060, 315, 270, 112), fill=(201, 162, 39, 26))
    img = Image.alpha_composite(img, overlay)
    d = ImageDraw.Draw(img, "RGBA")
    # Small mark at left
    mark = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark), 180)
    img.paste(mark, (64, 96), mark)
    f_title = ImageFont.truetype(DEJAVU_BOLD, 132)
    f_tag = ImageFont.truetype(DEJAVU_BOLD, 46)
    f_sub = ImageFont.truetype(DEJAVU, 30)
    d.text((280, 118), "Hifz", font=f_title, fill=WHITE)
    d.text((66, 330), "Memorise the Quran with AI", font=f_tag, fill=GOLD_LIGHT)
    d.text((66, 410), "Recite aloud. Get instant word-by-word feedback. Free, no sign-up.", font=f_sub, fill=(255, 255, 255, 180))
    img.convert("RGB").save(os.path.join(PUBLIC, "og-image.png"))
    img.convert("RGB").save(os.path.join(OPT, "og-image.webp"), "WEBP", quality=85)
    print("wrote og-image.png + og-image.webp")


def main():
    os.makedirs(OPT, exist_ok=True)
    # Master logo SVG — star points computed by the same function as the
    # raster mark, so SVG and PNG agree.
    star = " ".join(f"{x:.1f},{y:.1f}" for x, y in star_points(256, 236, 200, 82))
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Hifz logo">
  <rect width="512" height="512" rx="112" fill="#0B3D2E"/>
  <polygon fill="#C9A227" points="{star}"/>
  <polygon fill="#FFFFFF" points="126,296 256,336 386,296 386,396 256,436 126,396"/>
  <line x1="256" y1="336" x2="256" y2="436" stroke="#0B3D2E" stroke-width="9"/>
</svg>
"""
    with open(os.path.join(PUBLIC, "logo.svg"), "w") as f:
        f.write(svg)
    print("wrote public/logo.svg")

    make_icon(512, os.path.join(PUBLIC, "logo.png"))
    make_icon(512, os.path.join(PUBLIC, "logo2.png"))
    make_icon(512, os.path.join(PUBLIC, "icon-512.png"))
    make_icon(192, os.path.join(PUBLIC, "icon-192.png"))
    make_icon(180, os.path.join(PUBLIC, "apple-touch-icon.png"))
    make_icon(32, os.path.join(PUBLIC, "favicon.png"))

    # ICO (16/32/48) from the 512 master
    master = Image.open(os.path.join(PUBLIC, "icon-512.png"))
    ico_path = os.path.join(PUBLIC, "favicon.ico")
    master.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    master.save(os.path.join(ROOT, "app", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("wrote favicon.ico (public + app)")

    # WebP copies for /optimized
    for name, size in [("logo", 512), ("logo2", 512), ("icon-512", 512),
                       ("icon-192", 192), ("apple-touch-icon", 180), ("favicon", 32)]:
        src = os.path.join(PUBLIC, f"{name}.png")
        Image.open(src).convert("RGB").save(os.path.join(OPT, f"{name}.webp"), "WEBP", quality=90)
        print("wrote optimized/%s.webp" % name)

    make_og()


if __name__ == "__main__":
    main()
