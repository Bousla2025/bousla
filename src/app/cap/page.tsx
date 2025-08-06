// CaptainApp.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';

// استيراد المكونات الديناميكية
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100" />
  }
);

const MapComponent = dynamic(
  () => import('./MapComponent').then((mod) => mod.MapComponent),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100" />
  }
);

import 'leaflet/dist/leaflet.css';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Order, OrderDetails, Payment, Service, Position, 
  Profile, TrackingData 
} from './types';
import { createCustomIcon, decodePolyline, extractMunicipality } from './mapUtils';
import { 
  fetchData, fetchOrderById, updateOrderStatus, 
  updateServiceStatus 
} from './api';
import { OrderDetailsModal } from './OrderDetailsModal';
import { BetterLuckMessage } from './BetterLuckMessage';




// Dynamic imports for components that depend on window
// استبدال الاستيرادات الديناميكية بهذا الشكل:

const DynamicProfileMenu = dynamic(
  () => import('./menu/ProfileMenu').then((mod) => mod.ProfileMenu),
  { ssr: false }
);

const DynamicPaymentsMenu = dynamic(
  () => import('./menu/PaymentsMenu').then((mod) => mod.PaymentsMenu),
  { ssr: false }
);

const DynamicServicesMenu = dynamic(
  () => import('./menu/ServicesMenu').then((mod) => mod.ServicesMenu),
  { ssr: false }
);

const DynamicLastOrdersMenu = dynamic(
  () => import('./menu/LastOrdersMenu').then((mod) => mod.LastOrdersMenu),
  { ssr: false }
);

const DEFAULT_POSITION: Position = [33.5138, 36.2765];

