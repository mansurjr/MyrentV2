import { useState, useMemo } from "react";
import { useStores } from "../pages/stores/hooks/useStores";
import { useStalls } from "../pages/stalls/hooks/useStalls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Store as StoreIcon, LayoutGrid, Info, Search, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface MapModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MapModal({ isOpen, onOpenChange }: MapModalProps) {
  const [selectedItem, setSelectedItem] = useState<{ type: 'store' | 'stall', data: any } | null>(null);
  const [search, setSearch] = useState("");

  const { useGetStores } = useStores();
  const { useGetStalls } = useStalls();


  const { data: storesData, isLoading: storesLoading } = useGetStores({ limit: 1000, withContracts: true });
  const { data: stallsData, isLoading: stallsLoading } = useGetStalls({ limit: 1000 });

  const stores = useMemo(() => {
    const raw = Array.isArray(storesData) ? storesData : (storesData as any)?.data || [];
    if (!search) return raw;
    return raw.filter((s: any) => s.storeNumber.toLowerCase().includes(search.toLowerCase()));
  }, [storesData, search]);

  const stalls = useMemo(() => {
    const raw = Array.isArray(stallsData) ? stallsData : (stallsData as any)?.data || [];
    if (!search) return raw;
    return raw.filter((s: any) => s.stallNumber?.toLowerCase().includes(search.toLowerCase()));
  }, [stallsData, search]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b shrink-0 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-bold tracking-tight">Raqamli xarita</DialogTitle>
                <DialogDescription className="text-xs">Bozordagi barcha joylar holati</DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-4 mr-8">
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  className="h-9 pl-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-1 lg:grid-cols-2 bg-muted/5 min-h-0">
          {}
          <Card className="flex flex-col min-h-0 shadow-sm border-border/50">
            <CardHeader className="py-3 px-5 border-b border-border/50 bg-muted/40">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StoreIcon className="h-4 w-4 text-primary" />
                  Do'konlar
                </div>
                <Badge variant="secondary" className="font-mono">{stores.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-auto custom-scrollbar p-4">
                {storesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
                    {stores.map((store: any) => (
                      <button
                        key={store.id}
                        onClick={() => setSelectedItem({ type: 'store', data: store })}
                        className={cn(
                          "aspect-square rounded border flex flex-col items-center justify-center p-1 transition-all hover:ring-2 hover:ring-primary/30 active:scale-95 group relative overflow-hidden",
                          store.isOccupied 
                            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" 
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                        )}
                      >
                        <span className="text-[10px] font-black uppercase">{store.storeNumber}</span>
                        <span className="text-[8px] opacity-60 mt-0.5">{store.area}m²</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="flex flex-col min-h-0 shadow-sm border-border/50">
            <CardHeader className="py-3 px-5 border-b border-border/50 bg-muted/40">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-orange-500" />
                  Rastalar
                </div>
                <Badge variant="secondary" className="font-mono">{stalls.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-auto custom-scrollbar p-4">
                {stallsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
                    {stalls.map((stall: any) => (
                      <button
                        key={stall.id}
                        onClick={() => setSelectedItem({ type: 'stall', data: stall })}
                        className={cn(
                          "aspect-square rounded border flex flex-col items-center justify-center p-1 transition-all hover:ring-2 hover:ring-primary/30 active:scale-95 group relative",
                          stall.isOccupied 
                            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" 
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                        )}
                      >
                        <span className="text-[10px] font-black uppercase font-mono">{stall.stallNumber}</span>
                        <span className="text-[8px] opacity-60 mt-0.5">{stall.area}m²</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 border-t bg-muted/30 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-xs font-medium">Bo'sh</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <span className="text-xs font-medium">Band</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Ma'lumotlar oxirgi marta: {format(new Date(), "HH:mm", { locale: uz })} da yangilangan
          </p>
        </div>

        <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-2 text-primary mb-1">
                {selectedItem?.type === 'store' ? <StoreIcon className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {selectedItem?.type === 'store' ? "Do'kon" : "Rasta"} ma'lumotlari
                </span>
              </div>
              <SheetTitle className="text-2xl font-bold">
                № {selectedItem?.type === 'store' ? selectedItem?.data.storeNumber : selectedItem?.data.stallNumber}
              </SheetTitle>
              <SheetDescription>
                {selectedItem?.data.description || "Ushbu joy haqida tavsif mavjud emas."}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Maydoni</p>
                  <p className="text-lg font-bold">{selectedItem?.data.area} m²</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Holati</p>
                  <Badge 
                    variant={selectedItem?.data.isOccupied ? "destructive" : "secondary"}
                    className={cn(
                      "font-bold",
                      !selectedItem?.data.isOccupied && "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    {selectedItem?.data.isOccupied ? "Band" : "Bo'sh"}
                  </Badge>
                </div>
              </div>

              {selectedItem?.data.isOccupied && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2">
                    <Info className="h-5 w-5 text-primary" />
                    Egalik ma'lumotlari
                  </div>
                  
                  {selectedItem.type === 'store' && selectedItem.data.contracts?.[0] ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4 mb-2">Tadbirkor</p>
                        <p className="font-bold text-lg">{selectedItem.data.contracts[0].owner?.fullName || "Noma'lum"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Shartnoma №</p>
                          <p className="font-medium">{selectedItem.data.contracts[0].certificateNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Muddati</p>
                          <p className="font-medium italic">
                            {selectedItem.data.contracts[0].expiryDate 
                              ? format(new Date(selectedItem.data.contracts[0].expiryDate), "dd.MM.yyyy", { locale: uz }) 
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">Shartnoma ma'lumotlari topilmadi.</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <Badge variant="outline" className="justify-center py-2 bg-muted/20 text-muted-foreground border-dashed">
                  Sana: {format(new Date(), "d MMMM, yyyy", { locale: uz })}
                </Badge>
                {selectedItem?.type === 'stall' && (
                  <div className={cn(
                    "p-4 border rounded-xl",
                    selectedItem.data.isOccupied ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                  )}>
                    <p className={cn("text-sm font-semibold mb-1", selectedItem.data.isOccupied ? "text-red-800" : "text-emerald-800")}>
                      Bugungi holat
                    </p>
                    <p className={cn("text-xs opacity-80", selectedItem.data.isOccupied ? "text-red-700" : "text-emerald-700")}>
                      Holat: <span className="font-bold underline">{selectedItem.data.isOccupied ? "Band" : "Bo'sh"}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>
  );
}
