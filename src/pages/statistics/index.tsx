import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  Store, 
  LayoutGrid, 
  Loader2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useStatistics } from "./hooks/useStatistics";

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const firstNumber = (source: Record<string, unknown>, keys: string[], fallback = 0) => {
  for (const key of keys) {
    if (key in source) {
      const value = toNumber(source[key], NaN);
      if (Number.isFinite(value)) return value;
    }
  }
  return fallback;
};

const firstCount = (source: Record<string, unknown>, keys: string[], fallback = 0) => {
  for (const key of keys) {
    if (key in source) {
      const value = toNumber(source[key], NaN);
      if (Number.isFinite(value)) return value;
    }
  }
  return fallback;
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
  className?: string;
}

const StatCard = ({ title, value, description, icon: Icon, color, className }: StatCardProps) => (
  <Card className={cn("relative overflow-hidden border-border/50 bg-card border-none shadow-sm group hover:shadow-md transition-all duration-300", className)}>
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

const StatisticsPage = () => {
  const { t } = useTranslation();
  const { getMonthlySeries, getRevenueByEntity, getDashboardStats } = useStatistics();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthlySeriesQuery = getMonthlySeries({ months: 12 });
  const byEntityQuery = getRevenueByEntity({ month: currentMonth, year: currentYear });
  const dashboardStatsQuery = getDashboardStats();

  const [paymentPeriod, setPaymentPeriod] = React.useState<"week" | "month" | "year">("month");

  const dashboardData = dashboardStatsQuery.data || {};
  
  const expectedPayments = dashboardData.expectedPayments || {
    week: { paid: 0, estimated: 0 },
    month: { paid: 0, estimated: 0 },
    year: { paid: 0, estimated: 0 }
  };

  const occupancy = dashboardData.occupancy || {
    stalls: { total: 0, rented: 0, percentage: 0, empty: 0 },
    stores: { total: 0, rented: 0, percentage: 0, empty: 0 }
  };

  const topDebtors = Array.isArray(dashboardData.topDebtors) ? dashboardData.topDebtors : [];

  const currentPaymentData = expectedPayments[paymentPeriod];
  const remaining = currentPaymentData.estimated - currentPaymentData.paid;


  const donutData = useMemo(() => [
    { 
      name: t("statistics.paid"), 
      value: currentPaymentData.paid, 
      color: "#10b981" 
    },
    { 
      name: t("statistics.remaining"), 
      value: remaining > 0 ? remaining : 0, 
      color: "#f43f5e" 
    }
  ], [paymentPeriod, t, currentPaymentData.paid, remaining]);


  const chartData = useMemo(() => {
    if (!monthlySeriesQuery.data) return [];
    
    const { labels, series } = monthlySeriesQuery.data;
    return labels.map((label: string, index: number) => {
      const dataPoint: Record<string, string | number> = { name: label };
      (series as { key: string; data: number[] }[]).forEach((s) => {
        dataPoint[s.key] = s.data[index] || 0;
      });
      return dataPoint;
    });
  }, [monthlySeriesQuery.data]);

  const stats = useMemo(() => {
    if (!byEntityQuery.data) return [];

    const payload = byEntityQuery.data as Record<string, unknown>;
    const stores = Array.isArray(payload.stores) ? payload.stores as { name: string; value: number }[] : [];
    const stalls = Array.isArray(payload.stalls) ? payload.stalls as { name: string; value: number }[] : [];

    // Backend returns stalls/stores as [{name, value}] arrays — sum their values for totals
    const storeTotal = firstNumber(payload, ["storeTotal", "storesTotal", "storeRevenue", "storesRevenue"],
      stores.reduce((sum, s) => sum + toNumber(s.value), 0),
    );
    const stallTotal = firstNumber(payload, ["stallTotal", "stallsTotal", "stallRevenue", "stallsRevenue"],
      stalls.reduce((sum, s) => sum + toNumber(s.value), 0),
    );
    const total = firstNumber(payload, ["total", "totalRevenue", "totalAmount", "overallTotal"],
      storeTotal + stallTotal,
    );

    const storeCount = firstCount(payload, ["storeCount", "storesCount"], stores.length);
    const stallCount = firstCount(payload, ["stallCount", "stallsCount"], stalls.length);

    return [
        {
            title: t("statistics.total_revenue"),
            value: formatCurrency(total),
            description: t("statistics.current_month"),
            icon: TrendingUp,
            color: "bg-blue-600",
        },
        {
            title: t("statistics.store_revenue"),
            value: formatCurrency(storeTotal),
            description: `${storeCount} ${t("nav.stores")}`,
            icon: Store,
            color: "bg-emerald-500",
        },
        {
            title: t("statistics.stall_revenue"),
            value: formatCurrency(stallTotal),
            description: `${stallCount} ${t("nav.stalls")}`,
            icon: LayoutGrid,
            color: "bg-orange-500",
        }
    ];
  }, [byEntityQuery.data, t]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
  }

  if (monthlySeriesQuery.isLoading || byEntityQuery.isLoading || dashboardStatsQuery.isLoading) {

    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
      </div>
    );
  }

  return (
    <main className="p-6 space-y-8 w-full mx-auto animate-in fade-in duration-500 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t("statistics.title")}
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                    {t("statistics.description")}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>

        {/* OCCUPANCY SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold">{t("statistics.stalls_occupancy")}</CardTitle>
                    <CardDescription className="text-xs font-medium">{occupancy.stalls.rented} / {occupancy.stalls.total} {t("statistics.rented")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${occupancy.stalls.percentage}%` }} 
                        />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <span>{occupancy.stalls.percentage}% {t("statistics.filled")}</span>
                        <span>{occupancy.stalls.empty} {t("statistics.empty")}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold">{t("statistics.stores_occupancy")}</CardTitle>
                    <CardDescription className="text-xs font-medium">{occupancy.stores.rented} / {occupancy.stores.total} {t("statistics.rented")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${occupancy.stores.percentage}%` }} 
                        />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <span>{occupancy.stores.percentage}% {t("statistics.filled")}</span>
                        <span>{occupancy.stores.empty} {t("statistics.empty")}</span>
                    </div>
                </CardContent>
            </Card>


        </div>


        <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold">{t("statistics.revenue_trend")}</CardTitle>
                        <CardDescription className="text-xs font-medium">{t("statistics.last_year")}</CardDescription>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t("nav.stores")}</span>
                        </div>
                        <div className="flex items-center gap-2">

                            <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.2)]" />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t("nav.stalls")}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 pt-6">
                <div className="h-[450px] w-full pr-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorStore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorStall" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="4 4" 
                                vertical={false} 
                                stroke="#f0f0f0" 
                            />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={15}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                            />
                            <Tooltip 
                                cursor={{ stroke: '#f0f0f0', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                    padding: '12px 16px'
                                }}
                                itemStyle={{ fontWeight: 700, fontSize: '12px', padding: '2px 0' }}
                                labelStyle={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: '#94a3b8' }}
                                formatter={(value: number | string | undefined) => [formatCurrency(toNumber(value)), ""]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="store" 
                                stroke="#10b981" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorStore)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="stall" 
                                stroke="#f97316" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorStall)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
            {/* DONUT CHART (EXPECTED PAYMENTS) */}
            <Card className="border-none shadow-sm bg-white overflow-hidden h-full flex flex-col gap-0 py-0">
                <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between px-6 py-4">
                    <div>
                        <CardTitle className="text-lg font-bold">{t("statistics.expected_payments")}</CardTitle>
                        <CardDescription className="text-xs font-medium">{t("statistics.expected_vs_paid")}</CardDescription>
                    </div>

                    <Select value={paymentPeriod} onValueChange={(v: "week" | "month" | "year") => setPaymentPeriod(v)}>
                        <SelectTrigger className="w-[120px] bg-white ring-0 focus:ring-0">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">{t("statistics.week")}</SelectItem>
                            <SelectItem value="month">{t("statistics.month")}</SelectItem>
                            <SelectItem value="year">{t("statistics.year")}</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="pt-8">
                    <div className="flex flex-col items-center">
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | string | undefined) => formatCurrency(toNumber(value))}
                                        contentStyle={{ 
                                            borderRadius: '8px', 
                                            border: 'none', 
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center text for Donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("statistics.total")}</span>
                                <span className="text-sm font-bold mt-1 text-foreground">
                                    {formatCurrency(currentPaymentData.estimated)}
                                </span>
                            </div>

                        </div>

                        {/* Donut Legend */}
                        <div className="flex items-center justify-center gap-6 mt-4 w-full border-t border-border/50 pt-4">
                            {donutData.map((entry, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">
                                        {formatCurrency(entry.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TOP DEBTORS LIST */}
            <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col gap-0 py-0">
                <CardHeader className="border-b border-border/50 px-6 py-4 space-y-0.5 pb-4">
                    <CardTitle className="text-lg font-bold leading-none">{t("statistics.top_debtors")}</CardTitle>
                    <CardDescription className="text-xs font-medium">{t("statistics.priority_followup")}</CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-border/50">
                                <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <th className="px-6 py-3">{t("statistics.entity")}</th>
                                    <th className="px-6 py-3">{t("statistics.owner")}</th>
                                    <th className="px-6 py-2 text-right pr-6">{t("statistics.debt")}</th>
                                </tr>

                            </thead>
                            <tbody className="divide-y divide-border/50">                                {topDebtors.map((debtor: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{debtor.number}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {debtor.entityType === "stall" ? t("nav.stalls") : t("nav.stores")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-muted-foreground">{debtor.owner || "—"}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <span className="text-sm font-bold text-rose-500">{formatCurrency(debtor.debtAmount)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>

    </main>
  );
};

export default memo(StatisticsPage);
