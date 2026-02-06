import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = "Kutilmagan xatolik yuz berdi.";
  let errorStatus = "";

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status.toString();
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in fade-in duration-500">
      <div className="p-4 bg-destructive/10 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      
      <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
        {errorStatus && <span className="text-destructive">{errorStatus}</span>}
        Xatolik yuz berdi
      </h1>
      
      <p className="text-muted-foreground max-w-md mb-8">
        {errorMessage}
      </p>

      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Qayta yuklash
        </Button>
        <Button 
          onClick={() => navigate("/")}
          className="gap-2 shadow-lg shadow-primary/20"
        >
          <Home className="h-4 w-4" />
          Bosh sahifaga
        </Button>
      </div>

      <div className="mt-12 text-xs text-muted-foreground/50 font-mono">
        Debugger ID: {Math.random().toString(36).substring(7).toUpperCase()}
      </div>
    </div>
  );
}
