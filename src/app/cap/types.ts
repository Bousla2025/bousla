// types.ts
export type Position = [number, number];

export type Order = {
  id: number;
  user_id: number;
  caption_id: number;
  start_point: string;
  start_text: string;
  end_point: string;
  end_text: string;
  cost: string;
  distance_km: string;
  duration_min: number;
  status: string;
  other_phone: string;
  notes: string;
  ser_id: number;
  startplacetxt: string;
  endplacetxt: string;
  ser_chi_id: number;
  user_rate: number;
  start_detlis: string;
  end_detlis: string;
   insert_time: string; // أضف هذا السطر
};

export type OrderDetails = {
  id: number;
  ser_chi_id: number;
  start_text: string;
  end_text: string;
  distance_km: string;
  duration_min: number;
  cost: string;
  user_rate: number;
  start_detlis: string;
  end_detlis: string;
  notes: string;
};

export type Service = {
  id: number;
  ser_id: number;
  name1: string;
  f_km: string;
  km: string;
  m_cost: string;
  add_cost: string;
  dis_cost: string;
  photo1: string;
  active: number;
};

export type Payment = {
  id: number;
  cap_id: number;
  mony: string;
  type1: string;
  center_id: number;
  note: string;
  insert_time: string;
  update_time: string;
  date_formatted: string;
};

export type PaymentsByMonth = {
  month_name: string;
  payments: Payment[];
};

export type Profile = {
  name: string;
  phone: string;
  photo: string;
};

export type TrackingData = {
  distance: string;
  time: string;
  price: string;
};