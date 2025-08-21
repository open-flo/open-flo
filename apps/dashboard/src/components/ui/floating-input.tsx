import React from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, icon, endIcon, className, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    // Check for initial value and updates to controlled value
    React.useEffect(() => {
      const currentValue = props.value || props.defaultValue || "";
      setHasValue(String(currentValue) !== "");
    }, [props.value, props.defaultValue]);

    const handleFocus = () => setFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setHasValue(e.target.value !== "");
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== "");
      props.onChange?.(e);
    };

    // Check both state and direct prop value to ensure label floats when there's any value
    const currentValue = props.value || "";
    const isLabelFloating = focused || hasValue || String(currentValue) !== "";

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            "peer w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background",
            "transition-all duration-200",
            "placeholder:text-transparent",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            endIcon && "pr-10",
            className
          )}
          {...props}
        />
        
        <label
          className={cn(
            "absolute pointer-events-none transition-all duration-200 bg-background px-1",
            icon && "left-9" || "left-2",
            isLabelFloating
              ? "-top-2 text-xs font-medium text-foreground"
              : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground left-3",
            icon && !isLabelFloating && "left-10"
          )}
        >
          {label}
        </label>

        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";