import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Receipt } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IDailyPaymentsDay, IDailyPaymentsMetric, IDailyPaymentsSummary } from "../hooks/useStatistics";

interface DailyPaymentsSectionProps {
  dailyPayments?: IDailyPaymentsSummary;
  month: number;
  year: number;
  locale: string;
  monthLabel: string;
}

type NormalizedDay = {
  date: string;
  day: number;
  count: number;
  revenue: number;
  stall: {
    count: number;
    revenue: number;
  };
  store: {
    count: number;
    revenue: number;
  };
};

const padNumber = (value: number) => String(value).padStart(2, "0");

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const parseIsoDate = (value?: string) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = padNumber(value.getMonth() + 1);
  const day = padNumber(value.getDate());
  return `${year}-${month}-${day}`;
};

const buildMonthRange = (month: number, year: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    from: toIsoDate(start),
    to: toIsoDate(end),
  };
};

const enumerateIsoDates = (from: string, to: string) => {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);

  if (!start || !end || start > end) return [];

  const result: Array<{ date: string; day: number }> = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    result.push({
      date: toIsoDate(cursor),
      day: cursor.getDate(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

const normalizeMetric = (metric?: IDailyPaymentsMetric) => ({
  count: toNumber(metric?.count),
  revenue: toNumber(metric?.revenue),
});

const normalizeDay = (day?: IDailyPaymentsDay, fallbackDate?: string, fallbackDay?: number): NormalizedDay => ({
  date: day?.date || fallbackDate || "",
  day: toNumber(day?.day, fallbackDay || 0),
  count: toNumber(day?.count),
  revenue: toNumber(day?.revenue),
  stall: normalizeMetric(day?.stall),
  store: normalizeMetric(day?.store),
});

const normalizeDailyPayments = (
  summary: IDailyPaymentsSummary | undefined,
  month: number,
  year: number,
) => {
  const defaultRange = buildMonthRange(month, year);
  const from = parseIsoDate(summary?.from) ? summary?.from || defaultRange.from : defaultRange.from;
  const to = parseIsoDate(summary?.to) ? summary?.to || defaultRange.to : defaultRange.to;
  const dayMap = new Map((summary?.days || []).map((day) => [day.date || "", day]));

  return {
    from,
    to,
    totals: {
      count: toNumber(summary?.totals?.count),
      revenue: toNumber(summary?.totals?.revenue),
      stall: normalizeMetric(summary?.totals?.stall),
      store: normalizeMetric(summary?.totals?.store),
    },
    days: enumerateIsoDates(from, to).map(({ date, day }) => normalizeDay(dayMap.get(date), date, day)),
  };
};

const getCalendarWeekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

const buildCalendarCells = (days: NormalizedDay[]) => {
  if (!days.length) return [];

  const cells: Array<NormalizedDay | null> = [];
  const firstDate = parseIsoDate(days[0].date);
  const leadingEmptyDays = firstDate ? getCalendarWeekdayIndex(firstDate) : 0;

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push(null);
  }

  cells.push(...days);

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

export function DailyPaymentsSection({
  dailyPayments,
  month,
  year,
  locale,
  monthLabel,
}: DailyPaymentsSectionProps) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<NormalizedDay | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("uz-Latn-UZ", {
        style: "currency",
        currency: "UZS",
        maximumFractionDigits: 0,
      }),
    [],
  );
  const compactCurrencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("uz-Latn-UZ", {
        style: "currency",
        currency: "UZS",
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [],
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat("uz-Latn-UZ"), []);
  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }),
    [locale],
  );
  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale],
  );
  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
      }),
    [locale],
  );

  const normalizedDailyPayments = useMemo(
    () => normalizeDailyPayments(dailyPayments, month, year),
    [dailyPayments, month, year],
  );
  const calendarCells = useMemo(
    () => buildCalendarCells(normalizedDailyPayments.days),
    [normalizedDailyPayments.days],
  );
  const weekdayLabels = useMemo(() => {
    const monday = new Date(2026, 0, 5);
    return Array.from({ length: 7 }, (_, index) =>
      weekdayFormatter.format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)),
    );
  }, [weekdayFormatter]);

  const chartData = useMemo(
    () =>
      normalizedDailyPayments.days.map((day) => ({
        ...day,
        label: String(day.day),
        fullDateLabel: parseIsoDate(day.date) ? shortDateFormatter.format(parseIsoDate(day.date) as Date) : day.date,
        storeRevenue: day.store.revenue,
        stallRevenue: day.stall.revenue,
      })),
    [normalizedDailyPayments.days, shortDateFormatter],
  );

  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const formatCompactCurrency = (value: number) => compactCurrencyFormatter.format(value);
  const formatDate = (value: string) => {
    const parsed = parseIsoDate(value);
    return parsed ? shortDateFormatter.format(parsed) : value;
  };
  const formatFullDate = (value: string) => {
    const parsed = parseIsoDate(value);
    return parsed ? fullDateFormatter.format(parsed) : value;
  };

  return (
    <>
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">{t("statistics.daily_payments")}</CardTitle>
              <CardDescription className="text-xs font-medium">
                {t("statistics.daily_payments_desc")} - {monthLabel}
              </CardDescription>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              {formatDate(normalizedDailyPayments.from)} - {formatDate(normalizedDailyPayments.to)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border/60 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" />
                <span>{t("statistics.payment_count")}</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-foreground">
                {numberFormatter.format(normalizedDailyPayments.totals.count)}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-slate-50/80 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("statistics.total_revenue")}
              </div>
              <div className="mt-3 text-2xl font-bold text-foreground">
                {formatCurrency(normalizedDailyPayments.totals.revenue)}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-slate-50/80 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("statistics.store_revenue")}
              </div>
              <div className="mt-3 text-2xl font-bold text-foreground">
                {formatCurrency(normalizedDailyPayments.totals.store.revenue)}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {numberFormatter.format(normalizedDailyPayments.totals.store.count)} {t("statistics.count")}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-slate-50/80 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("statistics.stall_revenue")}
              </div>
              <div className="mt-3 text-2xl font-bold text-foreground">
                {formatCurrency(normalizedDailyPayments.totals.stall.revenue)}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {numberFormatter.format(normalizedDailyPayments.totals.stall.count)} {t("statistics.count")}
              </div>
            </div>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  dy={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  tickFormatter={(value) => formatCompactCurrency(toNumber(value))}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDateLabel || ""}
                  formatter={(value: number | string | undefined, name?: string) => [
                    formatCurrency(toNumber(value)),
                    name || "",
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                    padding: "12px 16px",
                  }}
                  itemStyle={{ fontWeight: 700, fontSize: "12px", padding: "2px 0" }}
                  labelStyle={{
                    fontWeight: 800,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                    color: "#94a3b8",
                  }}
                />
                <Bar dataKey="storeRevenue" stackId="revenue" name={t("nav.stores")} fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="stallRevenue" stackId="revenue" name={t("nav.stalls")} fill="#f97316" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[860px] border border-border/60 bg-white">
              <div className="grid grid-cols-7 border-b border-border/60">
                {weekdayLabels.map((label) => (
                  <div
                    key={label}
                    className="border-r border-border/60 bg-slate-50 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 last:border-r-0"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarCells.map((day, index) =>
                  day ? (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className="min-h-[118px] border-r border-b border-border/60 px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none last:border-r-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-lg font-semibold text-slate-900">{day.day}</span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {numberFormatter.format(day.count)}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-semibold text-slate-900">
                          {formatCurrency(day.revenue)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-700">
                          <span>{t("nav.stores")}</span>
                          <span>{formatCurrency(day.store.revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-orange-700">
                          <span>{t("nav.stalls")}</span>
                          <span>{formatCurrency(day.stall.revenue)}</span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[118px] border-r border-b border-border/60 bg-slate-50/40 last:border-r-0"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedDay)} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-lg rounded-lg">
          {selectedDay ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  {formatFullDate(selectedDay.date)}
                </DialogTitle>
                <DialogDescription>
                  {t("statistics.daily_payments_desc")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border/60 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("statistics.payment_count")}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">
                    {numberFormatter.format(selectedDay.count)}
                  </div>
                </div>

                <div className="rounded-md border border-border/60 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("statistics.total_revenue")}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-foreground">
                    {formatCurrency(selectedDay.revenue)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                    {t("nav.stores")}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-emerald-950">
                    {formatCurrency(selectedDay.store.revenue)}
                  </div>
                  <div className="mt-1 text-sm text-emerald-800">
                    {numberFormatter.format(selectedDay.store.count)} {t("statistics.count")}
                  </div>
                </div>

                <div className="rounded-md border border-orange-100 bg-orange-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-orange-700">
                    {t("nav.stalls")}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-orange-950">
                    {formatCurrency(selectedDay.stall.revenue)}
                  </div>
                  <div className="mt-1 text-sm text-orange-800">
                    {numberFormatter.format(selectedDay.stall.count)} {t("statistics.count")}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
