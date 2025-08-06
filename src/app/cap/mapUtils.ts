// mapUtils.ts
// mapUtils.ts
'use client';

import { Position } from './types';

let L: typeof import('leaflet') | null = null;

if (typeof window !== 'undefined') {
  import('leaflet').then((leaflet) => {
    L = leaflet;
    
    // Fix for default marker icons
    const defaultIconProto = L.Icon.Default.prototype as typeof L.Icon.Default.prototype & {
      _getIconUrl?: string;
    };
    delete defaultIconProto._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/marker-icon-2x.png',
      iconUrl: '/images/marker-icon.png',
      shadowUrl: '/images/marker-shadow.png',
    });
  });
}

export const createCustomIcon = (color: string) => {
  if (!L) return {} as L.Icon;
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`
    )}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export const decodePolyline = (encoded: string) => {
  const poly: {lat: number, lng: number}[] = [];
  let index = 0, lat = 0, lng = 0;
  const len = encoded.length;
  
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    poly.push({lat: lat * 1e-5, lng: lng * 1e-5});
  }
  
  return poly;
};

export const extractMunicipality = (text: string) => {
  if (!text) return 'غير محدد';
  if (text.includes("بلدية")) {
    return text.split("بلدية")[1].split(",")[0].trim();
  }
  if (text.includes("المدينة:")) {
    return text.split("المدينة:")[1].split(",")[0].trim();
  }
  return text;
};