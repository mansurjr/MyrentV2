import { useState, useMemo } from "react";
import { DataTable } from "@/components/DataTable";
import { useSections } from "../hooks/useSections";
import { columns } from "./columns";
import { SectionForm } from "./SectionForm";
import { Search, Plus, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Button } from "@/components/ui/button";
import type { Section } from "../../../types/api-responses";
import { useTranslation } from "react-i18next";
import { downloadExcelWithAuth } from "@/lib/excel-export";
import { format } from "date-fns";

export function SectionsList() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const sectionsHook = useSections();
  const { data: rawData, isLoading } = sectionsHook.useGetSections();

  const handleExport = async () => {
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3020/api";
    const url = `${baseURL}/sections/export/excel`;
    
    try {
      await downloadExcelWithAuth(url, `sections_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };
  const sections = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    
    if (Array.isArray((rawData as any).data)) return (rawData as any).data as Section[];
    return [];
  }, [rawData]);

  const { openSidebar, closeSidebar } = useSidebarStore();

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return sections;
    const lowerSearch = debouncedSearch.toLowerCase();
    return sections.filter((section) => 
      section.name.toLowerCase().includes(lowerSearch) ||
      (section.description && section.description.toLowerCase().includes(lowerSearch))
    );
  }, [sections, debouncedSearch]);


  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  const handleEdit = (section: Section) => {
    console.log("Editing section:", section);
    openSidebar({
      title: "Bo'limni tahrirlash",
      content: (
        <SectionForm
          editData={section}
          onSuccess={closeSidebar}
          onCancel={closeSidebar}
        />
      ),
    });
  };

  const handleAdd = () => {
    openSidebar({
      title: "Yangi bo'lim qo'shish",
      content: (
        <SectionForm
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
          <h1 className="text-3xl font-bold tracking-tight">Bo'limlar</h1>
          <p className="text-muted-foreground">
            Bozor bo'limlari va ularning mas'ul xodimlarini boshqarish.
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
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        ) : (
          <DataTable
            columns={columns(handleEdit)}
            data={paginatedData}
            pageCount={totalPages}
            pageIndex={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            total={filteredData.length}
          />
        )}
      </div>
    </div>
  );
}
