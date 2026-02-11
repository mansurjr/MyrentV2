import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useStores } from "../../stores/hooks/useStores";
import { useOwners } from "../../owners/hooks/useOwners";
import { useContracts } from "../../contracts/hooks/useContracts";
import { useDebounce } from "@/hooks/useDebounce";
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
  addMonths,
  startOfMonth,
  parseISO,
  isBefore,
  isAfter,
  isSameMonth,
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

type FilterType = "store" | "owner";

export function ReconciliationView() {
  const { t } = useTranslation();
  const { useGetStores } = useStores();
  const { useGetOwners } = useOwners();
  const { useGetContracts, payContract, automatePaymentRedirect } = useContracts();

  const [filterType, setFilterType] = useState<FilterType>("store");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(
    null,
  );
  const [showInactive, setShowInactive] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [payingMonth, setPayingMonth] = useState<{
    date: Date;
    label: string;
  } | null>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data: storesData, isLoading: storesLoading } = useGetStores({
    search: filterType === "store" ? debouncedSearch : "",
    limit: 100,
  });

  const { data: ownersData, isLoading: ownersLoading } = useGetOwners({
    search: filterType === "owner" ? debouncedSearch : "",
    limit: 100,
    isActive: true,
  });

  const { data: contractsData, isLoading: contractsLoading } = useGetContracts({
    storeId: filterType === "store" ? selectedStoreId || undefined : undefined,
    ownerId: filterType === "owner" ? selectedOwnerId || undefined : undefined,
    isActive: showInactive ? undefined : true,
  });

  const selectedStore = useMemo(
    () => storesData?.data?.find((s) => s.id === selectedStoreId),
    [storesData, selectedStoreId],
  );

  const selectedOwner = useMemo(
    () => ownersData?.data?.find((o) => o.id === selectedOwnerId),
    [ownersData, selectedOwnerId],
  );

  const selectedContract = useMemo(
    () => contractsData?.data?.find((c) => c.id === selectedContractId),
    [contractsData, selectedContractId],
  );

  const paymentHistory = useMemo(() => {
    if (!selectedContract) return [];

    const issueDate = selectedContract.issueDate
      ? parseISO(selectedContract.issueDate)
      : new Date();
    const expiryDate = selectedContract.expiryDate
      ? parseISO(selectedContract.expiryDate)
      : null;
    const now = new Date();

    const calculationEndDate =
      expiryDate && isBefore(expiryDate, now)
        ? now
        : expiryDate || addMonths(now, 12);

    const months: any[] = [];
    let currentMonth = startOfMonth(issueDate);
    const endCalculationMonth = startOfMonth(calculationEndDate);

    while (!isAfter(currentMonth, endCalculationMonth)) {
      const paidThrough = selectedContract.paymentSnapshot?.paidThrough
        ? parseISO(selectedContract.paymentSnapshot.paidThrough)
        : null;

      const isPaid = paidThrough ? !isBefore(paidThrough, currentMonth) : false;
      const isPast = isBefore(currentMonth, startOfMonth(now));
      const isCurrent = isSameMonth(currentMonth, now);

      months.push({
        date: currentMonth,
        label: format(currentMonth, "MMMM yyyy", { locale: uz }),
        isPaid,
        isPast,
        isCurrent,
        isFuture: isAfter(currentMonth, startOfMonth(now)),
      });

      currentMonth = addMonths(currentMonth, 1);
    }

    return months;
  }, [selectedContract]);

  const availableYears = useMemo(() => {
    if (paymentHistory.length === 0) return [];
    const years = new Set<number>();
    paymentHistory.forEach((m) => years.add(getYear(m.date)));
    return Array.from(years).sort((a, b) => b - a);
  }, [paymentHistory]);

  const filteredPaymentHistory = useMemo(() => {
    if (selectedYear === "all") return paymentHistory;
    return paymentHistory.filter(
      (m) => getYear(m.date).toString() === selectedYear,
    );
  }, [paymentHistory, selectedYear]);

  const stats = useMemo(() => {
    if (!selectedContract) return null;

    const now = new Date();
    const expiryDate = selectedContract.expiryDate
      ? parseISO(selectedContract.expiryDate)
      : null;

    return {
      monthsRemaining: expiryDate
        ? Math.max(0, differenceInMonths(expiryDate, now))
        : null,
      totalPaidMonths: paymentHistory.filter((m) => m.isPaid).length,
      totalUnpaidPastMonths: paymentHistory.filter((m) => m.isPast && !m.isPaid)
        .length,
    };
  }, [selectedContract, paymentHistory]);

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type);
    setSearchTerm("");
    setSelectedStoreId(null);
    setSelectedOwnerId(null);
    setSelectedContractId(null);
    setSelectedYear("all");
  };

  const handlePay = async () => {
    if (!selectedContract || !payingMonth) return;

    try {
      await payContract.mutateAsync({
        id: selectedContract.id,
        amount: Number(selectedContract.shopMonthlyFee),
        month: format(payingMonth.date, "yyyy-MM-dd"),
      });
      setIsPayConfirmOpen(false);
      setPayingMonth(null);
    } catch (error) {
      console.error("Payment error:", error);
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
            </div>
            <CardTitle className="text-base flex items-center gap-2">
              {filterType === "store" ? (
                <StoreIcon className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
              {filterType === "store" ? t("reconciliation.select_store") : t("reconciliation.select_owner")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  filterType === "store"
                    ? t("reconciliation.store_number_placeholder")
                    : t("reconciliation.search_owner_placeholder")
                }
                className="pl-8 bg-muted/30 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 -mx-2 px-2 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                {storesLoading || ownersLoading ? (
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
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group",
                          selectedStoreId === store.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-muted",
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
                            {store.Section?.name || t("reconciliation.no_department")}
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
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group",
                        selectedOwnerId === owner.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-muted",
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
          (!selectedOwnerId && filterType === "owner") ? (
            <Card className="h-full flex items-center justify-center border-dashed border-2 bg-muted/10 opacity-60">
              <div className="text-center space-y-3">
                <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                  {filterType === "store" ? (
                    <StoreIcon className="h-8 w-8 text-muted-foreground/50" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{t("reconciliation.start_instruction")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("reconciliation.select_instruction", { 
                      type: filterType === "store" ? t("reconciliation.store_type") : t("reconciliation.owner_type") 
                    })}
                  </p>
                </div>
              </div>
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
                      {contractsData?.data?.map((contract) => (
                        <button
                          key={contract.id}
                          onClick={() => {
                            setSelectedContractId(contract.id);
                            setSelectedYear("all");
                          }}
                          className={cn(
                            "text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 group/item",
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
                                  contract.isPaidCurrentMonth
                                    ? "outline"
                                    : "destructive"
                                }
                                className="text-[10px] h-5 px-1.5 uppercase">
                                {contract.isPaidCurrentMonth
                                  ? t("common.paid")
                                  : t("common.unpaid")}
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
                      ))}
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
                              {stats?.totalPaidMonths}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                              {t("reconciliation.unpaid_months")}
                            </Label>
                            <div className="text-lg font-bold text-red-600">
                              {stats?.totalUnpaidPastMonths}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 pt-2">
                          {stats?.totalUnpaidPastMonths &&
                            stats.totalUnpaidPastMonths > 0 ? (
                            <Button
                              onClick={async () => {
                                if (!selectedContract) return;
                                setIsRedirecting(true);
                                try {
                                  const firstUnpaidMonth = paymentHistory.find(m => !m.isPaid && m.isPast)?.date;
                                  await automatePaymentRedirect(selectedContract.id, {
                                    months: stats?.totalUnpaidPastMonths || 0,
                                    startMonth: firstUnpaidMonth ? format(firstUnpaidMonth, "yyyy-MM") : undefined
                                  });
                                } finally {
                                  setIsRedirecting(false);
                                }
                              }}
                              disabled={isRedirecting}
                              className="w-full flex items-center justify-center gap-2 font-bold shadow-sm transition-all active:scale-[0.98] bg-red-600 hover:bg-red-700 text-white">
                              {isRedirecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PayIcon className="h-4 w-4" />
                              )}
                              {t("reconciliation.pay_debt")}
                              {!isRedirecting && <ArrowRight className="h-4 w-4 ml-auto" />}
                            </Button>
                          ) : null}

                          {stats?.totalUnpaidPastMonths &&
                            stats.totalUnpaidPastMonths > 0 && (
                              <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-red-600 uppercase">
                                <AlertCircle className="h-3 w-3" />
                                {new Intl.NumberFormat("uz-UZ").format(
                                  stats.totalUnpaidPastMonths * Number(selectedContract.shopMonthlyFee),
                                )}{" "}
                                UZS
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
                          <Label className="text-xs font-bold text-muted-foreground uppercase">
                            {t("reconciliation.year")}:
                          </Label>
                          <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}>
                            <SelectTrigger className="h-8 w-[100px] text-xs font-bold">
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
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                      {month.isPaid
                                        ? t("reconciliation.successfully_paid")
                                        : month.isPast
                                          ? t("reconciliation.unpaid_debt")
                                          : t("reconciliation.future_payment")}
                                    </p>
                                    {!month.isPaid && month.isPast && (
                                        <button
                                          onClick={async () => {
                                            if (!selectedContract) return;
                                            setIsRedirecting(true);
                                            try {
                                              await automatePaymentRedirect(selectedContract.id, {
                                                months: 1,
                                                startMonth: format(month.date, "yyyy-MM")
                                              });
                                            } finally {
                                              setIsRedirecting(false);
                                            }
                                          }}
                                          disabled={isRedirecting}
                                          className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-50">
                                          {isRedirecting ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <PayIcon className="h-3 w-3" />
                                          )}
                                          {t("common.pay")}
                                        </button>
                                    )}
                                  </div>
                                </div>
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
                                  ? t("common.done")
                                  : month.isPast
                                    ? t("common.debt")
                                    : t("common.waiting")}
                              </Badge>
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
    </div>
  );
}
