import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { useContracts } from "../hooks/useContracts";
import { columns } from "../components/columns";
import { Search, Archive as ArchiveIcon, FilterX, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { downloadExcelWithAuth } from "@/lib/excel-export";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export function ArchivedContracts() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const contractsHook = useContracts();
  const { data, isLoading } = contractsHook.useGetContracts({
    page,
    limit: pageSize,
    search: debouncedSearch,
    isActive: false,
  });

  const handleExport = async () => {
    const filters = {
      search: debouncedSearch,
      isActive: false,
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3020/api";
    const url = `${baseURL}/contracts/export/excel?${queryParams.toString()}`;
    
    try {
      await downloadExcelWithAuth(url, `archived_contracts_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6 h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <ArchiveIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arxiv: Shartnomalar</h1>
            <p className="text-muted-foreground">
              Arxivdagi (yakunlangan yoki nofaol) shartnomalar ro'yxati.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish (№, Tadbirkor, Do'kon)..."
            className="h-10 pl-9 bg-background border-border/50 focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        {search && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-10 px-3">
            <FilterX className="mr-2 h-4 w-4" />
            Tozalash
          </Button>
        )}
        <div className="flex-1" />
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
            columns={columns(() => {}, true).filter(col => col.id !== "paymentStatus")}
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
