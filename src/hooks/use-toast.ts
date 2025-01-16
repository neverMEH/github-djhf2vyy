import { toast as sonnerToast, type Toast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    const toastFn = variant === 'destructive' ? sonnerToast.error : sonnerToast;

    return toastFn(title, {
      description,
    });
  };

  return {
    toast,
  };
}