'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ORANGE = '#EF9F27';

interface LocationPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onLocationChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix Leaflet icon issue with Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current).setView([lat, lng], 5);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
    }).addTo(map);

    markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
    markerRef.current.on('dragend', () => {
      const pos = markerRef.current?.getLatLng();
      if (pos) onLocationChange(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      markerRef.current?.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Mettre à jour la position du marqueur si les props changent
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
    }
  }, [lat, lng]);

  // Détection du thème pour le style des coordonnées
  const isDark = typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <div className="location-picker">
      <div ref={mapRef} style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden' }} />
      <div className="location-coords">
        <span>Latitude : {lat.toFixed(6)}</span>
        <span>Longitude : {lng.toFixed(6)}</span>
        <button
          type="button"
          className="geoloc-btn"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                onLocationChange(pos.coords.latitude, pos.coords.longitude);
              });
            }
          }}
        >
          📍 Utiliser ma position
        </button>
      </div>
      <style jsx>{`
        .location-picker {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .location-coords {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: ${isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'};
          flex-wrap: wrap;
          gap: 8px;
        }
        .geoloc-btn {
          background: rgba(239,159,39,0.12);
          border: 1px solid rgba(239,159,39,0.3);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .geoloc-btn:hover {
          background: rgba(239,159,39,0.2);
          border-color: ${ORANGE};
        }
      `}</style>
    </div>
  );
}