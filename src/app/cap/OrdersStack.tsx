// OrdersStack.tsx
import { OrderDetails } from './types';

interface OrdersStackProps {
  orders: OrderDetails[];
  onAccept: (orderId: number) => void;
  onClose: (orderId: number) => void;
  acceptStatus: 'idle' | 'goodluck' | 'loading' | 'success' | 'error';
}

export const OrdersStack = ({ 
  orders,
  onAccept,
  onClose,
  acceptStatus
}: OrdersStackProps) => {
  return (
    <div className="fixed bottom-2 left-0 right-0 mx-4 z-50 space-y-2">
      {orders.map((order, index) => (
        <div 
          key={order.id}
          className={`bg-white rounded-lg shadow-xl border border-gray-300 transition-all duration-300 ${
            index !== 0 ? 'opacity-90 -mt-16' : ''
          }`}
          style={{
            transform: `scale(${1 - index * 0.05})`,
            zIndex: orders.length - index,
          }}
        >
          <div className="p-4 rtl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">
                الطلب #{orders.length - index}
              </h3>
              <button 
                onClick={() => onClose(order.id)}
                className="text-gray-500 hover:text-red-500 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-3">
              <p className="text-sm">
                <span className="font-bold text-red-500">من:</span> {order.start_text}
              </p>
              <p className="text-sm">
                <span className="font-bold text-green-500">إلى:</span> {order.end_text}
              </p>
            </div>

            <div className="flex justify-between text-sm mb-3">
              <span>المسافة: {order.distance_km} كم</span>
              <span>التكلفة: {order.cost} ل.س</span>
            </div>

            {index === 0 && (
              <>
                {acceptStatus === 'loading' ? (
                  <button className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold flex justify-center items-center" disabled>
                    جاري المعالجة...
                  </button>
                ) : acceptStatus === 'success' ? (
                  <button className="w-full bg-green-500 text-white py-2 rounded-lg font-bold" disabled>
                    تم القبول بنجاح ✓
                  </button>
                ) : acceptStatus === 'goodluck' ? (
                  <button className="w-full bg-yellow-500 text-white py-2 rounded-lg font-bold" disabled>
                    محجوز مسبقاً
                  </button>
                ) : (
                  <button 
                    onClick={() => onAccept(order.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold"
                  >
                    قبول الطلب
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};