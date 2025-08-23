// CaptainApp.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { 
  Order, OrderDetails, Payment, Service, Position, 
  Profile, TrackingData, Last_order, CaptainData,KotlinOrderData
} from './types';
import { createCustomIcon, decodePolyline, extractMunicipality, createCarIcon } from './mapUtils';
import { 
  fetchData, fetchOrderById, updateOrderStatus, 
  update_order_status, 
  updateServiceStatus, fetchlast_order
} from './api';
import { OrderDetailsModal } from './OrderDetailsModal';
import { BetterLuckMessage } from './BetterLuckMessage';
import OrderTrackingModal from './OrderTrackingModal';

// تحميل مكونات القوائم أولاً
const DynamicProfileMenu = dynamic(
  () => import('./menu/ProfileMenu').then((mod) => mod.ProfileMenu),
  { ssr: false, loading: () => <div className="h-0 w-0" /> }
);

const DynamicPaymentsMenu = dynamic(
  () => import('./menu/PaymentsMenu').then((mod) => mod.PaymentsMenu),
  { ssr: false, loading: () => <div className="h-0 w-0" /> }
);

const DynamicServicesMenu = dynamic(
  () => import('./menu/ServicesMenu').then((mod) => mod.ServicesMenu),
  { ssr: false, loading: () => <div className="h-0 w-0" /> }
);

const DynamicLastOrdersMenu = dynamic(
  () => import('./menu/LastOrdersMenu').then((mod) => mod.LastOrdersMenu),
  { ssr: false, loading: () => <div className="h-0 w-0" /> }
);

// تحميل مكونات الخريطة بعد ذلك
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">جاري تحميل الخريطة...</div>
    </div>
  });

const MapComponent = dynamic(
  () => import('./MapComponent').then((mod) => mod.MapComponent),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100" />
  }
);

const DEFAULT_POSITION: Position = [33.5138, 36.2765];

