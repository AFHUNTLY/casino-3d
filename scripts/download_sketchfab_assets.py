#!/usr/bin/env python3
import os, json, re, zipfile, shutil, subprocess, sys, time
from pathlib import Path
from urllib.parse import urlparse
import requests

TOKEN = os.environ.get('SKETCHFAB_TOKEN', 'f9f54d22ee664e8aa6a83bd9a1e9e00f')
ROOT = Path('/root/casino-3d')
RAW = ROOT / 'assets_raw' / 'sketchfab'
PUBLIC = ROOT / 'client' / 'public' / 'assets' / 'models'
RAW.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)

HEADERS = {'Authorization': f'Token {TOKEN}', 'User-Agent': 'casino-3d-asset-pipeline/1.0'}

# Accept CC0 and CC-BY / CC-BY-SA. Reject NC and ND.
BAD = ['NonCommercial', 'NoDerivs']

TARGETS = [
    ('slot', 'slot machine casino', 3),
    ('roulette', 'roulette table casino', 2),
    ('blackjack', 'blackjack table casino', 2),
    ('poker', 'casino poker table', 2),
    ('chair', 'casino chair', 2),
    ('chandelier', 'chandelier', 2),
    ('bar', 'whiskey bottle bar', 2),
    ('horse', 'low poly horse', 2),
]

selected = []

for category, q, limit in TARGETS:
    r = requests.get('https://api.sketchfab.com/v3/search', params={
        'type': 'models', 'q': q, 'downloadable': 'true', 'count': 10
    }, headers=HEADERS, timeout=30)
    print('\nSEARCH', category, q, r.status_code)
    if r.status_code != 200:
        print(r.text[:500]); continue
    found = 0
    for it in r.json().get('results', []):
        lic = it.get('license') or {}
        label = lic.get('label') or ''
        if any(b in label for b in BAD):
            print(' skip bad license', it.get('name'), label)
            continue
        # prefer CC0/Attribution/Free Standard, avoid obviously irrelevant
        selected.append({
            'category': category,
            'uid': it['uid'],
            'name': it.get('name') or category,
            'author': (it.get('user') or {}).get('displayName') or (it.get('user') or {}).get('username') or 'Unknown',
            'license': label,
            'viewerUrl': it.get('viewerUrl'),
        })
        print(' select', it.get('name'), label, it.get('uid'))
        found += 1
        if found >= limit: break

# Dedupe by uid, keep first
seen=set(); unique=[]
for s in selected:
    if s['uid'] not in seen:
        unique.append(s); seen.add(s['uid'])

print('\nSELECTED', len(unique))
(RAW/'selected.json').write_text(json.dumps(unique, indent=2), encoding='utf-8')

# Download archives
for s in unique:
    uid=s['uid']; slug=re.sub(r'[^a-z0-9]+','-', (s['category']+'-'+s['name']).lower()).strip('-')[:60]
    dest=RAW/slug
    if (dest/'downloaded.ok').exists():
        print('already downloaded', slug); continue
    dest.mkdir(parents=True, exist_ok=True)
    (dest/'meta.json').write_text(json.dumps(s, indent=2), encoding='utf-8')
    dr=requests.get(f'https://api.sketchfab.com/v3/models/{uid}/download', headers=HEADERS, timeout=30)
    print('download endpoint', slug, dr.status_code)
    if dr.status_code != 200:
        print(dr.text[:500]); continue
    data=dr.json()
    # Prefer gltf archive, fallback usdz/original if needed
    entry=data.get('gltf') or data.get('glb') or data.get('source')
    if not entry:
        print('no supported archive', data.keys()); continue
    url=entry.get('url')
    ar=requests.get(url, timeout=120, headers={'User-Agent':'Mozilla/5.0'})
    print(' archive', ar.status_code, len(ar.content))
    if ar.status_code != 200: continue
    zpath=dest/'archive.zip'
    zpath.write_bytes(ar.content)
    try:
        with zipfile.ZipFile(zpath) as z:
            z.extractall(dest/'extracted')
    except zipfile.BadZipFile:
        # sometimes direct glb
        (dest/(slug+'.glb')).write_bytes(ar.content)
    (dest/'downloaded.ok').write_text('ok')

print('DONE')
