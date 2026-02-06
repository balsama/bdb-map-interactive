# BDB Birding Boundary

A mobile-friendly web app that shows whether you're inside or outside the BDB birding competition boundary. Uses Leaflet and Turf.js with your Boston neighborhoods GeoJSON.

## Features

- **Boundary check** — Uses device GPS to determine if you're inside the competition area
- **Neighborhood name** — When inside, shows which neighborhood you're in
- **Mobile-first** — Designed for smartphones in the field
- **PWA-ready** — Installable as an app on your phone

## Running locally

Serve the folder over HTTP (required for geolocation and service worker):

```bash
# Using npx (Node.js)
npx serve .

# Or Python 3
python -m http.server 8000
```

Then open http://localhost:3000 (or :8000) in your browser. On a phone, use your computer's local IP so you can test on device.

## GeoJSON source

Boundary data is loaded from:
https://raw.githubusercontent.com/balsama/bdb-map/refs/heads/main/public/bdb-neighborhoods.geojson
