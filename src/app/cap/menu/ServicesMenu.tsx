'use client';

import React from 'react';
import { Service } from '../types';
import Image from 'next/image';

interface ServicesMenuProps {
  services: Service[];
  isUpdatingService: number | null;
  onClose: () => void;
  onToggleService: (service: Service) => void;
}

export const ServicesMenu: React.FC<ServicesMenuProps> = ({
  services,
  isUpdatingService,
  onClose,
  onToggleService
}) => {
  return (
    <div className="absolute top-0 left-0 h-full w-3/4 max-w-sm bg-white z-40 shadow-xl">
      <div className="h-full flex flex-col">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">الخدمات</h2>
          <button onClick={onClose} className="text-2xl">
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Image 
  src={service.photo1 || '/default-service.png'} 
  alt={service.name1}
  width={48}  // القيمة بالبكسل (مقابل w-12 في className)
  height={48} // القيمة بالبكسل (مقابل h-12 في className)
  className="object-cover rounded-lg"
  onError={(e) => {
    (e.target as HTMLImageElement).src = '/default-service.png';
  }}
/>
                  <div className="text-right">
                    <h3 className="font-medium text-gray-800">{service.name1}</h3>
                    <p className="text-sm text-gray-500">
                      {service.m_cost} ل.س/دقيقة - {service.km} كم
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => onToggleService(service)}
                  disabled={isUpdatingService === service.id}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none
                    ${service.active === 1 ? 'bg-green-500' : 'bg-gray-300'}
                    ${isUpdatingService === service.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`inline-block w-5 h-5 transform transition-transform bg-white rounded-full shadow
                      ${service.active === 1 ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                  {isUpdatingService === service.id && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};