declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userName?: string;
      userEmail?: string;
      userRole?: string;
      workshopId?: string;
      customerId?: string;
    }
  }
}
export {};
