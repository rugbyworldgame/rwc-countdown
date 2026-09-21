"""Check all canonical pages and internal links; --live also checks published HTML."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json,re,sys,urllib.request,urllib.error,concurrent.futures,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='https://rugby2027.ru'
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__(); self.tags=[]; self.feed(s)
 def handle_starttag(self,t,a): self.tags.append((t,dict(a)))
 def select(self,t,**attrs): return [a for n,a in self.tags if n==t and all(a.get(k)==v for k,v in attrs.items())]
def resolve(path):
 path=unquote(path).lstrip('/')
 for p in [ROOT/path,ROOT/(path+'.html'),ROOT/path/'index.html']:
  if p.is_file(): return p
 return None
urls=[n.text for n in ET.parse(ROOT/'sitemap.xml').iter() if n.tag.endswith('loc')]
errors=[]; titles=set(); descriptions=set()
for url in urls:
 path=resolve(urlsplit(url).path); s=path.read_text(); p=Page(s)
 title=re.search('<title>(.*?)</title>',s,re.S).group(1)
 desc=p.select('meta',name='description')
 if title in titles: errors.append(f'duplicate title {url}')
 titles.add(title)
 if len(desc)!=1 or desc[0].get('content') in descriptions: errors.append(f'description {url}')
 descriptions.add(desc[0]['content'])
 if len(p.select('h1'))!=1: errors.append(f'H1 {url}')
 if p.select('link',rel='canonical')!=[{'rel':'canonical','href':url}]: errors.append(f'canonical {url}')
 if not p.select('html',lang='ru'): errors.append(f'language {url}')
 if p.select('meta',name='robots'): errors.append(f'robots {url}')
 for block in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>',s,re.S): json.loads(block)
 for tag,a in p.tags:
  attr='href' if tag in ('a','link') else 'src' if tag in ('img','script','iframe') else None
  if not attr or attr not in a: continue
  u=urlsplit(a[attr])
  if (u.netloc and u.netloc!='rugby2027.ru') or (u.scheme and u.scheme not in ('https','http')): continue
  target=resolve(u.path) if u.path else path
  if not target: errors.append(f'broken {url}: {a[attr]}')
  elif u.fragment and tag=='a' and f'id="{u.fragment}"' not in target.read_text(): errors.append(f'fragment {url}: {a[attr]}')
  if tag=='img' and not all(k in a for k in ['alt','width','height']): errors.append(f'image {url}')
 ids=[a['id'] for _,a in p.tags if 'id' in a]
 if len(ids)!=len(set(ids)): errors.append(f'duplicate IDs {url}')
 if not p.select('nav',**{'aria-label':'Основное меню'}): errors.append(f'no static menu {url}')
print(f'Local: {len(urls)} canonical pages checked; {len(errors)} errors')
for e in errors: print(e)
if '--live' in sys.argv:
 def get(url):
  try:
   with urllib.request.urlopen(url,timeout=30) as r: return url,r.status,r.read().decode(),r.url
  except urllib.error.HTTPError as e: return url,e.code,e.read().decode(),url
 results=list(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(get,urls+[BASE+'/robots.txt',BASE+'/sitemap.xml',BASE+'/seo-nonexistent-check',BASE+'/contacts',BASE+'/contacts.html',BASE+'/shop',BASE+'/schedule.html',BASE+'/about.html',BASE+'/match-center/toulouse-bordeaux/']))
 for url,status,body,final in results:
  canonical=Page(body).select('link',rel='canonical')
  print(f'{status} {url} canonical={canonical[0]["href"] if canonical else "—"}')
  if url in urls and (status!=200 or not canonical or canonical[0]['href']!=url): errors.append('live '+url)
  if url in urls and '<!-- static-menu -->' not in body: errors.append('stale '+url)
  if url in urls:
   local=resolve(urlsplit(url).path).read_text()
   remote=Page(body); expected=Page(local)
   for name in ['description']:
    if remote.select('meta',name=name)!=expected.select('meta',name=name): errors.append('live meta '+url)
   if re.findall('<title>(.*?)</title>',body,re.S)!=re.findall('<title>(.*?)</title>',local,re.S): errors.append('live title '+url)
   if remote.select('meta',property='og:url')!=expected.select('meta',property='og:url'): errors.append('live OG '+url)
   if re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>',body,re.S)!=re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>',local,re.S): errors.append('live schema '+url)
print(f'Total errors: {len(errors)}')
sys.exit(bool(errors))
