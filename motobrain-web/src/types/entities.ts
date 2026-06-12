export type UserRole = 'owner' | 'mechanic';

export interface User {
  id: string;
  workshopId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  workshopId: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  stockMin: number;
  barcode?: string;
  compatibility?: string[];
  active: boolean;
  isLowStock: boolean;
  margin: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  workshopId: string;
  name: string;
  cedula?: string;
  phone: string;
  email?: string;
  optInWhatsapp: boolean;
  portalActive: boolean;
  createdAt: string;
  motorcycleCount?: number;
  lastServiceAt?: string;
}

export interface Motorcycle {
  id: string;
  customerId: string;
  placa: string;
  brand: string;
  model: string;
  year?: number;
  cc?: number;
  kmCurrent: number;
  lastServiceAt?: string;
  createdAt: string;
}

export type ServiceStatus = 'open' | 'in_progress' | 'closed' | 'cancelled';

export interface ServiceProduct {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Service {
  id: string;
  workshopId: string;
  motorcycleId: string;
  customerId: string;
  type: string;
  status: ServiceStatus;
  description?: string;
  diagnosis?: string;
  mechanicId?: string;
  mechanicName?: string;
  products: ServiceProduct[];
  laborCost: number;
  total: number;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  customerName?: string;
  placa?: string;
}

export interface DiagnosisResult {
  possibleCauses: string[];
  recommendedActions: string[];
  estimatedCost?: { min: number; max: number };
  notes?: string;
  reply?: string;
}

export interface DiagnosisSession {
  id: string;
  workshopId: string;
  motorcycleId?: string;
  symptoms: string[];
  diagnosis: DiagnosisResult;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  aiModel: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
