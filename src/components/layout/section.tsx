import { cn } from '@/lib/utils';
import React from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

const spacingStyles = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
  xl: 'py-16',
};

export function Section({
  children,
  spacing = 'md',
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(spacingStyles[spacing], className)}
      {...props}
    >
      {children}
    </section>
  );
}