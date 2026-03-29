import type { ContractPaymentPeriod } from "@/types/api-responses";
import type { PublicPaymentMethod } from "@/types/payment";

const PUBLIC_PAYMENT_METHODS = new Set<PublicPaymentMethod>(["click", "payme"]);
const PAYMENT_METHOD_LABELS: Record<PublicPaymentMethod, string> = {
  click: "Click",
  payme: "Payme",
};

const configuredPaymentMethods = (() => {
  const rawValue =
    import.meta.env.VITE_PAYMENT_METHODS ??
    import.meta.env.VITE_PUBLIC_PAYMENT_METHODS ??
    "";

  const parsed = rawValue
    .split(",")
    .map((method: string) => method.trim().toLowerCase() as PublicPaymentMethod)
    .filter((method: PublicPaymentMethod, index: number, list: PublicPaymentMethod[]) =>
      PUBLIC_PAYMENT_METHODS.has(method) && list.indexOf(method) === index,
    );

  return parsed.length > 0 ? parsed : ["click"];
})();

export const CLICK_PAYMENT_METHOD = "click" as const;
const compareContractPeriods = (
  left: Pick<ContractPaymentPeriod, "year" | "month">,
  right: Pick<ContractPaymentPeriod, "year" | "month">,
) => {
  if (left.year !== right.year) {
    return left.year - right.year;
  }

  return left.month - right.month;
};

export const normalizePublicPaymentMethods = (methods?: readonly string[]) => {
  const normalized =
    methods?.reduce<PublicPaymentMethod[]>((acc, method) => {
      const nextMethod = method.toLowerCase() as PublicPaymentMethod;
      if (!PUBLIC_PAYMENT_METHODS.has(nextMethod) || acc.includes(nextMethod)) {
        return acc;
      }

      acc.push(nextMethod);
      return acc;
    }, []) ?? [];

  return normalized.length > 0 ? normalized : [CLICK_PAYMENT_METHOD];
};

export const resolveAvailablePaymentMethods = (methods?: readonly string[] | null) => {
  const normalizedMethods = normalizePublicPaymentMethods(methods ?? undefined);
  if (methods && methods.length > 0) {
    return normalizedMethods;
  }

  return configuredPaymentMethods;
};

export const getPaymentMethodLabel = (method: PublicPaymentMethod) =>
  PAYMENT_METHOD_LABELS[method];

export const getPendingContractPeriods = (periods: readonly ContractPaymentPeriod[]) =>
  periods
    .filter((period) => period.status === "PENDING")
    .sort(compareContractPeriods);

export const getPendingContractPeriodPrefix = (
  periods: readonly ContractPaymentPeriod[],
  count: number,
) => {
  const pendingPeriods = getPendingContractPeriods(periods);
  const normalizedCount = Math.max(0, Math.min(count, pendingPeriods.length));

  return pendingPeriods.slice(0, normalizedCount);
};

export const getPendingContractPeriodPrefixThroughId = (
  periods: readonly ContractPaymentPeriod[],
  targetPeriodId: string,
) => {
  const pendingPeriods = getPendingContractPeriods(periods);
  const targetIndex = pendingPeriods.findIndex((period) => period.id === targetPeriodId);

  if (targetIndex < 0) {
    return [];
  }

  return pendingPeriods.slice(0, targetIndex + 1);
};

export const sumContractPeriods = (
  periods: Array<Pick<ContractPaymentPeriod, "amount">>,
) => periods.reduce((sum, period) => sum + Number(period.amount || 0), 0);

export const normalizePeriodIds = (periodIds: readonly string[]) =>
  Array.from(new Set(periodIds.filter(Boolean)));
