import { DataTable } from "@/components/DataTable";
import { useTransactions } from "../hooks/useTransactions";
import { columns } from "./columns";
import { Search, X, Loader2, CreditCard, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { startOfDay, endOfDay, format } from "date-fns";

export function TransactionsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfDay(new Date()));
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const { useGetTransactions } = useTransactions();

  const { data, isLoading } = useGetTransactions({ 
    page, 
    limit: pageSize,
    search: debouncedSearch,
    status: status === "all" ? undefined : status,
    source: source === "all" ? undefined : (source as 'contract' | 'attendance'),
    paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
    dateFrom: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    dateTo: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  });

  const clearFilters = () => {
    setStatus("all");
    setSource("all");
    setPaymentMethod("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6 flex flex-col">
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Tranzaksiyalar</h1>
        <p className="text-muted-foreground">
          Barcha to'lovlar va moliyaviy amallar tarixi.
        </p>
      </div>

      {}
      <div className="bg-background p-4 rounded-xl border border-border/50 shadow-sm shrink-0">
        <div className="flex flex-wrap items-end gap-4">
          {}
          <div className="flex-1 min-w-[300px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Qidiruv</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ID, mijoz yoki raqam bo'yicha..."
                className="h-10 pl-9 bg-muted/20 border-border/50 focus:bg-background transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Manba</label>
            <Select value={source} onValueChange={(val) => {
              setSource(val);
              setPage(1);
            }}>
              <SelectTrigger className="h-10 w-full bg-muted/20 border-border/50">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary/70" />
                  <SelectValue placeholder="Hammasi" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hammasi</SelectItem>
                <SelectItem value="contract">Do'kon</SelectItem>
                <SelectItem value="attendance">Rasta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">To'lov</label>
            <Select value={paymentMethod} onValueChange={(val) => {
              setPaymentMethod(val);
              setPage(1);
            }}>
              <SelectTrigger className="h-10 w-full bg-muted/20 border-border/50">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Barchasi" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="CASH">Naqd</SelectItem>
                <SelectItem value="CLICK">Click</SelectItem>
                <SelectItem value="PAYME">Payme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Holati</label>
            <Select value={status} onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}>
              <SelectTrigger className="h-10 w-full bg-muted/20 border-border/50">
                <SelectValue placeholder="Barchasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="PAID">To'langan</SelectItem>
                <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                <SelectItem value="REVERSED">Qaytarilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Dan</label>
            <DateTimePicker 
              date={startDate} 
              setDate={(date) => {
                setStartDate(date);
                setPage(1);
              }} 
            />
          </div>

          {}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Gacha</label>
            <DateTimePicker 
              date={endDate} 
              setDate={(date) => {
                setEndDate(date);
                setPage(1);
              }} 
            />
          </div>

          {}
          <div className="pb-0.5 min-w-[100px]">
            {(status !== "all" || source !== "all" || paymentMethod !== "all" || search || startDate || endDate) && (
              <Button 
                variant="ghost" 
                onClick={clearFilters} 
                className="h-10 w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Tozalash
              </Button>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 min-h-0 bg-background rounded-xl border border-border/50 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="grid gap-4 py-20 place-items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            <p className="text-muted-foreground animate-pulse font-medium">Ma'lumotlar yuklanmoqda...</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            pageCount={data?.pagination?.totalPages || 1}
            pageIndex={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            total={data?.pagination?.total || 0}
          />
        )}
      </div>
    </div>
  );
}
