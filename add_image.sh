#!/usr/bin/env bash
# Usage: ./add_image.sh <filename> <short_title> [long_title]
#
#   filename    – image file already placed in images/
#   short_title – title shown on the unfocused thumbnail
#   long_title  – title shown in the lightbox (omit to use short_title for both)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GALLERY_JS="$SCRIPT_DIR/gallery.js"

usage() {
  echo "Usage: $0 <filename> <short_title> [long_title]"
  echo
  echo "  filename    – image file already placed in images/"
  echo "  short_title – title shown on the unfocused thumbnail"
  echo "  long_title  – title shown in the lightbox (omit to use short_title for both)"
  exit 1
}

[[ $# -ge 2 ]] || usage

FILENAME="$(basename "$1")"
SHORT="$2"
LONG="${3:-$2}"
IMG_PATH="$SCRIPT_DIR/images/$FILENAME"

[[ -f "$IMG_PATH" ]] || { echo "Error: images/$FILENAME not found"; exit 1; }

# ── Thumbnail (resized + compressed WebP, used in the grid) ───────────────────
THUMB_NAME="${FILENAME%.*}.webp"
THUMB_PATH="$SCRIPT_DIR/images/thumbs/$THUMB_NAME"
mkdir -p "$SCRIPT_DIR/images/thumbs"
if command -v magick &>/dev/null; then
  magick "$IMG_PATH" -resize '700x700>' -strip -quality 80 "$THUMB_PATH"
elif command -v convert &>/dev/null; then
  convert "$IMG_PATH" -resize '700x700>' -strip -quality 80 "$THUMB_PATH"
else
  echo "Warning: ImageMagick not found, skipping thumbnail generation (grid will use the full-size image)"
  THUMB_PATH=""
fi

# ── Dimensions ────────────────────────────────────────────────────────────────
if command -v identify &>/dev/null; then
  read -r W H <<< "$(identify -format "%w %h" "$IMG_PATH")"
elif command -v python3 &>/dev/null; then
  DIM_PY='
import sys, struct
path = sys.argv[1]
with open(path, "rb") as f:
    hdr = f.read(24)
if hdr[:8] == b"\x89PNG\r\n\x1a\n":
    w, h = struct.unpack(">II", hdr[16:24])
    print(w, h)
else:
    from PIL import Image
    img = Image.open(path)
    print(img.width, img.height)
'
  read -r W H <<< "$(python3 -c "$DIM_PY" "$IMG_PATH")"
else
  echo "Error: install ImageMagick or Python3+Pillow to read image dimensions"
  exit 1
fi

# ── Patch gallery.js ──────────────────────────────────────────────────────────
THUMB_REL=""
[[ -n "$THUMB_PATH" ]] && THUMB_REL="images/thumbs/$THUMB_NAME"

PATCH_PY='
import sys, json, re

js_path, filename, w, h, short, long_, thumb_rel = sys.argv[1:8]
src      = "images/" + filename
short_js = json.dumps(short)
long_js  = json.dumps(long_)
thumb_part = (", thumb: " + json.dumps(thumb_rel)) if thumb_rel else ""

if short == long_:
    entry = "  { src: " + json.dumps(src) + thumb_part + ", width: " + w + ", height: " + h + ", title: " + long_js + ", alt: " + short_js + " },"
else:
    entry = "  { src: " + json.dumps(src) + thumb_part + ", width: " + w + ", height: " + h + ", title: " + long_js + ", shortTitle: " + short_js + ", alt: " + short_js + " },"

content = open(js_path).read()
patched = re.sub(r"(\n\];)", "\n" + entry + r"\1", content, count=1)

if patched == content:
    sys.exit("Error: could not locate IMAGES array closing ]; in gallery.js")

open(js_path, "w").write(patched)
print("Added: " + entry.strip())
'

python3 -c "$PATCH_PY" "$GALLERY_JS" "$FILENAME" "$W" "$H" "$SHORT" "$LONG" "$THUMB_REL"
