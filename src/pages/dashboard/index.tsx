import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Store,
  LayoutGrid,
  Users,
  FileText,
  Archive,
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  ArrowRightLeft
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useTransactions } from "../transactions/hooks/useTransactions";

const StatCard = ({ title, value, description, icon: Icon, color }: any) => (
  <Card className="relative overflow-hidden border-border/50 bg-card border-none shadow-sm group hover:shadow-md transition-all duration-300">
    <div className={cn("absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]", color)} />
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
      <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        {title}
      </CardTitle>
      <div
        className={cn(
          "p-2 rounded-xl bg-white shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-300",
          color.replace("bg-", "text-"),
        )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-3xl font-bold tracking-tighter text-foreground">
          {value}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-2 font-medium leading-tight">
        {description}
      </p>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { useGetTransactions } = useTransactions();
  const transactionsQuery = useGetTransactions({ page: 1, limit: 8 });

  const currentMonth = useMemo(
    () => format(new Date(), "MMMM", { locale: uz }),
    [],
  );

  const stats = [
    {
      title: t("dashboard.total_stores"),
      value: "306",
      description: t("dashboard.stores_count_desc"),
      icon: Store,
      color: "bg-blue-600",
    },
    {
      title: t("dashboard.total_stalls"),
      value: "47",
      description: t("dashboard.stalls_count_desc"),
      icon: LayoutGrid,
      color: "bg-orange-500",
    },
    {
      title: t("dashboard.total_owners"),
      value: "247",
      description: t("dashboard.owners_count_desc"),
      icon: Users,
      color: "bg-indigo-600",
    },
    {
      title: t("dashboard.active_contracts"),
      value: "279",
      description: t("dashboard.active_contracts_desc", { month: currentMonth }),
      icon: FileText,
      color: "bg-emerald-600",
    },
    {
      title: t("dashboard.archived"),
      value: "21",
      description: t("dashboard.archived_desc", { month: currentMonth }),
      icon: Archive,
      color: "bg-rose-500",
    },
  ];

  return (
    <main className="p-6 space-y-8 w-full mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("dashboard.welcome")}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {t("dashboard.description")}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-border/50 self-start md:self-auto group hover:border-primary/30 transition-colors">
          <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/5 transition-colors">
            <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="pr-3">
            <p className="text-[9px] uppercase font-bold text-muted-foreground/60 leading-none mb-0.5">
              {t("common.today")}
            </p>
            <p className="text-xs font-bold text-foreground">
              {format(new Date(), "d MMMM, yyyy", { locale: uz })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          <h2 className="text-lg font-bold tracking-tight">
            {t("dashboard.general_indicators")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-lg font-bold">
                  {t("dashboard.recent_transactions")}
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  {t("dashboard.recent_transactions_desc")}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/transactions")}
                className="font-bold text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/5 rounded-lg active:scale-95 transition-all">
                {t("common.view_all")}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {transactionsQuery.isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
              </div>
            ) : !transactionsQuery.data?.data?.length ? (
              <div className="h-[200px] flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-muted/40 rounded-full">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-medium italic">
                    {t("dashboard.no_transactions")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {transactionsQuery.data.data.map((tx: any) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-border/40 hover:border-primary/30 hover:shadow-md transition-all group cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg bg-muted/40 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300",
                        tx.status === 'PAID' && "text-emerald-500 bg-emerald-50 group-hover:bg-emerald-100",
                      )}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate max-w-[150px] sm:max-w-[300px]">
                          {tx.attendanceId 
                            ? t("dashboard.today_stall", { number: tx.attendance?.Stall?.stallNumber || tx.attendanceId })
                            : t("dashboard.contract_store", { number: tx.contract?.store?.storeNumber || tx.contractId })}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium">{format(new Date(tx.createdAt), "d MMM, HH:mm", { locale: uz })}</span>
                          <span className="opacity-30">•</span>
                          <span className="bg-muted px-1 rounded uppercase tracking-tighter text-[9px]">{tx.paymentMethod}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {new Intl.NumberFormat("uz-UZ").format(Number(tx.amount))}
                        <span className="text-[10px] ml-1 opacity-60">UZS</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default memo(DashboardPage);
