import type { ComponentType } from 'react';

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 rounded-2xl bg-surface-tertiary/80 p-5 ring-1 ring-border-subtle">
        <Icon className="w-8 h-8 text-foreground-tertiary" />
      </div>
      <h3 className="font-heading text-xl text-foreground mb-2">{title}</h3>
      <p className="text-foreground-secondary text-sm max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