declare global {
   interface Window {
    // للاتصال من JavaScript إلى Kotlin
    Android?: {
      receiveMessage: (action: string, message: string) => void;
    };
    
    // للاتصال من Kotlin إلى JavaScript
    updateLocation?: (lat: number, lng: number) => void;
    handleNewOrder?: (orderId: number) => void;
    setCaptainData?: (data: CaptainData) => void;
    update_cost?: (km:string,min:string,cost:string) =>void;
    handleOpenOrder?: (orderData: KotlinOrderData) => void;  // إضافة هذه الدالة
    handleOpenOrderResponse?: (response: string) => void; // إضافة هذه الدالة
    
    // إذا كنت تستخدم ReactNativeWebView
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export default function CaptainApp() {
  // State
  const [active, setActive] = useState(false);
  const [zoneRadius, setZoneRadius] = useState(2);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastorder, setlastorder] = useState<Last_order[]>([]);
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
  const [isRefreshingLastOrders, setIsRefreshingLastOrders] = useState(false);
const [isRefreshingServices, setIsRefreshingServices] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [acceptOrderStatus, setAcceptOrderStatus] = useState<'idle' |'goodluck' | 'loading' | 'success' | 'error'>('idle');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showOrderTracking, setShowOrderTracking] = useState(false);
const [trackingOrder, setTrackingOrder] = useState<OrderDetails | null>(null);
  const [carMarker, setCarMarker] = useState<{
    position: Position;
    icon: L.Icon;
  } | null>(null);
  const [icons, setIcons] = useState<{
    carIcon: L.Icon | null,
    redIcon: L.Icon | null,
    greenIcon: L.Icon | null
  }>({
    carIcon: null,
    redIcon: null,
    greenIcon: null
  });
  const [captainId, setCaptainId] = useState<number>(0);
  const [menusLoaded, setMenusLoaded] = useState(false); // حالة جديدة لتتبع تحميل القوائم
  
  const mapRef = useRef<L.Map | null>(null);

  //دالة لمتابعة ارسال الطلب المكتمل وغير مرسل
  const [completedOrderData, setCompletedOrderData] = useState<{
  order: KotlinOrderData;
  real_km: string;
  real_min: string;
  real_price: string;
  end_time: string;
} | null>(null);

  // استقبال بيانات الكابتن
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      
      const id = urlParams.get('id');
      const name = urlParams.get('name');
      const phone = urlParams.get('phone');
      const photo = urlParams.get('photo');
      const active = urlParams.get('active');
      
      if (id) {
        setCaptainId(Number(id));
      }

      // تحويل قيمة active من سلسلة نصية إلى boolean
      setActive(active === 'true');
      
      // تحديث البيانات الأساسية
      const updatedProfile = {
        name: name ? decodeURIComponent(name) : profile.name,
        phone: phone ? decodeURIComponent(phone) : profile.phone,
        photo: profile.photo // الاحتفاظ بالقيمة الحالية افتراضيًا
      };
      
      // التحقق من صحة الصورة قبل التحديث
      if (photo) {
        const photoUrl = decodeURIComponent(photo);
        
        // دالة للتحقق من صحة الصورة
        const checkImageValidity = async (url: string) => {
          try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                return url; // الصورة صالحة
              }
            }
            return null; // الصورة غير صالحة
          } catch (error) {
            return null; // حدث خطأ في التحقق
          }
        };
        
        // التحقق من الصورة وتحديث الحالة فقط إذا كانت صالحة
        checkImageValidity(photoUrl).then(validUrl => {
          if (validUrl) {
            setProfile(prev => ({
              ...prev,
              ...updatedProfile,
              photo: validUrl
            }));
          } else {
            // إذا كانت الصورة غير صالحة، نحدّث كل شيء ما عدا الصورة
            setProfile(prev => ({
              ...prev,
              ...updatedProfile
            }));
          }
        });
      } else {
        // إذا لم تكن هناك صورة في الرابط، نحدّث البيانات الأخرى فقط
        setProfile(prev => ({
          ...prev,
          ...updatedProfile
        }));
      }
    }
  }, []);

  const sendToKotlin = (action: string, message: string) => {
    try {
      console.log(`Sending to Kotlin - Action: ${action}, Message: ${message}`);
      
      // الطريقة المباشرة مع TypeScript
      if (window.Android?.receiveMessage) {
        window.Android.receiveMessage(action, message);
        return;
      }
      
      // إذا كنت تستخدم ReactNativeWebView (يحتاج إلى JSON)
      if (window.ReactNativeWebView?.postMessage) {
        const jsonMessage = JSON.stringify({ action, message });
        window.ReactNativeWebView.postMessage(jsonMessage);
        return;
      }
      
      // للتنمية المحلية/المتصفح
      console.warn('Android interface not available, mocking send:', { action, message });
      mockKotlinResponse(action, message);
    } catch (error) {
      console.error('Error sending to Kotlin:', error);
    }
  };

  // دالة المحاكاة المعدلة
  const mockKotlinResponse = (action: string, message: string) => {
    console.log(`Mock Kotlin response - Action: ${action}, Message: ${message}`);
  };

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

  const fetchLastOrders = useCallback(async () => {
    console.log(captainId)
    try {
      const response = await fetchlast_order<Last_order[]>('get_lastorder', { cap_id: captainId });
      if (response.success) {
        setlastorder(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching last orders:', error);
    }
  }, [captainId]);

  // Effects
  useEffect(() => {
    // تحميل القوائم أولاً
    const loadMenus = async () => {
      try {
        // تحميل مكونات القوائم أولاً
        await Promise.all([
          import('./menu/ProfileMenu'),
          import('./menu/PaymentsMenu'),
          import('./menu/ServicesMenu'),
          import('./menu/LastOrdersMenu')
        ]);
        
        // تحديث حالة أن القوائم قد تم تحميلها
        setMenusLoaded(true);
        
        // ثم تحميل البيانات
        fetchInitialData();
        fetchPayments();
        fetchLastOrders();
      } catch (error) {
        console.error('Error loading menus:', error);
      }
    };

    loadMenus();
  }, []);

  // تحميل أيقونة السيارة بعد تحميل القوائم
  useEffect(() => {
    if (menusLoaded && currentLocation && icons.carIcon) {
      setCarMarker({
        position: currentLocation,
        icon: icons.carIcon as L.Icon
      });
    }
  }, [menusLoaded, icons.carIcon, currentLocation]);

  // داخل مكون CaptainApp، أضف useEffect لاستقبال الموقع
  useEffect(() => {
    // تعريف دالة استقبال الموقع من Kotlin
    window.updateLocation = (lat: number, lng: number) => {
      const newLocation: Position = [lat, lng];
      
      // تحديث حالة الموقع الحالي
      setCurrentLocation(newLocation);
      
      // تحديث مركز الدائرة
      setCircleCenter(newLocation);
      
      // تحديث موقع السيارة فقط
      if (icons.carIcon) {
        setCarMarker({
          position: newLocation,
          icon: icons.carIcon
        });
      }
      
      // إزالة أي كود يقوم بتغيير مركز الخريطة أو مستوى zoom تلقائياً
      // لا تستخدم mapRef.current.flyTo() أو setView() هنا
    };

    return () => {
      window.updateLocation = () => {};
    };
  }, [icons.carIcon]);

  // تحميل الأيقونات بعد تحميل القوائم
  useEffect(() => {
    if (menusLoaded) {
      const loadIcons = async () => {
        const [carIcon, redIcon, greenIcon] = await Promise.all([
          createCarIcon(),
          createCustomIcon('red'),
          createCustomIcon('green')
        ]);
        
        setIcons({
          carIcon,
          redIcon,
          greenIcon
        });
      };

      loadIcons();
    }
  }, [menusLoaded]);

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

  const handleRefreshLastOrders = useCallback(async () => {
  setIsRefreshingLastOrders(true);
  try {
    await fetchLastOrders();
  } catch (error) {
    console.error('Error refreshing last orders:', error);
  } finally {
    setIsRefreshingLastOrders(false);
  }
}, [fetchLastOrders]);

const handleRefreshServices = useCallback(async () => {
  setIsRefreshingServices(true);
  try {
    await fetchInitialData();
  } catch (error) {
    console.error('Error refreshing services:', error);
  } finally {
    setIsRefreshingServices(false);
  }
}, [fetchInitialData]);

  const handleActivate = useCallback(() => {
    const newActiveState = !active;
    setActive(newActiveState);
    
    // إرسال القيمة إلى Kotlin بناءً على الحالة الجديدة
    sendToKotlin("start_cap_serv", newActiveState ? "1" : "0");
  }, [active]);

  const clearRoute = useCallback(() => {
    setRoutePoints([]);
    setMarkers([]);
   // setCarMarker(null);
  }, []);

  const drawRoute = useCallback(async (startPoint: string, endPoint: string) => {
    if (!startPoint || !endPoint || !icons.redIcon || !icons.greenIcon) {
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
          icon: icons.redIcon as L.Icon,
          popup: "نقطة الانطلاق"
        },
        { 
          position: [endLat, endLng], 
          icon: icons.greenIcon as L.Icon,
          popup: "نقطة الوصول"
        }]);
      
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }, [clearRoute, icons.redIcon, icons.greenIcon]);

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

  ///استقبال الطلبات من كوتلن
  useEffect(() => {
    // تعريف دالة استقبال الطلبات من Kotlin
    window.handleNewOrder = async (orderId: number) => {
      console.log('Received new order ID:', orderId);
      
      try {
        // جلب تفاصيل الطلب من API
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
            notes: order.notes || 'لا توجد ملاحظات',
            km_price:order.km_price,
            min_price:order.min_price,
            discount:order.discount,
            add1:order.add1,
            f_km:order.f_km,
            start_time:new Date().toISOString() ,
            status:order.status,
             real_km:order.real_km,
        real_min:order.real_min,
        real_price:order.real_price,
        real_street:order.real_street,
        waiting_min:order.waiting_min,
        end_time:order.end_time,

          });
          
          setShowOrderDetails(true);
          
          if (order.start_point && order.end_point) {
            drawRoute(order.start_point, order.end_point);
          }
        }
      } catch (error) {
        console.error('Error handling new order:', error);
      }
    };

    return () => {
      // تنظيف الدالة عند إلغاء التثبيت
      window.handleNewOrder = () => {};
    };
  }, [drawRoute]);

  const openOrderDetails = useCallback(async (orderId: number) => {
    console.log('Fetching order with ID:', orderId);
    setAcceptOrderStatus('loading');
    
    const order = await fetchOrderById(orderId);
    
    if (!order) {
      console.error('No order data received for ID:', orderId);
      setAcceptOrderStatus('error');
      return;
    }

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
      notes: order.notes || 'لا توجد ملاحظات',
      km_price:order.km_price,
      min_price:order.min_price,
      discount:order.discount,
      add1:order.add1,
      f_km:order.f_km,
      start_time: new Date().toISOString(),
      status:order.status,
      real_km:order.real_km,
        real_min:order.real_min,
        real_price:order.real_price,
        real_street:order.real_street,
        waiting_min:order.waiting_min,
        end_time:order.end_time,
    });
    
    setAcceptOrderStatus('idle');
    setShowOrderDetails(true);
    
    if (order.start_point && order.end_point) {
      drawRoute(order.start_point, order.end_point);
    }
  }, [drawRoute]);


  ///الموافقة على الطلب
