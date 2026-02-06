/**
 * BDB Birding Boundary Check
 * Mobile-friendly app using Leaflet + Turf.js
 */

const GEOJSON_URL = 'https://raw.githubusercontent.com/balsama/bdb-map/refs/heads/main/public/bdb-neighborhoods.geojson';

// Map center (Boston) - matches bdb-map BoundaryMap
const BOSTON_CENTER = [42.364768, -71.054369];

let map;
let boundaryLayer;
let userMarker;
let boundaryFeatures = [];

const statusEl = document.getElementById('status');
const statusTextEl = statusEl.querySelector('.status-text');
const locateBtn = document.getElementById('locate-btn');

function setStatus(type, text) {
  statusEl.className = `status status-${type}`;
  statusTextEl.textContent = text;
}

function isPointInBoundary(lng, lat) {
  const point = turf.point([lng, lat]);
  for (const feature of boundaryFeatures) {
    if (feature.geometry && turf.booleanPointInPolygon(point, feature)) {
      return {
        inside: true,
        neighborhood: feature.properties?.Name || 'Competition area'
      };
    }
  }
  return { inside: false };
}

function updateLocation(lat, lng) {
  const result = isPointInBoundary(lng, lat);

  if (result.inside) {
    setStatus('inside', `Inside boundary · ${result.neighborhood}`);
  } else {
    setStatus('outside', 'Outside boundary');
  }

  // Update marker
  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
  } else {
    userMarker = L.marker([lat, lng]).addTo(map);
  }

  // Center map on user
  map.setView([lat, lng], Math.max(map.getZoom(), 14));
}

function handleLocationError(err) {
  console.warn('Geolocation error:', err);
  let msg = 'Unable to get location';
  if (err.code === 1) {
    msg = 'Location denied. Open in Safari (not home screen), or Settings → Safari → Clear History to reset.';
  } else if (err.code === 2) {
    msg = 'Location unavailable';
  } else if (err.code === 3) {
    msg = 'Location request timed out';
  }
  setStatus('error', msg);
}

function requestLocation() {
  setStatus('unknown', 'Getting location…');

  if (!navigator.geolocation) {
    setStatus('error', 'Geolocation not supported');
    return;
  }

  // enableHighAccuracy: false can help on iOS - precise GPS may trigger stricter permission flow
  navigator.geolocation.getCurrentPosition(
    (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
    handleLocationError,
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
  );
}

function initMap() {
  map = L.map('map', {
    center: BOSTON_CENTER,
    zoom: 13,
    zoomControl: false
  });

  L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    attribution: '© Stadia Maps',
    maxZoom: 19
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  locateBtn.addEventListener('click', requestLocation);
}

async function loadBoundary() {
  try {
    const resp = await fetch(GEOJSON_URL);
    const geojson = await resp.json();

    if (geojson.type === 'FeatureCollection' && geojson.features) {
      boundaryFeatures = geojson.features;
    } else {
      boundaryFeatures = [geojson];
    }

    boundaryLayer = L.geoJSON(geojson, {
      style: {
        fillColor: '#fb4e42',
        weight: 2,
        opacity: 0.6,
        color: '#0d1f2f',
        fillOpacity: 0.6
      },
      onEachFeature: (feature, layer) => {
        const neighborhood = feature.properties?.Name || 'Neighborhood';
        layer.bindTooltip(
          `<strong>${neighborhood}</strong><br>within Big Day Boston boundary`,
          { permanent: false, direction: 'center' }
        );
      }
    }).addTo(map);

    // Fit map to boundary with padding
    if (boundaryLayer.getBounds().isValid()) {
      map.fitBounds(boundaryLayer.getBounds(), { padding: [30, 30] });
    }

    // Don't auto-request location - mobile browsers require a user gesture (tap) to show
    // the permission prompt. Wait for user to tap "Check Location" instead.
    setStatus('unknown', 'Tap "Check Location" to see if you\'re inside the boundary');
  } catch (err) {
    console.error('Failed to load boundary:', err);
    setStatus('error', 'Failed to load boundary');
  }
}

function init() {
  initMap();
  loadBoundary();
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