export default function CaptainApp() {
  // State
  const [active, setActive] = useState(false);
  const [zoneRadius, setZoneRadius] = useState(2);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: "اسم الكابتن",
    phone: "0933696969",
    photo: ""
  });
  const [currentLocation, setCurrentLocation] = useState<Position | null>(DEFAULT_POSITION);
  const [trackingData, setTrackingData] = useState<TrackingData>({
    distance: "0.0",
    time: "0",
    price: "0.0"
  });
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showLastOrders, setShowLastOrders] = useState(false);
  const [userRate, setUserRate] = useState(0);
  const [pokeCount, setPokeCount] = useState(0);
  const [routePoints, setRoutePoints] = useState<Position[]>([]);
  const [markers, setMarkers] = useState<{position: Position, icon: L.Icon, popup: string}[]>([]);
  const [circleCenter, setCircleCenter] = useState<Position>(DEFAULT_POSITION);
  const [circleRadius, setCircleRadius] = useState(2000);
  const [mapZoom, setMapZoom] = useState(14);
  const [isUpdatingService, setIsUpdatingService] = useState<number | null>(null);
  const [isRefreshingPayments, setIsRefreshingPayments] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [acceptOrderStatus, setAcceptOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const captainId = 1;
  const mapRef = useRef<L.Map | null>(null);

  // Memoized values
  const filteredPayments = useMemo(() => {
    return filterMonth 
      ? payments.filter(p => p.insert_time.startsWith(filterMonth))
      : payments;
  }, [payments, filterMonth]);

  const availableMonths = useMemo(() => {
    return Array.from(
      new Set(payments.map(p => p.insert_time.substring(0, 7)))
    ).sort().reverse();
  }, [payments]);

  // Effects
  useEffect(() => {
    fetchInitialData();
    fetchPayments();
    setupLocationTracking();
  }, []);

  // Callbacks
 const fetchInitialData = useCallback(async () => {
  try {
    const servicesRes = await fetchData<Service[]>('cap_ser', { cap_id: captainId });
    if (servicesRes.success) {
      setServices(servicesRes.data || []);
    }
  } catch (error) {
    console.error('Error fetching initial data:', error);
  }
}, [captainId]);

const fetchPayments = useCallback(async () => {
  try {
    setIsRefreshingPayments(true);
    const response = await fetchData<Payment[]>('get_cap_payment', { cap_id: captainId });
    if (response.success) {
      setPayments(response.data || []);
    }
  } catch (error) {
    console.error('Error fetching payments:', error);
  } finally {
    setIsRefreshingPayments(false);
  }
}, [captainId]);

  

  const setupLocationTracking = useCallback(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: Position = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(newLocation);
          setCircleCenter(newLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleActivate = useCallback(() => {
    setActive(!active);
  }, [active]);

  const clearRoute = useCallback(() => {
    setRoutePoints([]);
    setMarkers([]);
  }, []);

  const drawRoute = useCallback(async (startPoint: string, endPoint: string) => {
    if (!startPoint || !endPoint) {
      clearRoute();
      return;
    }

    try {
      const [startLat, startLng] = startPoint.split(',').map(Number);
      const [endLat, endLng] = endPoint.split(',').map(Number);
      
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full`
      );
      const data = await response.json();
      
      let coordinates: [number, number][] = [];
      
      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        
        if (typeof route.geometry === 'string') {
          const decoded = decodePolyline(route.geometry);
          coordinates = decoded.map(point => [point.lat, point.lng]);
        } else if (route.geometry?.coordinates) {
          coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        }
      }
      
      if (coordinates.length === 0) {
        coordinates = [
          [startLat, startLng],
          [endLat, endLng]
        ];
      }
      
      setRoutePoints(coordinates);
      
      setMarkers([
        { 
          position: [startLat, startLng], 
          icon: createCustomIcon('red'),
          popup: "نقطة الانطلاق"
        },
        { 
          position: [endLat, endLng], 
          icon: createCustomIcon('green'),
          popup: "نقطة الوصول"
        }
      ]);
      
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }, [clearRoute]);

  const updateZoneRadius = useCallback((radius: number) => {
    const newRadius = Math.max(0.2, Math.min(5, radius));
    setZoneRadius(newRadius);
    setCircleRadius(newRadius * 1000);
  }, []);

  const handleMyLocation = useCallback(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.flyTo(currentLocation, 16);
      setMapZoom(16);
    }
  }, [currentLocation]);

const openOrderDetails = useCallback(async (orderId: number) => {
  console.log('Fetching order with ID:', orderId); // Debugging
  const order = await fetchOrderById(orderId);
  
  if (!order) {
    console.error('No order data received for ID:', orderId);
    return;
  }

    if (order) {
      setSelectedOrder({
        id: order.id,
        ser_chi_id: order.ser_chi_id,
        start_text: order.start_text,
        end_text: order.end_text,
        distance_km: order.distance_km,
        duration_min: order.duration_min,
        cost: order.cost,
        user_rate: order.user_rate,
        start_detlis: order.start_detlis,
        end_detlis: order.end_detlis,
        notes: order.notes || 'لا توجد ملاحظات'
      });
      setShowOrderDetails(true);
      
      if (order.start_point && order.end_point) {
        drawRoute(order.start_point, order.end_point);
      }
    }
  }, [drawRoute]);

const handleAcceptOrder = useCallback(async () => {
    if (!selectedOrder) return;

    setAcceptOrderStatus('loading');
    
    const result = await updateOrderStatus(selectedOrder.id, captainId);
    
    switch (result.status) {
        case 'success':
            setAcceptOrderStatus('success');
            setTimeout(() => {
                setShowOrderDetails(false);
                setAcceptOrderStatus('idle');
            }, 1000);
            break;
            
        case 'already_reserved':
            setAcceptOrderStatus('idle');
            setTimeout(() => {
                setShowOrderDetails(false);
                setAcceptOrderStatus('idle');
                clearRoute();
                setShowMessage(true);
            }, 1000);
            break;
            
        case 'error':
            setAcceptOrderStatus('error');
            console.error('Error:', result.message);
            break;
            
        default:
            setAcceptOrderStatus('idle');
    }
}, [selectedOrder, captainId, clearRoute]);

  const handleServiceToggle = useCallback(async (service: Service) => {
    const newActive = service.active === 1 ? 0 : 1;
    const originalActive = service.active;

    setServices(prev => prev.map(s => 
      s.id === service.id ? { ...s, active: newActive } : s
    ));

    try {
      await updateServiceStatus(service.id, newActive);
    } catch (error) {
      setServices(prev => prev.map(s => 
        s.id === service.id ? { ...s, active: originalActive } : s
      ));
      console.error('Failed to update service:', error);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowProfile(true)}
            className="text-xl mr-2"
          >
            ☰
          </button>

        
        </div>
        
        <h1 className="text-xl font-bold">كابتن بوصلة</h1>
        
        <div className="flex items-center">
          <span className={`text-sm mr-2 ${active ? "text-white-600" : "text-gray-300"}`}>
            {active ? "نشط" : "غير نشط"}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={active}
              onChange={handleActivate}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Map */}
        <div className="absolute inset-0 z-0">
  <Suspense fallback={<div className="h-full w-full bg-gray-100" />}>
    <MapContainer 
      center={currentLocation || DEFAULT_POSITION} 
      zoom={mapZoom} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      ref={mapRef}
    >
      <MapComponent 
        center={currentLocation || DEFAULT_POSITION}
        zoom={mapZoom}
        routePoints={routePoints}
        markers={markers}
        circleCenter={circleCenter}
        circleRadius={circleRadius}
      />
    </MapContainer>
  </Suspense>
</div>

        {/* Floating Action Buttons */}
        <div className="absolute right-4 bottom-20 flex flex-col space-y-3 z-10">
          <button 
            onClick={handleMyLocation}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 text-blue-600 p-3 rounded-full shadow-lg flex items-center justify-center transition-all"
            title="الموقع الحالي"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button 
            onClick={() => setShowServices(true)}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 text-green-600 p-3 rounded-full shadow-lg flex items-center justify-center transition-all"
            title="الخدمات"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </button>

          <button 
            onClick={() => updateZoneRadius(zoneRadius + 0.1)}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg flex items-center justify-center transition-all"
            title="تكبير الخريطة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <button 
            onClick={() => updateZoneRadius(zoneRadius - 0.1)}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg flex items-center justify-center transition-all"
            title="تصغير الخريطة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>

        {/* Dynamic Components */}
        {showProfile && (
          <DynamicProfileMenu 
            profile={profile}
            onClose={() => setShowProfile(false)}
            onShowServices={() => setShowServices(true)}
            onShowPayments={() => {
              setShowPayments(true);
              setShowProfile(false);
            }}
            onShowLastOrders={() => {
              setShowLastOrders(true);
              setShowProfile(false);
              openOrderDetails(1);
            }}
          />
        )}

        {showPayments && (
          <DynamicPaymentsMenu
            payments={filteredPayments}
            availableMonths={availableMonths}
            filterMonth={filterMonth}
            isRefreshing={isRefreshingPayments}
            onClose={() => setShowPayments(false)}
            onRefresh={fetchPayments}
            onFilterMonth={setFilterMonth}
          />
        )}

        {showServices && (
          <DynamicServicesMenu
            services={services}
            isUpdatingService={isUpdatingService}
            onClose={() => setShowServices(false)}
            onToggleService={handleServiceToggle}
          />
        )}

        {showLastOrders && (
          <DynamicLastOrdersMenu
            orders={orders.filter(o => o.status === 'end')}
            onClose={() => setShowLastOrders(false)}
            onOrderClick={openOrderDetails}
          />
        )}

        {showOrderDetails && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => {
              setShowOrderDetails(false);
              setAcceptOrderStatus('idle');
              clearRoute();
              
            }}
            
            onAccept={handleAcceptOrder}
            acceptStatus={acceptOrderStatus}
          />
        )}

        {showMessage && (
          <BetterLuckMessage onClose={() => setShowMessage(false)} />
        )}
      </main>
    </div>
  );
};