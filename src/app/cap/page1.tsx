//cap.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-toastify/dist/ReactToastify.css';


// تعريف الأنواع
type Order = {
  id: number;
  user_id: number;
  caption_id: number;
  start_point: string;
  start_text: string;
  end_point: string;
  end_text: string;
  cost: string;
  distance_km: string;
  duration_min: number;
  status: string;
  other_phone: string;
  notes: string;
  ser_id: number;
  startplacetxt: string;
  endplacetxt: string;
  ser_chi_id: number;
  user_rate: number;
  start_detlis: string;
  end_detlis: string;
  
};

type OrderDetails = {
  id: number;
  ser_chi_id: number;
  start_text: string;
  end_text: string;
  distance_km: string;
  duration_min: number;
  cost: string;
  user_rate: number;
  start_detlis: string;
  end_detlis: string;
  notes: string;
};

type Service = {
  id: number;
  ser_id: number;
  name1: string;
  f_km: string;
  km: string;
  m_cost: string;
  add_cost: string;
  dis_cost: string;
  photo1: string;
  active: number; 
};

type Payment = {
  id: number;
  cap_id: number;
  mony: string;
  type1: string;
  center_id: number;
  note: string;
  insert_time: string;
  update_time: string;
  date_formatted: string;
};

type PaymentsByMonth = {
  month_name: string;
  payments: Payment[];
};

type Position = [number, number];

// إنشاء أيقونات مخصصة
const createCustomIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`
    )}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const startIcon = createCustomIcon('red');
const endIcon = createCustomIcon('green');

// مكون الخريطة
const Map = ({ center, zoom, children }: { center: Position, zoom: number, children?: React.ReactNode }) => {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
};

// مكون لتحديث عرض الخريطة
const MapUpdater = ({ center, zoom }: { center: Position, zoom: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

const decodePolyline = (encoded: string) => {
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



export default function CaptainApp() {
  // State variables
  const [active, setActive] = useState(false);
  const [zoneRadius, setZoneRadius] = useState(2);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [profile, setProfile] = useState({
    name: "اسم الكابتن",
    phone: "0933696969",
    photo: ""
  });
  const [currentLocation, setCurrentLocation] = useState<Position | null>([33.5138, 36.2765]);
  const [trackingData, setTrackingData] = useState({
    distance: "0.0",
    time: "0",
    price: "0.0"
  });
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showLastOrders, setShowLastOrders] = useState(false);
  const [userRate, setUserRate] = useState(0);
  const [pokeCount, setPokeCount] = useState(0);
  const [routePoints, setRoutePoints] = useState<Position[]>([]);
  const [markers, setMarkers] = useState<{position: Position, icon: L.Icon, popup: string}[]>([]);
  const [circleCenter, setCircleCenter] = useState<Position>([33.5138, 36.2765]);
  const [circleRadius, setCircleRadius] = useState(2000);
  const [mapZoom, setMapZoom] = useState(14);
  const [isUpdatingService, setIsUpdatingService] = useState<number | null>(null);
  const [isRefreshingPayments, setIsRefreshingPayments] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
const [showOrderDetails, setShowOrderDetails] = useState(false);
const [showMessage, setShowMessage] = useState(false);


const [acceptOrderStatus, setAcceptOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const captainId = 1; // Default captain ID
  const mapRef = useRef<L.Map | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
    fetchPayments();
    setupLocationTracking();
  }, []);


  //جلب الطلب الجديد

  const fetchOrderById = async (orderId: number): Promise<Order | null> => {
  try {
    const response = await fetch(`https://alrasekhooninlaw.com/bousla/cap/get_order.php?id=${orderId}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data.success && data.order) {
      return data.order;
    } else {
      throw new Error(data.message || 'Order not found');
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

  const openOrderDetails = async (orderId: number) => {
  const order = await fetchOrderById(orderId);
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
    
    // رسم المسار إذا كانت هناك نقاط بداية ونهاية
    if (order.start_point && order.end_point) {
      drawRoute(order.start_point, order.end_point);
    }
  }
};


