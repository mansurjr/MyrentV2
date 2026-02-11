import { useState, useMemo } from "react";
import { DataTable } from "@/components/DataTable";
import { useStores } from "../hooks/useStores";
import { columns } from "./columns";
import { StoreForm } from "./StoreForm";
import { Search, Plus, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Button } from "@/components/ui/button";
import type { Store } from "../../../types/api-responses";
import { useTranslation } from "react-i18next";
import { downloadExcelWithAuth } from "@/lib/excel-export";
import { format } from "date-fns";

export function StoresList() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const storesHook = useStores();
  const { data, isLoading } = storesHook.useGetStores({
    page,
    limit: pageSize,
    search: debouncedSearch,
    withContracts: true,
  });

  const handleExport = async () => {
    const filters = {
      search: debouncedSearch,
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3020/api";
    const url = `${baseURL}/stores/export/excel?${queryParams.toString()}`;
    
    try {
      await downloadExcelWithAuth(url, `stores_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  const { openSidebar, closeSidebar } = useSidebarStore();

  const storesData = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).data)) return (data as any).data;
    return [];
  }, [data]);

  const handleEdit = (store: Store) => {
    openSidebar({
      title: t("stores.edit"),
      content: (
        <StoreForm
          editData={store}
          onSuccess={closeSidebar}
          onCancel={closeSidebar}
        />
      ),
    });
  };

  const handleAdd = () => {
    openSidebar({
      title: t("stores.add_new"),
      content: (
        <StoreForm
          onSuccess={closeSidebar}
          onCancel={closeSidebar}
        />
      ),
    });
  };

  return (
    <div className="space-y-6 p-6 h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.stores")}</h1>
          <p className="text-muted-foreground">
            {t("stores.description")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("stores.search_placeholder")}
            className="h-10 pl-8 bg-background border-border/50 focus-visible:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
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
          <div className="grid gap-4 py-10 place-items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : (
          <DataTable
            columns={columns(handleEdit)}
            data={storesData}
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
