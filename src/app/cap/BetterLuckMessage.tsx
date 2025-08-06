'use client';

import React from 'react';

interface BetterLuckMessageProps {
  onClose: () => void;
}

export const BetterLuckMessage: React.FC<BetterLuckMessageProps> = ({ onClose }) => {
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
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          حظ أوفر بالعرض القادم
        </h2>

        {/* النص الثانوي */}
        <p className="text-lg text-gray-700 mb-6">
          وافق كابتن آخر على الطلب، حاول أن تكون أسرع في المرة القادمة
        </p>

        {/* زر الموافقة */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg transition-colors duration-200"
        >
          موافق
        </button>
      </div>
    </div>
  );
};