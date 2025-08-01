// mapcomponent.js

import React, { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Create custom icons
const createCustomIcon = (color) => {
  const svgIcon = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24px" height="24px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`
  );

  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${svgIcon}`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const startIcon = createCustomIcon('red');
const endIcon = createCustomIcon('green');
const defaultIcon = createCustomIcon('blue');

// Sub-component to handle map clicks
const MapClickHandler = ({ active, onSelect }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!active || !map) return;
  
    const handleClick = (e) => {
      onSelect(e.latlng.lat, e.latlng.lng);
    };
  
    map.on('click', handleClick);
  
    return () => {
      map.off('click', handleClick);
    };
  }, [active, map, onSelect]);
  
  return null;
};

// Sub-component to adjust map view
const RouteAndLocationUpdater = ({ routes, locations, initialCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    const allPoints = [
      ...routes.flatMap(route => 
        route.coordinates ? route.coordinates.map(coord => [coord[0], coord[1]]) : []
      ),
      ...locations.filter(loc => loc.lat && loc.lon).map(loc => [loc.lat, loc.lon])
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      setTimeout(() => {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 2,
          easeLinearity: 0.25
        });
      }, 500);
    } else if (initialCoordinates && !isNaN(initialCoordinates[0])) {
      map.setView(initialCoordinates, 13);
    }
  }, [routes, locations, map, initialCoordinates]);

  return null;
};

// Main component
const MapComponent = ({ 
  coordinates = [33.5138, 36.2765], 
  routes = [], 
  locations = [], 
  isSelectingOnMap = false, 
  onSelectLocation = () => {} 
}) => {
  const validCoordinates = 
    Array.isArray(coordinates) && 
    coordinates.length === 2 && 
    !isNaN(coordinates[0]) && 
    !isNaN(coordinates[1])
      ? [coordinates[0], coordinates[1]]
      : [33.5138, 36.2765];

  const getRouteColor = (index) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    return colors[index % colors.length];
  };

  return (
    <MapContainer 
      center={validCoordinates} 
      zoom={13} 
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetmap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler active={isSelectingOnMap} onSelect={onSelectLocation} />
      <RouteAndLocationUpdater 
        routes={routes} 
        locations={locations} 
        initialCoordinates={validCoordinates} 
      />

      {routes.map((route, index) => {
        const { coordinates } = route;
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
          return null;
        }

        return (
          <Polyline 
            key={`route-${index}`}
            positions={coordinates}
            color={getRouteColor(index)}
            weight={4}
            opacity={0.7}
          />
        );
      })}

      {locations.map((location, index) => {
        if (!location.lat || !location.lon || isNaN(location.lat) || isNaN(location.lon)) {
          return null;
        }

        const isStart = location.isStartPoint;
        const isEnd = location.isEndPoint;

        return (
          <Marker
            key={`marker-${index}`}
            position={[location.lat, location.lon]}
            icon={isStart ? startIcon : isEnd ? endIcon : defaultIcon}
          >
            <Popup>
              <div className="font-medium">
                {isStart ? 'نقطة الانطلاق' : isEnd ? 'نقطة الوصول' : 'موقع مختار'}
              </div>
              <div>{location.name}</div>
              <div className="text-xs text-gray-500">
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;