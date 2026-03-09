import { useState, useMemo, useCallback, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { useContracts } from "../hooks/useContracts";
import { columns } from "./columns";
import { Search, Plus, FilterX, CreditCard, Landmark, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Button } from "@/components/ui/button";
import type { Contract } from "../../../types/api-responses";
import { ContractForm } from "./ContractForm";
import { useTranslation } from "react-i18next";
import { downloadExcelWithAuth } from "@/lib/excel-export";
import { format } from "date-fns";
import { useStatistics } from "@/pages/statistics/hooks/useStatistics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ContractsList() {
  const { t } = useTranslation();
  const { getReconciliationContracts } = useStatistics();
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [paymentType, setPaymentType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const { openSidebar, closeSidebar } = useSidebarStore();

  const contractsHook = useContracts();
  const { data, isLoading, refetch: refetchContracts } = contractsHook.useGetContracts({
    page,
    limit: pageSize,
    search: debouncedSearch,
    isActive: true,
    paid: paymentStatus === "all" ? undefined : paymentStatus === "paid",
    paymentType: paymentType === "all" ? undefined : paymentType as 'ONLINE' | 'BANK',
  });
  const reconciliationContractsQuery = getReconciliationContracts({
    page,
    limit: pageSize,
    search: debouncedSearch,
    isActive: true,
    paymentType: paymentType === "all" ? undefined : paymentType as "ONLINE" | "BANK",
  });

  const debtByContractId = useMemo(() => {
    const result: Record<number, number> = {};
    const summary = reconciliationContractsQuery.data?.summary;

    if (!Array.isArray(summary)) {
      return result;
    }

    for (const item of summary) {
      const rawContractId = item.contractId ?? item.id;
      const contractId = Number(rawContractId);
      if (!Number.isFinite(contractId)) continue;

      const debt = Number(item.unpaid ?? item.debtAmount ?? item.debt ?? 0) || 0;
      result[contractId] = debt;
    }

    return result;
  }, [reconciliationContractsQuery.data]);
  
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
  
  const handleEdit = useCallback((contract: Contract) => {
    openSidebar({
      title: t("contracts.edit"),
      content: (
        <ContractForm
          contract={contract}
          onSuccess={() => {
            closeSidebar();
          }}
        />
      ),
    });
  }, [openSidebar, t, closeSidebar]);

  const handleAdd = useCallback(() => {
    openSidebar({
      title: t("contracts.add_new"),
      content: (
        <ContractForm
          onSuccess={() => {
            closeSidebar();
          }}
        />
      ),
    });
  }, [openSidebar, t, closeSidebar]);

  const contractColumns = useMemo(
    () => columns(handleEdit, false, debtByContractId),
    [handleEdit, debtByContractId],
  );

  const handleExport = async () => {
    const filters = {
      search: debouncedSearch,
      isActive: true,
      paid: paymentStatus === "all" ? undefined : paymentStatus === "paid",
      paymentType: paymentType === "all" ? undefined : paymentType,
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const baseURL = `${window.location.origin}/api`;
    const url = `${baseURL}/contracts/export/excel?${queryParams.toString()}`;
    
    try {
      await downloadExcelWithAuth(url, `contracts_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentStatus("all");
    setPaymentType("all");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6 h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.contracts")}</h1>
          <p className="text-muted-foreground">
            {t("contracts.description")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("contracts.search_placeholder")}
            className="h-10 pl-9 bg-background border-border/50 focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select value={paymentStatus} onValueChange={(val) => { setPaymentStatus(val); setPage(1); }}>
          <SelectTrigger className="h-10 w-full sm:w-45 bg-background border-border/50 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={t("contracts.payment_status")} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("contracts.all_statuses")}</SelectItem>
            <SelectItem value="paid">{t("common.paid")}</SelectItem>
            <SelectItem value="debtors">{t("contracts.debtors")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentType} onValueChange={(val) => { setPaymentType(val); setPage(1); }}>
          <SelectTrigger className="h-10 w-full sm:w-45 bg-background border-border/50 shadow-sm">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={t("contracts.payment_type")} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("contracts.all_types")}</SelectItem>
            <SelectItem value="ONLINE">{t("contracts.online")}</SelectItem>
            <SelectItem value="BANK">{t("contracts.bank_only")}</SelectItem>
          </SelectContent>
        </Select>
        {(search || paymentStatus !== "all" || paymentType !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <FilterX className="mr-2 h-4 w-4" />
            {t("contracts.clear_filters")}
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={handleAdd} className="w-full sm:w-auto shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          {t("common.add_new")}
        </Button>
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

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="grid gap-6 py-20 place-items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground font-medium">{t("common.loading")}</p>
          </div>
        ) : (
            <DataTable
              columns={contractColumns}
              data={(Array.isArray(data) ? data : data?.data) || []}
              pageCount={data?.pagination?.totalPages || (data?.total ? Math.ceil(data.total / pageSize) : 1)}
              pageIndex={page}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              total={data?.pagination?.total || data?.total || (Array.isArray(data) ? data.length : 0)}
            />
        )}
      </div>
    </div>
  );
}
