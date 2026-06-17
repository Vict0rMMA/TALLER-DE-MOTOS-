export const PRODUCT_CATEGORIES = [
  'Aceites y lubricantes',
  'Frenos',
  'Transmisión',
  'Filtros',
  'Eléctrico',
  'Motor',
  'Llantas',
  'Otros',
] as const;

export const SERVICE_TYPES = [
  { id: 'oil_change', label: 'Cambio de aceite', icon: 'Droplets' },
  { id: 'brakes', label: 'Frenos', icon: 'CircleStop' },
  { id: 'chain_kit', label: 'Kit de arrastre', icon: 'Link' },
  { id: 'maintenance', label: 'Mantenimiento', icon: 'Settings' },
  { id: 'other', label: 'Otro', icon: 'Wrench' },
] as const;

export const SERVICE_STATUSES = [
  { id: 'open', label: 'Abierto', color: 'info' },
  { id: 'in_progress', label: 'En progreso', color: 'warning' },
  { id: 'closed', label: 'Cerrado', color: 'success' },
  { id: 'cancelled', label: 'Cancelado', color: 'danger' },
] as const;

export const MOTORCYCLE_MODELS = [
  'AKT NKD 125',
  'Bajaj Boxer CT 100',
  'Honda CB 125F',
  'Yamaha YBR 125',
  'Suzuki GN 125',
  'Hero Splendor',
  'TVS Apache RTR 160',
  'KTM Duke 200',
] as const;

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/inventario', label: 'Inventario', icon: 'Package' },
  { href: '/clientes', label: 'Clientes', icon: 'Users' },
  { href: '/servicios', label: 'Servicios', icon: 'Wrench' },
  { href: '/diagnostico', label: 'Diagnóstico IA', icon: 'Brain', badge: 'IA' },
  { href: '/analitica', label: 'Analítica', icon: 'BarChart3' },
  { href: '/consultas', label: 'Consultas', icon: 'MessageSquare', consultaBadge: true },
  { href: '/citas', label: 'Citas', icon: 'Calendar', appointmentBadge: true },
] as const;

export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0], // Dashboard
  NAV_ITEMS[4], // Diagnóstico IA
  NAV_ITEMS[3], // Servicios (centro, resaltado — el más usado)
  NAV_ITEMS[6], // Consultas
  NAV_ITEMS[7], // Citas
] as const;
