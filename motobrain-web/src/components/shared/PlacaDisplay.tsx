import { Badge } from '@/components/ui/badge';
import { formatPlaca } from '@/lib/utils';

interface PlacaDisplayProps {
  value: string;
}

export function PlacaDisplay({ value }: PlacaDisplayProps) {
  return (
    <Badge variant="secondary" className="font-mono uppercase tracking-wider">
      {formatPlaca(value)}
    </Badge>
  );
}
