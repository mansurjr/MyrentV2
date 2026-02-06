import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAttendances } from "../hooks/useAttendances";
import { useStalls } from "../../stalls/hooks/useStalls";
import { useSections } from "../../sections/hooks/useSections";
import { useSaleTypes } from "../../sale-types/hooks/useSaleTypes";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Calendar as CalendarIcon, Filter, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Stall, Attendance } from "@/types/api-responses";
import { columns } from "./columns";

export function AttendancesList() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sectionId, setSectionId] = useState<string>("all");
  const [saleTypeId, setSaleTypeId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { useGetStalls } = useStalls();
  const { useGetSections } = useSections();
  const { useGetSaleTypes } = useSaleTypes();
  const { useGetAttendances, createAttendance, updateAttendance } = useAttendances();

  const stallsQuery = useGetStalls({
    page,
    limit: pageSize,
    search,
    sectionId: sectionId === "all" ? undefined : Number(sectionId),
    saleTypeId: saleTypeId === "all" ? undefined : Number(saleTypeId),
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const attendancesQuery = useGetAttendances({
    dateFrom: dateStr,
    dateTo: dateStr,
    limit: 1000,
  });

  const { data: sectionsData } = useGetSections();
  const { data: saleTypesData } = useGetSaleTypes({ limit: 100 });

  const stalls = stallsQuery.data?.data || [];
  const attendances = attendancesQuery.data?.data || [];

  const handleToggleStatus = async (stall: Stall, currentAttendance?: Attendance) => {
    const newStatus = currentAttendance?.status === "PAID" ? "UNPAID" : "PAID";
    
    try {
      if (currentAttendance) {
        await updateAttendance.mutateAsync({
          id: currentAttendance.id,
          dto: { status: newStatus }
        });
      } else {
        await createAttendance.mutateAsync({
          stallId: stall.id,
          date: dateStr,
          status: "PAID",
          amount: Number(stall.dailyFee) || 0
        });
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const isLoading = attendancesQuery.isLoading || stallsQuery.isLoading || createAttendance.isPending || updateAttendance.isPending;

  return (
    <div className="flex flex-col h-full space-y-6 p-6 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.attendances")}</h1>
          <p className="text-muted-foreground">
            Kunlik rastalar davomati va to'lovlarini tezkor qayd etish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal h-10 border-border/50 shadow-sm",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {selectedDate ? format(selectedDate, "PPP", { locale: uz }) : <span>Sana tanlang</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card className="flex flex-col shadow-sm border-border/50 overflow-hidden flex-1 min-h-0">
        <CardHeader className="py-3 px-6 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rasta raqami..."
                className="h-9 pl-9 bg-background border-border/50 focus-visible:ring-primary/20 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger className="h-9 w-[180px] bg-background border-border/50 shadow-sm">
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

              <Select value={saleTypeId} onValueChange={setSaleTypeId}>
                <SelectTrigger className="h-9 bg-background border-border/50 shadow-sm">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder={t("nav.sale_types")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")} {t("nav.sale_types").toLowerCase()}</SelectItem>
                  {saleTypesData?.data?.map((type: any) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:block flex-1" />

            <div className="flex items-center justify-end">
              <Badge variant="secondary" className="px-4 py-1.5 font-bold">
                 {stallsQuery.data?.pagination?.total || 0} ta rasta
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-0 custom-scrollbar">
          {stallsQuery.isLoading || attendancesQuery.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns(attendances, handleToggleStatus, isLoading, t)}
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
      </Card>
    </div>
  );
}
