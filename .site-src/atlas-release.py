"""Append the Atlas release to an already-valid application artifact.

All compatibility behavior lives in source modules/fragments. This step deliberately
performs no literal search/replace against generated HTML.
"""
from pathlib import Path
import sys

ATLAS = Path(".site-src/atlas-experience.html")


def append_atlas(page: Path) -> None:
    if not page.is_file():
        raise FileNotFoundError(f"Atlas release target does not exist: {page}")
    atlas = ATLAS.read_text("utf-8")
    if not atlas.strip():
        raise RuntimeError("Atlas experience source is empty")
    with page.open("a", encoding="utf-8") as output:
        output.write(atlas)


if __name__ == "__main__":
    target = Path(sys.argv[1] if len(sys.argv) > 1 else "_site/app.html")
    try:
        append_atlas(target)
    except (OSError, RuntimeError) as error:
        raise SystemExit(str(error))
