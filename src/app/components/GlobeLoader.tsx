// components/GlobeLoader.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const GlobeLoader = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000); // سيظهر لمدة 3 ثوان

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* الكرة الأرضية */}
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "linear"
          }}
          className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-green-500 shadow-xl"
          style={{
            backgroundImage: `
              radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 20%),
              radial-gradient(circle at 70% 70%, rgba(255,255,255,0.5) 0%, transparent 20%)
            `,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 30px rgba(0,100,255,0.3)'
          }}
        >
          {/* نقطة سوريا */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute top-[42%] left-[58%] w-4 h-4 bg-red-600 rounded-full shadow-lg"
          />
        </motion.div>

        {/* نص التحميل */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-lg font-medium text-gray-700">جارٍ تحميل الخريطة</p>
          <p className="text-sm text-gray-500 mt-1">جاري التكبير على سوريا</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GlobeLoader;