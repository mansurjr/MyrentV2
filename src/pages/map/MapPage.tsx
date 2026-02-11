import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useStores } from "../stores/hooks/useStores";
import { useStalls } from "../stalls/hooks/useStalls";
import { useSections } from "../sections/hooks/useSections";
import { useContracts } from "../contracts/hooks/useContracts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Store as StoreIcon, 
  LayoutGrid, 
  Info, 
  Search, 
  Filter,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { useAttendances } from "../attendances/hooks/useAttendances";
import baseApi from "@/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

export default function MapPage() {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<{ type: 'store' | 'stall', data: any } | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [stallSearch, setStallSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const debouncedStoreSearch = useDebounce(storeSearch, 500);
  const debouncedStallSearch = useDebounce(stallSearch, 500);
  
  const { useGetStores } = useStores();
  const { useGetStalls } = useStalls();
  const { useGetSections } = useSections();
  const { automatePaymentRedirect } = useContracts();
  const { createAttendance } = useAttendances();

  const { data: storesData, isLoading: storesLoading } = useGetStores({ limit: 1000, withContracts: true });
  const { data: stallsData, isLoading: stallsLoading } = useGetStalls({ limit: 1000 });
  const { data: sectionsData } = useGetSections();

  const stores = useMemo(() => {
    let raw = storesData?.data || [];
    if (selectedSection !== "all") {
      raw = raw.filter((s: any) => s.sectionId === Number(selectedSection));
    }
    if (!debouncedStoreSearch) return raw;
    return raw.filter((s: any) => s.storeNumber.toLowerCase().includes(debouncedStoreSearch.toLowerCase()));
  }, [storesData, debouncedStoreSearch, selectedSection]);

  const stalls = useMemo(() => {
    let raw = stallsData?.data || [];
    if (selectedSection !== "all") {
      raw = raw.filter((s: any) => s.sectionId === Number(selectedSection));
    }
    if (!debouncedStallSearch) return raw;
    return raw.filter((s: any) => s.stallNumber?.toLowerCase().includes(debouncedStallSearch.toLowerCase()));
  }, [stallsData, debouncedStallSearch, selectedSection]);

  const itemData = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'store') {
      return storesData?.data?.find(s => s.id === selectedItem.data.id) || selectedItem.data;
    }
    return stallsData?.data?.find(s => s.id === selectedItem.data.id) || selectedItem.data;
  }, [selectedItem, storesData, stallsData]);

  const todayAttendance = useMemo(() => {
    if (selectedItem?.type !== 'stall' || !itemData) return null;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return itemData.attendances?.find((a: any) => 
      format(new Date(a.date), "yyyy-MM-dd") === todayStr
    );
  }, [selectedItem, itemData]);

  const handleQuickAttendance = async () => {
    if (selectedItem?.type !== 'stall' || !itemData) return;
    try {
      const dailyFee = Number(itemData.dailyFee) || 0;
      await createAttendance.mutateAsync({
        stallId: itemData.id,
        date: format(new Date(), "yyyy-MM-dd"),
        status: 'UNPAID',
        amount: dailyFee,
      });
    } catch (error) {
      console.error("Attendance creation error:", error);
    }
  };

  const handlePay = async () => {
    if (!todayAttendance) return;
    const isMyRent = window.location.hostname.includes("myrent.uz");
    const type = isMyRent ? 'payme' : 'click';
    try {
      const response = await baseApi.get(`/attendances/${todayAttendance.id}/pay/`, {
        params: { type },
      });
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  const handleContractPay = async () => {
    if (!itemData?.contracts?.[0]) return;
    const contract = itemData.contracts[0];
    await automatePaymentRedirect(contract.id, {
      months: contract.paymentSnapshot?.debtMonths || 1,
    });
  };

  const isMutating = createAttendance.isPending;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-6 p-6 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.map")}</h1>
          <p className="text-muted-foreground">
            {t("map.description")}
          </p>
        </div>
      </div>

      <Card className="flex flex-col shadow-sm border-border/50 overflow-hidden flex-1 min-h-0">
        <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <StoreIcon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{t("nav.stores")}</span>
                  <Badge variant="outline" className="bg-background">{stores.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{t("nav.stalls")}</span>
                  <Badge variant="outline" className="bg-background">{stalls.length}</Badge>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("nav.map") + "..."}
                    className="h-9 pl-9 bg-background border-border/50 focus-visible:ring-primary/20 transition-all shadow-sm w-full"
                    onChange={(e) => {
                      setStoreSearch(e.target.value);
                      setStallSearch(e.target.value);
                    }}
                  />
                </div>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full sm:w-50 h-9 bg-background border-border/50">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder={t("nav.sections")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")} {t("nav.sections").toLowerCase()}</SelectItem>
                    {sectionsData?.map((section) => (
                      <SelectItem key={section.id} value={String(section.id)}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-3 mb-4  bg-background py-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <StoreIcon className="h-5 w-5 text-primary" />
                  {t("nav.stores")}
                </h2>
                <div className="h-0.5 flex-1 bg-border/50 rounded-full" />
              </div>
              
              {storesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                  {stores.map((store: any) => {
                    const isTaken = store.isOccupied;
                    const isPaid = store.contracts?.[0]?.isPaidCurrentMonth;
                    
                    let statusClasses = "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400";
                    if (isTaken) {
                      if (isPaid) {
                        statusClasses = "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
                      } else {
                        statusClasses = "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
                      }
                    }

                    return (
                      <button
                        key={store.id}
                        onClick={() => setSelectedItem({ type: 'store', data: store })}
                        className={cn(
                          "aspect-3/2 rounded-lg border flex flex-col items-center justify-center p-2 transition-all hover:scale-105 hover:shadow-lg active:scale-95 group relative overflow-hidden",
                          statusClasses
                        )}
                      >
                        <span className="text-sm font-black leading-none">{store.storeNumber}</span>
                        <span className="text-[10px] font-medium opacity-60 mt-1">{store.area} {t("common.area_unit")}</span>
                        {isTaken && !isPaid && (
                          <div className="absolute top-1 right-1">
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4  bg-background  py-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-orange-500" />
                  {t("nav.stalls")}
                </h2>
                <div className="h-0.5 flex-1 bg-border/50 rounded-full" />
              </div>

              {stallsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-2">
                  {stalls.map((stall: any) => {
                    const isTaken = stall.isOccupied || stall.reserved;
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    const isPaid = stall.attendances?.some((a: any) => 
                      format(new Date(a.date), "yyyy-MM-dd") === todayStr && a.status === 'PAID'
                    );

                    let statusClasses = "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400";
                    if (isTaken) {
                      if (isPaid) {
                        statusClasses = "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
                      } else {
                        statusClasses = "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
                      }
                    }

                    return (
                      <button
                        key={stall.id}
                        onClick={() => setSelectedItem({ type: 'stall', data: stall })}
                        className={cn(
                          "aspect-square rounded-md border flex flex-col items-center justify-center p-1 transition-all hover:scale-110 hover:shadow-md active:scale-90",
                          statusClasses
                        )}
                      >
                        <span className="text-xs font-bold leading-none">{stall.stallNumber}</span>
                        <span className="text-[9px] opacity-60 mt-0.5">{stall.area}{t("common.area_unit")}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              {selectedItem?.type === 'store' ? <StoreIcon className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
              <span className="text-sm font-semibold uppercase tracking-wider">
                {selectedItem?.type === 'store' ? t("nav.stores").slice(0, -3) : t("nav.stalls").slice(0, -2)} {t("map.details")}
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold">
              № {selectedItem?.type === 'store' ? selectedItem?.data.storeNumber : selectedItem?.data.stallNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.data.description || t("map.no_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">{t("map.area")}</p>
                <p className="text-lg font-bold">{selectedItem?.data.area} {t("common.area_unit")}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">{t("map.status")}</p>
                {(() => {
                  const isTaken = selectedItem?.data.isOccupied || selectedItem?.data.reserved;
                  if (!isTaken) {
                    return (
                      <Badge variant="secondary" className="font-bold text-white bg-emerald-600 hover:bg-emerald-700">
                        {t("map.free")}
                      </Badge>
                    );
                  }

                  const todayStr = format(new Date(), "yyyy-MM-dd");
                  const isPaid = selectedItem?.type === 'stall' 
                    ? selectedItem?.data.attendances?.some((a: any) => format(new Date(a.date), "yyyy-MM-dd") === todayStr && a.status === 'PAID')
                    : selectedItem?.data.contracts?.[0]?.isPaidCurrentMonth;

                  return (
                    <Badge 
                      variant={isPaid ? "default" : "destructive"}
                      className={cn(
                        "font-bold text-white",
                        isPaid ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                      )}
                    >
                      {isPaid ? t("map.paid") : t("map.unpaid")}
                    </Badge>
                  );
                })()}
              </div>
            </div>

            {(selectedItem?.data.isOccupied || selectedItem?.data.reserved) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2">
                  <Info className="h-5 w-5 text-primary" />
                  {t("map.ownership_info")}
                </div>
                
                {selectedItem.type === 'store' && selectedItem.data.contracts?.[0] ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4 mb-2">{t("map.owner")}</p>
                      <p className="font-bold text-lg">{selectedItem.data.contracts[0].owner?.fullName || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("map.contract_no")}</p>
                        <p className="font-medium">{selectedItem.data.contracts[0].certificateNumber || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("map.expiry")}</p>
                        <p className="font-medium ">
                          {selectedItem.data.contracts[0].issueDate && format(new Date(selectedItem.data.contracts[0].issueDate), "dd.MM.yyyy", { locale: uz })}
                          {selectedItem.data.contracts[0].issueDate && selectedItem.data.contracts[0].expiryDate && " - "}
                          {selectedItem.data.contracts[0].expiryDate && format(new Date(selectedItem.data.contracts[0].expiryDate), "dd.MM.yyyy", { locale: uz })}
                          {!selectedItem.data.contracts[0].issueDate && !selectedItem.data.contracts[0].expiryDate && "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">{t("map.no_contract")}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Badge variant="outline" className="justify-center py-2 bg-muted/20 text-muted-foreground border-dashed">
                {t("map.today")}: {format(new Date(), "d MMMM, yyyy", { locale: uz })}
              </Badge>
              {selectedItem?.type === 'stall' && (
                <div className={cn(
                  "p-4 border rounded-xl",
                  selectedItem.data.reserved ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                )}>
                  <p className={cn("text-sm font-semibold mb-1", selectedItem.data.reserved ? "text-red-800" : "text-emerald-800")}>
                    {t("map.daily_status")}
                  </p>
                  <p className={cn("text-xs opacity-80", selectedItem.data.reserved ? "text-red-700" : "text-emerald-700")}>
                    {t("map.today")}: <span className="font-bold underline">{selectedItem.data.reserved ? t("map.occupied") : t("map.free")}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedItem?.type === 'stall' ? (
            <DialogFooter className="mt-6 flex flex-col gap-2">
              {!todayAttendance ? (
                <Button 
                  onClick={handleQuickAttendance} 
                  className="w-full bg-orange-500 hover:bg-orange-600 font-bold"
                  disabled={isMutating}
                >
                  {isMutating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {t("map.quick_attendance")}
                </Button>
              ) : todayAttendance.status === 'UNPAID' ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    onClick={handlePay} 
                    className="bg-blue-600 hover:bg-blue-700 font-bold w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("common.pay")}
                  </Button>
                </div>
              ) : (
                <div className="w-full p-2 bg-blue-50 text-blue-700 rounded-lg text-center text-sm font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("map.payment_received")}
                </div>
              )}
            </DialogFooter>
          ) : selectedItem?.type === 'store' && itemData?.contracts?.[0] ? (
            <DialogFooter className="mt-6 flex flex-col gap-2">
              {!itemData.contracts[0].isPaidCurrentMonth ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    onClick={handleContractPay}
                    className="bg-blue-600 hover:bg-blue-700 font-bold w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("common.pay")}
                  </Button>
                </div>
              ) : (
                <div className="w-full p-2 bg-blue-50 text-blue-700 rounded-lg text-center text-sm font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("common.paid")}
                </div>
              )}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
