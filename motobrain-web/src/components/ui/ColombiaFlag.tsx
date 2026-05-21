import { cn } from '@/lib/utils';

interface ColombiaFlagProps {
  className?: string;
  size?: number;
  title?: string;
}

/** Bandera de Colombia en SVG (no depende de archivos en /public, que Vercel no recibe por .gitignore). */
export function ColombiaFlag({ className, size = 32, title = 'Colombia' }: ColombiaFlagProps) {
  const height = Math.round(size * (2 / 3));

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 6 4"
      className={cn('block shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="6" height="2" fill="#FCD116" />
      <rect y="2" width="6" height="1" fill="#003893" />
      <rect y="3" width="6" height="1" fill="#CE1126" />
    </svg>
  );
}
