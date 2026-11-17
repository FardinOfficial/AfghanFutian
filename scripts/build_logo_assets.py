#!/usr/bin/env python3
"""Build the site's logo assets from one source image.

    python3 scripts/build_logo_assets.py path/to/logo-source.png

The source is expected to be a square image of the brand mark on a plain white
ground — that is how the artwork is supplied. From it this script writes:

    public/favicon.png          512x512  square tile, mark filling 90% of the width
    public/logo-mark.png        192x128  navy #002060 on transparency
    public/logo-mark-light.png  192x128  canvas cream #F4F3EF on transparency

Three things it gets right that are easy to get wrong by hand:

  * **Cropping.** The supplied canvas is mostly margin — the ink is only about
    71% of the width and 47% of the height — so an uncropped favicon leaves the
    mark floating tiny inside the browser tab.
  * **Aspect.** The mark is 1.50:1. It is never squeezed into a square box;
    the favicon is a square *canvas* with the mark centred inside it.
  * **Transparency.** The white ground becomes alpha, so the mark sits on both
    the light and the ink sections. Anti-aliased edges keep their coverage.

Requires macOS `sips` (used only to decode the source), Python 3.8+, and no
third-party packages: the PNGs are written by a small encoder at the bottom of
this file.
"""
import argparse
import os
import struct
import subprocess
import sys
import tempfile
import zlib

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(REPO, 'public')

NAVY = (0x00, 0x20, 0x60)      # the artwork's own ink
CREAM = (0xF4, 0xF3, 0xEF)     # --color-canvas
WHITE_CUTOFF = 232             # >= this on every channel counts as ground
LUM_NAVY = (0.2126 * NAVY[0] + 0.7152 * NAVY[1] + 0.0722 * NAVY[2]) / 255.0
HEADROOM = 255.0 - LUM_NAVY * 255.0   # luminance distance from white to navy


