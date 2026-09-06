# NEXUS FINAL - Web Surumu

Bu klasor Vercel icin hazirlanan frontend dosyalarini icerir (index.html, style.css, app.js, auth.js).

## Yapman gerekenler:

1. backend/ klasorunu Render.com gibi bir servise ayri deploy et (Vercel backend icin uygun degil).
2. Render sana bir adres verecek, ornegin: https://nexus-xxxx.onrender.com
3. app.js ve auth.js icindeki YOUR-BACKEND-URL.onrender.com yazan yerleri gercek adresle degistir:
   sed -i "s|YOUR-BACKEND-URL.onrender.com|GERCEK-ADRESIN|g" app.js auth.js
4. Bu klasoru (NEXUS FINAL) bir GitHub reposuna push et.
5. Vercel uzerinden o repoyu import et, root directory olarak bu klasoru sec, deploy et.
