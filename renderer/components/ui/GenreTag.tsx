interface GenreTagProps {
  genre: string;
  size?: 'sm' | 'md';
}

export function GenreTag({ genre, size = 'sm' }: GenreTagProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium bg-surface-tertiary text-foreground-secondary border border-border-subtle hover:border-accent/20 hover:text-accent transition-colors duration-200 ${sizeClasses[size]}`}
    >
      {genre}
    </span>
  );
}
