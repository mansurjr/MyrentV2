import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Store as StoreIcon, Tag, Calendar as CalendarIcon, ArrowRight, Loader2, Info, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTashkentTodayISO, formatTashkentDate } from "@/lib/time";
import { searchPublicContracts, getPublicStall } from "@/api/publicPay";
import type { PublicContractSearchResult, PublicStallDetail } from "@/types/payment";
import { sumContractPeriods } from "@/lib/payment";

type PublicSearchResult = PublicContractSearchResult | PublicStallDetail;

export default function PublicPayView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"store" | "stall">((searchParams.get("mode") as any) || "store");
  const [storeNumber, setStoreNumber] = useState(searchParams.get("storeNumber") || "");
  const [tin, setTin] = useState(searchParams.get("tin") || "");
  const [stallNumber, setStallNumber] = useState(searchParams.get("stall") || "");
  const [date, setDate] = useState(searchParams.get("date") || getTashkentTodayISO());

  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const getEntryDebtAmount = (entry: PublicContractSearchResult) =>
    sumContractPeriods(entry.pendingPeriods ?? []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    try {
      if (mode === "store") {
        if (!storeNumber && !tin) {
          setError("Do'kon raqami yoki STIR kiriting");
          setLoading(false);
          return;
        }
        const data = await searchPublicContracts({ storeNumber, tin, fields: "min" });
        const filtered = (data || []).filter((contract) => contract.paymentType === "ONLINE");
        setResults(filtered);
        if (filtered.length === 0) setError("Mos shartnoma topilmadi");
        setSearchParams({ mode: "store", storeNumber, tin });
      } else {
        if (!stallNumber) {
          setError("Rasta raqamini kiriting");
          setLoading(false);
          return;
        }
        const data = await getPublicStall(stallNumber, { date, fields: "min" });
        setResults([data]);
        setSearchParams({ mode: "stall", stall: stallNumber, date });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Qidiruvda xatolik yuz berdi");
    } finally {
      setLoading(false);
      if (resultsRef.current && results.length > 0) {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const clearFilters = () => {
    setStoreNumber("");
    setTin("");
    setStallNumber("");
    setResults([]);
    setError("");
    setSearchParams({});
  };

  useEffect(() => {
    if (searchParams.get("mode")) {
      handleSearch();
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-16 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="px-4 py-1.5 uppercase tracking-widest text-[10px] font-bold">
            Onlayn to'lov tizimi
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Ijara <span className="text-blue-600">To'lovi</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            To'lov summasini tekshirish uchun quyidagi ma'lumotlarni kiriting.
          </p>
        </div>

        <Card className="border shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b space-y-6 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg max-w-sm mx-auto">
              <button
                onClick={() => {
                  setMode("store");
                  setResults([]);
                  setError("");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-all",
                  mode === "store" 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <StoreIcon className="h-4 w-4" />
                Do'kon
              </button>
              <button
                onClick={() => {
                  setMode("stall");
                  setResults([]);
                  setError("");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-all",
                  mode === "stall" 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Tag className="h-4 w-4" />
                Rasta
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-10 space-y-8">
            <form onSubmit={handleSearch} className="space-y-6">
              {mode === "store" ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeNumber" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Do'kon raqami</Label>
                    <div className="relative group">
                      <StoreIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="storeNumber"
                        value={storeNumber}
                        onChange={(e) => setStoreNumber(e.target.value)}
                        placeholder="Masalan: A-27"
                        className="pl-10 h-14 bg-white dark:bg-slate-950 font-medium text-lg border-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tin" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">STIR (ixtiyoriy)</Label>
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="tin"
                        value={tin}
                        onChange={(e) => setTin(e.target.value)}
                        placeholder="305XXXXXX"
                        className="pl-10 h-14 bg-white dark:bg-slate-950 font-medium text-lg border-muted"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stall" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rasta raqami</Label>
                    <div className="relative group">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="stall"
                        value={stallNumber}
                        onChange={(e) => setStallNumber(e.target.value)}
                        placeholder="Masalan: ST-105"
                        required
                        className="pl-10 h-14 bg-white dark:bg-slate-950 font-medium text-lg border-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To'lov sanasi</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="date"
                        type="date"
                        max={getTashkentTodayISO()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pl-10 h-14 bg-white dark:bg-slate-950 font-medium text-lg border-muted"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-5 w-5" />
                  )}
                  {mode === "store" ? "Qidirish" : "To'lovni ko'rish"}
                </Button>
                {(storeNumber || tin || stallNumber) && (
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-14 px-8 font-bold text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <X className="mr-2 h-5 w-5" />
                    Tozalash
                  </Button>
                )}
              </div>
            </form>

            {error && (
              <div className="p-4 mb-0 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30  animate-in fade-in ">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <Info className="h-5 w-5 " />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              </div>
            )}

            <div ref={resultsRef} className="space-y-4">
              {results.map((entry, idx) => (
                <div
                  key={"id" in entry ? entry.id : `${entry.stallNumber}-${entry.date}-${idx}`}
                  onClick={() => {
                    const params: Record<string, string> =
                      mode === "store"
                        ? {
                            contractId: String((entry as PublicContractSearchResult).id),
                            mode: "contract",
                          }
                        : {
                            mode: "stall",
                            stall: (entry as PublicStallDetail).stallNumber,
                            date: (entry as PublicStallDetail).date,
                          };
                    const queryString = new URLSearchParams(params).toString();
                    navigate(`/pay/detail?${queryString}`);
                  }}
                  className="group relative p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-blue-200 dark:hover:border-blue-800 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        {mode === "store" ? <StoreIcon className="h-6 w-6" /> : <Tag className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-none mb-1">
                          {mode === "store" 
                            ? ((entry as PublicContractSearchResult).store?.storeNumber || `Shartnoma #${(entry as PublicContractSearchResult).id}`)
                            : `Rasta: ${(entry as PublicStallDetail).stallNumber}`}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                          {mode === "store"
                            ? ((entry as PublicContractSearchResult).owner?.fullName || "Tadbirkor ma'lumoti kiritilmagan")
                            : `Sana: ${formatTashkentDate((entry as PublicStallDetail).date)}`}
                          
                          {mode === "store" && getEntryDebtAmount(entry as PublicContractSearchResult) > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 px-2 text-[10px] font-bold">
                              Qarzdorlik: {new Intl.NumberFormat("uz-UZ").format(getEntryDebtAmount(entry as PublicContractSearchResult))} UZS
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center opacity-70">
          <p className="text-muted-foreground text-sm font-medium">
            Savollar tug'ilsa, iltimos bozor ma'muriyatiga murojaat qiling
          </p>
        </div>
      </div>
    </div>
  );
}
