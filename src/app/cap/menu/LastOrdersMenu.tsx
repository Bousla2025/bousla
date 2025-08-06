'use client';

import React, { useState } from 'react';
import { Order } from '../types';
import { extractMunicipality } from '../mapUtils';

interface LastOrdersMenuProps {
  orders: Order[];
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
    const orderDate = new Date(order.insert_time);
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

  return (
    <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-40 shadow-xl">
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
                  className="bg-white p-3 rounded-lg shadow border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onOrderClick(order.id)}
                >
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