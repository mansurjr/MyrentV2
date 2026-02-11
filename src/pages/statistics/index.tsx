import { memo, useMemo } from "react";
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
} from "recharts";
import { useStatistics } from "./hooks/useStatistics";

const StatCard = ({ title, value, description, icon: Icon, color, className }: any) => (
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
  const { getMonthlySeries, getRevenueByEntity } = useStatistics();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthlySeriesQuery = getMonthlySeries({ months: 12 });
  const byEntityQuery = getRevenueByEntity({ month: currentMonth, year: currentYear });

  const chartData = useMemo(() => {
    if (!monthlySeriesQuery.data) return [];
    
    const { labels, series } = monthlySeriesQuery.data;
    return labels.map((label: string, index: number) => {
      const dataPoint: any = { name: label };
      series.forEach((s: any) => {
        dataPoint[s.key] = s.data[index] || 0;
      });
      return dataPoint;
    });
  }, [monthlySeriesQuery.data]);

  const stats = useMemo(() => {
    if (!byEntityQuery.data) return [];
    
    const storeTotal = byEntityQuery.data.stores.reduce((sum: number, item: any) => sum + item.value, 0);
    const stallTotal = byEntityQuery.data.stalls.reduce((sum: number, item: any) => sum + item.value, 0);
    const total = storeTotal + stallTotal;

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
            description: `${byEntityQuery.data.stores.length} ${t("nav.stores")}`,
            icon: Store,
            color: "bg-emerald-500",
        },
        {
            title: t("statistics.stall_revenue"),
            value: formatCurrency(stallTotal),
            description: `${byEntityQuery.data.stalls.length} ${t("nav.stalls")}`,
            icon: LayoutGrid,
            color: "bg-orange-500",
        }
    ];
  }, [byEntityQuery.data, t]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("uz-UZ").format(value);
  }

  if (monthlySeriesQuery.isLoading || byEntityQuery.isLoading) {
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
                                formatter={(value: any) => [formatCurrency(value) + " UZS", ""]}
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
    </main>
  );
};

export default memo(StatisticsPage);
