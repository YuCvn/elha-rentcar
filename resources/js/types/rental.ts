import type { User } from './auth';

export type CarStatus = 'available' | 'rented' | 'maintenance';
export type CarCategory =
    | 'MPV'
    | 'SUV'
    | 'City Car'
    | 'Sedan'
    | 'Luxury'
    | 'EV';
export type TransmissionType = 'Automatic' | 'Manual';
export type FuelType = 'Bensin' | 'Diesel' | 'Hybrid' | 'Listrik';

export type BookingStatus =
    | 'pending'
    | 'waiting_admin'
    | 'confirmed'
    | 'ongoing'
    | 'completed'
    | 'cancelled';

export type PaymentStatus = 'unpaid' | 'dp' | 'paid' | 'refunded';
export type PaymentMethod = 'qris' | 'transfer_bank' | 'ewallet' | 'cash';

export interface Car {
    id: number;
    name: string;
    brand: string;
    category: string;
    license_plate: string;
    year: number;
    transmission: string;
    fuel_type: string;
    seats: number;
    price_per_day: number;
    with_driver_price: number;
    status: CarStatus;
    image_url: string | null;
    description: string | null;
    features: string[] | null;
    rating: number;
    total_trips: number;
    bookings_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Booking {
    id: number;
    booking_code: string;
    user_id: number | null;
    car_id: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    customer_address: string | null;
    customer_identity_number: string | null;
    customer_ktp_number: string | null;
    customer_sim_number: string | null;
    customer_kk_number: string | null;
    ktp_photo_url: string | null;
    sim_photo_url: string | null;
    kk_photo_url: string | null;
    payment_proof_url: string | null;
    start_date: string;
    end_date: string;
    total_days: number;
    with_driver: boolean;
    pickup_location: string;
    return_location: string;
    car_price_per_day: number;
    driver_fee_total: number;
    total_price: number;
    status: BookingStatus;
    payment_status: PaymentStatus;
    payment_method: string;
    notes: string | null;
    marketing_notes: string | null;
    verified_by_marketing_at?: string | null;
    confirmed_by_admin_at?: string | null;
    is_locked?: boolean;
    car?: Car | null;
    user?: User | null;
    created_at?: string;
    updated_at?: string;
}

export interface DashboardStats {
    total_cars: number;
    available_cars: number;
    rented_cars: number;
    maintenance_cars: number;
    total_bookings: number;
    active_bookings: number;
    waiting_admin_count?: number;
    new_leads_count?: number;
    paid_revenue: number;
    potential_revenue: number;
    dp_revenue?: number;
    utilization_rate?: number;
    driver_revenue?: number;
    car_only_revenue?: number;
}

export interface UserItem {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: 'admin' | 'owner' | 'marketing' | (string & {});
    identity_number: string | null;
    created_at: string;
    bookings_count?: number;
}
