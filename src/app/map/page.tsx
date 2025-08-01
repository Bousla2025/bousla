//MAP.TSX
//tamer
"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic"; // مطلوب لتحميل المكونات ديناميكيًا
import Layout from "../components/Layout";
import { FaMapMarkerAlt, FaFlagCheckered, FaSave, FaLocationArrow, FaArrowRight, FaInfoCircle, FaTimes, FaSpinner, FaChevronDown } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import GlobeLoader from "../components/GlobeLoader";

type Coordinates = [number, number];

interface MapLocation {
  id?: string;
  name: string;
  lat: number;
  lon: number;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface RouteData {
  code: string;
  routes: {
    distance: number;
    duration: number;
    geometry: string | { coordinates: number[][] };
  }[];
}

const MapComponent = dynamic(
  () => import("../components/MapComponent").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <GlobeLoader />,
  }
);

const MapOnlyPage: React.FC = () => {
  // Service data
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  
  const defaultCoordinates: Coordinates = [33.5138, 36.2765];
  const [startPoint, setStartPoint] = useState<MapLocation | null>(null);
  const [endPoint, setEndPoint] = useState<MapLocation | null>(null);
  const [startSearchQuery, setStartSearchQuery] = useState("");
  const [endSearchQuery, setEndSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<"start" | "end" | null>(null);
  const [startSearchResults, setStartSearchResults] = useState<SearchResult[]>([]);
  const [endSearchResults, setEndSearchResults] = useState<SearchResult[]>([]);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [tripInfo, setTripInfo] = useState<{
    distance: number;
    baseDuration: number;
    adjustedDuration: number;
    isPeakHour: boolean;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [searching, setSearching] = useState(false);
  const [showTripInfo, setShowTripInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hideTripInfo = () => {
    setShowTripInfo(false);
    setShowSearch(true);
  };

  const displayTripInfo = () => {
    setShowTripInfo(true);
    setShowSearch(false);
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const serviceIdParam = queryParams.get('service_id');
    const userIdParam = queryParams.get('user_id');
    
    if (serviceIdParam) {
      setServiceId(parseInt(serviceIdParam));
    }
    
    if (userIdParam) {
      setUserId(parseInt(userIdParam));
    }
  }, []);

  const decodePolyline = useCallback((encoded: string) => {
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
  }, []);

  const calculateRoute = useCallback(async (start: MapLocation, end: MapLocation) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&steps=true&annotations=true`
      );
      const data: RouteData = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('لم يتم العثور على مسار');
      }
      
      const route = data.routes[0];
      const distance = route.distance / 1000;
      const baseDuration = route.duration / 60;
      const currentHour = new Date().getHours();
      const isPeakHour = currentHour >= 10 && currentHour < 17;
      const adjustedDuration = isPeakHour ? baseDuration * 1.3 : baseDuration;
      
      setTripInfo({
        distance,
        baseDuration,
        adjustedDuration,
        isPeakHour
      });
      
      let coordinates: [number, number][] = [];
      
      if (route.geometry) {
        if (typeof route.geometry === 'string') {
          coordinates = decodePolyline(route.geometry).map(point => [point.lat, point.lng]);
        } else if (Array.isArray(route.geometry.coordinates)) {
          coordinates = route.geometry.coordinates.map((coord: number[]) => [
            coord[1], coord[0]
          ]);
        }
      }
      
      if (coordinates.length === 0) {
        coordinates = [
          [start.lat, start.lon],
          [end.lat, end.lon]
        ];
        toast("تم رسم خط مستقيم بين النقطتين", { icon: '⚠️' });
      }
      
      setRouteCoordinates(coordinates);
      
      const bounds = {
        minLat: Math.min(start.lat, end.lat),
        maxLat: Math.max(start.lat, end.lat),
        minLng: Math.min(start.lon, end.lon),
        maxLng: Math.max(start.lon, end.lon)
      };
      
      toast.success("تم حساب الرحلة بنجاح! جاري عرض المسار...");
      return bounds;
      
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
      toast.error(`فشل في حساب المسار: ${errorMessage}`);
      setRouteCoordinates([]);
      return null;
    }
  }, [decodePolyline]);

  useEffect(() => {
    if (startPoint && endPoint) {
      calculateRoute(startPoint, endPoint).then(bounds => {
        if (bounds) {
          console.log("تم تحريك الخريطة لرؤية المسار كاملاً");
          displayTripInfo();
        }
      });
    }
  }, [startPoint, endPoint, calculateRoute]);

  const clearStartPoint = () => {
    setStartPoint(null);
    setStartSearchQuery("");
    setStartSearchResults([]);
    setRouteCoordinates([]);
    setTripInfo(null);
    hideTripInfo();
    toast.success("تم مسح مكان الانطلاق");
  };

  const clearEndPoint = () => {
    setEndPoint(null);
    setEndSearchQuery("");
    setEndSearchResults([]);
    setRouteCoordinates([]);
    setTripInfo(null);
    hideTripInfo();
    toast.success("تم مسح مكان الوصول");
  };

  const handleAutoSearch = async (query: string, type: "start" | "end") => {
    if (!query.trim()) {
      if (type === "start") setStartSearchResults([]);
      else setEndSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=35.9,33.3,36.6,33.7&bounded=1`
      );
      const data: SearchResult[] = await response.json();
      
      if (data.length === 0) {
        toast.error("لم يتم العثور على نتائج للبحث");
      }
      
      if (type === "start") {
        setStartSearchResults(data);
      } else {
        setEndSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      toast.error("حدث خطأ أثناء البحث");
      if (type === "start") setStartSearchResults([]);
      else setEndSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const handleSearch = () => {
      if (activeSearch === "start" && startSearchQuery.trim()) {
        handleAutoSearch(startSearchQuery, "start");
      } else if (activeSearch === "end" && endSearchQuery.trim()) {
        handleAutoSearch(endSearchQuery, "end");
      } else {
        if (activeSearch === "start") setStartSearchResults([]);
        else if (activeSearch === "end") setEndSearchResults([]);
      }
    };

    const typingTimeout = setTimeout(handleSearch, 1000);
    
    return () => {
      clearTimeout(typingTimeout);
    };
  }, [startSearchQuery, endSearchQuery, activeSearch]);

  const handleSelectLocation = (lat: number, lon: number, displayName: string, type: "start" | "end") => {
    const location = { name: displayName, lat, lon };
    
    if (type === "start") {
      setStartPoint(location);
      toast.success("تم تحديد نقطة الانطلاق");
      setStartSearchResults([]);
    } else {
      setEndPoint(location);
      toast.success("تم تحديد نقطة الوصول");
      setEndSearchResults([]);
    }
    
    setActiveSearch(null);
    if (type === "start") setStartSearchQuery("");
    else setEndSearchQuery("");
  };

  const handleMapSelection = (lat: number, lon: number) => {
    const location = { name: `موقع مختار (${lat.toFixed(4)}, ${lon.toFixed(4)})`, lat, lon };
    
    if (activeSearch === "start") {
      setStartPoint(location);
      toast.success("تم تحديد نقطة الانطلاق من الخريطة");
    } else if (activeSearch === "end") {
      setEndPoint(location);
      toast.success("تم تحديد نقطة الوصول من الخريطة");
    }
    
    setIsSelectingOnMap(false);
    setActiveSearch(null);
  };

  const saveTrip = () => {
    if (!startPoint || !endPoint) {
      toast.error("الرجاء تحديد نقطتي الانطلاق والوصول أولاً");
      return;
    }
    
    try {
      const trips = JSON.parse(localStorage.getItem('savedTrips') || "[]");
      const newTrip = {
        id: Date.now(),
        start: startPoint,
        end: endPoint,
        createdAt: new Date().toISOString()
      };
      
      trips.push(newTrip);
      localStorage.setItem('savedTrips', JSON.stringify(trips));
      toast.success("تم حفظ الرحلة بنجاح!");
    } catch (error) {
      console.error("Failed to save trip:", error);
      toast.error("حدث خطأ أثناء حفظ الرحلة");
    }
  };

  const getCurrentLocation = async (type: "start" | "end") => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      toast.error("هذه الميزة غير متاحة في بيئة الخادم أو المتصفح لا يدعمها");
      return;
    }

    let permissionStatus: PermissionStatus | null = null;
    try {
      permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
      if (permissionStatus?.state === 'denied') {
        toast.error(
          <div>
            <p>تم رفض إذن الموقع</p>
            <p>الرجاء تفعيله من:</p>
            <p>إعدادات المتصفح → الموقع → السماح</p>
          </div>,
          { duration: 6000 }
        );
        return;
      }
    } catch (permissionError) {
      console.log("Permission API not supported", permissionError);
    }

    const loadingToast = toast.loading(
      <div>
        <p>جاري تحديد موقعك...</p>
        <p>قد يستغرق بضع ثوانٍ</p>
      </div>,
      { duration: 10000 }
    );

    try {
      const position = await Promise.race<GeolocationPosition>([
        new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            }
          );
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("تجاوز الوقت المحدد")), 15000)
        )
      ]);

      const { latitude, longitude } = position.coords;
      let locationName = "الموقع الحالي";

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        locationName = data.display_name || 
                      (data.address?.road ? `شارع ${data.address.road}` : locationName);
      } catch (reverseError) {
        console.log("Reverse geocoding failed, using coordinates only", reverseError);
      }

      handleSelectLocation(latitude, longitude, locationName, type);
      
      toast.success(
        <div>
          <p>تم تحديد موقعك بنجاح</p>
          <p className="text-sm opacity-80">{locationName}</p>
        </div>,
        { id: loadingToast, duration: 5000 }
      );

    } catch (error) {
      console.error("Geolocation error:", error);
      
      const errorMessage = (
        <div>
          <p>فشل في تحديد الموقع</p>
          <p className="text-sm">السبب: {getAndroidErrorMessage(error)}</p>
        </div>
      );

      toast.custom(
        (t) => (
          <div>
            {errorMessage}
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                getCurrentLocation(type);
              }}
              className="text-blue-500 hover:text-blue-700 ml-2"
            >
              إعادة المحاولة
            </button>
          </div>
        ),
        { 
          id: loadingToast,
          duration: 7000
        }
      );
    }
  };

  const getAndroidErrorMessage = (error: GeolocationPositionError | Error | unknown): string => {
  if (error instanceof GeolocationPositionError) {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return "رفض الإذن - تأكد من تفعيل صلاحيات الموقع";
      case error.POSITION_UNAVAILABLE:
        return "خدمة الموقع معطلة - تأكد من تفعيل GPS";
      case error.TIMEOUT:
        return "تجاوز الوقت - حاول في مكان مفتوح";
      default:
        return "خطأ غير معروف في نظام الموقع";
    }
  }
  
  if (error instanceof Error) {
    return error.message.includes("تجاوز الوقت") ? 
      "استغرقت العملية وقتاً طويلاً" : 
      error.message;
  }

  return "حدث خطأ غير متوقع";
};

  const getShortLocationName = (fullName: string | undefined) => {
    if (!fullName) return '';
    const parts = fullName.split(',');
    return parts[0].trim();
  };

  const submitOrder = async () => {
    if (!startPoint || !endPoint || !tripInfo || !serviceId || !userId) {
      toast.error("الرجاء تحديد نقاط الانطلاق والوصول أولاً");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("جاري إرسال الطلب...");

    try {
      const orderData = {
        user_id: userId,
        ser_chi_id: serviceId,
        start_point: `${startPoint.lat},${startPoint.lon}`,
        start_text: getShortLocationName(startPoint.name.substring(0, 255)),
        start_detlis: startPoint.name,
        end_point: `${endPoint.lat},${endPoint.lon}`,
        end_text: getShortLocationName(endPoint.name.substring(0, 255)),
        end_detlis: endPoint.name,
        distance_km: tripInfo.distance.toFixed(2),
        duration_min: Math.round(tripInfo.adjustedDuration),
        status: "new_order",
        start_time: new Date().toISOString()
      };

      const API_URL = 'https://alrasekhooninlaw.com/bousla/submit_order.php';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'فشل في إرسال الطلب');
      }

      if (!result.order_id) {
        throw new Error('لم يتم استلام رقم الطلب من الخادم');
      }

      toast.success(`تم إنشاء الطلب بنجاح! رقم الطلب: ${result.order_id}`, {
        id: loadingToast,
        duration: 5000
      });

      setStartPoint(null);
      setEndPoint(null);
      setTripInfo(null);

    } catch (error) {
      console.error("فشل إرسال الطلب:", error);
      
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الطلب";

      toast.error(errorMessage, {
        id: loadingToast,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col min-h-screen bg-gray-50 touch-none"
        dir="rtl"
      >
        {/* Page title */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="bg-white p-2 md:p-4 shadow-md w-full max-w-6xl mx-auto rounded-b-xl touch-none text-right"
        >
          <h1 className="text-lg md:text-2xl font-bold text-center text-gray-800 touch-none">
            بوصلة
          </h1>
        </motion.div>
        
        {/* Trip info */}
        {tripInfo && showTripInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-lg mx-2 mt-1 p-2 shadow-sm relative"
          >
            <button 
              onClick={hideTripInfo}
              className="absolute left-1 top-1 text-gray-500 hover:text-gray-700"
            >
              <FaChevronDown className="transform rotate-90 text-sm" />
            </button>
            
            <h3 className="font-bold text-green-800 text-xs mb-1 flex items-center gap-1 justify-center">
              <FaInfoCircle className="text-xs" />
              معلومات الرحلة
            </h3>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-start">
                <div className="text-gray-700 font-medium w-20">الانطلاق:</div>
                <div className="font-semibold flex-1 text-right pr-1">
                  {getShortLocationName(startPoint?.name)}
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="text-gray-700 font-medium w-20">الوصول:</div>
                <div className="font-semibold flex-1 text-right pr-1">
                  {getShortLocationName(endPoint?.name)}
                </div>
              </div>  
              
              <div className="flex items-center">
                <div className="text-green-700 font-medium w-20">المسافة:</div>
                <div className="font-semibold flex-1 text-right pr-1">
                  {tripInfo.distance.toFixed(1)} كم
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="text-green-700 font-medium w-20">الوقت:</div>
                <div className="font-semibold flex-1 text-right pr-1">
                  {tripInfo.adjustedDuration.toFixed(0)} دقيقة
                  {tripInfo.isPeakHour && " (ذروة)"}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search bar */}
        {showSearch && (
          <motion.div 
            layout
            className="bg-white p-2 md:p-4 shadow-md w-full max-w-6xl mx-auto my-1 rounded-lg relative text-right"
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.div 
                  whileHover={{ y: -1 }}
                  className="flex-1 relative"
                >
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      مكان الانطلاق
                    </label>
                    {startPoint && (
                      <button 
                        onClick={clearStartPoint}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <FaTimes className="text-xs" />
                        مسح
                      </button>
                    )}
                  </div>
                  <div className="flex items-center relative">
                    <div className="p-2 text-red-500">
                      <FaMapMarkerAlt className="text-sm" />
                    </div>
                    <motion.input
                      type="text"
                      value={activeSearch === "start" ? startSearchQuery : getShortLocationName(startPoint?.name) || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartSearchQuery(e.target.value)}
                      onFocus={() => setActiveSearch("start")}
                      placeholder="ابحث عن مكان الانطلاق"
                      className="w-full p-1 sm:p-2 text-xs sm:text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      whileFocus={{ scale: 1.01 }}
                      style={{ direction: 'rtl' }}
                    />
                    {(activeSearch === "start" && searching) && (
                      <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                        <FaSpinner className="text-blue-500 text-sm animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {activeSearch === "start" && startSearchResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="absolute z-[9999] w-full mt-1 border border-gray-200 rounded-lg bg-white shadow-xl overflow-hidden text-right"
                      style={{
                        top: '100%',
                        right: 0,
                        maxHeight: '300px'
                      }}
                    >
                      <div className="overflow-y-auto max-h-[300px]">
                        {startSearchResults.map((result, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="p-2 border-b hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelectLocation(
                              parseFloat(result.lat),
                              parseFloat(result.lon),
                              result.display_name,
                              "start"
                            )}
                          >
                            <div className="text-xs sm:text-sm font-medium line-clamp-2">
                              {result.display_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.lat}, {result.lon}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -1 }}
                  className="flex-1 relative"
                >
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      مكان الوصول
                    </label>
                    {endPoint && (
                      <button 
                        onClick={clearEndPoint}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <FaTimes className="text-xs" />
                        مسح
                      </button>
                    )}
                  </div>
                  <div className="flex items-center relative">
                    <div className="p-2 text-green-500">
                      <FaFlagCheckered className="text-sm" />
                    </div>
                    <motion.input
                      type="text"
                      value={activeSearch === "end" ? endSearchQuery : getShortLocationName(endPoint?.name) || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndSearchQuery(e.target.value)}
                      onFocus={() => setActiveSearch("end")}
                      placeholder="ابحث عن مكان الوصول"
                      className="w-full p-1 sm:p-2 text-xs sm:text-sm border rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
                      whileFocus={{ scale: 1.01 }}
                      style={{ direction: 'rtl' }}
                    />
                    {(activeSearch === "end" && searching) && (
                      <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                        <FaSpinner className="text-green-500 text-sm animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {activeSearch === "end" && endSearchResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="absolute z-[9999] w-full mt-1 border border-gray-200 rounded-lg bg-white shadow-xl overflow-hidden text-right"
                      style={{
                        top: '100%',
                        right: 0,
                        maxHeight: '300px'
                      }}
                    >
                      <div className="overflow-y-auto max-h-[300px]">
                        {endSearchResults.map((result, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="p-2 border-b hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelectLocation(
                              parseFloat(result.lat),
                              parseFloat(result.lon),
                              result.display_name,
                              "end"
                            )}
                          >
                            <div className="text-xs sm:text-sm font-medium line-clamp-2">
                              {result.display_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.lat}, {result.lon}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
              
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 min-w-[48%] sm:min-w-0"
                >
                  <button
                    onClick={() => {
                      if (activeSearch) {
                        setIsSelectingOnMap(true);
                        toast(`حدد موقع ${activeSearch === "start" ? "الانطلاق" : "الوصول"} على الخريطة`, {
                          icon: '📍',
                        });
                      }
                    }}
                    disabled={!activeSearch}
                    className={`w-full px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1 ${
                      activeSearch 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors`}
                  >
                    <FaMapMarkerAlt className="text-xs sm:text-sm" />
                    حدد على الخريطة
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 min-w-[48%] sm:min-w-0"
                >
                  <button
                    onClick={saveTrip}
                    disabled={!startPoint || !endPoint}
                    className={`w-full px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1 ${
                      startPoint && endPoint 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors`}
                  >
                    <FaSave className="text-xs sm:text-sm" />
                    حفظ الرحلة
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {showSearch && (
          <div className="w-full max-w-6xl mx-auto px-2">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 min-w-[48%] sm:min-w-0"
            >
              <button
                onClick={() => {
                  if (activeSearch) {
                    getCurrentLocation(activeSearch);
                  }
                }}
                disabled={!activeSearch}
                className={`w-full px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1 ${
                  activeSearch 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                <FaLocationArrow className="text-xs sm:text-sm" />
                الموقع الحالي
              </button>
            </motion.div>
          </div>
        )}
        
        {startPoint && endPoint && tripInfo && !showTripInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mx-4 mt-2 mb-2"
          >
            <button
              onClick={displayTripInfo}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 shadow-md text-sm"
            >
              <FaInfoCircle />
              عرض تفاصيل الرحلة
            </button>
          </motion.div>
        )}

        {startPoint && endPoint && tripInfo && (
          <motion.div 
            whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
            className="mx-4 mt-3 mb-4"
          >
            <button
              onClick={submitOrder}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 ${
                isSubmitting ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'
              } text-white rounded-lg flex items-center justify-center gap-2 shadow-lg`}
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaArrowRight className="text-sm" />
                  <span className="text-sm font-medium">ارسال الطلب</span>
                </>
              )}
            </button>
          </motion.div>
        )}
        
        <motion.div 
          layout
          className="flex-1 p-1 md:p-4 max-w-6xl w-full mx-auto touch-none relative z-10"
        >
          <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-220px)] w-full rounded-lg sm:rounded-xl overflow-hidden shadow-md sm:shadow-lg touch-none">
            <MapComponent 
              coordinates={startPoint ? [startPoint.lat, startPoint.lon] : defaultCoordinates}
              locations={
                [
                  ...(startPoint ? [{ ...startPoint, isStartPoint: true }] : []),
                  ...(endPoint ? [{ ...endPoint, isEndPoint: true }] : [])
                ]
              }
              routes={
                routeCoordinates.length > 0
                  ? [{
                      coordinates: routeCoordinates
                    }]
                  : []
              }
              isSelectingOnMap={isSelectingOnMap}
              onSelectLocation={handleMapSelection}
            />
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default MapOnlyPage;