import { cn } from '@/lib/utils';
import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizes = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-[90vw]',
  xl: 'max-w-[95vw]',
  full: 'max-w-full',
};

export function Container({
  children,
  size = 'lg',
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4',
        'min-w-[90vw]',
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}