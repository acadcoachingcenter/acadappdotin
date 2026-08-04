import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function LocationMap({
  center,
  markers = [],
  radiusKm,
  height = 320,
  zoom = 12
}) {
  const hasCenter = center && center[0] != null && center[1] != null;
  if (!hasCenter) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-sm border border-slate-200"
        style={{ height }}
      >
        Use GPS or enter an address to load the map.
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="rounded-lg overflow-hidden border border-slate-200 z-0"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Recenter center={center} />
        {radiusKm && (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#1565C0",
              fillColor: "#1565C0",
              fillOpacity: 0.08
            }}
          />
        )}
        <CircleMarker
          center={center}
          radius={8}
          pathOptions={{
            color: "#1565C0",
            fillColor: "#1565C0",
            fillOpacity: 0.9
          }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
        {markers.map((m, i) => (
          <CircleMarker
            key={i}
            center={[m.lat, m.lng]}
            radius={7}
            pathOptions={{
              color: m.color || "#16a34a",
              fillColor: m.color || "#16a34a",
              fillOpacity: 0.8
            }}
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}