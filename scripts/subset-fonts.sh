#!/bin/sh
# Writes public/fonts/<family>-latin-core-<weight>-normal.woff2: the Latin faces cut down to ASCII plus the few
# non-ASCII characters the copy uses (see CORE in app/globals.css). The full files stay for every other character,
# so nothing falls back to a system font; the core file is just what the first paint has to download (GP-406 perf).
# --glyph-names matters: without it (post table v3) Chrome rasterises the same outlines slightly differently.
# Needs fonttools + brotli: python3 -m venv /tmp/v && /tmp/v/bin/pip install fonttools brotli && PYFTSUBSET=/tmp/v/bin/pyftsubset sh scripts/subset-fonts.sh
set -e
cd "$(dirname "$0")/../public/fonts"
CORE="U+0020-007E,U+00A0,U+00A9,U+00AB,U+00B7,U+00BB,U+200E-200F,U+2011,U+2013-2014,U+2019,U+201C-201D,U+2022,U+2026,U+203A,U+2193"
for f in outfit-latin-300 outfit-latin-400 outfit-latin-600 outfit-latin-800 jetbrains-mono-latin-400 jetbrains-mono-latin-700 alexandria-latin-400 alexandria-latin-600; do
  out=$(echo "$f" | sed 's/-latin-/-latin-core-/')-normal.woff2
  "${PYFTSUBSET:-pyftsubset}" "$f-normal.woff2" --unicodes="$CORE" --layout-features='*' --glyph-names --flavor=woff2 --output-file="$out"
done
