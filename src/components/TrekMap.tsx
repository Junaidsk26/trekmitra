import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Mountain, Tent, Droplets, Camera } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icon in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons based on waypoint type
const createCustomIcon = (type: string) => {
  const iconHtml = renderToStaticMarkup(
    <div className={`p-2 rounded-full border-2 border-white shadow-lg ${
      type === 'base' ? 'bg-blue-500' : 
      type === 'peak' ? 'bg-red-500' : 
      type === 'camp' ? 'bg-orange-500' : 
      type === 'water' ? 'bg-cyan-500' : 
      'bg-nature-500'
    }`}>
      {type === 'base' && <MapPin className="w-4 h-4 text-white" />}
      {type === 'peak' && <Mountain className="w-4 h-4 text-white" />}
      {type === 'camp' && <Tent className="w-4 h-4 text-white" />}
      {type === 'water' && <Droplets className="w-4 h-4 text-white" />}
      {type === 'view' && <Camera className="w-4 h-4 text-white" />}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

interface TrekMapProps {
  center: [number, number];
  name: string;
  route?: [number, number][];
  waypoints?: {
    name: string;
    coordinates: [number, number];
    description?: string;
    type: 'base' | 'peak' | 'camp' | 'water' | 'view';
  }[];
}

export default function TrekMap({ center, name, route, waypoints }: TrekMapProps) {
  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0">
        <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {route && (
            <Polyline 
              positions={route} 
              pathOptions={{ color: '#10b981', weight: 5, opacity: 0.7, dashArray: '10, 10' }} 
            />
          )}

          {waypoints?.map((wp, i) => (
            <Marker 
              key={i} 
              position={wp.coordinates} 
              icon={createCustomIcon(wp.type)}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <h4 className="font-bold text-nature-900">{wp.name}</h4>
                  {wp.description && <p className="text-xs text-nature-600 mt-1">{wp.description}</p>}
                  <span className="inline-block mt-2 px-2 py-0.5 bg-nature-100 text-nature-700 text-[10px] font-bold uppercase rounded">
                    {wp.type}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {!waypoints && (
            <Marker position={center}>
              <Popup>
                {name} Base Village
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 glass rounded-2xl border border-white/5">
        {[
          { type: 'base', label: 'Base Village', color: 'bg-blue-500' },
          { type: 'peak', label: 'Summit', color: 'bg-red-500' },
          { type: 'camp', label: 'Campsite', color: 'bg-orange-500' },
          { type: 'view', label: 'Point of Interest', color: 'bg-nature-500' },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-xs text-nature-300">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
