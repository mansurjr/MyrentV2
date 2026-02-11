import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAttendances } from "../hooks/useAttendances";
import { useStalls } from "../../stalls/hooks/useStalls";
import baseApi from "@/api";
import { CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { downloadExcelWithAuth } from "@/lib/excel-export";
import { columns } from "./columns";

export function AttendancesList() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { useGetStalls } = useStalls();
  const {
    useGetAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
  } = useAttendances();

  const stallsQuery = useGetStalls({
    page,
    limit: pageSize,
    search,
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const attendancesQuery = useGetAttendances({
    date: dateStr,
    limit: 1000,
  });

  const stalls = stallsQuery.data?.data || [];
  const attendances = attendancesQuery.data?.data || [];

  const handleCreateAttendance = async (stallId: number, amount: number) => {
    try {
      await createAttendance.mutateAsync({
        stallId,
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

  const handleGetPaymentUrl = async (attendanceId: number, type: string) => {
    try {
      const response = await baseApi.get(`/attendances/${attendanceId}/pay/`, {
        params: { type },
      });
      return response.data.url;
    } catch (error) {
      console.error("Error getting payment URL:", error);
      return null;
    }
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

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3020/api";
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
      </div>

      <CardContent className="flex-1 overflow-auto p-0 custom-scrollbar">
        {stallsQuery.isLoading || attendancesQuery.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={columns(
              attendances,
              handleCreateAttendance,
              handleDeleteAttendance,
              handleGetPaymentUrl,
              isLoading,
              t,
            )}
            data={stalls}
            pageCount={stallsQuery.data?.pagination?.totalPages || 1}
            pageIndex={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            total={stallsQuery.data?.pagination?.total || 0}
          />
        )}
      </CardContent>
    </div>
  );
}
