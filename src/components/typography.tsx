import { cn } from '@/lib/utils';
import React from 'react';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function H1({ children, className, as = 'h1', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function H2({ children, className, as = 'h2', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        'scroll-m-20 text-3xl font-semibold tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function H3({ children, className, as = 'h3', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function P({ children, className, as = 'p', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Lead({ children, className, as = 'p', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn('text-xl text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Large({ children, className, as = 'div', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn('text-lg font-semibold', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Small({ children, className, as = 'small', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Subtle({ children, className, as = 'p', ...props }: TypographyProps) {
  const Component = as;
  return (
    <Component
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Component>
  );
}