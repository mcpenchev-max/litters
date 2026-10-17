# Litters — Carrot Cake Litter Diary

Live: https://litters.corgi.bg

Static site (no build step) on Vercel, backed by Firebase (Auth email-link + Firestore, Spark plan).

- `index.html`, `base.css`, `app.css`, `app.js` — the app UI and logic
- `fb.js` — Firebase backend (auth, Firestore data layer, photos stored in Firestore)
- `config.js` — Firebase web config, owner email, default litter
- `firestore.rules` — security rules (paste into Firebase console → Firestore → Rules)

Roles: owner (config.js) · editors (`roles/{email}`) · owners of puppies see only their dossier (`dossiers/{email}/byLitter/{litter}`).