# --------------------------------------------------------------------------- #
# Reading: decode anything sips understands, then walk it as top-down RGB.
# --------------------------------------------------------------------------- #
def load_rgb(path):
    bmp = os.path.join(tempfile.mkdtemp(), 'src.bmp')
    subprocess.run(['sips', '-s', 'format', 'bmp', path, '--out', bmp],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    data = open(bmp, 'rb').read()
    offset = struct.unpack_from('<I', data, 10)[0]
    width = struct.unpack_from('<i', data, 18)[0]
    height_raw = struct.unpack_from('<i', data, 22)[0]
    bpp = struct.unpack_from('<H', data, 28)[0]
    stride = ((width * bpp // 8 + 3) // 4) * 4
    step = bpp // 8
    height = abs(height_raw)
    bottom_up = height_raw > 0

    def px(x, y):
        x = 0 if x < 0 else (width - 1 if x >= width else x)
        y = 0 if y < 0 else (height - 1 if y >= height else y)
        row = (height - 1 - y) if bottom_up else y
        i = offset + row * stride + x * step
        return data[i + 2], data[i + 1], data[i]

    return width, height, px


# --------------------------------------------------------------------------- #
# Writing: minimal 8-bit RGBA PNG encoder.
# --------------------------------------------------------------------------- #
def write_png(path, width, height, rgba):
    def chunk(kind, payload):
        return (struct.pack('>I', len(payload)) + kind + payload +
                struct.pack('>I', zlib.crc32(kind + payload) & 0xffffffff))

    raw = bytearray()
    for y in range(height):
        raw.append(0)                       # filter type 0 (None)
        raw += rgba[y * width * 4:(y + 1) * width * 4]
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    blob = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
            chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as fh:
        fh.write(blob)


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #
def ink_box(px, width, height):
    """Bounding box of everything that is not white, plus a 2px guard so
    anti-aliased edges are not clipped."""
    min_x, min_y, max_x, max_y = width, height, -1, -1
    for y in range(height):
        for x in range(0, width, 2):
            r, g, b = px(x, y)
            if r > WHITE_CUTOFF and g > WHITE_CUTOFF and b > WHITE_CUTOFF:
                continue
            if x < min_x: min_x = x
            if y < min_y: min_y = y
            if x > max_x: max_x = x
            if y > max_y: max_y = y
    if max_x < 0:
        sys.exit('the source looks blank — is it really the logo artwork?')
    return (max(0, min_x - 2), max(0, min_y - 2),
            min(width, max_x + 3), min(height, max_y + 3))


def box_mean(px, x0, y0, x1, y1):
    """Mean colour of the source rectangle [x0,x1) x [y0,y1)."""
    ix0, iy0 = int(x0), int(y0)
    ix1 = max(ix0 + 1, int(x1 + 0.999))
    iy1 = max(iy0 + 1, int(y1 + 0.999))
    r = g = b = n = 0
    for y in range(iy0, iy1):
        for x in range(ix0, ix1):
            pr, pg, pb = px(x, y)
            r += pr
            g += pg
            b += pb
            n += 1
    return r / n, g / n, b / n


def render(px, box, out_w, out_h, colour, pad_x=0, pad_y=0):
    """Centre the ink box in an out_w x out_h canvas, scaled to fit, and paint
    it in one colour with coverage as alpha."""
    bx0, by0, bx1, by1 = box
    ink_w, ink_h = bx1 - bx0, by1 - by0
    avail_w, avail_h = out_w - 2 * pad_x, out_h - 2 * pad_y
    scale = min(avail_w / ink_w, avail_h / ink_h)
    draw_w, draw_h = ink_w * scale, ink_h * scale
    origin_x = pad_x + (avail_w - draw_w) / 2.0
    origin_y = pad_y + (avail_h - draw_h) / 2.0

    rgba = bytearray(out_w * out_h * 4)
    for oy in range(out_h):
        sy0 = by0 + (oy - origin_y) / scale
        if sy0 < by0 - 0.5 or sy0 > by1:
            continue
        for ox in range(out_w):
            sx0 = bx0 + (ox - origin_x) / scale
            if sx0 < bx0 - 0.5 or sx0 > bx1:
                continue
            r, g, b = box_mean(px, sx0, sy0, sx0 + 1 / scale, sy0 + 1 / scale)
            luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
            coverage = (255.0 - luminance) / HEADROOM
            coverage = 0.0 if coverage < 0 else (1.0 if coverage > 1 else coverage)
            if coverage <= 0.004:
                continue
            i = (oy * out_w + ox) * 4
            rgba[i] = colour[0]
            rgba[i + 1] = colour[1]
            rgba[i + 2] = colour[2]
            rgba[i + 3] = int(round(coverage * 255))
    return rgba


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('source', help='square source image of the mark on white')
    args = parser.parse_args()

    if not os.path.exists(args.source):
        sys.exit('no such file: %s' % args.source)

    width, height, px = load_rgb(args.source)
    box = ink_box(px, width, height)
    ink_w, ink_h = box[2] - box[0], box[3] - box[1]
    print('source %dx%d, ink %dx%d (aspect %.3f)' %
          (width, height, ink_w, ink_h, ink_w / ink_h))

    mark_w = 192
    mark_h = int(round(mark_w * ink_h / ink_w))
    for name, colour in (('logo-mark.png', NAVY),
                         ('logo-mark-light.png', CREAM)):
        rgba = render(px, box, mark_w, mark_h, colour)
        write_png(os.path.join(PUBLIC, name), mark_w, mark_h, rgba)
        print('  wrote %-22s %dx%d' % (name, mark_w, mark_h))

    tile = 512
    pad = int(round(tile * 0.05))
    rgba = render(px, box, tile, tile, NAVY, pad, pad)
    write_png(os.path.join(PUBLIC, 'favicon.png'), tile, tile, rgba)
    print('  wrote %-22s %dx%d' % ('favicon.png', tile, tile))


if __name__ == '__main__':
    main()
