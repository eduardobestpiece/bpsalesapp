interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export const Logo = ({ className = "h-10 w-auto max-w-[140px]", onClick }: LogoProps) => {
  return (
    <div className="cursor-pointer" onClick={onClick}>
      {/* Logo para modo claro */}
      <img 
        src="/monteo_policromia_horizontal (1).png" 
        alt="Logo Monteo" 
        className={`${className} dark:hidden`} 
      />
      {/* Logo para modo escuro */}
      <img 
        src="/monteo_dark_logo.png" 
        alt="Logo Monteo" 
        className={`${className} hidden dark:block`} 
      />
    </div>
  );
};