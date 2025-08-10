// MapComponent.tsx
'use client';

import React, { useEffect } from 'react';
import { TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Position } from './types';


interface MapComponentProps {
  center: Position;
  zoom: number;
  routePoints?: Position[];
  markers?: {
    position: Position;
    icon: L.Icon;
    popup: string;
  }[];
  circleCenter?: Position;
  circleRadius?: number;
}

const MapUpdater = ({ center, zoom }: { center: Position; zoom: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  routePoints = [],
  markers = [],
  circleCenter,
  circleRadius,
}) => {
  const map = useMap();

  useEffect(() => {
    // إصلاح أيقونات Leaflet عند التحميل
    const defaultIcon = L.Icon.Default.prototype;
    
    // @ts-expect-error - الخاصية غير موجودة في الأنواع لكنها موجودة فعليًا
    delete defaultIcon._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/marker-icon-2x.png',
      iconUrl: '/images/marker-icon.png',
      shadowUrl: '/images/marker-shadow.png',
    });
  }, []);

  
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} zoom={zoom} />
      
      {routePoints.length > 1 && (
        <Polyline 
          positions={routePoints}
          color="#3B82F6"
          weight={5}
          opacity={0.7}
          lineCap="round"
          lineJoin="round"
        />
      )}
      
      {markers.map((marker, index) => (
        <Marker key={`marker-${index}`} position={marker.position} icon={marker.icon}>
          <Popup>{marker.popup}</Popup>
        </Marker>
      ))}
      
      {circleCenter && circleRadius && (
        <Circle
          center={circleCenter}
          radius={circleRadius}
          color="red"
          fillOpacity={0.1}
        />
      )}
    </>
  );
};