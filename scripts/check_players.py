"""Validate the reusable registry without downloading any remote photo."""
import json
from pathlib import Path
from urllib.parse import urlparse

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'assets/players/players.json').read_text())
assert data['version'] == 1
ids, aliases = set(), {}
for player in data['players']:
    assert player['id'] not in ids, 'Duplicate player id'
    ids.add(player['id'])
    for alias in [player['name'], *player['aliases']]:
        key = ' '.join(alias.lower().replace('ё', 'е').split())
        assert key not in aliases or aliases[key] == player['id'], 'Ambiguous alias'
        aliases[key] = player['id']
    image = player['image']
    path = (root / image['src'].lstrip('/')).resolve()
    assert path.is_relative_to(root / 'assets/players')
    raw = path.read_bytes()
    assert raw[:4] == b'RIFF' and raw[8:12] == b'WEBP'
    assert len(raw) < 100_000
    assert 0 < image['width'] <= 400 and 0 < image['height'] <= 440
    assert image['author'] and image['changes'] and image['year']
    assert urlparse(image['source']).scheme == 'https'
    assert urlparse(image['licenseUrl']).netloc == 'creativecommons.org'
print(f'Player registry: {len(ids)} licensed local WebP images; aliases and paths valid.')
