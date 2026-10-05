export type Customer = {
  id: string;
  workshopId: string;
  name: string;
  cedula?: string;
  phone: string;
  email?: string;
  optInWhatsapp: boolean;
  optInEmail: boolean;
  portalActive: boolean;
  active: boolean;
  createdAt: Date;
};
