"""Install the shared loader in all public HTML documents, including future pages."""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
TAG='<script src="/assets/js/analytics.js?v=20260926" defer></script>'
def pages():
 for p in ROOT.rglob('*.html'):
  if any(x.startswith('.') or x in {'node_modules','dist','scripts','worker','checks'} for x in p.relative_to(ROOT).parts): continue
  if re.search(r'<html\b',p.read_text(),re.I): yield p
errors=[]
for p in pages():
 s=p.read_text()
 if '--check' in sys.argv:
  if s.count(TAG)!=1: errors.append(str(p.relative_to(ROOT)))
 else:
  s=re.sub(r'<script\b[^>]*src="/assets/js/analytics\.js[^" ]*"[^>]*>\s*</script>','',s)
  s=s.replace('</head>',TAG+'</head>');p.write_text(s)
if errors: raise SystemExit('Missing/duplicate analytics: '+', '.join(errors))
print('Analytics coverage: all public HTML documents checked.')
