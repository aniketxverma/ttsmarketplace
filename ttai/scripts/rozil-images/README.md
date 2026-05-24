# Rozil — Image Upload Folder

Put your Rozil product images here, then run:

```
node scripts/upload-rozil-images.js
```

## Required files

### Root (brand identity)
```
logo.png                          ← Rozil logo (the rainbow circle)
banner.jpg                        ← Wide header image (product lineup, e.g. 1400×400)
og-image.jpg                      ← Social share image (1200×630)
```

### products/  (14 product photos)
```
products/detergente-oxy.jpg
products/gel-activo-max.jpg
products/mas-color.jpg
products/la-abuela.jpg
products/jabon-marsella.jpg
products/max-power.jpg
products/suavizante-pasion-rojo.jpg
products/suavizante-pasion-azul.jpg
products/suavizante-pasion-rosa.jpg
products/fregasuelos-mascotas.jpg
products/oxy-activo-color.jpg
products/oxy-activo-blanca.jpg
products/limpiahogar.jpg
products/lavavajillas-profesional-5l.jpg
```

### gallery/  (6 larger showcase photos)
```
gallery/gama-completa.jpg          ← All products together
gallery/suavizantes-pasion.jpg     ← 3 softeners side by side
gallery/oxy-activo.jpg             ← OXY range
gallery/lavavajillas-5l.jpg        ← Dishwasher 5L bottle
gallery/fregasuelos-mascotas.jpg   ← Pet floor cleaner
gallery/fabrica-malaga.jpg         ← Factory / office photo
```

### certs/  (optional certificate images)
```
certs/registro-sanitario.jpg
certs/reach-clp.jpg
certs/registro-mercantil.jpg
```

## Notes
- Files not found are silently skipped (you can upload in batches)
- Re-running the script overwrites existing files (safe to re-run)
- JPG and PNG both work; WebP is also accepted
- Recommended product image size: 600×600 px minimum
- Gallery images: 900px wide minimum
