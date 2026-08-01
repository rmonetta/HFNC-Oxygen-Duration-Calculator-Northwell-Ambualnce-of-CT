# HFNC Oxygen Duration Calculator — Version 2

Static web application for estimating oxygen duration during heated high flow nasal cannula therapy.

## Files
- `index.html` — application markup
- `styles.css` — visual design
- `app.js` — HFNC calculation logic and interaction
- `manifest.webmanifest` — installable web-app configuration
- `sw.js` — offline cache
- `assets/` — reserved for icons and graphics

No build step or package installation is required. Upload these files directly to the repository or static hosting provider.

## Calculation
- Available cylinder oxygen: `(PSI − 300) × cylinder factor`
- Cylinder oxygen flow: `((FiO₂ − 20.9) ÷ 79.1) × total HFNC flow`
- Duration: `available oxygen ÷ cylinder oxygen flow`

Supported oxygen sources:
- D Tank — Portable Cylinder
- E Tank — Large Portable Cylinder
- M Tank — Ambulance On-Board Main
