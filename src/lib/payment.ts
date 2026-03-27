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
  periods.filter((period) => period.status === "PENDING");

export const sumContractPeriods = (
  periods: Array<Pick<ContractPaymentPeriod, "amount">>,
) => periods.reduce((sum, period) => sum + Number(period.amount || 0), 0);

export const normalizePeriodIds = (periodIds: readonly string[]) =>
  Array.from(new Set(periodIds.filter(Boolean)));
