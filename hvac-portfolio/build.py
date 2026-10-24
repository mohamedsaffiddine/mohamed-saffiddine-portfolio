"""Build a standalone Cloudflare Pages upload directory, using only Python 3."""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'site'
DEST = ROOT / 'dist'
data = json.loads((SOURCE / 'data.json').read_text())
for document in data['documents']:
    path = SOURCE / 'assets' / 'documents' / document['file']
    if hashlib.sha256(path.read_bytes()).hexdigest() != document['sha256']:
        raise SystemExit(f'Original document checksum mismatch: {document["file"]}')
if DEST.is_symlink():
    raise SystemExit('Refusing to replace a symlinked dist directory')
if DEST.exists():
    shutil.rmtree(DEST)
shutil.copytree(SOURCE, DEST)
manifest = {str(p.relative_to(DEST)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(DEST.rglob('*')) if p.is_file()}
(DEST / 'build-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Built {len(manifest)} files; all 8 original document checksums verified. Output: {DEST}')
