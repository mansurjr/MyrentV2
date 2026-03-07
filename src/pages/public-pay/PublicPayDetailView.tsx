import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Store as StoreIcon, Tag, CheckSquare, Square, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  createPublicContractPaymentUrl,
  createPublicStallPaymentUrl,
  getPublicContractDetail,
  getPublicStall,
} from "@/api/publicPay";
import { formatTashkentDate, getMonthName } from "@/lib/time";
import { cn } from "@/lib/utils";

export default function PublicPayDetailView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const availableMethods = window.location.origin.includes("myrent") ? ["payme"] : ["click"];

  const contractId = searchParams.get("contractId");
  const mode = searchParams.get("mode") || "contract";
  const stallNumber = searchParams.get("stall");
  const date = searchParams.get("date");
  const create = searchParams.get("create") === 'true';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingStatus, setPayingStatus] = useState<string>("idle");
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "contract" && contractId) {
        const res = await getPublicContractDetail(Number(contractId));
        setData(res);
        const periods = res.pendingPeriods || res.paymentPeriods || [];
        const unpaid = periods.filter((p: any) => p.status === 'PENDING' || !p.status || p.status === 'UNPAID');
        if (unpaid.length > 0) {
          setSelectedPeriods(unpaid.map((p: any) => p.id));
        }
      } else if (mode === "stall" && stallNumber) {
        try {
          const res = await getPublicStall(stallNumber, { date: date || undefined });
          setData(Array.isArray(res) ? res[0] : res);
        } catch (err) {
          if (create) {
            setData({
              stall: { stallNumber: stallNumber },
              payment: { date: date, status: 'UNPAID' },
              isNew: true
            });
          } else {
            throw err;
          }
        }
      } else {
        setError("Ma'lumotlar yetarli emas");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contractId, mode, stallNumber, date, create]);

  // Reload data when tab becomes active
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [contractId, mode, stallNumber, date, create]); 

  const togglePeriod = (id: string) => {
    setSelectedPeriods(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handlePayment = async (method: string) => {
    if (selectedPeriods.length === 0 && mode === 'contract') {
      alert("Iltimos, kamida bitta oyni tanlang");
      return;
    }

    setPayingStatus(method);
    try {
      let url = "";
      if (mode === "contract" && data?.id) {
        const res = await createPublicContractPaymentUrl(data.id, {
          periodIds: selectedPeriods,
          method
        });
        url = res.url;
      } else if (mode === "stall" && (data?.stall?.stallNumber || stallNumber)) {
        const res = await createPublicStallPaymentUrl(data?.stall?.stallNumber || stallNumber, {
          date: data?.payment?.date || date,
          method
        });
        url = res.url;
      }

      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error("To'lov havolasi olinmadi");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || "To'lovda xatolik yuz berdi");
    } finally {
      setPayingStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md w-full border border-muted shadow-lg">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold">{error || "Ma'lumot topilmadi"}</h2>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full h-12">
              Orqaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isContract = mode === "contract";
  const allPeriods = isContract 
    ? (data.pendingPeriods || data.paymentPeriods || data.debtPeriods || []) 
    : [];

  const pendingPeriods = allPeriods.filter((p: any) => 
    p.status === 'PENDING' || p.status === 'UNPAID' || !p.status || p.isPaid === false
  );
  const backendDebtAmountRaw = Number(
    data.paymentSnapshot?.debtAmount ??
      data.unpaid ??
      data.debtAmount ??
      data.debt ??
      0,
  );
  const backendDebtAmount = Number.isFinite(backendDebtAmountRaw)
    ? backendDebtAmountRaw
    : 0;
  
  const amountToPay = isContract 
    ? backendDebtAmount
    : Number(data.payment?.amount || data.stall?.dailyFee || 0);

  const isPaid = isContract 
    ? (pendingPeriods.length === 0 && backendDebtAmount === 0)
    : data.payment?.status === 'PAID';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-20 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 text-muted-foreground hover:text-blue-600 transition-colors font-bold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <Card className="border shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50 p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isContract ? <StoreIcon className="h-6 w-6" /> : <Tag className="h-6 w-6" />}
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                {isContract ? (data.store?.storeNumber || "Do'kon") : `Rasta: ${data.stall?.stallNumber || stallNumber}`}
              </CardTitle>
            </div>
            <CardDescription className="font-semibold text-slate-600 dark:text-slate-400">
              {isContract ? data.owner?.fullName : `Sana: ${formatTashkentDate(data.payment?.date || date || "")}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Holati</span>
                {isPaid ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 text-xs font-black uppercase flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    To'langan
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="px-4 py-1.5 text-xs font-black uppercase animate-pulse">
                    {data.isNew ? "Yangi davomat" : "To'lanmagan"}
                  </Badge>
                )}
              </div>

              {isContract && pendingPeriods.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Qarzdorlik tafsilotlari</span>
                    <button 
                      onClick={() => {
                        if (selectedPeriods.length === pendingPeriods.length) {
                          setSelectedPeriods([]);
                        } else {
                          setSelectedPeriods(pendingPeriods.map((p: any) => p.id));
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                    >
                      {selectedPeriods.length === pendingPeriods.length ? "Barchasini bekor qilish" : "Barchasini tanlash"}
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {pendingPeriods.map((p: any) => {
                      const mNumber = typeof p.month === 'string' ? parseInt(p.month.replace(/\D/g, '')) : p.month;
                      const isSelected = selectedPeriods.includes(p.id);
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => togglePeriod(p.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg text-sm font-bold border transition-all cursor-pointer",
                            isSelected 
                              ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                              : "bg-slate-50 dark:bg-slate-800 border-muted/30 hover:border-blue-200 dark:hover:border-blue-800"
                          )}
                        >
                          <div className={cn(
                            "h-5 w-5 rounded flex items-center justify-center transition-colors",
                            isSelected ? "text-blue-600" : "text-slate-300"
                          )}>
                            {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 flex justify-between">
                            <span className={isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-600 dark:text-slate-400"}>
                              {p.year}-yil, {getMonthName(mNumber)}
                            </span>
                            <span className={isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-900 dark:text-white"}>
                              {new Intl.NumberFormat("uz-UZ").format(p.amount)} UZS
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator className="opacity-50" />

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-900 dark:text-white font-extrabold text-lg">Umumiy summa</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400 block tracking-tight">
                    {amountToPay > 0 ? new Intl.NumberFormat("uz-UZ").format(amountToPay) : "—"}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">UZS</span>
                </div>
              </div>
            </div>

            {!isPaid && (
              <div className="grid gap-4 pt-4">
                {(data.availableMethods || availableMethods)
                  .map((method: string) => {
                    const m = method.toLowerCase();
                    const isClick = m === "click";
                    const isPayme = m === "payme";

                  return (
                    <Button 
                      key={method}
                      onClick={() => handlePayment(method)}
                      disabled={payingStatus !== "idle"}
                      className={cn(
                        "h-16 rounded-xl flex items-center justify-between px-6 transition-all hover:scale-[1.01] active:scale-[0.99] font-black tracking-widest italic text-lg shadow-lg",
                        isClick ? "bg-[#0091ff] hover:bg-[#0070c5] text-white shadow-blue-500/10" : 
                        isPayme ? "bg-[#16c7cc] hover:bg-[#12a5aa] text-white shadow-teal-500/10" : 
                        "bg-slate-900 hover:bg-slate-800 text-white"
                      )}
                    >
                      <span className="uppercase">{method}</span>
                      {payingStatus === method ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <ArrowLeft className="h-5 w-5 rotate-180" />
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
            
            {!isPaid && data.paymentUrl && (isContract ? selectedPeriods.length === pendingPeriods.length : true) && (
              <div className="pt-4">
                <Button 
                  asChild
                  className="w-full h-14 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20"
                >
                  <a href={data.paymentUrl} target="_blank" rel="noopener noreferrer">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Barcha qarzlarni to'lash
                  </a>
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-slate-50/30 dark:bg-slate-800/20 p-6">
            <p className="text-muted-foreground text-[10px] text-center font-semibold uppercase tracking-wider mx-auto leading-relaxed">
              Guvohnoma № {isContract ? (data.certificateNumber || "—") : "—"}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
