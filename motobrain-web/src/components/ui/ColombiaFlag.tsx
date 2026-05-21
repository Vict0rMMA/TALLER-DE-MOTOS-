import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ColombiaFlagProps {
  className?: string;
  size?: number;
  title?: string;
}

/** Bandera de Colombia (evita el emoji 🇨🇴 que en Windows se ve como "CO"). */
export function ColombiaFlag({ className, size = 32, title = 'Colombia' }: ColombiaFlagProps) {
  return (
    <Image
      src="/images/colombia-flag.png"
      alt={title}
      width={size}
      height={Math.round(size * 0.667)}
      className={cn('object-cover', className)}
      title={title}
      priority={size >= 28}
    />
  );
}
