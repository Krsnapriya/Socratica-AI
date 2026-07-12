export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-mono font-medium tracking-wide uppercase rounded-md transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  
  const variants = {
    primary: "bg-primary-container text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-inverse-primary",
    secondary: "bg-transparent text-on-surface border border-outline-variant hover:bg-surface-variant hover:border-outline",
    ghost: "bg-transparent text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
    danger: "bg-transparent text-error border border-error hover:bg-error/10"
  };

  const sizes = {
    sm: "px-3 py-1 text-[10px] leading-4",
    md: "px-4 py-2 text-xs leading-4",
    lg: "px-6 py-3 text-sm leading-5",
    icon: "p-2" // for icon-only buttons
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
