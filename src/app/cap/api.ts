// api.ts
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
    order?: Order; 
}

interface OrderApiResponse {
  success: boolean;
  message?: string;
  order: Order;
}

import { Order } from './types';

export const fetchData = async (
  endpoint: string,
  params: Record<string, any> = {},
  method: string = 'GET'
): Promise<ApiResponse> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://alrasekhooninlaw.com/bousla/cap';
    
    const options: RequestInit = {
      method,
    };

    if (method === 'POST') {
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      options.body = new URLSearchParams(params).toString();
    }

    // بناء URL بشكل صحيح مع وضع .php قبل Query Parameters
    const url = method === 'GET'
      ? `${baseUrl}/${endpoint}.php?${new URLSearchParams(params).toString()}`
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

export const fetchOrderById = async (orderId: number): Promise<Order | null> => {
  try {
    const response = await fetchData('get_order', { id: orderId });
    
    console.log('API Response:', response); // لأغراض debugging
    
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

export const updateOrderStatus = async (orderId: number, captainId: number): Promise<{
    status: 'success' | 'already_reserved' | 'error',
    message?: string,
    current_captain_id?: number
}> => {
    const formData = new FormData();
    formData.append('id', orderId.toString());
    formData.append('cap_id', captainId.toString());

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/update_order_status.php`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        // إذا كان الخادم يعيد حالة غير 200 ولكن مع بيانات صالحة
        if (!response.ok && !data.status) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Update order error:', error);
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
        };
    }
};

export const updateServiceStatus = async (serviceId: number, newActive: number) => {
  try {
    const response = await fetchData('cap_ser', {
      ser_id: serviceId.toString(),
      active: newActive.toString()
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