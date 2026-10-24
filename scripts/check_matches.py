"""Contract tests for generated match pages, missing data and single-match mode."""
import json,re,copy
from render_matches import ROOT,outputs,render,validate
from html.parser import HTMLParser
from urllib.parse import urlsplit
class Page(HTMLParser):
 def __init__(self,text):super().__init__();self.tags=[];self.feed(text)
 def handle_starttag(self,t,attrs):self.tags.append((t,dict(attrs)))
data=json.loads((ROOT/'data/matches.json').read_text());validate(data)
for path,text in outputs(data).items():
 if path.suffix!='.html':continue
 p=Page(text)
 frames=[a for t,a in p.tags if t=='iframe'];assert len(frames)==1
 ids=[a['id'] for t,a in p.tags if 'id' in a];assert len(ids)==len(set(ids))
 assert len([1 for t,a in p.tags if t=='h1'])==1
 assert text.count('/assets/js/analytics.js?')==1
 assert 'refLinkId=246672' in text and '2202 2068 8814 8090' in text
 match=next(m for m in data['matches'] if m['video']==frames[0]['src'])
 event=next(json.loads(x) for x in re.findall(r'<script type="application/ld\+json" data-seo>(.*?)</script>',text) if json.loads(x)['@type']=='SportsEvent')
 assert event['startDate']==match['start'] and event['homeTeam']['name']==match['home']['name'] and event['awayTeam']['name']==match['away']['name']
 lists=re.findall(r'<ol(?: start="16")?>(.*?)</ol>',text,re.S)
 assert [len(re.findall('<li',x)) for x in lists]==[15,8,15,8]
 for t,a in p.tags:
  if t=='a' and a.get('href','').startswith('/match-center/2026-'):
   assert (ROOT/urlsplit(a['href']).path.lstrip('/')/'index.html').exists()
 assert '{{' not in text
m=copy.deepcopy(data['matches'][-1]);template=(ROOT/'scripts/templates/match.html').read_text()
single=render(m,[m],[m],template,True)
assert 'aria-label="Выбор матча"' not in single and 'location.replace' not in single
m['home']['players']=[];m['officials']={}
empty=render(m,[m],[m],template)
assert 'Подтверждённый состав пока не добавлен' in empty and 'Пока не подтверждено' in empty
assert len(re.findall('<iframe ',empty))==1
print('Match contracts: isolated players, event, video, links; one/many/pending modes PASS')
