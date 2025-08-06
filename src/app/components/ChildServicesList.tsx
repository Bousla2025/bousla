// components/ChildServicesList.tsx

import React, { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import Image from 'next/image';

export interface ChildService {
  id: number;
  name1: string;
  f_km: string;
  km: string;
  m_cost: string;
  add_cost: string;
  dis_cost: string;
  photo1: string;
  tax: string;
  car_seats: string;
}

interface ChildServicesListProps {
  services: ChildService[];
  distance: number;
  duration: number;
  onServiceSelect?: (service: ChildService) => void;
}

interface PricingDetailsModalProps {
  service: ChildService;
  distance: number;
  duration: number;
  onClose: () => void;
}

const ChildServicesList: React.FC<ChildServicesListProps> = ({ 
  services, 
  distance, 
  duration,
  onServiceSelect 
}) => {
  const [selectedService, setSelectedService] = useState<ChildService | null>(null);
  const [chosenService, setChosenService] = useState<ChildService | null>(null);

  const calculatePrice = (service: ChildService) => {
    const firstKm = parseFloat(service.f_km) || 0;
    const kmPrice = parseFloat(service.km) || 0;
    const minutePrice = parseFloat(service.m_cost) || 0;
    const additionalCost = parseFloat(service.add_cost) || 0;
    const discount = parseFloat(service.dis_cost) || 0;
    const tax = parseFloat(service.tax) || 0;
    
    const price = (firstKm + (kmPrice * distance) + (minutePrice * duration) + additionalCost + tax) - discount;
    
    return Math.max(0, price).toFixed(0);
  };

  const handleServiceClick = (service: ChildService) => {
    setChosenService(service);
    if (onServiceSelect) {
      onServiceSelect(service);
    }
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex space-x-3 rtl:space-x-reverse px-2">
        {services.map((service) => (
          <motion.div
            key={service.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-shrink-0 w-40 rounded-lg shadow-md overflow-hidden cursor-pointer transition-colors ${
              chosenService?.id === service.id 
                ? 'bg-yellow-50 border-2 border-yellow-300' 
                : 'bg-white border border-gray-200'
            }`}
            onClick={() => handleServiceClick(service)}
          >
            <div className="p-3">
              <div className="flex justify-center mb-2">
                {service.photo1 ? (
                  <Image
                    src={service.photo1}
                    alt={service.name1}
                    width={48}
                    height={48}
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = '/path-to-fallback-image.png';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-500">لا يوجد صورة</span>
                  </div>
                )}
              </div>
              
              <div className="text-center mb-2">
                <h3 className={`font-bold text-sm line-clamp-1 ${
                  chosenService?.id === service.id ? 'text-black-800' : 'text-gray-800'
                }`}>
                  {service.name1}
                </h3>
                <p className={`text-lg font-bold ${
                  chosenService?.id === service.id ? 'text-red-600' : 'text-black-600'
                }`}>
                  {calculatePrice(service)} ل.س
                </p>
              </div>
              
              <button 
                className={`w-full py-1 rounded text-xs flex items-center justify-center gap-1 ${
                  chosenService?.id === service.id
                    ? 'bg-yellow-100 text-black-700'
                    : 'bg-blue-50 hover:bg-blue-100 text-black-600'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedService(service);
                }}
              >
                <FaInfoCircle className="text-xs" />
                التفاصيل
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedService && (
        <PricingDetailsModal
          service={selectedService}
          distance={distance}
          duration={duration}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
};

const PricingDetailsModal: React.FC<PricingDetailsModalProps> = ({ 
  service, 
  distance, 
  duration, 
  onClose
}) => {
  const roundedDistance = Math.ceil(distance * 10) / 10;
  const roundedDuration = Math.ceil(duration);
  
  const calculatePrice = (service: ChildService) => {
    const firstKm = parseFloat(service.f_km) || 0;
    const kmPrice = parseFloat(service.km) || 0;
    const minutePrice = parseFloat(service.m_cost) || 0;
    const additionalCost = parseFloat(service.add_cost) || 0;
    const discount = parseFloat(service.dis_cost) || 0;
    const tax = parseFloat(service.tax) || 0;
    
    const firstKmCost = firstKm;
    const distanceCost = kmPrice * roundedDistance;
    const durationCost = minutePrice * roundedDuration;
    const totalBeforeDiscount = firstKmCost + distanceCost + durationCost + additionalCost + tax;
    const finalPrice = totalBeforeDiscount - discount;

    return Math.max(0, Math.ceil(finalPrice)).toString();
  };

  

  const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value || "0") : value;
  // استخدام toLocaleString مع locale 'en' لتنسيق الأرقام بالإنجليزية
  return num.toLocaleString('en');
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="absolute inset-0" style={{ pointerEvents: 'auto' }} />
      
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300 relative z-10"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="bg-yellow-300 p-4 text-black">
          <h3 className="text-lg font-bold text-center">تفاصيل الرحلة</h3>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <span className="font-bold text-gray-800 text-center">{service.name1}</span>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-400 mb-2">التكاليف الأساسية</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">رسوم طلب:</span>
                  <span className="font-medium">{formatCurrency(service.f_km)} ل.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد المقاعد:</span>
                  <span className="font-medium">
                    {formatCurrency(service.car_seats)} 
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تكلفة المسافة:</span>
                  <span className="font-medium">
                    {formatCurrency(service.km)} ل.س × {roundedDistance.toFixed(1)} كم
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تكلفة الوقت:</span>
                  <span className="font-medium">
                    {formatCurrency(service.m_cost)} ل.س × {roundedDuration} دقيقة
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-400 mb-2">التكاليف الإضافية</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">تكاليف إضافية:</span>
                  <span className="font-medium">{formatCurrency(service.add_cost)} ل.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الضريبة:</span>
                  <span className="font-medium">{formatCurrency(service.tax)} ل.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الخصم:</span>
                  <span className="font-medium text-red-500">-{formatCurrency(service.dis_cost)} ل.س</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">المبلغ الإجمالي:</span>
              <span className="text-green-600 font-bold text-xl">
                {formatCurrency(calculatePrice(service))} ل.س
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 text-black rounded-lg font-medium transition-colors w-full max-w-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChildServicesList;