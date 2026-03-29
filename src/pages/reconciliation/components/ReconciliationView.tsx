import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Store as StoreIcon,
  FileText,
  CreditCard,
  Calendar as CalendarIcon,
  ChevronRight,
  User,
  Eye,
  EyeOff,
  CreditCard as PayIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Pencil,
  LayoutGrid,
} from "lucide-react";
import { useStores } from "../../stores/hooks/useStores";
import { useOwners } from "../../owners/hooks/useOwners";
import { useContracts } from "../../contracts/hooks/useContracts";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { useStalls } from "../../stalls/hooks/useStalls";
import { useAttendances } from "../../attendances/hooks/useAttendances";
import { ManualPayDialog } from "../../contracts/components/ManualPayDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  format,
  differenceInMonths,
  parseISO,
  getYear,
} from "date-fns";
import { uz } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Attendance } from "@/types/api-responses";
import { getAdminAttendancePaymentUrl } from "@/api/payments";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import {
  getPendingContractPeriodPrefixThroughId,
  getPendingContractPeriods,
} from "@/lib/payment";

type FilterType = "store" | "owner" | "stall";

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const isFuturePeriod = (year: number, month: number, referenceDate: Date) => {
  const currentYear = referenceDate.getFullYear();
  const currentMonthIndex = referenceDate.getMonth() + 1;
  return year > currentYear || (year === currentYear && month > currentMonthIndex);
};

const getContractPeriodMetrics = (
  paymentPeriods?: Array<{
    year: number;
    month: number;
    status: string;
    amount: string | number;
  }>,
) => {
  if (!paymentPeriods?.length) {
    return {
      paidMonths: 0,
      unpaidPastMonths: 0,
      unpaidPastAmount: 0,
    };
  }

  const now = new Date();

  return paymentPeriods.reduce(
    (acc, period) => {
      if (period.status === "PAID") {
        acc.paidMonths += 1;
        return acc;
      }

      if (period.status === "PENDING" && !isFuturePeriod(period.year, period.month, now)) {
        acc.unpaidPastMonths += 1;
        acc.unpaidPastAmount += toNumber(period.amount, 0);
      }

      return acc;
    },
    {
      paidMonths: 0,
      unpaidPastMonths: 0,
      unpaidPastAmount: 0,
    },
  );
};

export function ReconciliationView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { useGetStores } = useStores();
  const { useGetOwners } = useOwners();
  const { useGetContracts, payContract, automatePaymentRedirect, updatePeriod, generateFuturePeriods } = useContracts();

  const [filterType, setFilterType] = useState<FilterType>("store");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(
    null,
  );
  const [showInactive, setShowInactive] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "debt">("all");

  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [payingMonth, setPayingMonth] = useState<{
    date: Date;
    label: string;
  } | null>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [editedAmounts, setEditedAmounts] = useState<Record<string, string>>({});
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>("");
  const [isManualPayOpen, setIsManualPayOpen] = useState(false);
  const [isAdvancePayOpen, setIsAdvancePayOpen] = useState(false);
  const [advanceMonths, setAdvanceMonths] = useState<string>("1");

  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data: storesData, isLoading: storesLoading } = useGetStores({
    search: filterType === "store" ? debouncedSearch : "",
    limit: 100,
  });

  const { useGetStalls } = useStalls();
  const { data: stallsData, isLoading: stallsLoading, refetch: refetchStalls } = useGetStalls({
    search: filterType === "stall" ? debouncedSearch : "",
    limit: 100,
  });

  const { useGetAttendances } = useAttendances();
  const {
    data: attendancesData,
    isLoading: attendancesLoading,
    refetch: refetchAttendances,
  } = useGetAttendances({
    stallId: selectedStallId || undefined,
    limit: 1000,
    enabled: filterType === "stall" && !!selectedStallId
  });

  const { data: ownersData, isLoading: ownersLoading } = useGetOwners({
    search: filterType === "owner" ? debouncedSearch : "",
    limit: 100,
    isActive: true,
  });

  const { data: contractsData, isLoading: contractsLoading, refetch: refetchContracts } = useGetContracts({
    storeId: filterType === "store" ? selectedStoreId || undefined : undefined,
    ownerId: filterType === "owner" ? selectedOwnerId || undefined : undefined,
    isActive: showInactive ? false : true,
  });

  // Reload data when tab becomes active
  useEffect(() => {
    const handleFocus = () => {
      refetchContracts();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetchContracts]);

  const selectedStore = useMemo(
    () => storesData?.data?.find((s) => s.id === selectedStoreId),
    [storesData, selectedStoreId],
  );

  const selectedOwner = useMemo(
    () => ownersData?.data?.find((o) => o.id === selectedOwnerId),
    [ownersData, selectedOwnerId],
  );

  const selectedStall = useMemo(
    () => stallsData?.data?.find((s) => s.id === selectedStallId),
    [stallsData, selectedStallId],
  );

  const selectedContract = useMemo(
    () => contractsData?.data?.find((c) => c.id === selectedContractId),
    [contractsData, selectedContractId],
  );

  const paymentHistory = useMemo(() => {
    if (!selectedContract || !selectedContract.paymentPeriods) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth() + 1; // 1-12

    // Sort payment periods so past, current and future months are visible in one timeline.
    const periods = selectedContract.paymentPeriods
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year; // Ascending year
        return a.month - b.month; // Ascending month
      });

    return periods.map((period) => {
      const periodDate = new Date(period.year, period.month - 1);
      const isPaid = period.status === "PAID";
      const isFuture =
        period.year > currentYear ||
        (period.year === currentYear && period.month > currentMonthIndex);
      
      // Determine if it's the current month (for highlighting)
      const isCurrent =
        period.year === currentYear && period.month === currentMonthIndex;

      return {
        id: period.id,
        date: periodDate,
        label: format(periodDate, "MMMM yyyy", { locale: uz }),
        isPaid,
        isPast: !isPaid && !isFuture,
        isCurrent,
        isFuture,
        status: period.status,
        amount: period.amount,
        isEdit: period.isEdit
      };
    });
  }, [selectedContract]);

  const availableYears = useMemo(() => {
    if (paymentHistory.length === 0) return [];
    const years = new Set<number>();
    paymentHistory.forEach((m) => years.add(getYear(m.date)));
    return Array.from(years).sort((a, b) => a - b);
  }, [paymentHistory]);

  const filteredPaymentHistory = useMemo(() => {
    let filtered = paymentHistory;
    
    if (selectedYear !== "all") {
      filtered = filtered.filter((m) => getYear(m.date).toString() === selectedYear);
    }
    
    if (statusFilter === "paid") {
      filtered = filtered.filter((m) => m.isPaid);
    } else if (statusFilter === "debt") {
      filtered = filtered.filter((m) => !m.isPaid && !m.isFuture);
    }
    
    return filtered;
  }, [paymentHistory, selectedYear, statusFilter]);

  const hasFuturePeriods = useMemo(() => {
    if (!selectedContract?.paymentPeriods?.length) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth() + 1;

    return selectedContract.paymentPeriods.some(
      (period) =>
        period.year > currentYear ||
        (period.year === currentYear && period.month > currentMonthIndex),
    );
  }, [selectedContract]);

  const stats = useMemo(() => {
    if (!selectedContract || !selectedContract.paymentPeriods) return null;

    const now = new Date();
    const expiryDate = selectedContract.expiryDate
      ? parseISO(selectedContract.expiryDate)
      : null;
    const selectedMetrics = getContractPeriodMetrics(selectedContract.paymentPeriods);

    const totalPaidMonths = selectedMetrics.paidMonths;
    const totalUnpaidPastMonths = selectedMetrics.unpaidPastMonths;
    const totalDebtAmount = selectedMetrics.unpaidPastAmount;
    const totalDebt = totalDebtAmount;

    return {
      monthsRemaining: expiryDate
        ? Math.max(0, differenceInMonths(expiryDate, now))
        : null,
      totalPaidMonths,
      totalUnpaidPastMonths,
      totalDebtAmount,
      totalDebt,
    };
  }, [selectedContract]);

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type);
    setSearchTerm("");
    setSelectedStoreId(null);
    setSelectedOwnerId(null);
    setSelectedStallId(null);
    setSelectedContractId(null);
    setSelectedYear("all");
    setEditedAmounts({});
  };

  const handlePay = async () => {
    if (!selectedContract || !payingMonth) return;

    try {
      await payContract.mutateAsync({
        id: selectedContract.id,
        amount: Number(selectedContract.shopMonthlyFee),
        month: format(payingMonth.date, "yyyy-MM"),
      });
      setIsPayConfirmOpen(false);
      setPayingMonth(null);
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  const handlePayAttendance = async (attendanceId: number) => {
    if (isRedirecting) {
      return;
    }

    setIsRedirecting(true);
    try {
      const response = await getAdminAttendancePaymentUrl(attendanceId);
      if (response.url) {
        window.open(response.url, '_blank');
      }
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 400 || status === 409) {
        await Promise.all([refetchAttendances(), refetchStalls()]);
      }
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: getApiErrorMessage(
          error,
          "To'lov holati yangilandi. Iltimos, rastani qayta tekshirib ko'ring.",
        ),
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleContractRedirect = async (periodIds: string[]) => {
    if (!selectedContract || isRedirecting) {
      return;
    }

    if (periodIds.length === 0) {
      return;
    }

    setIsRedirecting(true);
    try {
      await automatePaymentRedirect(selectedContract.id, periodIds);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 400 || status === 409) {
        await refetchContracts();
      }

      toast({
        variant: "destructive",
        title: t("common.error"),
        description: getApiErrorMessage(
          error,
          "To'lov holati yangilandi. Iltimos, shartnomani qayta tekshirib ko'ring.",
        ),
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  const openContractPaymentDialog = async (periodIds: string[]) => {
    if (!selectedContract) {
      return;
    }

    if (selectedContract.paymentType === "BANK") {
      setIsManualPayOpen(true);
      return;
    }

    await handleContractRedirect(periodIds);
  };

  const handleAdvancePayment = async () => {
    if (!selectedContract) return;

    const months = Number(advanceMonths);
    if (!Number.isFinite(months) || months < 1 || months > 12) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("reconciliation.advance_months_validation"),
      });
      return;
    }

    try {
      const generated = await generateFuturePeriods.mutateAsync({
        id: selectedContract.id,
        dto: { months },
      });

      const refreshed = await refetchContracts();
      const refreshedContract = refreshed.data?.data?.find(
        (contract) => contract.id === selectedContract.id,
      );

      setIsAdvancePayOpen(false);
      setAdvanceMonths("1");

      if (selectedContract.paymentType === "ONLINE") {
        const generatedKeys = new Set(
          (generated.generatedPeriods || []).map((period) => `${period.year}-${period.month}`),
        );

        const generatedPendingPeriods =
          refreshedContract?.paymentPeriods
            ?.filter((period) => period.status === "PENDING")
            ?.filter((period) => generatedKeys.has(`${period.year}-${period.month}`))
            ?.sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              return a.month - b.month;
            }) || [];
        const generatedPendingPeriodIds =
          generatedPendingPeriods.length > 0 && refreshedContract?.paymentPeriods
            ? getPendingContractPeriodPrefixThroughId(
                refreshedContract.paymentPeriods,
                generatedPendingPeriods[generatedPendingPeriods.length - 1].id,
              ).map((period) => period.id)
            : [];

        if (generatedPendingPeriodIds.length > 0) {
          toast({
            title: t("common.success"),
            description: t("reconciliation.processing_payment"),
          });
          await automatePaymentRedirect(selectedContract.id, generatedPendingPeriodIds);
        } else {
          toast({
            title: t("common.success"),
            description: t("reconciliation.advance_periods_generated"),
          });
        }
        return;
      }

      toast({
        title: t("common.success"),
        description: t("reconciliation.advance_periods_generated"),
      });
    } catch (error) {
      console.error("Advance payment generation error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("reconciliation.advance_payment_failed"),
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-9xl h-full flex flex-col">
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("nav.reconciliation")}
        </h1>
        <p className="text-muted-foreground">
          {t("reconciliation.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <Card className="lg:col-span-1 flex flex-col shadow-sm border-border/50 h-[76vh]">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex p-1 bg-muted rounded-lg mb-4">
              <button
                onClick={() => handleFilterTypeChange("store")}
                className={cn(
                  "flex-1 flex items-center justify-center py-1.5 text-xs font-bold rounded-md transition-all",
                  filterType === "store"
                    ? "bg-background shadow text-primary"
                    : "text-muted-foreground",
                )}>
                <StoreIcon className="h-3.5 w-3.5 mr-1.5" />
                {t("nav.stores")}
              </button>
              <button
                onClick={() => handleFilterTypeChange("owner")}
                className={cn(
                  "flex-1 flex items-center justify-center py-1.5 text-xs font-bold rounded-md transition-all",
                  filterType === "owner"
                    ? "bg-background shadow text-primary"
                    : "text-muted-foreground",
                )}>
                <User className="h-3.5 w-3.5 mr-1.5" />
                {t("nav.owners")}
              </button>
              <button
                onClick={() => handleFilterTypeChange("stall")}
                className={cn(
                  "flex-1 flex items-center justify-center py-1.5 text-xs font-bold rounded-md transition-all",
                  filterType === "stall"
                    ? "bg-background shadow text-primary"
                    : "text-muted-foreground",
                )}>
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                Rasta
              </button>
            </div>
            <CardTitle className="text-base flex items-center gap-2">
              {filterType === "store" ? (
                <StoreIcon className="h-4 w-4 text-primary" />
              ) : filterType === "stall" ? (
                <LayoutGrid className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
              {filterType === "store" ? t("reconciliation.select_store") : filterType === "stall" ? "Rastani tanlang" : t("reconciliation.select_owner")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  filterType === "store"
                    ? t("reconciliation.store_number_placeholder")
                    : filterType === "stall"
                    ? "Rasta raqamini kiriting..."
                    : t("reconciliation.search_owner_placeholder")
                }
                className="pl-8 bg-muted/30 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 -mx-2 px-2 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                {storesLoading || ownersLoading || stallsLoading ? (
                  <div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
                    {t("common.loading")}
                  </div>
                ) : filterType === "store" ? (
                  storesData?.data?.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground italic">
                      {t("reconciliation.not_found")}
                    </div>
                  ) : (
                    storesData?.data?.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => {
                          setSelectedStoreId(store.id);
                          setSelectedContractId(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group border",
                          selectedStoreId === store.id
                            ? "bg-primary text-primary-foreground shadow-md border-primary"
                            : "hover:bg-muted border-border/50",
                        )}>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            № {store.storeNumber}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              selectedStoreId === store.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground",
                            )}>
                            {store.area} {t("common.area_unit")} •{" "}
                            {store.section?.name || t("reconciliation.no_department")}
                          </span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                            selectedStoreId === store.id && "opacity-100",
                          )}
                        />
                      </button>
                    ))
                  )
                ) : filterType === "stall" ? (
                  stallsData?.data?.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground italic">
                      {t("reconciliation.not_found")}
                    </div>
                  ) : (
                    stallsData?.data?.map((stall) => (
                      <button
                        key={stall.id}
                        onClick={() => {
                          setSelectedStallId(stall.id);
                          setSelectedContractId(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group border",
                          selectedStallId === stall.id
                            ? "bg-primary text-primary-foreground shadow-md border-primary"
                            : "hover:bg-muted border-border/50",
                        )}>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            № {stall.stallNumber}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              selectedStallId === stall.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground",
                            )}>
                            {stall.area} {t("common.area_unit")} •{" "}
                            Rasta
                          </span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                            selectedStallId === stall.id && "opacity-100",
                          )}
                        />
                      </button>
                    ))
                  )
                ) : ownersData?.data?.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground italic">
                    {t("reconciliation.not_found")}
                  </div>
                ) : (
                  ownersData?.data?.map((owner) => (
                    <button
                      key={owner.id}
                      onClick={() => {
                        setSelectedOwnerId(owner.id);
                        setSelectedContractId(null);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group border",
                        selectedOwnerId === owner.id
                          ? "bg-primary text-primary-foreground shadow-md border-primary"
                          : "hover:bg-muted border-border/50",
                      )}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{owner.fullName}</span>
                        <span
                          className={cn(
                            "text-xs",
                            selectedOwnerId === owner.id
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground",
                          )}>
                          STIR: {owner.tin}
                        </span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                          selectedOwnerId === owner.id && "opacity-100",
                        )}
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          {(!selectedStoreId && filterType === "store") ||
          (!selectedOwnerId && filterType === "owner") ||
          (!selectedStallId && filterType === "stall") ? (
            <Card className="h-full flex items-center justify-center border-dashed border-2 bg-muted/10 opacity-60">
              <div className="text-center space-y-3">
                <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                  {filterType === "store" ? (
                    <StoreIcon className="h-8 w-8 text-muted-foreground/50" />
                  ) : filterType === "stall" ? (
                    <LayoutGrid className="h-8 w-8 text-muted-foreground/50" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{t("reconciliation.start_instruction")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("reconciliation.select_instruction", { 
                      type: filterType === "store" ? t("reconciliation.store_type") : filterType === "stall" ? "rasta" : t("reconciliation.owner_type") 
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ) : filterType === "stall" && selectedStallId ? (
            <Card className="h-full flex flex-col shadow-sm border-border/50 min-h-0 py-0 overflow-hidden">
              <CardHeader className="bg-muted/30 py-4 shrink-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Rasta Davomati (№ {selectedStall?.stallNumber})
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-0 flex-1 min-h-0 overflow-hidden px-0 py-0">
                <div className="h-full overflow-y-auto custom-scrollbar pt-0 px-0">
                  {attendancesLoading ? (
                    <div className="py-10 text-center animate-pulse">Yuklanmoqda...</div>
                  ) : attendancesData?.data?.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground font-medium">Ma'lumot topilmadi.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50">
                      {attendancesData?.data?.map((att: Attendance) => (
                        <div key={att.id} className="bg-background p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", att.status === 'PAID' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                              {att.status === 'PAID' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold capitalize">{format(new Date(att.date), "d MMMM, yyyy", { locale: uz })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {att.status !== 'PAID' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  void handlePayAttendance(att.id);
                                }}
                                disabled={isRedirecting}
                                className="h-8 bg-blue-600 hover:bg-blue-700 font-bold"
                              >
                                {isRedirecting ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <PayIcon className="h-3 w-3 mr-1" />
                                )}
                                To'lash
                              </Button>
                            )}
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-bold block">
                                {new Intl.NumberFormat("uz-UZ").format(Number(att.amount || selectedStall?.dailyFee || 0))} UZS
                              </span>
                              <Badge variant={att.status === 'PAID' ? 'outline' : 'destructive'} 
                                className={cn("text-[10px] uppercase h-5 px-2", att.status === 'PAID' && "border-emerald-200 bg-emerald-50 text-emerald-700")}>
                                {att.status === 'PAID' ? "To'langan" : "Qarz"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shrink-0 shadow-sm border-border/50">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {t("reconciliation.contracts")}:{" "}
                    {filterType === "store"
                      ? `${t("reconciliation.store_no")} ${selectedStore?.storeNumber}`
                      : selectedOwner?.fullName}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInactive(!showInactive)}
                    className={cn(
                      "h-8 text-xs font-bold gap-2 active:scale-95 transition-all",
                      showInactive
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground",
                    )}>
                    {showInactive ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                    {t("reconciliation.archived_items")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {contractsLoading ? (
                    <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">
                      {t("common.loading")}
                    </div>
                  ) : contractsData?.data?.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="p-3 bg-muted rounded-full w-fit mx-auto">
                        <FileText className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        {showInactive
                          ? t("reconciliation.no_contracts")
                          : t("reconciliation.no_active_contracts")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {contractsData?.data?.map((contract) => {
                        const contractDebtAmount = getContractPeriodMetrics(contract.paymentPeriods).unpaidPastAmount;

                        return (
                        <button
                          key={contract.id}
                          onClick={() => {
                            setSelectedContractId(contract.id);
                            setSelectedYear("all");
                            setEditedAmounts({});
                          }}
                          className={cn(
                            "text-left p-4 rounded-xl  transition-all flex items-start gap-4 group/item border",
                            selectedContractId === contract.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/50 hover:border-primary/50 hover:bg-muted/50",
                            !contract.isActive && "opacity-75 grayscale-[0.5]",
                          )}>
                          <div
                            className={cn(
                              "p-2.5 rounded-lg",
                              selectedContractId === contract.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                              !contract.isActive && "bg-muted/50",
                            )}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold flex items-center gap-2">
                              № {contract.certificateNumber || t("common.unknown")}
                              <Badge
                                  variant={
                                    contractDebtAmount > 0 ? "destructive" : "default"
                                  }
                                  className={cn(
                                    "text-[10px] h-5 px-1.5 uppercase",
                                    contractDebtAmount <= 0 && "bg-emerald-500 hover:bg-emerald-600 border-transparent"
                                  )}>
                                {contractDebtAmount > 0 ? t("common.unpaid") : t("common.paid")}
                              </Badge>
                              {!contract.isActive && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-5 px-1.5 uppercase bg-muted/80">
                                  {t("common.archive")}
                                </Badge>
                              )}
                            </h4>
                            <p className="text-sm font-medium text-foreground/80 mt-1 truncate">
                              {filterType === "owner"
                                ? `${t("reconciliation.store_no")} ${contract.store?.storeNumber}`
                                : contract.owner?.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {contract.issueDate &&
                                format(
                                  parseISO(contract.issueDate),
                                  "dd.MM.yyyy",
                                )}{" "}
                              -
                              {contract.expiryDate
                                ? format(
                                    parseISO(contract.expiryDate),
                                    "dd.MM.yyyy",
                                  )
                                : t("common.unlimited")}
                            </p>
                          </div>
                        </button>
                      )})}
                    </div>
                  )}
                </CardContent>
              </Card>
              {selectedContractId && selectedContract && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 max-w-full pt-0">
                  <div className="space-y-6 shrink-0 md:w-full">
                    <Card className="h-fit shadow-sm border-border/50 overflow-hidden pt-0">
                      <div className="bg-primary/5 p-4 border-b border-border/50 flex items-center justify-between">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
                          {t("common.data")}
                        </h4>
                        {!selectedContract.isActive && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-muted uppercase tracking-tight">
                            {t("reconciliation.archived_status")}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
                            {filterType === "store" ? t("nav.owners") : t("nav.stores")}
                          </Label>
                          <div className="flex items-center gap-2 font-semibold">
                            {filterType === "store" ? (
                              <User className="h-4 w-4 text-primary" />
                            ) : (
                              <StoreIcon className="h-4 w-4 text-primary" />
                            )}
                            {filterType === "store"
                              ? selectedContract.owner?.fullName
                              : `№ ${selectedContract.store?.storeNumber}`}
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
                            {t("reconciliation.monthly_fee")}
                          </Label>
                          <div className="flex items-center gap-2 font-bold text-lg text-primary">
                            <CreditCard className="h-5 w-5" />
                            {new Intl.NumberFormat("uz-UZ").format(
                              Number(selectedContract.shopMonthlyFee),
                            )}{" "}
                            UZS
                          </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                              {t("reconciliation.paid_months")}
                            </Label>
                            <div className="text-lg font-bold text-emerald-600">
                              {stats!.totalPaidMonths}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                              {t("reconciliation.unpaid_months")}
                            </Label>
                            <div className="text-lg font-bold text-red-600">
                              {stats!.totalUnpaidPastMonths}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 pt-2">
                          {selectedContract.isActive && !hasFuturePeriods && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setAdvanceMonths("1");
                                setIsAdvancePayOpen(true);
                              }}
                              className="w-full font-bold"
                            >
                              Oldindan to'lash
                            </Button>
                          )}

                          {stats!.totalDebtAmount > 0 &&
                          (selectedContract.paymentType === "BANK" ||
                            selectedContract.paymentPeriods?.some((p) => p.status === "PENDING")) ? (
                            <Button
                                onClick={async () => {
                                if (!selectedContract) return;

                                const pendingPeriods = selectedContract.paymentPeriods
                                  ? getPendingContractPeriods(selectedContract.paymentPeriods).map(
                                      (period) => period.id,
                                    )
                                  : [];
                                
                                if (selectedContract.paymentType === "BANK" || pendingPeriods.length > 0) {
                                  void openContractPaymentDialog(pendingPeriods);
                                }
                              }}
                              disabled={isRedirecting}
                              className="w-full flex items-center justify-center gap-2 font-bold shadow-sm transition-all active:scale-[0.98] bg-red-600 hover:bg-red-700 text-white">
                              {isRedirecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PayIcon className="h-4 w-4" />
                              )}
                              {selectedContract.paymentType === 'ONLINE' ? t("reconciliation.pay_debt") : t("contracts.manual_pay")}
                              {!isRedirecting && <ArrowRight className="h-4 w-4 ml-auto" />}
                            </Button>
                          ) : null}

                          {(stats!.totalDebtAmount > 0 || stats!.totalDebt > 0) && (
                            <div className="space-y-1">
                              {stats!.totalDebtAmount > 0 && (
                                <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-red-600 uppercase">
                                  <AlertCircle className="h-3 w-3" />
                                  {new Intl.NumberFormat("uz-UZ").format(stats!.totalDebtAmount)} UZS
                                </div>
                              )}
                              <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-primary uppercase">
                                <span>Jami:</span>
                                {new Intl.NumberFormat("uz-UZ").format(stats!.totalDebt)} UZS
                              </div>
                            </div>
                          )}
                        </div>
                        {stats?.monthsRemaining !== null && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
                                {t("reconciliation.remaining_term")}
                              </Label>
                              <div className="flex items-center gap-2 text-amber-600 font-bold">
                                <CalendarIcon className="h-4 w-4" />
                                {stats?.monthsRemaining} {t("reconciliation.months_unit")}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="md:col-span-2 flex flex-col shadow-sm border-border/50 min-h-0 py-0overflow-hidden">
                    <CardHeader className="bg-muted/30 py-0 shrink-0 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <CardTitle className="text-lg">
                            {t("reconciliation.payment_schedule")}
                          </CardTitle>
                          <CardDescription>
                            {t("reconciliation.payment_status_by_month")}
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">
                            {t("reconciliation.year")}:
                          </Label>
                          <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}>
                            <SelectTrigger className="h-8 w-22.5 text-xs font-bold">
                              <SelectValue placeholder={t("reconciliation.year")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t("common.all")}</SelectItem>
                              {availableYears.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">
                            {t("transactions.status")}:
                          </Label>
                          <Select
                            value={statusFilter}
                            onValueChange={(val) =>
                              setStatusFilter(val as "all" | "paid" | "debt")
                            }>
                            <SelectTrigger className="h-8 w-27.5 text-xs font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t("common.all")}</SelectItem>
                              <SelectItem value="paid">{t("common.paid")}</SelectItem>
                              <SelectItem value="debt">{t("common.unpaid")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          {t("common.paid")}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          {t("common.unpaid")}
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-0 flex-1 min-h-0 overflow-hidden px-0 py-0">
                      <div className="h-full overflow-y-auto custom-scrollbar pt-0 px-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50">
                          {filteredPaymentHistory.map((month, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "bg-background p-4 flex items-center justify-between transition-colors",
                                month.isCurrent &&
                                  "bg-primary/5 ring-1 ring-primary/20 inset-0 z-10",
                              )}>
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "p-2 rounded-lg",
                                    month.isPaid
                                      ? "bg-emerald-50 text-emerald-600"
                                      : month.isPast
                                        ? "bg-red-50 text-red-600"
                                        : "bg-muted text-muted-foreground",
                                  )}>
                                  {month.isPaid ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : month.isPast ? (
                                    <XCircle className="h-5 w-5" />
                                  ) : (
                                    <CalendarIcon className="h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <p
                                    className={cn(
                                      "text-sm font-bold capitalize",
                                      month.isCurrent && "text-primary",
                                    )}>
                                    {month.label}
                                    {month.isCurrent && (
                                      <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm uppercase">
                                        {t("common.current")}
                                      </span>
                                    )}
                                    {month.isFuture && (
                                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm uppercase">
                                        Kelgusi oy
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                      {month.isPaid
                                        ? t("reconciliation.successfully_paid")
                                        : month.isPast
                                          ? t("reconciliation.unpaid_debt")
                                          : t("reconciliation.future_payment")}
                                    </p>
                                    {!month.isPaid && (
                                        <button
                                          onClick={() => {
                                            if (!selectedContract?.paymentPeriods) {
                                              return;
                                            }

                                            const periodIds = getPendingContractPeriodPrefixThroughId(
                                              selectedContract.paymentPeriods,
                                              month.id,
                                            ).map((period) => period.id);
                                            void openContractPaymentDialog(periodIds);
                                          }}
                                          disabled={isRedirecting}
                                          className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-50">
                                          {isRedirecting ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <PayIcon className="h-3 w-3" />
                                          )}
                                          {selectedContract.paymentType === 'ONLINE' ? t("common.pay") : t("contracts.manual_pay")}
                                        </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <span className="text-sm font-bold block">
                                      {new Intl.NumberFormat("uz-UZ").format(
                                        Number(editedAmounts[month.id!] ?? month.amount)
                                      )}{" "}
                                      UZS
                                    </span>
                                  </div>
                                  {month.isEdit && !month.isPaid && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-primary hover:bg-primary/10"
                                      onClick={() => {
                                        setEditingPeriodId(month.id!);
                                        setTempAmount(String(editedAmounts[month.id!] ?? month.amount));
                                      }}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <Badge
                                  variant={
                                    month.isPaid
                                      ? "outline"
                                      : month.isPast
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className={cn(
                                    "text-[10px] uppercase h-6 px-2",
                                    month.isPaid &&
                                      "border-emerald-200 bg-emerald-50 text-emerald-700",
                                  )}>
                                  {month.isPaid
                                    ? t("common.paid")
                                    : month.isPast
                                      ? t("common.debt")
                                      : t("common.waiting")}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog open={isPayConfirmOpen} onOpenChange={setIsPayConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reconciliation.confirm_payment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reconciliation.confirm_message", {
                label: payingMonth?.label,
                amount: new Intl.NumberFormat("uz-UZ").format(Number(selectedContract?.shopMonthlyFee))
              })}
              <br />
              <br />
              {t("reconciliation.confirm_note")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={payContract.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePay();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={payContract.isPending}>
              {payContract.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.paying")}
                </>
              ) : (
                t("common.yes_pay")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingPeriodId} onOpenChange={(open) => !open && setEditingPeriodId(null)}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>{t("contracts.edit_amount") || "Изменить сумму"}</DialogTitle>
            <DialogDescription>
              {t("contracts.edit_amount_description") || "Введите новую сумму для данного периода оплаты."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">{t("contracts.monthly_fee")}</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={tempAmount}
                  onChange={(e) => setTempAmount(e.target.value)}
                  className="pl-3 pr-12"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-sm font-bold text-muted-foreground uppercase">UZS</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPeriodId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                if (editingPeriodId && tempAmount) {
                  try {
                    await updatePeriod.mutateAsync({
                      periodId: editingPeriodId,
                      amount: Number(tempAmount),
                    });
                    setEditingPeriodId(null);
                  } catch (error) {
                    console.error("Update period error:", error);
                  }
                }
              }}
              disabled={updatePeriod.isPending}
            >
              {updatePeriod.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("common.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdvancePayOpen} onOpenChange={setIsAdvancePayOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Oldindan to'lash</DialogTitle>
            <DialogDescription>
              {t("reconciliation.select_months")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="advanceMonths">{t("contracts.months_count")}</Label>
              <Select value={advanceMonths} onValueChange={setAdvanceMonths}>
                <SelectTrigger id="advanceMonths">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, index) => {
                    const value = String(index + 1);
                    return (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdvancePayOpen(false)}
              disabled={generateFuturePeriods.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAdvancePayment}
              disabled={generateFuturePeriods.isPending}
            >
              {generateFuturePeriods.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("common.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedContract && (
        <ManualPayDialog
          contract={selectedContract}
          open={isManualPayOpen}
          onOpenChange={setIsManualPayOpen}
        />
      )}
    </div>
  );
}
