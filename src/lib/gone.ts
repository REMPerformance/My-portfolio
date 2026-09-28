/** 410 Gone – starý obsah (LP Webdesign) natrvalo zrušený. Vyhľadávače ho vyradia rýchlejšie ako pri 404. */
export function gone() {
  return new Response(
    `<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Stránka bola zrušená</title></head><body style="font-family:sans-serif;background:#050505;color:#fff;padding:40px"><h1>Táto stránka bola natrvalo zrušená</h1><p>Na remperformance.sk dnes nájdete dovoz áut z USA. <a style="color:#ff3b55" href="https://remperformance.sk/">Prejsť na úvod</a></p></body></html>`,
    { status: 410, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, noarchive", "cache-control": "public, max-age=86400" } }
  );
}
