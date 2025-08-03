// components/ChildServicesList.tsx
import React from "react";
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

const ChildServicesList: React.FC<ChildServicesListProps> = ({ services, distance, duration }) => {
  const calculatePrice = (service: ChildService) => {
    const firstKm = parseFloat(service.f_km) || 0;
    const kmPrice = parseFloat(service.km) || 0;
    const minutePrice = parseFloat(service.m_cost) || 0;
    const additionalCost = parseFloat(service.add_cost) || 0;
    const discount = parseFloat(service.dis_cost) || 0;
    const tax = parseFloat(service.tax) || 0;
    
    // الحساب: (سعر أول كم + (سعر الكم * المسافة) + (سعر الدقيقة * الوقت) + الإضافة المالية + الضريبة) - الحسم
    const price = (firstKm + (kmPrice * distance) + (minutePrice * duration) + additionalCost + tax) - discount;
    
    return Math.max(0, price).toFixed(0); // التأكد من أن السعر لا يكون سالباً
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
                onClick={() => {
                  // هنا يمكنك عرض تفاصيل السعر
                  alert(`
                    تفاصيل التسعير:
                    - السعر الأولي: ${service.f_km} ل.س
                    - سعر الكيلومتر: ${service.km} ل.س × ${distance.toFixed(1)} كم
                    - سعر الدقيقة: ${service.m_cost} ل.س × ${duration.toFixed(0)} دقيقة
                    - الإضافة المالية: ${service.add_cost} ل.س
                    - الضريبة: ${service.tax} ل.س
                    - الحسم: ${service.dis_cost} ل.س
                    --------------------------
                    الإجمالي: ${calculatePrice(service)} ل.س
                  `);
                }}
              >
                <FaInfoCircle className="text-xs" />
                التفاصيل
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChildServicesList;