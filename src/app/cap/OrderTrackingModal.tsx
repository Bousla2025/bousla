// OrderTrackingModal.tsx
'use client';

import React, { useState, useEffect } from 'react';

export type myorder = {
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
  discount: string;
  km_price: string;
  min_price: string;
  add1: string;
  f_km: string;
};

interface TrackingData {
  distance: string;
  time: string;
  price: string;
}

interface OrderTrackingModalProps {
  order: myorder;
  trackingData?: TrackingData;
  initialStatus?: string; // إضافة خاصية للحالة الأولية
  onNextStatus: (status: string) => void;
  onCallCustomer: () => void;
  onPokeCustomer: () => void;
  onCallCompany: () => void;
  onCallEmergency: () => void;
  isLoading?: boolean;
}

const STATUS_STEPS = [
  { id: 'arrived', label: 'انا في طريقي' },
  { id: 'waiting', label: 'انا في انتظار الزبون' },
  { id: 'started', label: 'تم بدء الرحلة' },
  { id: 'completed', label: 'انتهت الرحلة' }
];

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  trackingData,
  initialStatus = 'arrived', // قيمة افتراضية
  onNextStatus,
  onCallCustomer,
  onPokeCustomer,
  onCallCompany,
  onCallEmergency,
  isLoading = false
}) => {
  const [currentStatus, setCurrentStatus] = useState(initialStatus); // استخدام القيمة الأولية
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayData, setDisplayData] = useState({
    distance: order.distance_km,
    time: order.duration_min.toString(),
    price: order.cost
  });

  useEffect(() => {
    if (trackingData) {
      setDisplayData({
        distance: trackingData.distance || order.distance_km,
        time: trackingData.time || order.duration_min.toString(),
        price: trackingData.price || order.cost
      });
    }
  }, [trackingData, order]);

  const handleNextStatus = () => {
    const currentIndex = STATUS_STEPS.findIndex(step => step.id === currentStatus);
    if (currentIndex < STATUS_STEPS.length - 1) {
      const nextStatus = STATUS_STEPS[currentIndex + 1].id;
      setCurrentStatus(nextStatus);
      onNextStatus(nextStatus);
    }
  };

  const getStatusIndex = (statusId: string) => {
    return STATUS_STEPS.findIndex(step => step.id === statusId);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div dir="rtl" className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 border-t border-gray-200 transition-all duration-300">
      {/* زر التصغير/التكبير */}
      <div className="flex justify-center pt-2 pb-1 cursor-pointer" onClick={toggleExpand}>
        <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      {/* دوائر عرض بيانات التكلفة */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex justify-around items-center mb-2">
          {/* دائرة المسافة */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-transparent border-2 border-blue-500 rounded-full flex flex-col items-center justify-center text-blue-500 font-bold shadow-md">
              <span className="text-lg">{displayData.distance}</span>
              <span className="text-xs">كم</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">المسافة</span>
          </div>

          {/* دائرة الوقت */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-transparent border-2 border-blue-500 rounded-full flex flex-col items-center justify-center text-blue-500 font-bold shadow-md">
              <span className="text-lg">{displayData.time}</span>
              <span className="text-xs">دقيقة</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">الوقت</span>
          </div>

          {/* دائرة التكلفة */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-transparent border-2 border-blue-500 rounded-full flex flex-col items-center justify-center text-blue-500 font-bold shadow-md">
              <span className="text-lg">{displayData.price}</span>
              <span className="text-xs">ل.س</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">التكلفة</span>
          </div>
        </div>
      </div>

      {/* Status Progress */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex justify-between mb-3 relative">
          {STATUS_STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center z-10 relative" style={{ flex: 1 }}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  getStatusIndex(currentStatus) >= index 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <div className="text-xs mt-1 text-center px-1" style={{ maxWidth: '70px' }}>
                {step.label}
              </div>
            </div>
          ))}
          <div className="absolute top-4 left-0 right-0 h-1.5 bg-gray-300 transform translate-y-[-50%]">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ 
                width: `${(getStatusIndex(currentStatus) / (STATUS_STEPS.length - 1)) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* زر التالي الكبير */}
         <button
        onClick={() => onNextStatus(STATUS_STEPS[getStatusIndex(currentStatus) + 1]?.id || 'completed')}
        disabled={getStatusIndex(currentStatus) === STATUS_STEPS.length - 1 || isLoading}
        className="w-full h-14 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 text-base font-semibold shadow-md hover:bg-blue-700 transition-colors relative"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="mr-2">جاري التحديث...</span>
          </div>
        ) : (
          getStatusIndex(currentStatus) === STATUS_STEPS.length - 1 
            ? 'تم الانتهاء' 
            : 'الانتقال للمرحلة التالية'
        )}
      </button>
      </div>

      {/* المحتوى الإضافي - يظهر فقط في الوضع الممتد */}
      {isExpanded && (
        <>
          {/* معلومات الطلب */}
          <div dir="rtl" className="p-3 bg-blue-50 border-b border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <span className="text-gray-600 ml-1">:من</span>
                <span className="font-bold truncate max-w-[250px]">{order.start_text}</span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-600 ml-1">:إلى</span>
                <span className="font-bold truncate max-w-[250px]">{order.end_text}</span>
              </div>
            </div>
          </div>

          {/* الأزرار الدائرية */}
          <div className="p-3 flex justify-around items-center">
            <button
              onClick={onCallCustomer}
              className="flex flex-col items-center justify-center"
              title="اتصال بالزبون"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-green-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-xs">اتصال</span>
            </button>

            <button
              onClick={onPokeCustomer}
              className="flex flex-col items-center justify-center"
              title="نكز الزبون"
            >
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-yellow-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-xs">نكز</span>
            </button>

            <button
              onClick={onCallCompany}
              className="flex flex-col items-center justify-center"
              title="اتصال بالشركة"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h2m-2 0h-4m-2 0H9m2 0h2m2 0h2M9 7h2m2 0h2M9 11h2m2 0h2m-2 4h2" />
                </svg>
              </div>
              <span className="text-xs">الشركة</span>
            </button>

            <button
              onClick={onCallEmergency}
              className="flex flex-col items-center justify-center"
              title="اتصال طوارئ"
            >
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-red-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-xs">طوارئ</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderTrackingModal;