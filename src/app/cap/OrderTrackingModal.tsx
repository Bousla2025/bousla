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
  onNextStatus: (status: string) => void;
  onCallCustomer: () => void;
  onPokeCustomer: () => void;
  onCallCompany: () => void;
  onCallEmergency: () => void;
}

const STATUS_STEPS = [
  { id: 'arrived', label: 'في الطريق' },
  { id: 'waiting', label: 'في الانتظار' },
  { id: 'started', label: 'بدأت الرحلة' },
  { id: 'completed', label: 'انتهت' }
];

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  trackingData,
  onNextStatus,
  onCallCustomer,
  onPokeCustomer,
  onCallCompany,
  onCallEmergency
}) => {
  const [currentStatus, setCurrentStatus] = useState('arrived');
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div dir="rtl" className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 border-t border-gray-200 transition-all duration-300 max-w-md mx-auto">
      {/* Header مع زر التصغير/التكبير */}
      <div className="flex justify-between items-center p-3 bg-blue-600 text-white rounded-t-2xl">
        <div className="flex items-center">
          <span className="text-sm font-medium">تتبع الطلب #{order.id}</span>
        </div>
        <button 
          onClick={toggleExpand}
          className="p-1 rounded-full hover:bg-blue-700 transition-colors"
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* المحتوى الأساسي (يظهر دائمًا) */}
      <div className="p-3 bg-white">
        {/* معلومات المسار المختصرة */}
        <div className="flex justify-between items-center mb-3 text-xs">
          <div className="flex items-center truncate max-w-[40%]">
            <span className="text-gray-500 ml-1">من:</span>
            <span className="font-medium truncate">{order.start_text}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <div className="flex items-center truncate max-w-[40%]">
            <span className="text-gray-500 ml-1">إلى:</span>
            <span className="font-medium truncate">{order.end_text}</span>
          </div>
        </div>

        {/* بيانات التكلفة المدمجة */}
        <div className="flex justify-around items-center bg-blue-50 rounded-lg p-2 mb-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <span className="text-blue-600 font-bold text-sm">{displayData.distance}</span>
              <span className="text-xs text-gray-500 mr-1">كم</span>
            </div>
            <span className="text-xs text-gray-500">المسافة</span>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <span className="text-blue-600 font-bold text-sm">{displayData.time}</span>
              <span className="text-xs text-gray-500 mr-1">د</span>
            </div>
            <span className="text-xs text-gray-500">الوقت</span>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <span className="text-blue-600 font-bold text-sm">{displayData.price}</span>
              <span className="text-xs text-gray-500 mr-1">ل.س</span>
            </div>
            <span className="text-xs text-gray-500">التكلفة</span>
          </div>
        </div>

        {/* شريط التقدم المصغر */}
        <div className="flex justify-between items-center mb-3 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 -z-10">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ 
                width: `${(getStatusIndex(currentStatus) / (STATUS_STEPS.length - 1)) * 100}%` 
              }}
            ></div>
          </div>
          
          {STATUS_STEPS.map((step, index) => (
            <div key={step.id} className="relative z-10">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  getStatusIndex(currentStatus) >= index 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {isExpanded && (
                <div className="absolute bottom-[-20px] right-1/2 transform translate-x-1/2 text-xs whitespace-nowrap">
                  {step.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* زر الانتقال للمرحلة التالية */}
        <button
          onClick={handleNextStatus}
          disabled={getStatusIndex(currentStatus) === STATUS_STEPS.length - 1}
          className="w-full py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
        >
          {getStatusIndex(currentStatus) === STATUS_STEPS.length - 1 
            ? 'تم الانتهاء' 
            : 'التالي'}
        </button>
      </div>

      {/* المحتوى الإضافي (يظهر فقط عند التوسيع) */}
      {isExpanded && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          {/* الأزرار الإضافية */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button
              onClick={onCallCustomer}
              className="flex flex-col items-center justify-center p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="اتصال بالزبون"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs mt-1">اتصال</span>
            </button>

            <button
              onClick={onPokeCustomer}
              className="flex flex-col items-center justify-center p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              title="نكز الزبون"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs mt-1">نكز</span>
            </button>

            <button
              onClick={onCallCompany}
              className="flex flex-col items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="اتصال بالشركة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h2m-2 0h-4m-2 0H9m2 0h2m2 0h2M9 7h2m2 0h2M9 11h2m2 0h2m-2 4h2" />
              </svg>
              <span className="text-xs mt-1">الشركة</span>
            </button>

            <button
              onClick={onCallEmergency}
              className="flex flex-col items-center justify-center p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="اتصال طوارئ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs mt-1">طوارئ</span>
            </button>
          </div>

          {/* معلومات إضافية عن الطلب */}
          <div className="text-xs text-gray-600">
            <div className="flex justify-between mb-1">
              <span>سعر الكيلومتر:</span>
              <span className="font-medium">{order.km_price} ل.س</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>سعر الدقيقة:</span>
              <span className="font-medium">{order.min_price} ل.س</span>
            </div>
            {order.discount !== "0" && (
              <div className="flex justify-between mb-1">
                <span>خصم:</span>
                <span className="font-medium text-green-600">{order.discount} ل.س</span>
              </div>
            )}
            {order.notes && order.notes !== 'لا توجد ملاحظات' && (
              <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-100">
                <span className="font-medium">ملاحظات:</span> {order.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingModal;