import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src="/upstream-logo.png" 
            alt="Upstream Logo" 
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Assistente TISS Inteligente
            </h1>
            <p className="text-xs text-muted-foreground">
              Upstream - Ferramenta profissional para faturistas
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
