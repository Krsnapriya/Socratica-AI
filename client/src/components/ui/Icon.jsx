export default function Icon({ name, filled = false, size = 24, className = '', ...props }) {
  return (
    <span 
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={{ fontSize: `${size}px` }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}
