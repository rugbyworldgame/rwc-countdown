"""Generate permanent match pages from data/matches.json; no network/dependencies."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from html import escape
from urllib.parse import urlsplit,parse_qs
import json,re,sys,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='https://rugby2027.ru'
e=lambda x:escape(str(x),quote=True)
def js(x):return json.dumps(x,ensure_ascii=False).replace('<','\\u003c')
def url(m):return '/match-center/'+m['id']+'/'
def name(m):return f'«{m["home"]["name"]}» — «{m["away"]["name"]}»'
def date(m):return datetime.fromisoformat(m['start']).astimezone(ZoneInfo('Europe/Moscow'))
MONTHS='января февраля марта апреля мая июня июля августа сентября октября ноября декабря'.split()
def shortdate(m):
 d=date(m);return f'{d.day} {MONTHS[d.month-1]}'
def time(m):return date(m).strftime('%H:%M')
def validate(data):
 assert data['version']==1
 ids=set()
 for m in data['matches']:
  assert re.fullmatch(r'\d{4}-\d{2}-\d{2}-[a-z0-9-]+',m['id']) and m['id'] not in ids,'Unique dated IDs required'
  ids.add(m['id'])
  assert m['status'] in ['scheduled','live','finished','postponed','cancelled']
  assert datetime.fromisoformat(m['start']).utcoffset() is not None
  u=urlsplit(m['video']);q=parse_qs(u.query)
  assert u.scheme=='https' and u.hostname in ['vk.ru','vkvideo.ru'] and u.path=='/video_ext.php'
  assert all(q.get(k) for k in ['oid','id','hash'])
  for t in [m['home'],m['away']]:
   assert t['name'] and re.fullmatch(r'#[0-9a-fA-F]{6}',t['color'])
   assert len(t['players']) in [0,23], 'Use full confirmed 23 or empty pending lineup'
   for p in t['players']:assert isinstance(p,str) or (p.get('name') and p.get('playerId'))
  for source in m['sources']:assert source['url'].startswith('https://')
 assert data['featured'] and len(set(data['featured']))==len(data['featured']) and set(data['featured'])<=ids

def selector(featured,current):
 if len(featured)<2:return ''
 links=''.join(f'<a href="{url(m)}"'+(' aria-current="page"' if m['id']==current['id'] else '')+f'><small>{e(shortdate(m))} · {time(m)} МСК · {e(m["competition"])}</small><strong>{e(name(m))}</strong></a>' for m in featured)
 return '<nav class="shell match-selector" aria-label="Выбор матча">'+links+'</nav>'

def render(m,featured,allmatches,template,entry=False):
 canonical=BASE+('/match-center/' if entry else url(m))
 title='Матч-центр — трансляции регби | Rugby 2027' if entry else f'{name(m)} · {shortdate(m)} {date(m).year} | Rugby 2027'
 desc='Матч-центр Rugby 2027: трансляции регби, расписание эфиров, составы команд и судьи. Время по Москве.' if entry else f'{name(m)}: {m["competition"]}, {m["round"]}-й тур. {shortdate(m)} {date(m).year}, {time(m)} МСК. Трансляция, составы и судейская бригада.'
 crumbs=[('Главная',BASE+'/'),('Матч-центр',BASE+'/match-center/')]
 if not entry:crumbs.append((name(m),canonical))
 schema=[{'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i,'name':n,'item':u} for i,(n,u) in enumerate(crumbs,1)]}]
 schema.append({'@context':'https://schema.org','@type':'SportsEvent','@id':BASE+url(m)+'#event','name':name(m),'sport':'Регби','startDate':m['start'],'url':BASE+url(m),'location':{'@type':'Place','name':m['venue'],'address':{'@type':'PostalAddress','addressLocality':m['city'],'addressCountry':m['country']}},'homeTeam':{'@type':'SportsTeam','name':m['home']['name']},'awayTeam':{'@type':'SportsTeam','name':m['away']['name']}})
 metadata=f'<meta name="description" content="{e(desc)}"><link rel="canonical" href="{canonical}">'
 for k,v in {'type':'website','locale':'ru_RU','site_name':'Rugby 2027','title':title,'description':desc,'url':canonical}.items():metadata+=f'<meta property="og:{k}" content="{e(v)}">'
 metadata+=''.join('<script type="application/ld+json" data-seo>'+js(x)+'</script>' for x in schema)
 def badge(t):return f'<span aria-hidden="true" style="background:{t["color"]};color:#fff">{e(t["badge"])}</span>'
 home,away=m['home'],m['away']
 scoreboard=f'''<section class="match-scoreboard"><div class="shell"><a class="match-back" href="/">← На главную</a>
 <div class="match-competition">{e(m['competition'])} · {e(m['season'])} · {m['round']}-й тур</div>
 <div class="match-teams" aria-label="{e(name(m))}"><div class="match-team">{badge(home)}<strong>«{e(home['name'])}»</strong></div><div class="match-versus"><b>VS</b><small>{shortdate(m)} · {time(m)} МСК</small></div><div class="match-team">{badge(away)}<strong>«{e(away['name'])}»</strong></div></div>
 <div class="match-venue">Стадион «{e(m['venue'])}» · {e(m['city'])}</div>
 <div class="match-countdown-wrap" id="matchCountdown"><span class="live-dot" aria-hidden="true"></span><span id="countdownLabel">Начало: {shortdate(m)}, {time(m)} МСК</span><div class="match-countdown" id="countdownValues" hidden>'''+''.join(f'<b><strong id="match{k}">—</strong><small>{v}</small></b>' for k,v in [('Days','дн.'),('Hours','ч.'),('Minutes','мин.'),('Seconds','сек.')])+'''</div></div></div></section>'''
 stream=f'''<div class="stream-heading"><div><span class="match-kicker">Трансляция матча</span><h1 id="stream-title">{e(name(m))}</h1></div><span class="stream-time">Начало в {time(m)} МСК</span></div><div class="responsive-video"><iframe src="{e(m['video'])}" title="Трансляция матча {e(name(m))}" width="1280" height="720" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock" allowfullscreen></iframe></div><p class="stream-help">Если эфир не запустился автоматически, нажмите кнопку воспроизведения в центре окна.</p><p class="stream-help"><a href="{url(m)}">Постоянная ссылка на этот матч</a></p>'''
 players=json.loads((ROOT/'assets/players/players.json').read_text())['players']
 aliases={n.lower().replace('ё','е'):p['id'] for p in players for n in [p['name'],*p.get('aliases',[])]}
 def li(p):
  n=p if isinstance(p,str) else p['name'];pid=p.get('playerId') if isinstance(p,dict) else aliases.get(n.replace(' (капитан)','').lower().replace('ё','е'))
  return '<li'+(f' data-player-id="{e(pid)}"' if pid else '')+'>'+e(n)+'</li>'
 def roster(t):
  h=f'<article class="lineup-card"><header>{badge(t)}<div><small>Заявка команды</small><h3>«{e(t["name"])}»</h3></div></header>'
  if t['players']:h+='<h4>Стартовый XV</h4><ol>'+''.join(map(li,t['players'][:15]))+'</ol><h4>Запасные</h4><ol start="16">'+''.join(map(li,t['players'][15:]))+'</ol>'
  else:h+='<p>Подтверждённый состав пока не добавлен.</p>'
  return h+'</article>'
 def facts(items):return '<dl class="match-facts">'+''.join('<div><dt>'+e(k)+'</dt><dd>'+e(v or 'Пока не подтверждено')+'</dd></div>' for k,v in items)+'</dl>'
 content=f'''<section class="section shell match-content"><article class="match-intro"><span class="match-kicker">Почему стоит смотреть</span><h2>{e(m['introTitle'])}</h2><p>{e(m['intro'])}</p><p class="stream-help">Больше регби: <a href="/streams">наши трансляции</a> · <a href="/participants">участники Кубка мира 2027</a>.</p></article>
 <section class="match-info" aria-labelledby="info-title"><div class="match-section-heading"><span>Всё в одном месте</span><h2 id="info-title">Основная информация</h2></div>'''+facts([('Дата',shortdate(m)+f' {date(m).year} года'),('Начало',time(m)+' МСК'),('Турнир',m['competition']),('Сезон и тур',f'{m["season"]} · {m["round"]}-й тур'),('Главный арбитр',m['officials'].get('referee')),('Стадион',f'«{m["venue"]}», {m["city"]}')])+'''</section><section class="lineups" aria-labelledby="lineups-title"><div class="match-section-heading"><span>Заявки команд</span><h2 id="lineups-title">Составы</h2></div><div class="lineup-grid">'''+roster(home)+roster(away)+'''</div></section><section class="match-info" aria-labelledby="officials-title"><div class="match-section-heading"><span>Назначения на матч</span><h2 id="officials-title">Судейская бригада</h2></div>'''+facts([(k,m['officials'].get(v)) for k,v in [('Главный арбитр','referee'),('Боковые судьи','assistants'),('Видеорефери','tmo')]])+'<p class="stream-help">Источники: '+' · '.join(f'<a href="{e(x["url"])}" target="_blank" rel="noopener">{e(x["label"])}</a>' for x in m['sources'])+'</p></section></section>'
 archive=[a for a in allmatches if a['id'] not in {x['id'] for x in featured}]
 archive_html='<details class="shell match-archive"><summary>Другие опубликованные матчи</summary>'+''.join(f'<a href="{url(a)}">{shortdate(a)} {date(a).year} · {e(name(a))}</a>' for a in archive)+'</details>' if archive else ''
 config=[dict(id=x['id'],start=x['start'],status=x['status'],url=url(x)) for x in featured]
 # Classic head script selects once, before any iframe is parsed. No mid-view changes.
 entry_script='<script>if(window.RugbyMatchSelection){const m=RugbyMatchSelection.choose('+js(config)+',Date.now());if(m)location.replace(m.url);}</script>' if entry and len(featured)>1 else ''
 values=dict(title=e(title),metadata=metadata,entry_script=entry_script,selector=selector(featured,m),scoreboard=scoreboard,stream=stream,content=content,archive=archive_html,timer_config='<script id="match-config" type="application/json">'+js(dict(start=m['start'],status=m['status']))+'</script>')
 return re.sub(r'\{\{([a-z_]+)\}\}',lambda x:values[x[1]],template)

def outputs(data):
 validate(data)
 matches=sorted(data['matches'],key=lambda m:date(m));byid={m['id']:m for m in matches}
 featured=sorted([byid[x] for x in data['featured']],key=lambda m:date(m))
 template=(ROOT/'scripts/templates/match.html').read_text()
 result={ROOT/url(m).lstrip('/')/'index.html':render(m,featured,matches,template) for m in matches}
 result[ROOT/'match-center/index.html']=render(featured[0],featured,matches,template,True)
 urls=[n.text for n in ET.parse(ROOT/'sitemap.xml').iter() if n.tag.endswith('loc')]
 urls=sorted(set(urls+[BASE+'/match-center/']+[BASE+url(m) for m in matches]))
 result[ROOT/'sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+u+'</loc></url>\n' for u in urls)+'</urlset>\n'
 return result

def main():
 data=json.loads((ROOT/'data/matches.json').read_text());result=outputs(data)
 for p,s in result.items():
  if '--check' in sys.argv:
   assert p.exists() and p.read_text()==s, f'Regenerate: {p.relative_to(ROOT)}'
  else:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)
 print(f'Match centre: {len(data["matches"])} permanent fixtures; {len(data["featured"])} featured')
if __name__=='__main__':main()