const handleAcceptOrder = useCallback(async (status:string) => {
  if (!selectedOrder) return;

  setAcceptOrderStatus('loading');

  try {
    const result = await update_order_status(selectedOrder.id, captainId,status);
    console.log(result)

    if (result === 'success') {
      setAcceptOrderStatus('success');
      
      // إرسال بيانات الطلب إلى Kotlin
      const orderData = {
        id: selectedOrder.id,
        start_text: selectedOrder.start_text,
        end_text: selectedOrder.end_text,
        distance_km: selectedOrder.distance_km,
        duration_min: selectedOrder.duration_min,
        cost: selectedOrder.cost,
        user_rate: selectedOrder.user_rate,
        km_price:selectedOrder.km_price,
        min_price:selectedOrder.min_price,
        discount:selectedOrder.discount,
        add1:selectedOrder.add1,
        f_km:selectedOrder.f_km,
        start_time:selectedOrder.start_time,
        accept_time:new Date().toISOString()
      };
      
      sendToKotlin("order_accepted", JSON.stringify(orderData));

      //ايقاف زر استقبال الطلبات
      setActive(false)
      
      setTimeout(() => {
        setShowOrderDetails(false);
        setAcceptOrderStatus('idle');
        clearRoute();
        
        // إظهار واجهة متابعة الطلب
        setTrackingOrder(selectedOrder);
        setShowOrderTracking(true);
      }, 2000);
    } else if (result === 'goodluck') {
      setAcceptOrderStatus('goodluck');
      setTimeout(() => {
        setShowOrderDetails(false);
        setAcceptOrderStatus('idle');
        clearRoute();
        setShowMessage(true);
      }, 2000);
    } else {
      setAcceptOrderStatus('error');
    }
  } catch (error) {
    console.error('Error accepting order:', error);
    setAcceptOrderStatus('error');
  }
}, [selectedOrder, captainId, clearRoute]);


