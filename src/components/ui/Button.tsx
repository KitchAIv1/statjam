import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, forwardRef } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-gold disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider transform hover:-translate-y-0.5',
  {
    variants: {
      variant: {
        primary: 'text-white shadow-lg hover:shadow-xl',
        secondary: 'text-black shadow-lg hover:shadow-xl',
        outline: 'border-2 text-white hover:text-black hover:bg-white',
        ghost: 'text-white hover:bg-gray-800',
      },
      size: {
        sm: 'h-10 px-4 text-sm min-w-[120px] max-w-[200px]',
        md: 'h-12 px-6 text-base min-w-[140px] max-w-[240px]',
        lg: 'h-14 px-8 text-base min-w-[180px] max-w-[280px]',
        xl: 'h-16 px-10 text-lg min-w-[220px] max-w-[320px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const getVariantStyles = () => {
      const styles: React.CSSProperties = {
        boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
      };
      switch (variant) {
        case 'primary':
          styles.backgroundColor = '#4B0082';
          styles.color = '#ffffff';
          styles.boxShadow = '0 4px 14px 0 rgba(75, 0, 130, 0.39)';
          break;
        case 'secondary':
          styles.backgroundColor = '#FFD700';
          styles.color = '#000000';
          styles.boxShadow = '0 4px 14px 0 rgba(255, 215, 0, 0.39)';
          break;
        case 'outline':
          styles.backgroundColor = 'transparent';
          styles.borderColor = '#4B0082';
          styles.color = '#ffffff';
          styles.borderWidth = '2px';
          break;
        default:
          styles.backgroundColor = '#4B0082';
          styles.color = '#ffffff';
          break;
      }
      return styles;
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        style={getVariantStyles()}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };