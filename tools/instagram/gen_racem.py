import os,re,base64
S=os.getcwd(); T=os.path.dirname(os.path.abspath(__file__)); P=os.path.abspath(os.path.join(T,'..','..'))
rem=open(P+'/public/brand/logo-white.svg').read(); rem=re.sub(r'<svg','<svg class="rem"',rem,1)
F=lambda n,w,st='normal':f'@font-face{{font-family:{"BC" if "Condensed" in n else "B"};font-weight:{w};font-style:{st};src:url(file://{T}/fonts/{n}.ttf)}}'
css=F('Barlow-Medium',500)+F('Barlow-SemiBold',600)+F('Barlow-Bold',700)+F('BarlowCondensed-BlackItalic',900,'italic')+F('BarlowCondensed-ExtraBoldItalic',800,'italic')+'''
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;background:#000;color:#fff;font-family:B,sans-serif;position:relative;overflow:hidden}
.top{position:absolute;left:52px;right:50px;top:44px;height:70px;display:flex;align-items:center;justify-content:space-between}
.top img{height:66px;width:auto;display:block}
.rem{width:400px;height:auto;display:block}
.photo{position:absolute;left:44px;right:44px;top:146px;border-bottom:12px solid #c8102e;overflow:hidden;background:#fff}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.tag{position:absolute;left:44px;z-index:3;background:#c8102e;font:italic 900 40px BC;letter-spacing:.02em;text-transform:uppercase;padding:14px 44px 12px 26px;clip-path:polygon(0 0,100% 0,calc(100% - 24px) 100%,0 100%)}
.info{position:absolute;left:48px;right:48px}
.kicker{display:flex;align-items:center;gap:16px;font:700 23px B;letter-spacing:.24em;color:#ff3b57;text-transform:uppercase}
.kicker::before{content:"";width:46px;height:7px;background:#c8102e;flex:none}
h1{font:italic 900 132px/1.02 BC;text-transform:uppercase;letter-spacing:.005em;margin-top:22px}
h1 b,h2 b{color:#ee2242;font-weight:900}
h2{font:italic 900 96px/1 BC;text-transform:uppercase;margin-top:14px;display:flex;align-items:flex-start;gap:22px}
h2 .no{font-size:150px;line-height:.86;color:#c8102e}
h2 span.t{padding-top:6px}
p{font:500 33px/1.45 B;color:rgba(255,255,255,.93);margin-top:22px;text-wrap:pretty}
p b{font-weight:700;color:#fff}
.cells{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;margin-top:26px;border-top:2px solid rgba(255,255,255,.22);border-bottom:2px solid rgba(255,255,255,.22)}
.cell{padding:20px 22px 18px;border-left:2px solid rgba(255,255,255,.22)}
.cell:first-child{border-left:0;padding-left:0}
.cell small{display:block;font:700 18px B;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.cell b{display:block;font:italic 900 42px/1.05 BC;text-transform:uppercase;margin-top:10px;white-space:nowrap}
.lbl{font:700 21px B;letter-spacing:.2em;text-transform:uppercase;color:#ff3b57;margin-top:26px}
p.sm{font-size:28px;margin-top:8px;color:rgba(255,255,255,.8)}
.foot{position:absolute;left:0;right:50px;bottom:40px;display:flex;justify-content:space-between;align-items:center}
.web{background:#c8102e;font:italic 900 34px BC;letter-spacing:.04em;text-transform:uppercase;padding:16px 56px 14px 48px;clip-path:polygon(0 0,100% 0,calc(100% - 26px) 100%,0 100%);display:flex;align-items:center;gap:18px}
.web svg{width:26px;height:26px}
.foot .n{font:700 22px B;color:rgba(255,255,255,.5);letter-spacing:.2em}
'''
def build(key,logo,web,slides):
    for i,(img,pos,ph,tag,body) in enumerate(slides,1):
        t=f'<div class="tag" style="top:{146+ph-58}px">{tag}</div>' if tag else ''
        html=f'''<!doctype html><meta charset="utf-8"><style>{css}</style><body>
<div class="top"><img src="file://{T}/brand/{logo}">{rem}</div>
<div class="photo" style="height:{ph+12}px"><img src="file://{S}/src/{img}" style="object-position:{pos}"></div>{t}
<div class="info" style="top:{146+ph+12+58}px">{body}</div>
<div class="foot"><span class="web">{web}<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><span class="n">{i} / {len(slides)}</span></div></body>'''
        open(f'{S}/{key}-s{i}.html','w').write(html)
