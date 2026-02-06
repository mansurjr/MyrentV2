import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[70vh] p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-8">
        <div className="text-[12rem] font-black leading-none text-muted/20 select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-6 bg-background border-2 border-dashed border-primary/20 rounded-2xl rotate-3 shadow-xl">
            <Search className="h-16 w-16 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-3">Sahifa topilmadi</h1>
      <p className="text-muted-foreground max-w-sm mb-10">
        Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan bo'lishi mumkin.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Orqaga qaytish
        </Button>
        <Button 
          onClick={() => navigate("/")}
          className="gap-2 px-8 shadow-xl shadow-primary/20"
        >
          <Home className="h-4 w-4" />
          Bosh sahifaga
        </Button>
      </div>
    </div>
  );
}
