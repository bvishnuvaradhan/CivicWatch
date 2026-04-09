import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Issue } from '../types';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type IssuesMapProps = {
  location: { lat: number; lng: number };
  issues: Issue[];
};

const IssuesMap = ({ location, issues }: IssuesMapProps) => {
  return (
    <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {issues.map((issue) => (
        <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
          <Popup>
            <div className="p-2">
              <h4 className="font-bold text-slate-900">{issue.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
              <Link to={`/issue/${issue.id}`} className="text-indigo-600 text-xs font-bold mt-2 block">View Details</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default IssuesMap;
