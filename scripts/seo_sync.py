"""Refresh static navigation and SEO after editorial changes. No dependencies."""
from pathlib import Path
import re, json, html

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://rugby2027.ru'
descriptions = {
 'index': 'Кубок мира по регби 2027 в Австралии: расписание, сборные, стадионы и матч-центр. Независимый русскоязычный проект для болельщиков.',
 'about': 'Формат Кубка мира по регби 2027: 24 сборные, шесть групп, плей-офф, города и стадионы Австралии. Коротко о главном турнире.',
 'schedule': 'Расписание Кубка мира по регби 2027: групповой этап и плей-офф, даты матчей и пары команд. Информация для русскоязычных болельщиков.',
 'history': 'История Кубка мира по регби: чемпионы, финалы и памятные события предыдущих турниров на независимом сайте Rugby 2027.',
 'participants': 'Все 24 участника Кубка мира по регби 2027 по группам A–F. Страницы сборных с историей, статистикой и матчами группового этапа.',
 'stadiums': 'Стадионы Кубка мира по регби 2027: восемь арен в семи городах Австралии, вместимость и программа матчей, стадионы открытия и финала.',
 'streams': 'Трансляции регби на Rugby 2027: информация об эфирах и переход в матч-центр с видеоплеером и составами команд.',
 'partners': 'Постоянные партнёры независимого проекта Rugby 2027. Информация о партнёрах и ссылки на их услуги.',
 'tickets': 'Информация о билетах на Кубок мира по регби 2027 в Австралии и ссылки для болельщиков на странице независимого проекта Rugby 2027.',
 'news': 'Раздел новостей независимого русскоязычного проекта Rugby 2027. Страница находится в подготовке.',
 '404': 'Запрошенная страница не найдена. Перейдите к расписанию, участникам или матч-центру Rugby 2027.'
}
menu = (ROOT/'menu.html').read_text().replace('aria-expanded="false"', 'aria-expanded="false" aria-controls="mobileNav"')
support = (ROOT/'support.html').read_text()
footer = '<nav class="seo-footer" aria-label="Разделы сайта">' + ''.join(f'<a href="{p}">{n}</a>' for p,n in [('/', 'Главная'),('/about','О турнире'),('/schedule','Расписание'),('/participants','Участники'),('/stadiums','Стадионы'),('/streams','Трансляции'),('/match-center/','Матч-центр'),('/partners','Партнёры')]) + '</nav><p class="seo-disclaimer">Независимый русскоязычный проект. Не является официальным сайтом World Rugby.</p>'
pages = sorted(ROOT.glob('*.html')) + [ROOT/'match-center/index.html']
indexed=[]
for path in pages:
 s=path.read_text()
 if '<html' not in s: continue
 key=path.stem if path.parent==ROOT else 'match-center'
 canonical=BASE+('/' if key=='index' else '/match-center/' if key=='match-center' else '/'+key)
 h1=html.unescape(re.sub('<[^>]+>',' ',re.search(r'<h1\b[^>]*>(.*?)</h1>',s,re.S).group(1))).strip()
 title=html.unescape(re.search(r'<title>(.*?)</title>',s,re.S).group(1))
 desc=descriptions.get(key, f'{h1} на Кубке мира по регби 2027: история выступлений, статистика предыдущих турниров, квалификация и матчи группового этапа.')
 if key=='match-center':
  if '«Бордо» — «Стад Франсе»' not in h1 or '2026-09-20T22:05:00+03:00' not in s:
   raise ValueError('Match changed: update SportsEvent data before regenerating SEO.')
  title='Матч-центр — трансляции регби | Rugby 2027'
  desc=f'Матч-центр Rugby 2027: {h1}. Видеоплеер, составы команд и информация о встрече. Время начала указано по Москве.'
 s=re.sub(r'<title>.*?</title>', '<title>'+html.escape(title)+'</title>',s,flags=re.S)
 s=re.sub(r'<meta\b[^>]*(?:name=["\'](?:description|robots|theme-color|twitter:[^"\']+)["\']|property=["\']og:[^"\']+["\'])[^>]*>','',s,flags=re.I)
 s=re.sub(r'<link\b[^>]*rel=["\']canonical["\'][^>]*>','',s,flags=re.I)
 s=re.sub(r'<script type="application/ld\+json" data-seo>.*?</script>','',s,flags=re.S)
 s=re.sub(r'<link rel="stylesheet" href="/assets/css/(?:seo|support)\.css[^"\']*">','',s)
 tags=f'<meta name="description" content="{html.escape(desc,quote=True)}"><link rel="canonical" href="{canonical}"><meta name="theme-color" content="#080d15">'
 for prop,value in {'og:type':'website','og:locale':'ru_RU','og:site_name':'Rugby 2027','og:title':title,'og:description':desc,'og:url':canonical}.items():
  tags+=f'<meta property="{prop}" content="{html.escape(value,quote=True)}">'
 tags+='<meta name="twitter:card" content="summary">'
 if key in ('404','news'): tags+='<meta name="robots" content="noindex,follow">'
 else: indexed.append(canonical)
 data=[]
 if key=='index': data.append({'@context':'https://schema.org','@type':'WebSite','@id':BASE+'/#website','url':BASE+'/','name':'Rugby 2027','inLanguage':'ru','description':desc})
 elif key!='404':
  crumbs=[('Главная',BASE+'/')]
  if key not in descriptions and key!='match-center': crumbs.append(('Участники',BASE+'/participants'))
  crumbs.append(('Матч-центр' if key=='match-center' else h1,canonical))
  data.append({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i,'name':n,'item':u} for i,(n,u) in enumerate(crumbs,1)]})
 if key=='match-center':
  # Explicitly supplied match data. Update this record when replacing the match.
  data.append({'@context':'https://schema.org','@type':'SportsEvent','@id':canonical+'#event-2026-09-20','name':'Бордо — Стад Франсе','sport':'Регби','startDate':'2026-09-20T22:05:00+03:00','url':canonical,'location':{'@type':'Place','name':'Шабан-Дельмас','address':{'@type':'PostalAddress','addressLocality':'Бордо','addressCountry':'FR'}},'homeTeam':{'@type':'SportsTeam','name':'Бордо'},'awayTeam':{'@type':'SportsTeam','name':'Стад Франсе'}})
 tags+=''.join('<script type="application/ld+json" data-seo>'+json.dumps(d,ensure_ascii=False)+'</script>' for d in data)
 s=re.sub(r'<noscript><style>@media\(max-width:1250px\).*?</noscript>','',s,flags=re.S)
 tags+='<link rel="stylesheet" href="/assets/css/support.css"><link rel="stylesheet" href="/assets/css/seo.css"><noscript><style>@media(max-width:1250px){.mobile-nav{display:flex;position:static;max-height:none;flex-wrap:wrap}.menu-toggle{display:none}.nav{flex-wrap:wrap;height:auto;padding-block:15px}}</style></noscript>'
 if 'fonts.googleapis.com/css2' not in s:
  tags+='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;family=Oswald:wght@500;600&amp;display=swap">'
 if 'rel="icon"' not in s: tags+='<link rel="icon" href="/favicon.svg" type="image/svg+xml">'
 s=s.replace('</head>',tags+'</head>')
 if '<footer' not in s: s=s.replace('</main>','</main><footer></footer>',1)
 # Marked blocks make this generator safe to run repeatedly.
 s=re.sub(r'<!-- static-menu -->.*?<!-- /static-menu -->','<div id="menu-container"></div>',s,flags=re.S)
 s=s.replace('<div id="menu-container"></div>','<!-- static-menu --><div id="menu-container">'+menu+'</div><!-- /static-menu -->')
 s=re.sub(r'<!-- static-support -->.*?<!-- /static-support -->','<div id="project-support-slot"></div>',s,flags=re.S)
 slot='<!-- static-support --><div id="project-support-slot" class="shell support-shell">'+support+'</div><!-- /static-support -->'
 if re.search(r'<div[^>]*id="project-support-slot"[^>]*>\s*</div>',s): s=re.sub(r'<div[^>]*id="project-support-slot"[^>]*>\s*</div>',lambda m:slot,s)
 else: s=s.replace('<footer>',slot+'<footer>',1)
 s=re.sub(r'<!-- seo-footer -->.*?<!-- /seo-footer -->','',s,flags=re.S)
 s=s.replace('</footer>','<!-- seo-footer -->'+footer+'<!-- /seo-footer --></footer>')
 s=re.sub(r'href="/([^"?#]+)\.html([?#][^"]*)?"',lambda m:'href="/'+('' if m[1]=='index' else m[1])+(m[2] or '')+'"',s)
 def img(m):
  tag=m[0]
  if 'width=' not in tag: tag=tag[:-1]+' width="640" height="480">'
  if 'decoding=' not in tag: tag=tag[:-1]+' decoding="async">'
  if key=='participants' and 'loading=' not in tag: tag=tag[:-1]+' loading="lazy">'
  return tag
 s=re.sub(r'<img\b[^>]*>',img,s)
 s=s.replace('<h2 class="sr-only">Информация о турнире</h2>','')
 if key in ('about','history') and 'data-seo-section' not in s:
  label='Формат и особенности турнира' if key=='about' else 'Чемпионы прошлых турниров'
  s=s.replace('<div class="content-grid">',f'<h2 class="sr-only" data-seo-section>{label}</h2><div class="content-grid">',1)
 if 'class="skip-link"' not in s:
  s=re.sub(r'<body([^>]*)>',r'<body\1><a class="skip-link" href="#main-content">К содержанию</a>',s,count=1)
  s=re.sub(r'<main\b(?![^>]*\bid=)', '<main id="main-content"',s,count=1)
 s=s.replace('<script src="/menu.js"></script>','<script src="/menu.js" defer></script>')
 s=s.replace('Официальная лента новостей','Лента новостей независимого проекта')
 path.write_text('\n'.join(line.rstrip() for line in s.splitlines())+'\n')
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+u+'</loc></url>\n' for u in sorted(indexed))+'</urlset>\n')
print(f'SEO refreshed: {len(indexed)} indexable pages')
