import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('page-header-premium', className)}>
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-subtitle">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 [&_.btn-accent]:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center [&_.btn-accent]:sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