K=lambda s:f'<div class="kicker">{s}</div>'
C=lambda *xs:'<div class="cells">'+''.join(f'<div class="cell"><small>{a}</small><b>{b}</b></div>' for a,b in xs)+'</div>'
H2=lambda no,t:f'<h2><span class="no">{no}</span><span class="t">{t}</span></h2>'
build('sk','racem-logo.png','racem.sk',[
 ('o4db-3.jpg','center',560,'Spolu 509,70 €',K('Škoda Octavia 4 RS Combi')+'<h1 style="font-size:124px">Tri diely s <b>ABE</b> na zadok RS</h1><p>Spoiler a dvojdielny difúzor. Bez lakovania a bez zápisu do techničáku.</p>'),
 ('o4sp-2.jpg','center',606,'S ABE',K('Diel 1 z 3')+H2('01','Strešný <b>spoiler</b>')+C(('Cena','169,90 €'),('Materiál','ABS'),('Povrch','Lesklý čierny'))+'<p>Lepí sa 3M páskou. Sedí na Octaviu 4 Combi vrátane RS.</p>'),
 ('o4ds-2.jpg','center',606,'S ABE',K('Diel 2 z 3')+H2('02','Difúzor <b>stred</b>')+C(('Cena','209,90 €'),('Materiál','ABS'),('Povrch','Lesklý čierny'))+'<p>Stredová časť na originálny nárazník RS a RS Plus.</p>'),
 ('o4db-0.jpg','center',606,'S ABE',K('Diel 3 z 3')+H2('03','Difúzor <b>boky</b>')+C(('Cena','129,90 €'),('Materiál','ABS'),('Povrch','Lesklý čierny'))+'<p>Dvojdielny set, ktorý rozšíri nárazník po stranách.</p>'),
 ('o4ds-4.jpg','center 40%',418,'',K('Celý set')+'<h1 style="font-size:112px;margin-top:14px">Spolu <b>509,70 €</b></h1>'+C(('Spoiler','169,90 €'),('Stred','209,90 €'),('Boky','129,90 €'))+'<p>Sedí na Octaviu 4 RS a RS Plus Combi. Všetky tri diely sú z lesklého čierneho ABS a netreba ich lakovať.</p><div class="lbl">Pozor</div><p class="sm">Spoiler je len na Combi, na liftback nesedí.</p><p><b>Všetko nájdeš na racem.sk.</b> Odkaz je v profile.</p>'),
])
build('us','racemusa-logo.png','racemusa.com',[
 ('cbase-6.jpg','center',560,'6th Gen, 2016-2024',K('Camaro widebody kits')+'<h1 style="font-size:124px">3 ways to go wide on your <b>Camaro</b></h1>'),
 ('cbase-0.jpg','center',606,'Fender flares',K('Kit 1 of 3')+H2('01','SFXLA <b>Base kit</b>')+C(('Price','$5,744.09'),('Material','FRP'),('Pieces','4 flares'))+'<p>Front and rear fender extensions. Bolt on or mold on.</p>'),
 ('cfull-2.jpg','center',606,'Flares + spoiler',K('Kit 2 of 3')+H2('02','SFXLA <b>Full kit</b>')+C(('Price','$6,605.93'),('Material','FRP'),('Pieces','4 flares + spoiler'))+'<p>Everything in the base kit plus the rear spoiler.</p>'),
 ('czl1-2c.jpg','center',606,'Complete aero',K('Kit 3 of 3')+H2('03','ZL1 style <b>complete</b>')+C(('Price','$8,164.65'),('Material','FRP'),('Width','+50 / +75 mm'))+'<p>Flares, splitters and spoilers in one kit. Fits RS, SS and ZL1.</p>'),
 ('cfull-5.jpg','center 55%',418,'',K('Pick your width')+'<h1 style="font-size:104px;margin-top:14px">From <b>$5,744.09</b></h1>'+C(('Base','$5,744.09'),('Full','$6,605.93'),('ZL1 style','$8,164.65'))+'<p>SFXLA kits fit 1LS, 1LT, 2LT, 1SS and 2SS. The ZL1 style kit fits RS, SS and ZL1, 2016 to 2024.</p><div class="lbl">Not sure about fitment?</div><p class="sm">Send us your VIN and we will check it for you.</p><p><b>All three are on racemusa.com.</b> Link in bio.</p>'),
])
