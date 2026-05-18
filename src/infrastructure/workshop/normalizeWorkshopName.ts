const LEGACY_NAMES: Record<string, string> = {
  'Taller Demo MotoBrain': 'Mi Taller MotoBrain',
  'Taller demo MotoBrain': 'Mi Taller MotoBrain',
  'Taller Demo': 'Mi Taller MotoBrain',
};

const DEFAULT_NAME = 'Mi Taller MotoBrain';

export function normalizeWorkshopName(name: string | null | undefined): string {
  const raw = (name ?? '').trim();
  if (!raw) return DEFAULT_NAME;
  if (LEGACY_NAMES[raw]) return LEGACY_NAMES[raw];

  const cleaned = raw
    .replace(/\bdemo\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || DEFAULT_NAME;
}

export function workshopNameNeedsUpdate(name: string | null | undefined): boolean {
  const raw = (name ?? '').trim();
  if (!raw) return false;
  return normalizeWorkshopName(raw) !== raw;
}
