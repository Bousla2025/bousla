import { useEffect } from "react";
import L from "leaflet";

const RightClickMenu = ({ onAddLocation }) => {
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.originalEvent.preventDefault();
      
      const map = e.target;
      if (map.closePopup) map.closePopup();

      const button = L.DomUtil.create('button');
      button.innerHTML = 'إضافة موقع جديد';
      Object.assign(button.style, {
        width: '100%',
        padding: '8px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'inherit'
      });
      
      button.onclick = () => {
        onAddLocation(e.latlng.lat, e.latlng.lng);
        if (map.closePopup) map.closePopup();
      };

      L.popup({ closeButton: false })
        .setLatLng(e.latlng)
        .setContent(button)
        .openOn(map);
    };

    const map = document.querySelector('.leaflet-container')?._leaflet_map;
    if (!map) return;

    map.on('contextmenu', handleContextMenu);
    return () => map.off('contextmenu', handleContextMenu);
  }, [onAddLocation]);

  return null;
};

export default RightClickMenu;