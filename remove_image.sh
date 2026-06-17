#!/usr/bin/env bash
# Usage: ./remove_image.sh <filename>
#
#   filename – image to remove from the gallery (the file itself is kept)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GALLERY_JS="$SCRIPT_DIR/gallery.js"

usage() {
  echo "Usage: $0 <filename>"
  echo
  echo "  filename – image to remove from the gallery (the file itself is kept)"
  exit 1
}

[[ $# -ge 1 ]] || usage

FILENAME="$(basename "$1")"

PATCH_PY='
import sys, re

js_path, filename = sys.argv[1], sys.argv[2]

# match any IMAGES entry line that references this file (single or double quoted)
pattern = r"\n  \{[^\n]*" + re.escape("images/" + filename) + r"[^\n]*\},"
content = open(js_path).read()
patched = re.sub(pattern, "", content)

if patched == content:
    sys.exit("Error: images/" + filename + " not found in gallery.js")

open(js_path, "w").write(patched)
print("Removed: images/" + filename)
'

python3 -c "$PATCH_PY" "$GALLERY_JS" "$FILENAME"
