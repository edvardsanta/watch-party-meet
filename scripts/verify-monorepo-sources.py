#!/usr/bin/env python3
"""Verify the imported source snapshots against their recorded content hashes."""

import hashlib
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]


def tree_digest(directory):
    """Hash relative paths, file kind, executable bit and content deterministically."""
    digest = hashlib.sha256()
    count = 0
    for path in sorted(directory.rglob("*")):
        if path.is_symlink():
            kind, content = "symlink", str(path.readlink()).encode()
        elif path.is_file():
            kind = "executable" if path.stat().st_mode & 0o111 else "file"
            content = path.read_bytes()
        else:
            continue
        record = [path.relative_to(directory).as_posix(), kind,
                  hashlib.sha256(content).hexdigest()]
        digest.update(json.dumps(record, separators=(",", ":")).encode() + b"\n")
        count += 1
    return digest.hexdigest(), count


def main():
    manifest = json.loads((ROOT / "components/sources.lock.json").read_text())
    failed = False
    for source in manifest["sources"]:
        directory = ROOT / source["path"]
        checksum, count = tree_digest(directory)
        valid = checksum == source["sha256_tree"] and count == source["file_count"]
        valid = valid and all((directory / name).is_file() for name in source["license_files"])
        print(f"{'OK' if valid else 'CHANGED'} {source['name']} ({count} files)")
        failed |= not valid
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