//تعديل حالة الطلب
const handleNextStatus = useCallback(async (status: string) => {
  if (!trackingOrder) return;

  // حالة التحميل - إظهار مؤشر الانتظار
  setAcceptOrderStatus('loading');

  try {
    if (status == "completed") {
      sendToKotlin("stop_tracking_services", "0");
      setShowOrderTracking(false);
      sendToKotlin("order_status_update", JSON.stringify({
        orderId: trackingOrder.id,
        status: status,
        date_time: new Date().toISOString() 
      }));
      
    }

    // إرسال حالة الطلب الجديدة إلى السيرفر مع مهلة زمنية
    const result = await Promise.race([
      update_order_status(trackingOrder.id, captainId, status),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 10000)) // مهلة 10 ثواني
    ]);

    if (result === 'timeout') {
      // إذا انتهت المهلة الزمنية
      setAcceptOrderStatus('error');
      throw new Error('فشل في تحديث الحالة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
    }

    if (result === 'success') {
      // إرسال الطلب لكوتلن
      sendToKotlin("order_status_update", JSON.stringify({
        orderId: trackingOrder.id,
        status: status,
        date_time: new Date().toISOString() 
      }));
      
      if (status == "completed") {
        sendToKotlin("delete_order_finish", "0");
      }
      
      console.log(`تم تحديث حالة الطلب ${trackingOrder.id} إلى ${status} بنجاح`);
      setAcceptOrderStatus('success');
      
      // إخفاء مؤشر الانتظار بعد نجاح العملية
      setTimeout(() => {
        setAcceptOrderStatus('idle');
      }, 2000);
    } else {
      console.error('فشل في تحديث حالة الطلب في السيرفر');
      setAcceptOrderStatus('error');
      throw new Error('فشل في تحديث الحالة. يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    console.error('خطأ أثناء تحديث حالة الطلب:', error);
    setAcceptOrderStatus('error');
    throw error; // إعادة رفع الخطأ ليتم التعامل معه في المكون الفرعي
  }
}, [trackingOrder, captainId]);

///عرض الطلب المفتوح بعد اعادة تشغيل التطبيق
useEffect(() => {
  // طلب التحقق من الطلبات المفتوحة من Kotlin
  const checkForOpenOrder = () => {
    sendToKotlin("check_open_order", "");
  };

  // تعريف دالة استقبال الرد من Kotlin
  window.handleOpenOrderResponse = (response: string) => {
    console.log('Open order response:', response);
    
    if (response !== "no_open_order") {
      try {
        // محاولة تحليل الرد كمصفوفة أولاً
        const orderDataArray = JSON.parse(response);
        let orderData: KotlinOrderData | null = null;
        
        if (Array.isArray(orderDataArray) && orderDataArray.length > 0) {
          // أخذ أول عنصر في المصفوفة
          orderData = orderDataArray[0];
        } else if (typeof orderDataArray === 'object' && orderDataArray !== null) {
          // إذا كان كائنًا وليس مصفوفة
          orderData = orderDataArray;
        }
        
        if (orderData && typeof orderData.id === 'number') {
          if (orderData.status === "completed") {
            // عرض واجهة الطلب المكتمل
            setCompletedOrderData({
              order: orderData,
              real_km: orderData.real_km || "0",
              real_min: orderData.real_min || "0", 
              real_price: orderData.real_price || "0",
              end_time: orderData.end_time || new Date().toISOString()
            });
          } else {
            handleOpenOrder(orderData);
          }
        }
      } catch (error) {
        console.error('Error parsing open order data:', error);
      }
    } else {
      console.log('No open orders found');
    }
  };

  // التحقق من وجود طلب مفتوح عند تحميل التطبيق
  checkForOpenOrder();

  return () => {
    window.handleOpenOrderResponse = () => {};
  };
}, []);

//عرض رسالة متابعة الطلب المكتمل وغير مرسل للسيرفر
const handleSubmitCompletedOrder = useCallback(async () => {
  if (!completedOrderData) return;

  try {
    setAcceptOrderStatus('loading');
    
    // إرسال تحديث الحالة للسيرفر
    const result = await update_order_status(
      completedOrderData.order.id, 
      captainId, 
      "completed"
    );

    if (result === 'success') {
      // إرسال البيانات إلى Kotlin
      sendToKotlin("order_status_update", JSON.stringify({
        orderId: completedOrderData.order.id,
        status: "completed",
        date_time: completedOrderData.end_time,
        real_km: completedOrderData.real_km,
        real_min: completedOrderData.real_min,
        real_price: completedOrderData.real_price
      }));

      sendToKotlin("delete_order_finish", "0");
      
      setAcceptOrderStatus('success');
      setCompletedOrderData(null);
      
      setTimeout(() => {
        setAcceptOrderStatus('idle');
      }, 2000);
    } else {
      setAcceptOrderStatus('error');
      alert('فشل في إرسال التحديث. يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    console.error('Error submitting completed order:', error);
    setAcceptOrderStatus('error');
    alert('حدث خطأ أثناء إرسال التحديث.');
  }
}, [completedOrderData, captainId]);



// تطوير دالة handleOpenOrder لمعالجة البيانات الكاملة
const handleOpenOrder = (orderData: KotlinOrderData) => {
    console.log('Received open order:', orderData);
    
    // إنشاء كائن الطلب مع جميع البيانات
    const trackingOrderData: OrderDetails = {
        id: orderData.id,
        ser_chi_id: orderData.ser_chi_id || 0,
        start_text: orderData.start_text || '',
        end_text: orderData.end_text || '',
        distance_km: orderData.distance_km || '0.0',
        duration_min: typeof orderData.duration_min === 'string' 
            ? parseInt(orderData.duration_min) || 0 
            : orderData.duration_min || 0,
        cost: orderData.cost || '0.0',
        user_rate: typeof orderData.user_rate === 'string' 
            ? parseInt(orderData.user_rate) || 0 
            : orderData.user_rate || 0,
        start_detlis: orderData.start_detlis || '',
        end_detlis: orderData.end_detlis || '',
        notes: orderData.notes || 'لا توجد ملاحظات',
        km_price: orderData.km_price || '0.0',
        min_price: orderData.min_price || '0.0',
        discount: orderData.discount || '0',
        add1: orderData.add1 || '0.0',
        f_km: orderData.f_km || '0.0',
        start_time: orderData.start_time || new Date().toISOString(),
        status:orderData.status || 'arrived',
        real_km:orderData.real_km,
        real_min:orderData.real_min,
        real_price:orderData.real_price,
        real_street:orderData.real_street,
        waiting_min:orderData.waiting_min,
        end_time:orderData.end_time,
    };
    
    // تعيين حالة التتبع - استخدام حالة الطلب من Kotlin إذا كانت متوفرة
    setTrackingOrder(trackingOrderData);
    setShowOrderTracking(true);
    
    // إذا كانت هناك نقاط طريق، رسم المسار
    if (orderData.start_point && orderData.end_point) {
        drawRoute(orderData.start_point, orderData.end_point);
    }
    
    // إرسال حالة الطلب إلى Kotlin للتأكد من المزامنة
    sendToKotlin("order_tracking_started", JSON.stringify({
        orderId: orderData.id,
        status: orderData.status || 'unknown'
    }));
};


//الاتصال بالزبون
const handleCallCustomer = useCallback(() => {
  if (trackingOrder) {
    sendToKotlin("call_customer", trackingOrder.id.toString());
  }
}, [trackingOrder]);

//نكز
const handlePokeCustomer = useCallback(() => {
  if (trackingOrder) {
    sendToKotlin("poke_customer", trackingOrder.id.toString());
  }
}, [trackingOrder]);
//الاتصال بالشركة
const handleCallCompany = useCallback(() => {
  sendToKotlin("call_company", "");
}, []);
//الاتصال بالطوارئ
const handleCallEmergency = useCallback(() => {
  sendToKotlin("call_emergency", "");
}, []);

///استقبال بيانات متابعة الرحلة من كوتلن
useEffect(() => {
  window.update_cost = (km: string, min: string, cost: string) => {
    console.log('Received cost data:', { km, min, cost });
    
    setTrackingData({
      distance: km,
      time: min,
      price: cost
    });
    
    if (trackingOrder) {
      setTrackingOrder(prev => prev ? {
        ...prev,
        distance_km: km,
        duration_min: parseInt(min) || 0,
        cost: cost
      } : null);
    }
  };

  return () => {
    window.update_cost = undefined;
  };
}, [trackingOrder]);

  //ايقاف او تشغيل الخدمات
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون على الأقل 6 أحرف');
      return;
    }

    try {
      const response = await fetch('https://alrasekhooninlaw.com/bousla/app/update_password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          captain_id: captainId,
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        // إظهار رسالة نجاح
        alert('تم تغيير كلمة المرور بنجاح');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
      } else {
        setPasswordError(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
    } catch (error) {
      setPasswordError('حدث خطأ في الاتصال بالخادم');
    }
  };

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
          {menusLoaded ? (
            <Suspense fallback={<div className="h-full w-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-500">جاري تحميل الخريطة...</div>
            </div>}>
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
                  markers={[
                    ...markers,
                    ...(carMarker ? [{
                      position: carMarker.position,
                      icon: carMarker.icon,
                      popup: "موقعك الحالي"
                    }] : [])
                  ]}
                  circleCenter={circleCenter}
                  circleRadius={circleRadius}
                />
              </MapContainer>
            </Suspense>
          ) : (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-500">جاري تحميل الخدمات الأساسية...</div>
            </div>
          )}
        </div>

        {/* Floating Action Buttons */}
        {menusLoaded && (
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
        )}

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
            }}
            onvertioal_order={() =>{
              openOrderDetails(1);
              setShowProfile(false)
            }}
            onlogout_btn={()=> sendToKotlin("logout", "")}
            onShowChangePassword={() => {
              setShowChangePassword(true);
              setShowProfile(false); // إغلاق قائمة البروفايل عند فتح نافذة تغيير كلمة المرور
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
    isRefreshing={isRefreshingServices}
    onClose={() => setShowServices(false)}
    onRefresh={handleRefreshServices}
    onToggleService={handleServiceToggle}
  />
)}

        {showLastOrders && (
  <DynamicLastOrdersMenu
    orders={lastorder}
    isRefreshing={isRefreshingLastOrders}
    onClose={() => setShowLastOrders(false)}
    onRefresh={handleRefreshLastOrders}
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
             onAccept={() => handleAcceptOrder("cap_accept")}
            acceptStatus={acceptOrderStatus} 
          />
        )}

        {showMessage && (
          <BetterLuckMessage onClose={() => setShowMessage(false)} />
        )}

  {showOrderTracking && trackingOrder && (
  <div className="fixed bottom-0 left-0 right-0 z-50">
    <OrderTrackingModal
      order={trackingOrder}
      trackingData={trackingData}
      initialStatus={trackingOrder.status} // تمرير حالة الطلب من البيانات
      onNextStatus={handleNextStatus}
      onCallCustomer={handleCallCustomer}
      onPokeCustomer={handlePokeCustomer}
      onCallCompany={handleCallCompany}
      onCallEmergency={handleCallEmergency}
    />
  </div>
)}

{/* واجهة ارسال الطلب المعلق */}
{completedOrderData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-96">
      <h2 className="text-xl font-bold mb-4 text-center">تفاصيل الرحلة المكتملة</h2>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="font-semibold">المسافة المقطوعة:</span>
          <span>{completedOrderData.real_km} كم</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-semibold">الوقت المستغرق:</span>
          <span>{completedOrderData.real_min} دقيقة</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-semibold">التكلفة النهائية:</span>
          <span>{completedOrderData.real_price} ل.س</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-semibold">وقت الانتهاء:</span>
          <span>{new Date(completedOrderData.end_time).toLocaleString('ar-SA')}</span>
        </div>
      </div>

      <div className="flex justify-between space-x-3">
        <button
          onClick={() => setCompletedOrderData(null)}
          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
        >
          إلغاء
        </button>
        
        <button
          onClick={handleSubmitCompletedOrder}
          disabled={acceptOrderStatus === 'loading'}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
        >
          {acceptOrderStatus === 'loading' ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري الإرسال...
            </>
          ) : (
            'إرسال التحديث'
          )}
        </button>
      </div>
    </div>
  </div>
)}

        {showChangePassword && (
          <div className="absolute inset-0 flex items-center justify-center z-40 backdrop-blur-md">
            <div className="bg-white p-6 rounded-lg w-80 ">
              <h2 className="text-xl font-bold mb-4 text-right">تغيير كلمة المرور</h2>
              
              {passwordError && (
                <div className="mb-4 text-red-500 text-right">{passwordError}</div>
              )}
              
              <div className="mb-4">
                <label className="block text-right mb-2">كلمة المرور الحالية</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 border rounded text-right"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-right mb-2">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded text-right"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-right mb-2">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border rounded text-right"
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordError('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};