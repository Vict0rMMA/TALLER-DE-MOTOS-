import type { User } from './entities';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardKPIs {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  openServices: number;
  closedThisMonth: number;
  revenueThisMonth: number;
  pendingConsultations?: number;
  pendingAppointments?: number;
  month: string;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface RevenueByMonth {
  month: string;
  monthLabel: string;
  revenue: number;
  serviceCount: number;
}