///رسائل المتابعة وتعديل حالة status
const updateOrderStatus = async (orderId: number) => {
  try {
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const response = await fetch('https://alrasekhooninlaw.com/bousla/cap/update_order_status.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id: orderId.toString(),
        cap_id: captainId.toString(),
      }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      // نعيد كائن الخطأ مع البيانات الواردة من السيرفر
      throw {
        isApiError: true,
        status: response.status,
        message: data.message || 'فشل في تحديث حالة الطلب',
        apiResponse: data
      };
    }

    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};
  //جلب الدفعات
 const fetchPayments = async () => {
  try {
    setIsRefreshingPayments(true);
    const response = await fetchData('get_cap_payment', { cap_id: captainId });
    if (response.success) {
      setPayments(response.data || []);
    }
  } catch (error) {
    console.error('Error fetching payments:', error);
  } finally {
    setIsRefreshingPayments(false);
  }
};

  // تصفية الدفعات حسب الشهر إذا كان محدداً
  const filteredPayments = filterMonth 
    ? payments.filter(p => p.insert_time.startsWith(filterMonth))
    : payments;

  // الحصول على الأشهر المتاحة للتصفية
  const availableMonths = Array.from(
    new Set(payments.map(p => p.insert_time.substring(0, 7)))
  ).sort().reverse();

  //تلوين السحب والدفع في المدفوعات
  const getPaymentTypeInfo = (type: string) => {
  switch(type.toLowerCase()) {
    case 'withdrawal':
      return {
        text: 'سحب',
        color: 'bg-red-100 text-red-800', // لون أحمر فاتح للنص الخلفية
        border: 'border-red-200', // لون الحدود
      };
    case 'payment':
      return {
        text: 'تسديد',
        color: 'bg-green-100 text-green-800', // لون أخضر فاتح للنص الخلفية
        border: 'border-green-200', // لون الحدود
      };
    default:
      return {
        text: type,
        color: 'bg-gray-100 text-gray-800',
        border: 'border-gray-200',
      };
  }
};


  // دالة مخصصة لتحديث حالة الخدمة
  const updateServiceStatus = async (serviceId: number, newActive: number) => {
    setIsUpdatingService(serviceId);
    try {
      const response = await fetch('https://alrasekhooninlaw.com/bousla/cap/cap_ser.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ser_id: serviceId.toString(),
          active: newActive.toString()
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'فشل في تحديث الخدمة');
      }

      return data;
    } finally {
      setIsUpdatingService(null);
    }
  };

  // دالة معالجة تغيير حالة الخدمة
  const handleServiceToggle = async (service: Service) => {
    const newActive = service.active === 1 ? 0 : 1;
    const originalActive = service.active;

    console.log('المعاملات المرسلة:', {
      ser_id: service.id,
      active: newActive
    });

    // تحديث واجهة المستخدم فوراً
    setServices(prev => prev.map(s => 
      s.id === service.id ? { ...s, active: newActive } : s
    ));

    try {
      const result = await updateServiceStatus(service.id, newActive);
      console.log('نتيجة التحديث:', result);
      console.log(`تم التحديث بنجاح`);
    } catch (error) {
      console.error('خطأ في التحديث:', error);
      // التراجع عن التغيير
      setServices(prev => prev.map(s => 
        s.id === service.id ? { ...s, active: originalActive } : s
      ));
      console.error('فشل في التحديث: ' + getErrorMessage(error));
    }
  };

  const fetchInitialData = async () => {
    try {
      

      // Fetch services
      const servicesRes = await fetchData('cap_ser', { cap_id: captainId });
      if (servicesRes.success) {
        setServices(servicesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      console.error('حدث خطأ في جلب البيانات');
    }
  };

  const fetchData = async (endpoint: string, params: Record<string, any> = {}): Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }> => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`https://alrasekhooninlaw.com/bousla/cap/${endpoint}.php?${queryString}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error(`Error fetching ${endpoint}:`, error);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'حدث خطأ غير متوقع';
  }

  const setupLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
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
    }
  };

  const handleActivate = async () => {
    setActive(!active);
  };

  const clearRoute = () => {
  setRoutePoints([]); // إفراغ مصفوفة نقاط المسار
  setMarkers([]);     // إزالة العلامات (Markers)
};

 const drawRoute = async (startPoint: string, endPoint: string) => {
  if (!startPoint || !endPoint) {
    clearRoute(); // مسح المسار إذا كانت النقاط غير صالحة
    return;
  }
  try {
    const [startLat, startLng] = startPoint.split(',').map(Number);
    const [endLat, endLng] = endPoint.split(',').map(Number);
    
    // استدعاء خدمة OSRM للحصول على المسار
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full`
    );
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    let coordinates: [number, number][] = [];
    
    if (typeof route.geometry === 'string') {
      // فك تشفير المسار إذا كان مشفراً
      const decoded = decodePolyline(route.geometry);
      coordinates = decoded.map(point => [point.lat, point.lng]);
    } else if (route.geometry?.coordinates) {
      // استخدام الإحداثيات مباشرة إذا كانت متاحة
      coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    } else {
      // استخدام خط مستقيم كحل بديل
      coordinates = [
        [startLat, startLng],
        [endLat, endLng]
      ];
    }
    
    setRoutePoints(coordinates);
    
    setMarkers([
      { 
        position: [startLat, startLng], 
        icon: startIcon,
        popup: "نقطة الانطلاق"
      },
      { 
        position: [endLat, endLng], 
        icon: endIcon,
        popup: "نقطة الوصول"
      }
    ]);
    
    // حساب المسافة والوقت لعرضها
    const distance = (route.distance / 1000).toFixed(1);
    const duration = Math.round(route.duration / 60);
    
    return { distance, duration };
    
  } catch (error) {
    console.error('Error calculating route:', error);
    // استخدام خط مستقيم كحل بديل عند الخطأ
    const [startLat, startLng] = startPoint.split(',').map(Number);
    const [endLat, endLng] = endPoint.split(',').map(Number);
    
    setRoutePoints([
      [startLat, startLng],
      [endLat, endLng]
    ]);
    
    setMarkers([
      { 
        position: [startLat, startLng], 
        icon: startIcon,
        popup: "نقطة الانطلاق"
      },
      { 
        position: [endLat, endLng], 
        icon: endIcon,
        popup: "نقطة الوصول"
      }
    ]);
    
    return { distance: '0.0', duration: 0 };
  }
};


  const updateCircleOnMap = (radius: number) => {
    setZoneRadius(radius);
    setCircleRadius(radius * 1000);
  };

  const extractMunicipality = (text: string) => {
    if (text.includes("بلدية")) {
      return text.split("بلدية")[1].split(",")[0].trim();
    }
    if (text.includes("المدينة:")) {
      return text.split("المدينة:")[1].split(",")[0].trim();
    }
    return text;
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapZoom + 1);
      setMapZoom(mapZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapZoom - 1);
      setMapZoom(mapZoom - 1);
    }
  };

  const handleMyLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.flyTo(currentLocation, 16);
      setMapZoom(16);
    }
  };

  const updateZoneRadius = (radius: number) => {
    const newRadius = Math.max(0.2, Math.min(5, radius));
    setZoneRadius(newRadius);
    setCircleRadius(newRadius * 1000);
  };

  const MapRefUpdater = ({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) => {
    const map = useMap();
    
    useEffect(() => {
      if (map) {
        (mapRef as React.MutableRefObject<L.Map | null>).current = map;
      }
    }, [map, mapRef]);

    return null;
  };

  // دالة الموافقة على الطلب
const handleAcceptOrder = async () => {
  if (!selectedOrder) return;

  try {
    setAcceptOrderStatus('loading');
    
    const response = await updateOrderStatus(selectedOrder.id);
    
    // إذا وصلنا إلى هنا يعني أن العملية نجحت
    console.log('تم قبول الطلب بنجاح:', selectedOrder.id);
    setAcceptOrderStatus('success');
    
    setTimeout(() => {
      setShowOrderDetails(false);
      setAcceptOrderStatus('idle');
    }, 1000);
    
  } catch (error) {
    console.error('فشل في قبول الطلب:', error);
    setAcceptOrderStatus('error');

    // معالجة الأخطاء المختلفة
    if (typeof error === 'object' && error !== null) {
      const err = error as {
        isApiError?: boolean;
        message?: string;
        apiResponse?: { message?: string };
      };

      // تحقق من وجود رسالة الخطأ
      const errorMessage = err.message || err.apiResponse?.message;

      if (errorMessage && errorMessage.includes("العملية لم تتم") || 
         errorMessage?.includes("الطلب محجوز بالفعل")) {
           setShowOrderDetails(false);
            setAcceptOrderStatus('idle');
            clearRoute()
        setShowMessage(true);
      }
    }
  }
};

//توسيع العنوان في السرسالة
const OrderDetailsModal = () => {
  if (!selectedOrder) return null;
  
  const [expandedStart, setExpandedStart] = useState(false);
  const [expandedEnd, setExpandedEnd] = useState(false);

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return 'لا توجد تفاصيل';
    if (text.length <= maxLength || expandedStart || expandedEnd) return text;
    return `${text.substring(0, maxLength)}...`;
  };

// مكون عرض طلب جديد
 return (
    <div className="fixed bottom-2 left-0 right-0 mx-4 bg-white rounded-lg shadow-xl z-50 border border-gray-300 rtl">
      {/* زر الإغلاق في الأعلى */}
      <div className="flex justify-end p-2">
        <button 
          onClick={() => {
            setShowOrderDetails(false);
            setAcceptOrderStatus('idle');
            clearRoute()
           
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4">
        {/* العنوان */}
        <div className="flex items-center mb-3">
          <h3 className="flex-1 text-center text-xl font-bold text-red-500">
            {selectedOrder.start_text} - {selectedOrder.end_text}
          </h3>
        </div>

        {/* نوع الخدمة */}
        <div className="flex items-center mb-3">
          <span className="text-xl font-bold text-gray-600">نوع الطلب</span>
          <span className="mr-3 text-xl font-bold">{selectedOrder.ser_chi_id}</span>
        </div>

        {/* المسافة والوقت */}
        <div className="mb-3">
          <div className="flex">
            <div className="flex-1 text-center text-sm font-sans text-black">
              المسافة: {selectedOrder.distance_km} كم
            </div>
            <div className="flex-1 text-center text-sm font-sans text-black">
              الوقت: {selectedOrder.duration_min} دقيقة
            </div>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

        {/* السعر والتقييم */}
        <div className="mb-3">
          <div className="flex">
            <div className="flex-1 text-center text-sm font-sans text-black">
              السعر: {selectedOrder.cost} ل.س
            </div>
            <div className="flex-1 text-center text-sm font-sans text-black">
              تقييم الزبون: 
              {Array(5).fill(0).map((_, i) => (
                <span key={i} className={i < selectedOrder.user_rate ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

        {/* موقع البداية */}
        <div className="mb-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span 
              className="mr-2 text-sm font-bold text-black flex-1 cursor-pointer"
              onClick={() => setExpandedStart(!expandedStart)}
            >
              من: {truncateText(selectedOrder.start_detlis)}
              {selectedOrder.start_detlis && selectedOrder.start_detlis.length > 30 && (
                <span className="text-blue-500 text-xs mr-1">
                  {expandedStart ? 'إخفاء' : 'المزيد'}
                </span>
              )}
            </span>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

        {/* موقع الوصول */}
        <div className="mb-3 mt-2">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span 
              className="mr-2 text-sm font-bold text-black flex-1 cursor-pointer"
              onClick={() => setExpandedEnd(!expandedEnd)}
            >
              الى: {truncateText(selectedOrder.end_detlis)}
              {selectedOrder.end_detlis && selectedOrder.end_detlis.length > 30 && (
                <span className="text-blue-500 text-xs mr-1">
                  {expandedEnd ? 'إخفاء' : 'المزيد'}
                </span>
              )}
            </span>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

        {/* الملاحظات */}
        {selectedOrder.notes && (
          <div className="mb-3">
            <p className="text-lg font-bold text-red-600 mr-2">{selectedOrder.notes}</p>
          </div>
        )}

        {/* زر الموافقة */}
        {acceptOrderStatus === 'loading' ? (
          <button
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold text-lg flex justify-center items-center mt-2"
            disabled
          >
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            جاري المعالجة...
          </button>
        ) : acceptOrderStatus === 'success' ? (
          <button
            className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-lg mt-2"
            disabled
          >
            تم القبول بنجاح ✓
          </button>
        ) : acceptOrderStatus === 'error' ? (
          <button
            onClick={handleAcceptOrder}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-lg mt-2"
          >
            حاول مرة أخرى
          </button>
        ) : (
          <button
            onClick={handleAcceptOrder}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-lg mt-2"
          >
            موافق
          </button>
        )}
      </div>
    </div>
  );
};


//رسالة حظ اوفر عند الحاجة لعرضها شغل setShowMessage(true);

const BetterLuckMessage = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed bottom-2 left-0 right-0 mx-4 bg-white rounded-lg shadow-xl z-50 border border-gray-300 rtl p-4">
      {/* زر الإغلاق في الأعلى */}
      <div className="flex justify-end">
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* محتوى الرسالة */}
      <div className="flex flex-col items-center text-center">
        {/* أيقونة الموقع */}
        <div className="w-24 h-24 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* النص الرئيسي */}
        <h2 className="text-3xl font-bold text-black-600 mb-2">
          حظ أوفر بالعرض القادم.....
        </h2>

        {/* النص الثانوي */}
        <p className="text-lg font-bold text-gray-700 mb-6">
          وافق كابتن آخر على الطلب، حاول أن تكون أسرع
        </p>

        {/* زر الموافقة */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-xl"
        >
          موافق
        </button>
      </div>
    </div>
  );
};

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Head>
        <title>تطبيق كابتن بوصلة</title>
      </Head>

      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowProfile(true)}
            className="text-xl mr-2"
          >
            ☰
          </button>

          <button 
            onClick={() => updateZoneRadius(zoneRadius - 0.1)}
            className="bg-blue-700 hover:bg-blue-800 text-white p-1 rounded-full w-8 h-8 flex items-center justify-center"
          >
            -
          </button>
          <button 
            onClick={() => updateZoneRadius(zoneRadius + 0.1)}
            className="bg-blue-700 hover:bg-blue-800 text-white p-1 rounded-full w-8 h-8 flex items-center justify-center"
          >
            +
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
  <Map center={currentLocation || [33.5138, 36.2765]} zoom={mapZoom}>
    {currentLocation && <MapUpdater center={currentLocation} zoom={mapZoom} />}
    <MapRefUpdater mapRef={mapRef} />

            
            
            {/* Route */}
            {routePoints.length > 1 && (
  <Polyline 
    positions={routePoints}
    color="#3B82F6" // لون أزرق جميل
    weight={5}
    opacity={0.7}
    lineCap="round"
    lineJoin="round"
    
  />
)}
            {/* Markers */}
            {markers.map((marker, index) => (
              <Marker key={index} position={marker.position} icon={marker.icon}>
                <Popup>{marker.popup}</Popup>
              </Marker>
            ))}
            
            {/* Zone Circle */}
            <Circle
              center={circleCenter}
              radius={circleRadius}
              color="red"
              fillOpacity={0.1}
            />
          </Map>
        </div>

        {/* Floating Action Buttons */}
<div className="absolute right-4 bottom-20 flex flex-col space-y-3 z-10">
  {/* زر الموقع الحالي */}
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
  
  {/* زر الخدمات */}
  <button 
    onClick={() => setShowServices(true)}
    className="bg-white bg-opacity-80 hover:bg-opacity-100 text-green-600 p-3 rounded-full shadow-lg flex items-center justify-center transition-all"
    title="الخدمات"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  </button>

  {/* زر تكبير منطقة العمل */}
  <button 
     onClick={() => updateZoneRadius(zoneRadius + 0.1)}
    className="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg flex items-center justify-center transition-all"
    title="تكبير الخريطة"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  </button>
  
  {/* زر تصغير منطقة العمل */}
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

        {/* Profile Menu - Android Style */}
        {showProfile && (
          <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-30 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">القائمة</h2>
                <button 
                  onClick={() => setShowProfile(false)}
                  className="text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-center mt-4">
                  <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 overflow-hidden">
                    {profile.photo ? (
                      <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {profile.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-gray-600">{profile.phone}</p>
                </div>
                
                <div className="mt-8">
                  

                    <button 
                    onClick={() => { setShowServices(true) }}
                    className="w-full text-right py-3 border-b flex justify-between items-center hover:bg-gray-100 px-2 rounded"
                  >
                    <span>تعديل خدماتي</span>
                    <span>&gt;</span>
                  </button>

                   <button 
  onClick={() => { 
    
    setShowPayments(true); 
    setShowProfile(false);
  }}
  className="w-full text-right py-3 border-b flex justify-between items-center hover:bg-gray-100 px-2 rounded"
>
  <span>دفعاتي</span>
  <span>&gt;</span>
</button>

                  <button 
                    onClick={() => { setShowLastOrders(true); setShowProfile(false); openOrderDetails(1); }}
                    className="w-full text-right py-3 border-b flex justify-between items-center hover:bg-gray-100 px-2 rounded"
                  >
                    <span>الطلبات السابقة</span>
                    <span>&gt;</span>
                  </button>


                  
                  <button className="w-full text-right py-3 border-b flex justify-between items-center hover:bg-gray-100 px-2 rounded">
                    <span>تغيير كلمة المرور</span>
                    <span>&gt;</span>
                  </button>
                  <button className="w-full text-right py-3 text-red-500 hover:bg-gray-100 px-2 rounded mt-4">
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Menu */}
        {showPayments && (
  <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-40 shadow-xl">
    <div className="h-full flex flex-col">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={fetchPayments}
            disabled={isRefreshingPayments}
            className="p-1 mr-2"
            title="تحديث البيانات"
          >
            {isRefreshingPayments ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
        </div>
       
      </div>
        <h2 className="text-xl font-bold">الدفعات</h2>
        <button onClick={() => setShowPayments(false)} className="text-2xl">
          &times;
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* فلترة حسب الشهر */}
        <div className="mb-4 flex overflow-x-auto pb-2">
          <button
            onClick={() => setFilterMonth(null)}
            className={`px-3 py-1 rounded-full mr-2 whitespace-nowrap ${
              !filterMonth ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            الكل
          </button>
          {availableMonths.map(month => (
            <button
              key={month}
              onClick={() => setFilterMonth(month)}
              className={`px-3 py-1 rounded-full mr-2 whitespace-nowrap ${
                filterMonth === month ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {new Date(month).toLocaleDateString('ar', { month: 'long', year: 'numeric' })}
            </button>
          ))}
        </div>

        {/* قائمة الدفعات */}
        <div className="space-y-3">
  {filteredPayments.length > 0 ? (
    filteredPayments.map(payment => {
      const typeInfo = getPaymentTypeInfo(payment.type1);
      return (
        <div key={payment.id} className={`p-3 rounded-lg shadow border ${typeInfo.border} ${typeInfo.color}`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeInfo.color.replace('bg-', 'bg-opacity-50 ')}`}>
              {typeInfo.text}
            </span>
            <span className="font-bold">
              {parseFloat(payment.mony).toFixed(2)} ل.س
            </span>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600">
              {new Date(payment.insert_time).toLocaleDateString('en')}
            </span>
            {payment.note && (
              <span className="text-gray-500 truncate max-w-xs">
                {payment.note}
              </span>
            )}
          </div>
        </div>
      );
    })
  ) : (
    <div className="text-center py-8 text-gray-500">
      لا توجد دفعات مسجلة
    </div>
  )}
</div>
      </div>
    </div>
  </div>
)}

        {/* Services Menu */}
        {showServices && (
        <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-40 shadow-xl">
          <div className="h-full flex flex-col">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">الخدمات</h2>
              <button onClick={() => setShowServices(false)} className="text-2xl">
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {services.map(service => (
                  <div key={service.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={service.photo1} 
                        alt={service.name1}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-service.png';
                        }}
                      />
                      <div dir="rtl">
                        <h3 className="font-medium text-gray-800">{service.name1}</h3>
                        <p className="text-sm text-gray-500">
                          {service.m_cost} للدقيقة - {service.km} كم
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleServiceToggle(service)}
                      disabled={isUpdatingService === service.id}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none
                        ${service.active === 1 ? 'bg-green-500' : 'bg-gray-300'}
                        ${isUpdatingService === service.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span
                        className={`inline-block w-5 h-5 transform transition-transform bg-white rounded-full shadow
                          ${service.active === 1 ? 'translate-x-5' : 'translate-x-0'}
                        `}
                      />
                      {isUpdatingService === service.id && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Last Orders Menu */}
        {showLastOrders && (
          <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-40 shadow-xl">
            <div className="h-full flex flex-col">
              <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">الطلبات السابقة</h2>
                <button 
                  onClick={() => setShowLastOrders(false)}
                  className="text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex justify-around mb-4 bg-blue-50 p-2 rounded-lg">
                  <button className="px-3 py-1 bg-blue-100 rounded text-sm">اليوم</button>
                  <button className="px-3 py-1 bg-blue-100 rounded text-sm">الأسبوع</button>
                  <button className="px-3 py-1 bg-blue-100 rounded text-sm">الشهر</button>
                </div>
                
                <div className="space-y-3">
                  {orders.filter(o => o.status === 'end').map(order => (
                    <div key={order.id} className="bg-white p-3 rounded-lg shadow border border-gray-100">
                      <div className="flex justify-between">
                        <span className="font-semibold">طلب #{order.id}</span>
                        <span className="text-sm text-gray-500">{order.distance_km} كم</span>
                      </div>
                      <div className="text-sm mt-2">
                        <p className="font-medium">من: {extractMunicipality(order.startplacetxt)}</p>
                        <p className="font-medium">إلى: {extractMunicipality(order.endplacetxt)}</p>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-blue-500 font-bold">{order.cost} ل.س</span>
                        <span className="text-sm">{order.duration_min} دقيقة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/*رسالة طلب جديد*/}
        {showOrderDetails && <OrderDetailsModal />}
        {/*رسالة حظ اوفر*/}
        {showMessage && <BetterLuckMessage onClose={() => setShowMessage(false)} />}

      </main>
    </div>
  );
}