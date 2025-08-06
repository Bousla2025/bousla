// OrderDetailsModal.tsx
'use client';

import React, { useState } from 'react';
import { OrderDetails } from './types';

interface OrderDetailsModalProps {
  order: OrderDetails;
  onClose: () => void;
  onAccept: () => Promise<void>;
  acceptStatus: 'idle' | 'loading' | 'success' | 'error';
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onAccept,
  acceptStatus
}) => {
  const [expandedStart, setExpandedStart] = useState(false);
  const [expandedEnd, setExpandedEnd] = useState(false);

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return 'لا توجد تفاصيل';
    if (text.length <= maxLength || expandedStart || expandedEnd) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div className="fixed bottom-2 left-0 right-0 mx-4 bg-white rounded-lg shadow-xl z-50 border border-gray-300 rtl">
      <div className="flex justify-end p-2">
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center mb-3">
          <h3 className="flex-1 text-center text-xl font-bold text-red-500">
            {order.start_text} - {order.end_text}
          </h3>
        </div>

        <div className="flex items-center mb-3">
          <span className="text-xl font-bold text-gray-600">نوع الطلب</span>
          <span className="mr-3 text-xl font-bold">{order.ser_chi_id}</span>
        </div>

        <div className="mb-3">
          <div className="flex">
            <div className="flex-1 text-center text-sm font-sans text-black">
              المسافة: {order.distance_km} كم
            </div>
            <div className="flex-1 text-center text-sm font-sans text-black">
              الوقت: {order.duration_min} دقيقة
            </div>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

        <div className="mb-3">
          <div className="flex">
            <div className="flex-1 text-center text-sm font-sans text-black">
              السعر: {order.cost} ل.س
            </div>
            <div className="flex-1 text-center text-sm font-sans text-black">
              تقييم الزبون: 
              {Array(5).fill(0).map((_, i) => (
                <span key={i} className={i < order.user_rate ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

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
              من: {truncateText(order.start_detlis)}
              {order.start_detlis && order.start_detlis.length > 30 && (
                <span className="text-blue-500 text-xs mr-1">
                  {expandedStart ? 'إخفاء' : 'المزيد'}
                </span>
              )}
            </span>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

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
              الى: {truncateText(order.end_detlis)}
              {order.end_detlis && order.end_detlis.length > 30 && (
                <span className="text-blue-500 text-xs mr-1">
                  {expandedEnd ? 'إخفاء' : 'المزيد'}
                </span>
              )}
            </span>
          </div>
          <div className="border-t border-gray-400 my-2"></div>
        </div>

        {order.notes && (
          <div className="mb-3">
            <p className="text-lg font-bold text-red-600 mr-2">{order.notes}</p>
          </div>
        )}

        {acceptStatus === 'loading' ? (
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
        ) : acceptStatus === 'success' ? (
          <button
            className="w-full bg-green-500 text-white py-2 rounded-lg font-bold text-lg mt-2"
            disabled
          >
            تم القبول بنجاح ✓
          </button>
        ) : acceptStatus === 'error' ? (
          <button
            onClick={onAccept}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-lg mt-2"
          >
            حاول مرة أخرى
          </button>
        ) : (
          <button
            onClick={onAccept}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-lg mt-2"
          >
            موافق
          </button>
        )}
      </div>
    </div>
  );
};