'use client';

import React, { useState } from 'react';
import { Last_order } from '../types';
import { extractMunicipality } from '../mapUtils';

interface LastOrdersMenuProps {
  orders: Last_order[];
  onClose: () => void;
  onOrderClick: (orderId: number) => void;
}

export const LastOrdersMenu: React.FC<LastOrdersMenuProps> = ({
  orders,
  onClose,
  onOrderClick
}) => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.start_time as string);
    const now = new Date();
    
    if (timeFilter === 'day') {
      return orderDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return orderDate >= weekStart;
    } else {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-40 shadow-xl" dir="rtl">
      <div className="h-full flex flex-col">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">الطلبات السابقة</h2>
          <button 
            onClick={onClose}
            className="text-2xl"
          >
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-around mb-4 bg-blue-50 p-2 rounded-lg">
            <button 
              onClick={() => setTimeFilter('day')}
              className={`px-3 py-1 rounded text-sm ${timeFilter === 'day' ? 'bg-blue-500 text-white' : 'bg-blue-100'}`}
            >
              اليوم
            </button>
            <button 
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 rounded text-sm ${timeFilter === 'week' ? 'bg-blue-500 text-white' : 'bg-blue-100'}`}
            >
              الأسبوع
            </button>
            <button 
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 rounded text-sm ${timeFilter === 'month' ? 'bg-blue-500 text-white' : 'bg-blue-100'}`}
            >
              الشهر
            </button>
          </div>
          
          <div className="space-y-3">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-white p-3 rounded-lg shadow border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors text-right"
                  onClick={() => onOrderClick(order.id)}
                >
                  <div className="mb-2">
                    <p className="font-medium">من: {extractMunicipality(order.start_text)}</p>
                    <p className="font-medium">إلى: {extractMunicipality(order.end_text)}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-center text-sm border-t pt-2">
                    <span className="font-medium">كم</span>
                    <span className="font-medium">دقيقة</span>
                    <span className="font-medium text-blue-500">ل.س</span>
                    <span className="font-medium">عمولة</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 text-center text-sm border-t pt-2">
                    <span className="font-medium">{order.real_km}</span>
                    <span className="font-medium">{order.real_min}</span>
                    <span className="font-medium text-blue-500">{order.real_price}</span>
                    <span className="font-medium">{order.comp_percent}</span>
                  </div>
                  
                  {order.start_time && (
                    <div className="text-xs text-gray-500 mt-2 text-left">
                      <span>{formatDate(order.start_time as string)}</span>
                      <span className="mx-2">|</span>
                      <span>{formatTime(order.start_time as string)}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد طلبات في الفترة المحددة
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};