import { DataTable } from "@/components/DataTable";
import { useOwners } from "../hooks/useOwners";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSidebarStore } from "@/store/useSidebarStore";
import { OwnerForm } from "./OwnerForm";

export function OwnersList() {
  const { openSidebar, closeSidebar } = useSidebarStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const handleAdd = () => {
    openSidebar({
      title: "Yangi do'kon egasi",
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

  return (
    <div className="space-y-6 p-6 h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Do'kon egalari</h1>
          <p className="text-muted-foreground">
            Tizimdagi barcha do'kon egalari ro'yxati va ularni boshqarish.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish (ism, tel, STIR)..."
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
          Yangi qo'shish
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="grid gap-4 py-10 place-items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Yuklanmoqda...</p>
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
