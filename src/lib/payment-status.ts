import type { Contract, Store } from "@/types/api-responses";
import { getTashkentTodayISO } from "@/lib/time";

type MaybeContract = Partial<Contract> | null | undefined;
type MaybeStore = Partial<Store> | null | undefined;

const getCurrentTashkentPeriod = () => {
  const [year, month] = getTashkentTodayISO().split("-");
  return {
    year: Number(year),
    month: Number(month),
  };
};

export const getActiveStoreContract = (store: MaybeStore) =>
  store?.contracts?.find((contract) => contract?.isActive);

export const resolveContractCurrentMonthPaid = (
  contract: MaybeContract,
): boolean | undefined => {
  if (!contract) {
    return undefined;
  }

  if (typeof contract.isPaidCurrentMonth === "boolean") {
    return contract.isPaidCurrentMonth;
  }

  if (typeof contract.paymentSnapshot?.hasCurrentPeriodPaid === "boolean") {
    return contract.paymentSnapshot.hasCurrentPeriodPaid;
  }

  if (Array.isArray(contract.paymentPeriods) && contract.paymentPeriods.length > 0) {
    const { year, month } = getCurrentTashkentPeriod();
    const currentPeriod = contract.paymentPeriods.find(
      (period) => period.year === year && period.month === month,
    );

    if (currentPeriod) {
      return currentPeriod.status === "PAID";
    }
  }

  return undefined;
};

export const resolveStoreCurrentMonthPaid = (
  store: MaybeStore,
): boolean | undefined => {
  if (!store) {
    return undefined;
  }

  if (typeof store.paidCurrentMonth === "boolean") {
    return store.paidCurrentMonth;
  }

  return resolveContractCurrentMonthPaid(getActiveStoreContract(store));
};
