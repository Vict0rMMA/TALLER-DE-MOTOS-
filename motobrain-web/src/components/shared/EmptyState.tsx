import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  imageSrc?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  imageSrc = '/images/empty-inventory.svg',
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <Image src={imageSrc} alt="" width={160} height={120} className="opacity-80" />
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      </div>
      {actionLabel && actionHref ? (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
