import os,re
S=os.getcwd(); T=os.path.dirname(os.path.abspath(__file__)); P=os.path.abspath(os.path.join(T,'..','..'))
logo=open(P+'/public/brand/logo-white.svg').read()
logo=re.sub(r'<svg','<svg class="logo"',logo,1)
M=T+'/node_modules/@fontsource/manrope/files/manrope-'
ff=''.join(f'@font-face{{font-family:Manrope;font-weight:{w};src:url(file://{M}{s}-{w}-normal.woff2)}}' for w in (500,700,800) for s in ('latin','latin-ext'))
ff+=''.join(f'@font-face{{font-family:"REM Display";font-weight:{w};src:url(file://{P}/public/fonts/rem-display{b}-{s}.woff2)}}' for w,b in ((400,''),(700,'-bold')) for s in ('latin','latin-ext'))
flag='<svg viewBox="0 0 30 20">'+'<rect width="30" height="20" fill="#fff"/>'+''.join(f'<rect y="{i*20/13*2:.3f}" width="30" height="{20/13:.3f}" fill="#b22234"/>' for i in range(7))+'<rect width="13" height="10.77" fill="#3c3b6e"/>'+''.join(f'<circle cx="{1.4+c*2.55:.2f}" cy="{1.4+r*2.5:.2f}" r=".55" fill="#fff"/>' for r in range(4) for c in range(5))+'</svg>'
css=ff+'''
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;background:#0d0e11;color:#fff;font-family:Manrope,sans-serif;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(900px 500px at 85% -5%,rgba(200,16,46,.28),transparent 60%),radial-gradient(700px 500px at 0% 105%,rgba(200,16,46,.16),transparent 60%),#0d0e11}
.top{position:absolute;left:56px;right:56px;top:50px;display:flex;align-items:center;justify-content:space-between}
.logo{width:470px;height:auto;display:block}
.photo{position:absolute;left:44px;right:44px;top:132px;height:725px;border-radius:26px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.55);border:3px solid rgba(255,255,255,.92)}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 62%,rgba(0,0,0,.42))}
.corner{position:absolute;width:74px;height:74px;border:7px solid #c8102e;z-index:3}
.c1{left:26px;top:114px;border-right:0;border-bottom:0;border-radius:30px 0 0 0}
.c2{right:26px;top:839px;border-left:0;border-top:0;border-radius:0 0 30px 0}
.st{position:absolute;z-index:5;font-family:"REM Display",Manrope;font-weight:700;text-transform:uppercase;letter-spacing:.03em;border:5px solid #fff;border-radius:16px;padding:13px 22px 11px;box-shadow:0 10px 26px rgba(0,0,0,.45);line-height:1.05;white-space:nowrap}
.st small{display:block;font:800 14px Manrope;letter-spacing:.16em;opacity:.85;margin-bottom:4px}
.green{background:#0f9d58}.red{background:#c8102e}.white{background:#fff;color:#111317;border-color:#111317}.dark{background:#111317}
.yellow{background:#ffc400;color:#111317;border-color:#111317}
.flag{position:absolute;z-index:6;right:70px;top:108px;transform:rotate(9deg);background:#fff;padding:8px;border-radius:12px;box-shadow:0 12px 28px rgba(0,0,0,.5)}
.flag svg{display:block;width:118px;height:79px;border-radius:6px}
.flag b{display:block;text-align:center;color:#111317;font:800 15px Manrope;letter-spacing:.14em;margin-top:6px}
.info{position:absolute;left:56px;right:56px;top:896px}
.kicker::before{content:"";width:44px;height:5px;background:#c8102e;display:block;flex:none}
.kicker{display:flex;align-items:center;gap:14px;font:800 21px Manrope;letter-spacing:.18em;color:#ff5c72;text-transform:uppercase}
h1{font-family:"REM Display",Manrope;font-weight:700;font-size:66px;line-height:1.04;letter-spacing:.005em;margin-top:14px;text-transform:uppercase;white-space:nowrap}
h1 em{font-style:normal;font-family:Manrope;font-weight:700;display:block;font-size:34px;letter-spacing:.01em;text-transform:none;color:rgba(255,255,255,.82);margin-top:10px}
h2 b{color:#ff5c72;font-weight:800}
h2{font-family:Manrope;font-weight:800;font-size:62px;line-height:1.12;letter-spacing:-.02em;margin-top:14px;text-wrap:balance}
p.lead{font:500 33px/1.42 Manrope;color:rgba(255,255,255,.92);margin-top:18px;max-width:940px;text-wrap:pretty}
.cells{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;margin-top:22px;border-top:2px solid rgba(255,255,255,.16);border-bottom:2px solid rgba(255,255,255,.16)}
.cell{padding:18px 20px 16px;border-left:2px solid rgba(255,255,255,.16)}
.cell:first-child{border-left:0;padding-left:2px}
.cell small{display:block;font:800 16px Manrope;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.62)}
.cell b{display:block;font-family:Manrope;font-weight:800;font-size:34px;line-height:1.1;margin-top:8px;white-space:nowrap;letter-spacing:-.01em}
.cell b i{font-style:normal;color:#ff4a63}
.foot{position:absolute;left:0;right:56px;bottom:40px;display:flex;justify-content:space-between;align-items:center}
.web{background:#c8102e;color:#fff;font-family:"REM Display",Manrope;font-weight:700;font-size:25px;letter-spacing:.05em;text-transform:uppercase;padding:17px 40px 15px 56px;clip-path:polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%);display:flex;align-items:center;gap:16px}
.web svg{width:26px;height:26px;display:block}
.foot .n{font:800 22px Manrope;color:rgba(255,255,255,.5);letter-spacing:.14em}
.price{position:absolute;left:56px;right:56px;top:150px}
.pbox{margin-top:34px;background:#fff;color:#111317;border-radius:30px;padding:42px 42px 46px;box-shadow:0 30px 70px rgba(0,0,0,.5);position:relative}
.pbox .l{font:800 19px Manrope;letter-spacing:.18em;text-transform:uppercase;color:#c8102e}
.pbox .big{font-family:"REM Display",Manrope;font-weight:700;font-size:104px;line-height:1;margin-top:16px;letter-spacing:-.02em;white-space:nowrap}
.pbox .alt{font:700 28px Manrope;color:#3a3f48;margin-top:14px}
.sub{margin-top:34px;font:800 19px Manrope;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.62)}
.ticks{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:18px 24px;font:700 28px Manrope;color:#fff}
.ticks div::before{content:"✓";color:#2fd27f;font-weight:800;margin-right:12px}
.plus{margin-top:26px;display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.07);border:2px solid rgba(255,255,255,.16);border-radius:20px;padding:20px 26px;font:800 30px Manrope}
.plus i{font-style:normal;color:#ff5c72;font-size:40px;line-height:1}
.note{margin-top:26px;font:500 24px/1.45 Manrope;color:rgba(255,255,255,.72)}
'''
def page(n,body):
    return f'<!doctype html><meta charset="utf-8"><style>{css}</style><body><div class="bg"></div><div class="top">{logo}</div>{body}<div class="foot"><span class="web">remperformance.sk<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><span class="n">{n} / 7</span></div></body>'
