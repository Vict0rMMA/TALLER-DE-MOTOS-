export type Customer = {
  id: string;
  workshopId: string;
  name: string;
  cedula?: string;
  phone: string;
  email?: string;
  optInWhatsapp: boolean;
  portalActive: boolean;
  createdAt: Date;
};
