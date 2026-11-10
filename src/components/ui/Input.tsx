import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = "start",
      required,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text)]"
          >
            {label}
            {required && (
              <span className="text-red-500 ms-1" aria-hidden>*</span>
            )}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === "start" && (
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "h-10 rounded-lg border bg-[var(--color-bg-card)] text-[var(--color-text)]",
              "placeholder:text-[var(--color-text-subtle)] text-sm transition-all duration-200",
              "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
              icon && iconPosition === "start" && "ps-10",
              icon && iconPosition === "end" && "pe-10",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                : "border-[var(--color-border)]",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {icon && iconPosition === "end" && (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] pointer-events-none">
              {icon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-500 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--color-text-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