def photo(i,pos='center'):
    return f'<div class="corner c1"></div><div class="corner c2"></div><div class="photo"><img src="file://{S}/src/c63-{i:02d}.jpg" style="object-position:{pos}"></div>'
FL=f'<div class="flag">{flag}<b>Z USA</b></div>'
slides=[
 photo(0,'40% center')+FL+
 '<div class="st red" style="left:70px;top:764px;transform:rotate(-5deg);font-size:34px">V8 Biturbo</div>'
 '<div class="st yellow" style="right:74px;top:742px;transform:rotate(4deg);font-size:46px"><small>Odhad s dovozom</small>30 236 €</div>'
 '<div class="info"><div class="kicker">V ponuke · objednávky do utorka 13. 10.</div><h1>AMG C 63 S<em>Mercedes-AMG, 4.0 V8 biturbo, sedan</em></h1>'
 '<div class="cells"><div class="cell"><small>Výkon</small><b><i>510</i> koní</b></div><div class="cell"><small>Rok</small><b>2019</b></div><div class="cell"><small>Nájazd</small><b>135 367 km</b></div><div class="cell"><small>Pohon</small><b>Zadný</b></div></div></div>',

 photo(3,'center')+FL+
 '<div class="st white" style="left:70px;top:770px;transform:rotate(-4deg);font-size:34px">C 63 S</div>'
 '<div class="info"><div class="kicker">Základné údaje</div><h2>Posledná generácia C 63 s <b>osemvalcom</b></h2>'
 '<div class="cells"><div class="cell"><small>Motor</small><b>4.0 V8</b></div><div class="cell"><small>Prevodovka</small><b>Automat</b></div><div class="cell"><small>Palivo</small><b>Benzín</b></div><div class="cell"><small>Farba</small><b>Strieborná</b></div></div></div>',

 photo(5,'center')+FL+
 '<div class="st white" style="left:70px;top:764px;transform:rotate(-5deg);font-size:30px">Airbagy nevystrelené</div>'
 '<div class="info"><div class="kicker">Stav auta</div><h2><b>Poškodený predok.</b> Kapota, maska a nárazník.</h2>'
 '<p class="lead">Podľa inzerátu ide o ľahké poškodenie troch dielov. Kľúč je k dispozícii, doklady sú typu Salvage. Pojazdnosť overíme pred kúpou.</p></div>',

 photo(9,'center')+
 '<div class="st red" style="right:74px;top:760px;transform:rotate(4deg);font-size:40px"><small>Výkon</small>510 koní</div>'
 '<div class="info"><div class="kicker">Pod kapotou</div><h2>Osemvalec 4.0 biturbo, <b>510 koní</b></h2>'
 '<p class="lead">Motor AMG s dvoma turbami. Nová generácia C 63 má už len štvorvalec, takže V8 zostáva len v jazdených kusoch.</p></div>',

 photo(4,'center')+
 '<div class="st white" style="left:70px;top:768px;transform:rotate(-4deg);font-size:32px">Interiér AMG</div>'
 '<div class="info"><div class="kicker">Interiér</div><h2>Čierna a červená koža, <b>športové sedadlá</b></h2>'
 '<p class="lead">Dvojfarebný kožený interiér, volant AMG a digitálny prístrojový štít.</p></div>',

 photo(14,'center')+
 '<div class="st yellow" style="right:74px;top:752px;transform:rotate(4deg);font-size:44px"><small>Nájazd</small>135 367 km</div>'
 '<div class="info"><div class="kicker">Tachometer</div><h2>Najazdených <b>135 367 km</b></h2>'
 '<p class="lead">Na tachometri je 84 113 míľ.</p></div>',

 '<div class="price"><div class="kicker">2019 Mercedes-AMG C 63 S</div><h2 style="font-size:60px">Koľko to vyjde na Slovensku</h2>'
 '<div class="pbox"><div class="st green" style="right:30px;top:26px;transform:rotate(4deg);font-size:26px;border-color:#111317">So značkami</div>'
 '<div class="l">Odhad ceny na slovenských značkách</div><div class="big">30 236 €</div><div class="alt">Auto dostanete prihlásené, s evidenčným číslom</div></div>'
 '<div class="sub">V cene je</div>'
 '<div class="ticks"><div>Kúpa na aukcii a poplatky</div><div>Doprava z USA</div><div>Clo a DPH</div><div>Homologizácia, STK, EČV</div><div>Kontrola histórie podľa VIN</div><div>Prístav a colný deklarant</div></div>'
 '<div class="plus"><i>+</i>kredit do racem.sk</div>'
 '<p class="note">Cena je odhad a závisí od výsledku aukcie a kurzu dolára. Presnú kalkuláciu Vám pripravíme na požiadanie.</p>'
 '<div class="st red" style="right:0;top:972px;transform:rotate(-3deg);font-size:32px;position:absolute"><small>Objednávky do</small>utorka 13. 10. · 18:30</div></div>'
]
for i,b in enumerate(slides,1): open(f'{S}/rem-s{i}.html','w').write(page(i,b))
