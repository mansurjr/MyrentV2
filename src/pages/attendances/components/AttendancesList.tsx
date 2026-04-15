import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAttendances } from "../hooks/useAttendances";
import { useStalls } from "../../stalls/hooks/useStalls";
import { CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { downloadExcelWithAuth } from "@/lib/excel-export";
import { columns } from "./columns";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminAttendanceBulkPaymentUrl,
  getAdminAttendancePaymentUrl,
} from "@/api/payments";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { sortByStallNumberAsc } from "@/lib/sort";
import type { Attendance } from "@/types/api-responses";
import type { AdminAttendancePaymentResponse } from "@/types/payment";

const getAttendanceStallNumber = (attendance: Attendance) =>
  (
    attendance as Attendance & {
      stall?: { stallNumber?: string | null } | null;
    }
  ).stall?.stallNumber ?? attendance.Stall?.stallNumber;

const formatDisplayDate = (value: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return format(parsedDate, "dd.MM.yyyy");
};

export function AttendancesList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStallIds, setSelectedStallIds] = useState<string[]>([]);
  const [bulkPaymentPreview, setBulkPaymentPreview] =
    useState<AdminAttendancePaymentResponse | null>(null);
  const [isBulkPaymentLoading, setIsBulkPaymentLoading] = useState(false);

  const { useGetStalls } = useStalls();
  const {
    useGetAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
  } = useAttendances();

  const stallsQuery = useGetStalls({
    search,
    limit: 1000,
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const attendancesQuery = useGetAttendances({
    date: dateStr,
    limit: 1000,
  });

  const stalls = useMemo(
    () =>
      (stallsQuery.data?.data || [])
        .slice()
        .sort((left, right) =>
          sortByStallNumberAsc(left.stallNumber, right.stallNumber),
        ),
    [stallsQuery.data?.data],
  );

  const attendances = useMemo(
    () =>
      (attendancesQuery.data?.data || [])
        .slice()
        .sort((left, right) =>
          sortByStallNumberAsc(
            getAttendanceStallNumber(left),
            getAttendanceStallNumber(right),
          ),
        ),
    [attendancesQuery.data?.data],
  );

  const attendanceByStallId = useMemo(
    () =>
      new Map(
        attendances.map((attendance) => [String(attendance.stallId), attendance]),
      ),
    [attendances],
  );

  const stallAmountById = useMemo(
    () =>
      new Map(
        stalls.map((stall) => {
          const stallId = String(stall.id);
          const attendance = attendanceByStallId.get(stallId);
          const rawAmount = attendance?.amount ?? stall.dailyFee ?? 0;
          const numericAmount = Number(rawAmount);

          return [stallId, Number.isFinite(numericAmount) ? numericAmount : 0];
        }),
      ),
    [attendanceByStallId, stalls],
  );

  const payableStallIds = useMemo(
    () =>
      stalls
        .filter(
          (stall) => attendanceByStallId.get(String(stall.id))?.status !== "PAID",
        )
        .map((stall) => String(stall.id)),
    [attendanceByStallId, stalls],
  );

  const payableStallIdSet = useMemo(
    () => new Set(payableStallIds),
    [payableStallIds],
  );

  const selectedStallIdSet = useMemo(
    () => new Set(selectedStallIds),
    [selectedStallIds],
  );

  const pageCount = Math.max(1, Math.ceil(stalls.length / pageSize));

  const paginatedStalls = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return stalls.slice(startIndex, startIndex + pageSize);
  }, [page, pageSize, stalls]);

  const visiblePayableStallIds = useMemo(
    () =>
      paginatedStalls
        .filter((stall) => payableStallIdSet.has(String(stall.id)))
        .map((stall) => String(stall.id)),
    [paginatedStalls, payableStallIdSet],
  );

  const allVisiblePayableSelected =
    visiblePayableStallIds.length > 0 &&
    visiblePayableStallIds.every((stallId) => selectedStallIdSet.has(stallId));

  const someVisiblePayableSelected =
    visiblePayableStallIds.some((stallId) => selectedStallIdSet.has(stallId)) &&
    !allVisiblePayableSelected;

  const selectedStalls = useMemo(
    () =>
      stalls.filter((stall) => selectedStallIdSet.has(String(stall.id))),
    [selectedStallIdSet, stalls],
  );

  const selectedTotalAmount = useMemo(
    () =>
      selectedStalls.reduce(
        (sum, stall) => sum + (stallAmountById.get(String(stall.id)) ?? 0),
        0,
      ),
    [selectedStalls, stallAmountById],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelectedStallIds([]);
  }, [dateStr]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  useEffect(() => {
    setSelectedStallIds((currentSelection) =>
      currentSelection.filter((stallId) => payableStallIdSet.has(stallId)),
    );
  }, [payableStallIdSet]);

  const handleToggleSelection = (stallId: string, checked: boolean) => {
    if (!payableStallIdSet.has(stallId)) {
      return;
    }

    setSelectedStallIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (checked) {
        nextSelection.add(stallId);
      } else {
        nextSelection.delete(stallId);
      }

      return Array.from(nextSelection);
    });
  };

  const handleToggleVisibleSelection = (checked: boolean) => {
    setSelectedStallIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      visiblePayableStallIds.forEach((stallId) => {
        if (checked) {
          nextSelection.add(stallId);
        } else {
          nextSelection.delete(stallId);
        }
      });

      return Array.from(nextSelection);
    });
  };

  const handleSelectAllPayable = () => {
    setSelectedStallIds(payableStallIds);
  };

  const handleClearSelection = () => {
    setSelectedStallIds([]);
  };

  const handleCreateAttendance = async (stallId: string | number, amount: number) => {
    try {
      await createAttendance.mutateAsync({
        stallId: String(stallId),
        date: dateStr,
        status: "UNPAID",
        amount,
      });
    } catch (error) {
      console.error("Error creating attendance:", error);
    }
  };

  const handleDeleteAttendance = async (id: number) => {
    try {
      await deleteAttendance.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting attendance:", error);
    }
  };

  const handleGetPaymentUrl = async (attendanceId: number) => {
    try {
      const response = await getAdminAttendancePaymentUrl(attendanceId);
      return response.url;
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 400 || status === 409) {
        await Promise.all([attendancesQuery.refetch(), stallsQuery.refetch()]);
      }

      toast({
        title: t("common.error"),
        description: getApiErrorMessage(
          error,
          "To'lov holati yangilandi. Iltimos, yana tekshirib ko'ring.",
        ),
        variant: "destructive",
      });
      return null;
    }
  };

  const handleBulkPayment = async () => {
    if (selectedStallIds.length === 0 || isBulkPaymentLoading) {
      return;
    }

    setIsBulkPaymentLoading(true);
    try {
      const response = await createAdminAttendanceBulkPaymentUrl({
        stallIds: selectedStallIds,
        date: dateStr,
      });

      setBulkPaymentPreview(response);
      setSelectedStallIds([]);
      await Promise.all([attendancesQuery.refetch(), stallsQuery.refetch()]);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 400 || status === 409) {
        await Promise.all([attendancesQuery.refetch(), stallsQuery.refetch()]);
      }

      toast({
        title: t("common.error"),
        description: getApiErrorMessage(
          error,
          "Tanlangan rastalar uchun to'lov sahifasini yaratib bo'lmadi.",
        ),
        variant: "destructive",
      });
    } finally {
      setIsBulkPaymentLoading(false);
    }
  };

  const handleOpenBulkPaymentPage = () => {
    if (!bulkPaymentPreview?.url) {
      return;
    }

    window.open(bulkPaymentPreview.url, "_blank");
    setBulkPaymentPreview(null);
  };

  const handleExport = async () => {
    const filters = {
      date: dateStr,
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const baseURL = `${window.location.origin}/api`;
    const url = `${baseURL}/attendances/export/excel?${queryParams.toString()}`;
    
    try {
      await downloadExcelWithAuth(url, `attendances_${dateStr}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  const isLoading =
    attendancesQuery.isLoading ||
    stallsQuery.isLoading ||
    createAttendance.isPending ||
    updateAttendance.isPending ||
    deleteAttendance.isPending;

  return (
    <div className="flex flex-col h-full space-y-6 p-6 overflow-hidden">
      <div className="space-y-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("nav.attendances")}
          </h1>
          <p className="text-muted-foreground">
            {t("attendances.list_description")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("attendances.search_placeholder")}
              className="h-10 pl-9 focus-visible:ring-primary/20 transition-all shadow-sm bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal h-10 border-border/50 shadow-sm bg-background",
                  !selectedDate && "text-muted-foreground",
                )}>
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: uz })
                ) : (
                  <span>{t("common.select_date")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleExport}
            className="bg-background border-border/50 hover:bg-muted/50 shadow-sm h-10 w-10 shrink-0"
            title={t("common.export_excel")}
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
          </Button>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Bulk stall payment</p>
              <p className="text-sm text-muted-foreground">
                Tanlangan rasta: {selectedStalls.length} ta. Jami:{" "}
                {new Intl.NumberFormat("uz-UZ").format(selectedTotalAmount)} UZS
              </p>
              <p className="text-xs text-muted-foreground">
                To'langan rastalar tanlanmaydi. Qayd etilmagan rastalar to'lovda
                avtomatik attendance yaratadi.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleSelectAllPayable}
                disabled={payableStallIds.length === 0}
              >
                To'lanmaganlarni tanlash
              </Button>
              <Button
                variant="outline"
                onClick={handleClearSelection}
                disabled={selectedStalls.length === 0}
              >
                Tozalash
              </Button>
              <Button
                onClick={() => {
                  void handleBulkPayment();
                }}
                disabled={selectedStalls.length === 0 || isBulkPaymentLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isBulkPaymentLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Tanlanganlarni to'lash
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 overflow-auto p-0 custom-scrollbar">
        {stallsQuery.isLoading || attendancesQuery.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={columns({
              attendanceByStallId,
              selectedStallIds: selectedStallIdSet,
              allVisiblePayableSelected,
              someVisiblePayableSelected,
              hasVisiblePayableRows: visiblePayableStallIds.length > 0,
              onToggleVisibleSelection: handleToggleVisibleSelection,
              onToggleSelection: handleToggleSelection,
              onCreate: handleCreateAttendance,
              onDelete: handleDeleteAttendance,
              onGetPaymentUrl: handleGetPaymentUrl,
              isLoading,
              t,
            })}
            data={paginatedStalls}
            pageCount={pageCount}
            pageIndex={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            total={stalls.length}
          />
        )}
      </CardContent>

      <Dialog
        open={!!bulkPaymentPreview}
        onOpenChange={(open) => {
          if (!open) {
            setBulkPaymentPreview(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>To'lovni tasdiqlash</DialogTitle>
            <DialogDescription>
              To'lov sahifasi tayyorlandi. Quyidagi rastalar uchun umumiy
              to'lovga o'tishingiz mumkin.
            </DialogDescription>
          </DialogHeader>

          {bulkPaymentPreview && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="font-semibold">{bulkPaymentPreview.provider}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Rastalar</p>
                  <p className="font-semibold">{bulkPaymentPreview.count}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Jami summa</p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat("uz-UZ").format(
                      bulkPaymentPreview.totalAmount,
                    )}{" "}
                    UZS
                  </p>
                </div>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border/50 p-3">
                {bulkPaymentPreview.items.map((item) => (
                  <div
                    key={`${item.attendanceId}-${item.stallId}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-background p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{item.stallNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Attendance ID: {item.attendanceId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sana: {formatDisplayDate(item.date)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-emerald-600">
                      {new Intl.NumberFormat("uz-UZ").format(item.amount)} UZS
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkPaymentPreview(null)}
            >
              Yopish
            </Button>
            <Button
              onClick={handleOpenBulkPaymentPage}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              To'lov sahifasini ochish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
