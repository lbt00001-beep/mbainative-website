"""Offline input extraction for prepare-cooking-audit.mjs (requires pandas).

Unzip the two public archives into research/cocina-20261126/tracking10 and
preelectoral2 first. The archives' SHA-256 hashes and source URLs are recorded
in data/cooking-audit.json. Never copy the extracted records into dist/vendor.
"""
from pathlib import Path
import json
import pandas as pd

root = Path(__file__).resolve().parent.parent / 'research/cocina-20261126'
for sub, pattern, expected in [('tracking10', '03*.dta', 2000), ('preelectoral2', '03*_voto.dta', 7500)]:
    paths = [p for p in (root / sub).rglob(pattern) if not p.name.startswith('._')]
    if len(paths) != 1:
        raise ValueError(f'Expected one vote DTA in {sub}, found {len(paths)}')
    path = paths[0]
    data = pd.read_stata(path, convert_categoricals=False)
    if len(data) != expected or not {'p1', 'p2', 'p3', 'p5', 'ponde'}.issubset(data.columns):
        raise ValueError('Unexpected sample or variable schema')
    # Full local records are intermediate input only; the JS step emits aggregates.
    (root / sub / (path.name + '.json')).write_text(data.to_json(orient='records', double_precision=15), encoding='utf-8')
    print(sub, len(data), 'records extracted locally')
