// api.ts
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  order?: Order; 
}

import { Console } from 'console';
import { Order } from './types';

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

    // بناء URL بشكل صحيح مع وضع .php قبل Query Parameters
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

// باقي الدوال تبقى كما هي بدون تغيير
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

export const updateOrderStatus = async (orderId: number, captainId: number) => {
    console.log('Sending request with:', { orderId, captainId });
    
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/update_order_status.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `id=${orderId}&cap_id=${captainId}`
        });

        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Update order error:', error);
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unexpected error'
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