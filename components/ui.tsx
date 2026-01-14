import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 active:scale-[0.98]";

  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary: "bg-white/10 text-brand-secondary hover:bg-white/20",
    outline: "border border-white/20 text-brand-secondary hover:bg-white hover:text-black bg-transparent",
    ghost: "text-brand-secondary hover:bg-white/5",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-14 px-8 text-base rounded-2xl",
    icon: "h-11 w-11 p-0 rounded-xl",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'default' | 'outline' | 'black', className?: string }> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: "bg-white/10 text-brand-secondary",
    outline: "border border-white/20 text-brand-secondary",
    black: "bg-white text-black"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const SectionTitle: React.FC<{ children: React.ReactNode, subtitle?: string }> = ({ children, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-display font-medium tracking-tight text-brand-secondary">{children}</h2>
    {subtitle && <p className="mt-1 text-brand-secondary/40 text-sm font-light">{subtitle}</p>}
  </div>
);

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  ...props
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallback);
      setHasError(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        {...props}
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300`}
        onError={handleError}
      />
    </div>
  );
};