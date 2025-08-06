'use client';

import React from 'react';
import { Profile } from '../types';
import Image from 'next/image';

interface ProfileMenuProps {
  profile: Profile;
  onClose: () => void;
  onShowServices: () => void;
  onShowPayments: () => void;
  onShowLastOrders: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  profile,
  onClose,
  onShowServices,
  onShowPayments,
  onShowLastOrders
}) => {
  return (
    <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-30 shadow-xl transform transition-transform duration-300 ease-in-out">
      <div className="h-full flex flex-col">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">القائمة</h2>
          <button 
            onClick={onClose}
            className="text-2xl"
          >
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center mt-4">
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 overflow-hidden">
              {profile.photo ? (
                <Image 
  src={profile.photo || '/default-avatar.png'} 
  alt="Profile" 
  fill
  className="object-cover"
  onError={(e) => {
    (e.target as HTMLImageElement).src = '/default-avatar.png';
  }}
/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl bg-blue-500 text-white">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-gray-600">{profile.phone}</p>
          </div>
          
          <div className="mt-8">
            <button 
              onClick={onShowServices}
              className="w-full text-right py-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 px-2 rounded transition-colors"
            >
              <span className="text-gray-800">تعديل خدماتي</span>
              <span className="text-gray-500">&gt;</span>
            </button>

            <button 
              onClick={onShowPayments}
              className="w-full text-right py-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 px-2 rounded transition-colors"
            >
              <span className="text-gray-800">دفعاتي</span>
              <span className="text-gray-500">&gt;</span>
            </button>

            <button 
              onClick={onShowLastOrders}
              className="w-full text-right py-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 px-2 rounded transition-colors"
            >
              <span className="text-gray-800">الطلبات السابقة</span>
              <span className="text-gray-500">&gt;</span>
            </button>

            <button className="w-full text-right py-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 px-2 rounded transition-colors">
              <span className="text-gray-800">تغيير كلمة المرور</span>
              <span className="text-gray-500">&gt;</span>
            </button>
            
            <button className="w-full text-right py-3 text-red-500 hover:bg-red-50 px-2 rounded mt-4 transition-colors">
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};