export default function Badge({ children, variant = 'primary', className = '' }) {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium tracking-wide uppercase";
  
  const variants = {
    primary: "bg-primary/15 text-primary border border-primary/30",
    secondary: "bg-secondary/15 text-secondary border border-secondary/30",
    tertiary: "bg-tertiary/15 text-tertiary border border-tertiary/30",
    error: "bg-error/15 text-error border border-error/30"
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
