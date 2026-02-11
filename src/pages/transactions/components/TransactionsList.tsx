import { DataTable } from "@/components/DataTable";
import { useTransactions } from "../hooks/useTransactions";
import { columns } from "./columns";
import { Search, X, Loader2, CreditCard, Receipt, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { startOfDay, endOfDay, format, parseISO } from "date-fns";
import { downloadExcelWithAuth } from "@/lib/excel-export";

export function TransactionsList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialSource = searchParams.get("source") || "all";
  const initialDateFrom = searchParams.get("dateFrom");
  const initialDateTo = searchParams.get("dateTo");

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>(initialSource);
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialDateFrom ? parseISO(initialDateFrom) : (initialSearch ? undefined : startOfDay(new Date()))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialDateTo ? parseISO(initialDateTo) : (initialSearch ? undefined : endOfDay(new Date()))
  );
  
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

  const handleExport = async () => {
    const filters = {
      search: debouncedSearch,
      status: status === "all" ? undefined : status,
      source: source === "all" ? undefined : source,
      paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
      dateFrom: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      dateTo: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3020/api";
    const url = `${baseURL}/transactions/export/excel?${queryParams.toString()}`;
    
    try {
      await downloadExcelWithAuth(url, `transactions_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  const clearFilters = () => {
    setStatus("all");
    setSource("all");
    setPaymentMethod("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearch("");
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-6 p-6 flex flex-col">
      <div className="flex flex-row items-start justify-between shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.transactions")}</h1>
          <p className="text-muted-foreground">
            {t("transactions.description")}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleExport}
          className="bg-background border-border/50 hover:bg-muted/50 shadow-sm"
          title={t("common.export_excel")}
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
        </Button>
      </div>
      <div className="bg-background rounded-xl shrink-0">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[300px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("transactions.search_label")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("transactions.search_placeholder")}
                className="h-10 pl-9 bg-muted/20 border-border/50 focus:bg-background transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("transactions.source")}</label>
            <Select value={source} onValueChange={(val) => {
              setSource(val);
              setPage(1);
            }}>
              <SelectTrigger className="h-10 w-full bg-muted/20 border-border/50">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary/70" />
                  <SelectValue placeholder={t("common.all")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="contract">{t("transactions.store")}</SelectItem>
                <SelectItem value="attendance">{t("transactions.stall")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("transactions.payment")}</label>
            <Select value={paymentMethod} onValueChange={(val) => {
              setPaymentMethod(val);
              setPage(1);
            }}>
              <SelectTrigger className="h-10 w-full bg-muted/20 border-border/50">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t("common.all")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="CASH">{t("transactions.cash")}</SelectItem>
                <SelectItem value="CLICK">Click</SelectItem>
                <SelectItem value="PAYME">Payme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("transactions.status")}</label>
            <Select value={status} onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}>
              <SelectTrigger className="h-10 w-full bg-muted/20 border-border/50">
                <SelectValue placeholder={t("common.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="PAID">{t("common.paid")}</SelectItem>
                <SelectItem value="PENDING">{t("common.pending")}</SelectItem>
                <SelectItem value="REVERSED">{t("transactions.reversed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("transactions.from")}</label>
            <DateTimePicker 
              date={startDate} 
              setDate={(date) => {
                setStartDate(date);
                setPage(1);
              }} 
            />
          </div>

          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("transactions.to")}</label>
            <DateTimePicker 
              date={endDate} 
              setDate={(date) => {
                setEndDate(date);
                setPage(1);
              }} 
            />
          </div>

          <div className="pb-0.5 min-w-[100px]">
            {(status !== "all" || source !== "all" || paymentMethod !== "all" || search || startDate || endDate) && (
              <Button 
                variant="ghost" 
                onClick={clearFilters} 
                className="h-10 w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                {t("transactions.clear")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-background rounded-xl border border-border/50 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="grid gap-4 py-20 place-items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            <p className="text-muted-foreground animate-pulse font-medium">{t("common.loading")}</p>
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
