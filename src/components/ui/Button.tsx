import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      iconPosition = "start",
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none";

    const variants = {
      primary:
        "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] focus-visible:ring-[var(--color-primary)] shadow-sm hover:shadow-md active:scale-[0.98]",
      secondary:
        "bg-[var(--color-secondary)] text-white hover:bg-[#2a1e12] focus-visible:ring-[var(--color-secondary)] shadow-sm",
      outline:
        "border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)] hover:text-white focus-visible:ring-[var(--color-primary)]",
      ghost:
        "bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)] focus-visible:ring-[var(--color-border)]",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm active:scale-[0.98]",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 shadow-sm active:scale-[0.98]",
    };

    const sizes = {
      xs: "text-xs px-2.5 py-1.5 h-7",
      sm: "text-sm px-3.5 py-2 h-9",
      md: "text-sm px-5 py-2.5 h-10",
      lg: "text-base px-7 py-3 h-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          (disabled || isLoading) && "opacity-60 cursor-not-allowed pointer-events-none",
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {!isLoading && icon && iconPosition === "start" && icon}
        {children}
        {!isLoading && icon && iconPosition === "end" && icon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
