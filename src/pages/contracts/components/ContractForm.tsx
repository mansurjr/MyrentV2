import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, Search, Store as StoreIcon, User as UserIcon, PlusCircle } from "lucide-react";
import { useContracts, type ICreateContractDto } from "../hooks/useContracts";
import { useOwners } from "../../owners/hooks/useOwners";
import { useStores } from "../../stores/hooks/useStores";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { useSidebarStore } from "@/store/useSidebarStore";
import type { Contract } from "../../../types/api-responses";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { format } from "date-fns";

interface ContractFormProps {
  contract?: Contract | null;
  onSuccess: () => void;
}

export function ContractForm({ contract, onSuccess }: ContractFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { closeSidebar } = useSidebarStore();
  const { createContract, updateContract } = useContracts();
  const { useGetOwners } = useOwners();
  const { useGetStores } = useStores();

  const [ownerSearch, setOwnerSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const debouncedOwnerSearch = useDebounce(ownerSearch, 400);
  const debouncedStoreSearch = useDebounce(storeSearch, 400);

  const { data: ownersData, isLoading: ownersLoading } = useGetOwners({ 
    search: debouncedOwnerSearch,
    limit: 1000 
  });
  
  const { data: storesData, isLoading: storesLoading } = useGetStores({ 
    search: debouncedStoreSearch,
    onlyFree: !contract ? true : undefined,
    limit: 1000 
  });

  const [formData, setFormData] = useState<ICreateContractDto>({
    certificateNumber: "",
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    paymentType: 'ONLINE',
    shopMonthlyFee: 0,
    ownerId: 0,
    storeId: 0,
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        certificateNumber: contract.certificateNumber || "",
        issueDate: contract.issueDate ? new Date(contract.issueDate).toISOString().split('T')[0] : "",
        expiryDate: contract.expiryDate ? new Date(contract.expiryDate).toISOString().split('T')[0] : "",
        paymentType: contract.paymentType,
        shopMonthlyFee: Number(contract.shopMonthlyFee) || 0,
        ownerId: contract.ownerId,
        storeId: contract.storeId,
      });
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (contract) {
        await updateContract.mutateAsync({ 
          id: contract.id, 
          dto: formData 
        });
      } else {
        await createContract.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving contract:", error);
    }
  };

  const isPending = createContract.isPending || updateContract.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2 custom-scrollbar">
        <div className="space-y-5">
          {}
          <div className="grid gap-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              {t("contracts.owner")}
            </Label>
            <Select
              value={formData.ownerId ? String(formData.ownerId) : undefined}
              onValueChange={(val) => setFormData({ ...formData, ownerId: Number(val) })}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Tadbirkorni tanlang" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="w-(--radix-select-trigger-width)">
                <div className="px-2 py-2 border-b border-border/50 sticky top-0 bg-popover z-20">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Ism bo'yicha qidirish..." 
                      className="h-8 pl-8 text-xs border-border/50 focus-visible:ring-primary/20"
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-[200px] min-h-[100px] overflow-y-auto custom-scrollbar">
                  {}
                  {contract && contract.owner && (
                    <SelectItem key={contract.owner.id} value={String(contract.owner.id)}>
                      {contract.owner.fullName}
                    </SelectItem>
                  )}

                  {ownersLoading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">Yuklanmoqda...</div>
                  ) : ownersData?.data?.length ? (
                    ownersData.data
                      .filter(o => o.id !== contract?.ownerId)
                      .map((owner) => (
                        <SelectItem key={owner.id} value={String(owner.id)}>
                          {owner.fullName}
                        </SelectItem>
                      ))
                  ) : !contract ? (
                    <div className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-xs text-primary hover:text-primary hover:bg-primary/5 h-9 px-2"
                        onClick={() => {
                          closeSidebar();
                          navigate("/owners");
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Yangi tadbirkor qo'shish
                      </Button>
                    </div>
                  ) : null}
                </div>
              </SelectContent>
            </Select>
          </div>

          {}
          <div className={cn("grid gap-2", !!contract && "cursor-not-allowed")}>
            <Label className={cn("text-sm font-semibold flex items-center gap-2", !!contract && "cursor-not-allowed")}>
              <StoreIcon className="h-4 w-6" />
              {t("contracts.store")}
            </Label>
            <Select
              value={formData.storeId ? String(formData.storeId) : undefined}
              onValueChange={(val) => setFormData({ ...formData, storeId: Number(val) })}
              disabled={!!contract}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Do'konni tanlang" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="w-(--radix-select-trigger-width)">
                <div className="px-2 py-2 border-b border-border/50 sticky top-0 bg-popover z-20">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Raqam bo'yicha qidirish..." 
                      className="h-8 pl-8 text-xs border-border/50 focus-visible:ring-primary/20"
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-[200px] min-h-[100px] overflow-y-auto custom-scrollbar">
                  {}
                  {contract && contract.store && (
                    <SelectItem key={contract.store.id} value={String(contract.store.id)}>
                      {contract.store.storeNumber}
                    </SelectItem>
                  )}

                  {storesLoading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">Yuklanmoqda...</div>
                  ) : (storesData?.data?.length) ? (
                    storesData.data
                      .filter((s: any) => s.id !== contract?.storeId)
                      .map((store: any) => (
                        <SelectItem key={store.id} value={String(store.id)}>
                          {store.storeNumber} ({store.area} m²)
                        </SelectItem>
                      ))
                  ) : !contract ? (
                    <div className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-xs text-primary hover:text-primary hover:bg-primary/5 h-9 px-2"
                        onClick={() => {
                          closeSidebar();
                          navigate("/stores");
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Yangi do'kon qo'shish
                      </Button>
                    </div>
                  ) : null}
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={cn("grid gap-2", !!contract && "cursor-not-allowed")}>
              <Label htmlFor="certificateNumber" className={cn("text-sm font-semibold", !!contract && "cursor-not-allowed")}>
                {t("contracts.certificate_number")}
              </Label>
              <Input
                id="certificateNumber"
                placeholder="Masalan: 001-2024"
                value={formData.certificateNumber}
                disabled={!!contract}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                className="h-10 border-border/50 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shopMonthlyFee" className="text-sm font-semibold">
                {t("contracts.monthly_fee")}
              </Label>
              <Input
                id="shopMonthlyFee"
                type="number"
                placeholder="0.00"
                value={formData.shopMonthlyFee || ""}
                onChange={(e) => setFormData({ ...formData, shopMonthlyFee: Number(e.target.value) })}
                className="h-10 border-border/50 focus:ring-primary/20 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="issueDate" className="text-sm font-semibold">
                {t("contracts.issue_date")}
              </Label>
              <DateTimePicker
                date={formData.issueDate ? new Date(formData.issueDate) : undefined}
                setDate={(d) => setFormData({ 
                  ...formData, 
                  issueDate: d ? format(d, 'yyyy-MM-dd') : '' 
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiryDate" className="text-sm font-semibold">
                {t("contracts.expiry_date")}
              </Label>
              <DateTimePicker
                date={formData.expiryDate ? new Date(formData.expiryDate) : undefined}
                setDate={(d) => setFormData({ 
                  ...formData, 
                  expiryDate: d ? format(d, 'yyyy-MM-dd') : '' 
                })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-semibold">
              {t("contracts.payment_type")}
            </Label>
            <Select
              value={formData.paymentType}
              onValueChange={(val: 'ONLINE' | 'BANK_ONLY') => setFormData({ ...formData, paymentType: val })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("contracts.payment_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE">{t("contracts.online")}</SelectItem>
                <SelectItem value="BANK_ONLY">{t("contracts.bank_only")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2 border-t border-border/50 mt-4 bg-background z-10">
        <Button
          type="submit"
          disabled={isPending || !formData.ownerId || !formData.storeId}
          className="w-full h-11 shadow-sm active:scale-[0.98] transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("contracts.save")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
