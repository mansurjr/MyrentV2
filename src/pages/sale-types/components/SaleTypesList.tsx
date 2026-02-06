import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { useSaleTypes } from "../hooks/useSaleTypes";
import { columns } from "./columns";
import { SaleTypeForm } from "./SaleTypeForm";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import type { SaleType } from "../../../types/api-responses";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Button } from "@/components/ui/button";

export function SaleTypesList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  const saleTypesHook = useSaleTypes();
  const { data, isLoading } = saleTypesHook.useGetSaleTypes({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  const { openSidebar, closeSidebar } = useSidebarStore();
  
  const handleEdit = (saleType: SaleType) => {
    openSidebar({
      title: "Sotuv turini tahrirlash",
      content: (
        <SaleTypeForm 
          editData={saleType} 
          onSuccess={closeSidebar} 
          onCancel={closeSidebar} 
        />
      ),
    });
  };

  const handleAdd = () => {
    openSidebar({
      title: "Yangi sotuv turi qo'shish",
      content: (
        <SaleTypeForm 
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
          <h1 className="text-3xl font-bold tracking-tight">Sotuv turlari</h1>
          <p className="text-muted-foreground">
            Tizimdagi sotuv turlari va ularning soliq stavkalarini boshqarish.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish (ism, tavsif)..."
            className="h-10 pl-8 bg-background border-border/50 focus-visible:ring-primary/20 transition-all font-medium"
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
            columns={columns(handleEdit)}
            data={data?.data || []}
            pageCount={data?.pagination?.totalPages || 1}
            pageIndex={page}
            onPageChange={setPage}
            total={data?.pagination?.total || 0}
          />
        )}
      </div>
    </div>
  );
}
