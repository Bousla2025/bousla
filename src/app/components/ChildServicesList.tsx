// components/ChildServicesList.tsx

import React, { useState } from "react"; // أضفنا useState هنا
import { FaInfoCircle } from "react-icons/fa";
import { motion } from "framer-motion";

interface ChildService {
  id: number;
  name1: string;
  f_km: string;
  km: string;
  m_cost: string;
  add_cost: string;
  dis_cost: string;
  photo1: string;
  tax: string;
}

interface ChildServicesListProps {
  services: ChildService[];
  distance: number;
  duration: number;
}

interface PricingDetailsModalProps {
  service: ChildService;
  distance: number;
  duration: number;
  onClose: () => void;
}

//عرض الخدمات
const ChildServicesList: React.FC<ChildServicesListProps> = ({ services, distance, duration }) => {
  const [selectedService, setSelectedService] = useState<ChildService | null>(null);

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

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex space-x-3 rtl:space-x-reverse px-2">
        {services.map((service) => (
          <motion.div
            key={service.id}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-40 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
          >
            <div className="p-3">
              <div className="flex justify-center mb-2">
                {service.photo1 ? (
                  <img 
                    src={service.photo1} 
                    alt={service.name1}
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-500">لا يوجد صورة</span>
                  </div>
                )}
              </div>
              
              <div className="text-center mb-2">
                <h3 className="font-bold text-sm text-gray-800 line-clamp-1">
                  {service.name1}
                </h3>
                <p className="text-lg font-bold text-green-600">
                  {calculatePrice(service)} ل.س
                </p>
              </div>
              
              <button 
                className="w-full py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs flex items-center justify-center gap-1"
                onClick={() => setSelectedService(service)}
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


//تفاصل الخدمة
const PricingDetailsModal: React.FC<PricingDetailsModalProps> = ({ 
  service, 
  distance, 
  duration, 
  onClose 
}) => {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-blue-600 p-4 text-white">
          <h3 className="text-lg font-bold text-center">تفاصيل التسعير</h3>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <span className="font-medium text-gray-700">الخدمة:</span>
            <span className="font-bold">{service.name1}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>السعر الأولي:</span>
              <span>{service.f_km} ل.س</span>
            </div>
            <div className="flex justify-between">
              <span>سعر الكيلومتر:</span>
              <span>{service.km} ل.س × {distance.toFixed(1)} كم</span>
            </div>
            <div className="flex justify-between">
              <span>سعر الدقيقة:</span>
              <span>{service.m_cost} ل.س × {duration.toFixed(0)} دقيقة</span>
            </div>
            <div className="flex justify-between">
              <span>الإضافة المالية:</span>
              <span>{service.add_cost} ل.س</span>
            </div>
            <div className="flex justify-between">
              <span>الضريبة:</span>
              <span>{service.tax} ل.س</span>
            </div>
            <div className="flex justify-between">
              <span>الحسم:</span>
              <span>-{service.dis_cost} ل.س</span>
            </div>
            
            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>الإجمالي:</span>
                <span className="text-green-600">{calculatePrice(service)} ل.س</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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