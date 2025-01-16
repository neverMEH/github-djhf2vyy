import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({
  size = 'md',
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={cn('animate-spin text-muted-foreground', className)}
      {...props}
    >
      <Loader2 className={sizes[size]} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}