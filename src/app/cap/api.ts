// api.ts
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  order?: Order; 
  status?: 'success' | 'goodluck' | 'error';
  current_captain_id?: number;
}


interface update_ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  order?: Order; 
  status?: 'success' | 'goodluck' | 'error';
  current_captain_id?: number;
}

type OrderStatusResponse = {
  status: 'success' | 'goodluck' | 'error';
  message?: string;
  current_captain_id?: number;
};

import { Order } from './types';

// الدالة الأساسية لجلب البيانات
export const fetchData = async <T = unknown>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
  method: string = 'GET'
): Promise<ApiResponse<T>> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alrasekhooninlaw.com/bousla/cap';
    
    const options: RequestInit = {
      method,
    };

    if (method === 'POST') {
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      options.body = new URLSearchParams(params as Record<string, string>).toString();
    }

    const url = method === 'GET'
      ? `${baseUrl}/${endpoint}.php?${new URLSearchParams(params as Record<string, string>).toString()}`
      : `${baseUrl}/${endpoint}.php`;

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error(`Error fetching ${endpoint}:`, error);
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

export const update_order_fetchData = async <T = unknown>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
  method: string = 'GET'
): Promise<update_ApiResponse<T>> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alrasekhooninlaw.com/bousla/cap';

    const options: RequestInit = {
      method,
    };

    if (method === 'POST') {
      options.headers = {
        'Content-Type': 'application/json',
      };
      options.body = JSON.stringify(params);
    }

    const url = method === 'GET'
      ? `${baseUrl}/${endpoint}.php?${new URLSearchParams(params as Record<string, string>).toString()}`
      : `${baseUrl}/${endpoint}.php`;

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error(`Error fetching ${endpoint}:`, error);
    return {
      success: false,
      message: errorMessage
    };
  }
};




// دوال خاصة بالطلبات
export const fetchOrderById = async (orderId: number): Promise<Order | null> => {
  try {
    const response = await fetchData('get_order', { id: orderId });
    
    console.log('API Response:', response);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order');
    }

    if (!response.order) {
      throw new Error('Order data is missing in response');
    }

    return response.order;
  } catch (error) {
    console.error('Error fetching order:', {
      error,
      orderId,
      timestamp: new Date().toISOString()
    });
    return null;
  }
};

export const updateOrderStatus = async (
  orderId: number, 
  captainId: number
): Promise<OrderStatusResponse> => {
  try {
    const response = await update_order_fetchData<OrderStatusResponse>('update_order_status', {
      id: orderId,
      cap_id: captainId
    }, 'POST');

    if (response.status === 'goodluck') {
      return {
        status: 'goodluck',
        message: response.message,
        current_captain_id: response.current_captain_id
      };
    }

    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to update order status');
    }

    return {
      status: 'success',
      message: response.message
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};


// دوال أخرى
export const updateServiceStatus = async (serviceId: number, newActive: number, cap_id: number) => {
  try {
    const response = await fetchData('cap_ser', {
      ser_id: serviceId.toString(),
      active: newActive.toString(),
      cap_id: cap_id.toString() // إرسال cap_id في POST
    }, 'POST');

    if (!response.success) {
      throw new Error(response.message || 'Failed to update service');
    }

    return response;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};


export async function update_order_status(orderId: number, captainId: number,status:string) {
  try {
    const response = await fetch('https://alrasekhooninlaw.com/bousla/cap/update_order_status.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: orderId,
        cap_id: captainId,
        status:status
      }),
    });

    const result = await response.json();
   
    

    if (!response.ok || result.status === 'error') {
      console.error('خطأ في العملية:', result.message);
      return 'error';
    }

    if (result.status === 'goodluck') {
      console.log('الطلب مأخوذ مسبقًا من قبل كابتن آخر:', result.current_captain_id);
      return 'goodluck';
    }

    if (result.status === 'success') {
      console.log('تم قبول الطلب بنجاح:', result);
      return 'success';
    }

   

    return 'error'; // fallback
  } catch (err) {
    console.error('استثناء أثناء الاتصال بالخادم:', err);
    return 'error';
  }
}

export const fetchlast_order = async <T = unknown>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
  method: string = 'GET'
): Promise<ApiResponse<T>> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alrasekhooninlaw.com/bousla/cap';
    
    // تحويل جميع القيم إلى string
    const processedParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => 
        [key, value.toString()] // تحويل أي قيمة إلى string
      )
    );

    const url = `${baseUrl}/${endpoint}.php?${new URLSearchParams(processedParams as Record<string, string>).toString()}`;
    
    const response = await fetch(url, { method });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};


