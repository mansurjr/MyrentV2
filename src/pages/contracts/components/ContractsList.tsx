import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { useContracts } from "../hooks/useContracts";
import { columns } from "./columns";
import { Search, Plus, FilterX, CreditCard, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Button } from "@/components/ui/button";
import type { Contract } from "../../../types/api-responses";
import { ContractForm } from "./ContractForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ContractsList() {
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [paymentType, setPaymentType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const { openSidebar, closeSidebar } = useSidebarStore();

  const contractsHook = useContracts();
  const { data, isLoading } = contractsHook.useGetContracts({
    page,
    limit: pageSize,
    search: debouncedSearch,
    isActive: true,
    paid: paymentStatus === "all" ? undefined : paymentStatus === "paid",
    paymentType: paymentType === "all" ? undefined : paymentType as 'ONLINE' | 'BANK_ONLY',
  });

  const handleEdit = (contract: Contract) => {
    openSidebar({
      title: "Shartnomani tahrirlash",
      content: (
        <ContractForm
          contract={contract}
          onSuccess={() => {
            closeSidebar();
          }}
        />
      ),
    });
  };

  const handleAdd = () => {
    openSidebar({
      title: "Yangi shartnoma qo'shish",
      content: (
        <ContractForm
          onSuccess={() => {
            closeSidebar();
          }}
        />
      ),
    });
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
          <h1 className="text-3xl font-bold tracking-tight">Shartnomalar</h1>
          <p className="text-muted-foreground">
            Barcha tadbirkorlar va ularning do'konlari bilan tuzilgan shartnomalarni boshqarish.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

        <Select value={paymentStatus} onValueChange={(val) => { setPaymentStatus(val); setPage(1); }}>
          <SelectTrigger className="h-10 w-full sm:w-45 bg-background border-border/50 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="To'lov holati" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="paid">To'langan</SelectItem>
            <SelectItem value="debtors">Qarzdorlar</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentType} onValueChange={(val) => { setPaymentType(val); setPage(1); }}>
          <SelectTrigger className="h-10 w-full sm:w-45 bg-background border-border/50 shadow-sm">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="To'lov turi" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            <SelectItem value="ONLINE">Onlayn</SelectItem>
            <SelectItem value="BANK_ONLY">Bank orqali</SelectItem>
          </SelectContent>
        </Select>
        {(search || paymentStatus !== "all" || paymentType !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <FilterX className="mr-2 h-4 w-4" />
            Saralashni tozalash
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={handleAdd} className="w-full sm:w-auto shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Yangi qo'shish
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="grid gap-6 py-20 place-items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground font-medium">Yuklanmoqda...</p>
          </div>
        ) : (
          <DataTable
            columns={columns(handleEdit)}
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
