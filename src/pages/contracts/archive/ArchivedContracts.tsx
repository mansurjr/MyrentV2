import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { useContracts } from "../hooks/useContracts";
import { columns } from "../components/columns";
import { Search, Archive as ArchiveIcon, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";

export function ArchivedContracts() {
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
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="grid gap-6 py-20 place-items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground font-medium">Yuklanmoqda...</p>
          </div>
        ) : (
          <DataTable
            columns={columns(() => {}).filter(col => col.id !== "actions" && col.id !== "paymentStatus")}
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


