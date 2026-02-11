import { DataTable } from "@/components/DataTable";
import { useOwners } from "../hooks/useOwners";
import { getColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSidebarStore } from "@/store/useSidebarStore";
import { OwnerForm } from "./OwnerForm";
import { useTranslation } from "react-i18next";
import { downloadExcelWithAuth } from "@/lib/excel-export";
import { format } from "date-fns";

export function OwnersList() {
  const { t } = useTranslation();
  const { openSidebar, closeSidebar } = useSidebarStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);
  const columns = getColumns(false);

  const handleAdd = () => {
    openSidebar({
      title: t("owners.add_new"),
      content: (
        <OwnerForm 
          onSuccess={closeSidebar} 
          onCancel={closeSidebar} 
        />
      ),
    });
  };
  
  const ownersHook = useOwners();
  const { data, isLoading } = ownersHook.useGetOwners({ 
    page, 
    limit: pageSize,
    search: debouncedSearch,
    isActive: true
  });

  const handleExport = async () => {
    const filters = {
      search: debouncedSearch,
      isActive: true,
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3020/api";
    const url = `${baseURL}/owners/export/excel?${queryParams.toString()}`;
    
    try {
      await downloadExcelWithAuth(url, `owners_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 p-6 h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.owners")}</h1>
          <p className="text-muted-foreground">
            {t("owners.description")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("owners.search_placeholder")}
            className="h-10 pl-8 bg-background border-border/50 focus-visible:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex-1" />
        <Button onClick={handleAdd} className="w-full sm:w-auto shadow-md shadow-primary/10">
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
          <div className="grid gap-4 py-10 place-items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">{t("common.loading")}</p>
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
