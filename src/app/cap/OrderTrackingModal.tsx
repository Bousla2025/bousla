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
  { id: 'waiting', label: 'بانتظار الزبون' },
  { id: 'started', label: 'بدأت الرحلة' },
  { id: 'completed', label: 'انتهت الرحلة' }
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRouteExpanded, setIsRouteExpanded] = useState(true);
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

  const toggleRouteExpand = () => {
    setIsRouteExpanded(!isRouteExpanded);
  };

  return (
    <div dir="rtl" className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 border-t border-gray-200 transition-all duration-300">
      {/* زر التصغير/التكبير الرئيسي */}
      <div className="flex justify-center pt-2 pb-1 cursor-pointer" onClick={toggleExpand}>
        <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      {isExpanded && (
        <>
          {/* المحتوى الرئيسي */}
          <div className="flex flex-col md:flex-row">
            {/* الشريط الجانبي للبيانات */}
            <div className="bg-blue-50 p-3 md:w-28 md:flex-shrink-0 flex md:flex-col justify-around items-center border-l border-gray-200">
              {/* دائرة المسافة */}
              <div className="flex flex-col items-center mb-2 md:mb-4">
                <div className="w-14 h-14 bg-blue-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs mb-1 shadow-md">
                  <span className="text-sm">{displayData.distance}</span>
                  <span className="text-[10px]">كم</span>
                </div>
                <span className="text-xs text-gray-600 hidden md:block">المسافة</span>
              </div>

              {/* دائرة الوقت */}
              <div className="flex flex-col items-center mb-2 md:mb-4">
                <div className="w-14 h-14 bg-green-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs mb-1 shadow-md">
                  <span className="text-sm">{displayData.time}</span>
                  <span className="text-[10px]">دقيقة</span>
                </div>
                <span className="text-xs text-gray-600 hidden md:block">الوقت</span>
              </div>

              {/* دائرة التكلفة */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-purple-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs mb-1 shadow-md">
                  <span className="text-sm">{displayData.price}</span>
                  <span className="text-[10px]">ل.س</span>
                </div>
                <span className="text-xs text-gray-600 hidden md:block">التكلفة</span>
              </div>
            </div>

            {/* المحتوى الرئيسي */}
            <div className="flex-1">
              {/* معلومات الطريق - قابلة للطي */}
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center cursor-pointer" onClick={toggleRouteExpand}>
                  <h3 className="text-sm font-semibold text-gray-700">تفاصيل الرحلة</h3>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 text-gray-500 transition-transform ${isRouteExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {isRouteExpanded && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-2 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">من</div>
                        <div className="text-sm font-medium truncate">{order.start_text}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-green-100 text-green-800 rounded-full p-1 mr-2 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">إلى</div>
                        <div className="text-sm font-medium truncate">{order.end_text}</div>
                      </div>
                    </div>
                  </div>
                )}
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
                      <div className="text-xs mt-1 text-center px-1 hidden sm:block" style={{ maxWidth: '70px' }}>
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
                  onClick={handleNextStatus}
                  disabled={getStatusIndex(currentStatus) === STATUS_STEPS.length - 1}
                  className="w-full h-12 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors"
                >
                  {getStatusIndex(currentStatus) === STATUS_STEPS.length - 1 
                    ? 'تم الانتهاء' 
                    : 'التالي'}
                </button>
              </div>

              {/* الأزرار الدائرية */}
              <div className="p-3 flex justify-around items-center bg-gray-50">
                <button
                  onClick={onCallCustomer}
                  className="flex flex-col items-center justify-center"
                  title="اتصال بالزبون"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-green-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-yellow-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mb-1 shadow-md hover:bg-red-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-xs">طوارئ</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderTrackingModal;