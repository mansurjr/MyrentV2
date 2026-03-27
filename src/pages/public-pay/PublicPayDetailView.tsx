import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Store as StoreIcon,
  Tag,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  createPublicContractPaymentUrl,
  createPublicStallPaymentUrl,
  getPublicContractDetail,
  getPublicStall,
} from "@/api/publicPay";
import { getMonthName } from "@/lib/time";
import { cn } from "@/lib/utils";
import type {
  PublicContractDetail,
  PublicStallDetail,
} from "@/types/payment";
import {
  getPendingContractPeriods,
  normalizePeriodIds,
  sumContractPeriods,
} from "@/lib/payment";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { usePaymentMethodState } from "@/hooks/usePaymentMethodState";
import { PaymentMethodSelector } from "@/components/payment/PaymentMethodSelector";

type PaymentDetailData = PublicContractDetail | PublicStallDetail;

export default function PublicPayDetailView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get("contractId");
  const mode = searchParams.get("mode") || "contract";
  const stallNumber = searchParams.get("stall");
  const date = searchParams.get("date");
  const isContractMode = mode === "contract";

  const [data, setData] = useState<PaymentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const requestIdRef = useRef(0);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      if (isContractMode && contractId) {
        const response = await getPublicContractDetail(Number(contractId));
        const pendingPeriods = getPendingContractPeriods(response.paymentPeriods);
        const pendingIds = normalizePeriodIds(pendingPeriods.map((period) => period.id));

        setData(response);
        setSelectedPeriods((currentIds) => {
          const preservedIds = currentIds.filter((periodId) => pendingIds.includes(periodId));
          return preservedIds.length > 0 ? preservedIds : pendingIds;
        });
        return;
      }

      if (!isContractMode && stallNumber && date) {
        const response = await getPublicStall(stallNumber, { date });
        setData(response);
        setSelectedPeriods([]);
        return;
      }

      setError("Ma'lumotlar yetarli emas");
      setData(null);
      setSelectedPeriods([]);
    } catch (err) {
      setData(null);
      setSelectedPeriods([]);
      setError(getApiErrorMessage(err, "Ma'lumotlarni yuklashda xatolik"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contractId, isContractMode, stallNumber, date]);

  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [contractId, isContractMode, stallNumber, date]);

  const contractData = isContractMode ? (data as PublicContractDetail | null) : null;
  const stallData = !isContractMode ? (data as PublicStallDetail | null) : null;
  const {
    availableMethods,
    selectedMethod,
    setSelectedMethod,
    paymentUrlLoading,
    setPaymentUrlLoading,
    paymentError,
    setPaymentError,
  } = usePaymentMethodState(contractData?.availableMethods ?? stallData?.availableMethods ?? null);
  const pendingPeriods = contractData ? getPendingContractPeriods(contractData.paymentPeriods) : [];
  const selectedPendingPeriods = pendingPeriods.filter((period) => selectedPeriods.includes(period.id));
  const amountToPay = contractData
    ? sumContractPeriods(selectedPendingPeriods)
    : Number(stallData?.dailyFee ?? 0);
  const isPaid = contractData ? pendingPeriods.length === 0 : stallData?.status === "PAID";

  const togglePeriod = (id: string) => {
    setSelectedPeriods((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((periodId) => periodId !== id)
        : [...currentIds, id],
    );
  };

  const handlePayment = async () => {
    if (paymentUrlLoading) {
      return;
    }

    if (contractData && selectedPendingPeriods.length === 0) {
      setPaymentError("Iltimos, kamida bitta oyni tanlang");
      return;
    }

    if (!selectedMethod) {
      setPaymentError("To'lov usulini tanlang");
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    const newTab = window.open("", "_blank");
    setPaymentError(null);
    setPaymentUrlLoading(true);

    try {
      let url = "";

      if (contractData) {
        const periodIds = normalizePeriodIds(selectedPendingPeriods.map((period) => period.id));
        const response = await createPublicContractPaymentUrl(contractData.id, {
          periodIds,
          method: selectedMethod,
        });
        url = response.url;
      } else if (stallData) {
        const response = await createPublicStallPaymentUrl(stallData.stallNumber, {
          date: stallData.date,
          method: selectedMethod,
        });
        url = response.url;
      }

      if (requestIdRef.current !== currentRequestId) {
        newTab?.close();
        return;
      }

      if (!url) {
        throw new Error("To'lov havolasi olinmadi");
      }

      if (newTab) {
        newTab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      newTab?.close();

      const status = getApiErrorStatus(err);
      if (status === 400 || status === 409) {
        await fetchData();
      }

      const fallbackMessage = contractData
        ? "To'lov davrlari yangilandi. Iltimos, tanlovni qayta tekshirib urinib ko'ring."
        : "Rasta to'lov holati yangilandi. Iltimos, qayta tekshirib urinib ko'ring.";
      setPaymentError(getApiErrorMessage(err, fallbackMessage));
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setPaymentUrlLoading(false);
      }
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
            <h2 className="text-xl font-bold">
              {error || "Ma'lumot topilmadi"}
            </h2>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full h-12">
              Orqaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-20 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-blue-600 transition-colors font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <Card className="border shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50 p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {contractData ? (
                  <StoreIcon className="h-6 w-6" />
                ) : (
                  <Tag className="h-6 w-6" />
                )}
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                {contractData
                  ? contractData.store?.storeNumber || "Do'kon"
                  : `Rasta: ${stallData?.stallNumber || stallNumber}`}
              </CardTitle>
            </div>
            <CardDescription className="font-semibold text-slate-600 dark:text-slate-400">
              {contractData ? contractData.owner?.fullName : `Sana: ${stallData?.date || date}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                  Holati
                </span>
                {isPaid ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 text-xs font-black uppercase flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    To'langan
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="px-4 py-1.5 text-xs font-black uppercase animate-pulse">
                    To'lanmagan
                  </Badge>
                )}
              </div>

              {contractData && pendingPeriods.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                      Qarzdorlik tafsilotlari
                    </span>
                    <button
                      onClick={() => {
                        if (selectedPeriods.length === pendingPeriods.length) {
                          setSelectedPeriods([]);
                        } else {
                          setSelectedPeriods(pendingPeriods.map((period) => period.id));
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 uppercase hover:underline">
                      {selectedPeriods.length === pendingPeriods.length
                        ? "Barchasini bekor qilish"
                        : "Barchasini tanlash"}
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {pendingPeriods.map((period) => {
                      const isSelected = selectedPeriods.includes(period.id);
                      return (
                        <div
                          key={period.id}
                          onClick={() => togglePeriod(period.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg text-sm font-bold border transition-all cursor-pointer",
                            isSelected
                              ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              : "bg-slate-50 dark:bg-slate-800 border-muted/30 hover:border-blue-200 dark:hover:border-blue-800",
                          )}>
                          <div
                            className={cn(
                              "h-5 w-5 rounded flex items-center justify-center transition-colors",
                              isSelected ? "text-blue-600" : "text-slate-300",
                            )}>
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 flex justify-between">
                            <span
                              className={
                                isSelected
                                  ? "text-blue-900 dark:text-blue-100"
                                  : "text-slate-600 dark:text-slate-400"
                              }>
                              {period.year}-yil, {getMonthName(period.month)}
                            </span>
                            <span
                              className={
                                isSelected
                                  ? "text-blue-900 dark:text-blue-100"
                                  : "text-slate-900 dark:text-white"
                              }>
                              {new Intl.NumberFormat("uz-UZ").format(Number(period.amount))} UZS
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
                <span className="text-slate-900 dark:text-white font-extrabold text-lg">
                  Umumiy summa
                </span>
                <div className="text-right">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400 block tracking-tight">
                    {amountToPay > 0
                      ? new Intl.NumberFormat("uz-UZ").format(amountToPay)
                      : "0"}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    UZS
                  </span>
                </div>
              </div>
            </div>

            {!isPaid && (
              <div className="grid gap-4 pt-4">
                <PaymentMethodSelector
                  availableMethods={availableMethods}
                  selectedMethod={selectedMethod}
                  onSelect={setSelectedMethod}
                  disabled={paymentUrlLoading}
                />
                {paymentError ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {paymentError}
                  </div>
                ) : null}
                <Button
                  onClick={() => {
                    void handlePayment();
                  }}
                  disabled={paymentUrlLoading || availableMethods.length === 0}
                  className={cn(
                    "h-16 rounded-xl flex items-center justify-between px-6 transition-all hover:scale-[1.01] active:scale-[0.99] font-black tracking-widest italic text-lg shadow-lg",
                    selectedMethod === "payme"
                      ? "bg-[#16c7cc] hover:bg-[#12a5aa] text-white shadow-teal-500/10"
                      : "bg-[#0091ff] hover:bg-[#0070c5] text-white shadow-blue-500/10",
                  )}>
                  <span className="uppercase">
                    {selectedMethod ? "To'lovga o'tish" : "To'lov usulini tanlang"}
                  </span>
                  {paymentUrlLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-slate-50/30 dark:bg-slate-800/20 p-6">
            <p className="text-muted-foreground text-[10px] text-center font-semibold uppercase tracking-wider mx-auto leading-relaxed">
              Guvohnoma No. {contractData ? contractData.certificateNumber || "-" : "-"}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
