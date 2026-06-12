import httpx, json, re

headers = {'User-Agent': 'Mozilla/5.0'}
r = httpx.get('https://www.myscheme.gov.in/search', headers=headers, follow_redirects=True, timeout=30)
m = re.search(r'<script\s+id="__NEXT_DATA__"\s+type="application/json">(.*?)</script>', r.text, re.S)
if m:
    try:
        data = json.loads(m.group(1))
        pp = data.get('props',{}).get('pageProps',{})
        print('Found Next.js data.')
        print('Keys:', list(pp.keys()))
        
        # Look for schemes array
        for k, v in pp.items():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and 'slug' in v[0]:
                print(f"Found {len(v)} schemes in list '{k}'")
                print("First item keys:", list(v[0].keys()))
            elif isinstance(v, dict) and 'data' in v:
                d = v['data']
                if isinstance(d, list) and len(d) > 0 and isinstance(d[0], dict) and 'slug' in d[0]:
                    print(f"Found {len(d)} schemes in dict '{k}' -> 'data'")
                    print("First item keys:", list(d[0].keys()))
    except Exception as e:
        print('JSON error:', e)
else:
    print('No NEXT_DATA found.')
