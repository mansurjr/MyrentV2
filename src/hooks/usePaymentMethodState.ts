import { useEffect, useMemo, useState } from "react";
import type { PublicPaymentMethod } from "@/types/payment";
import { resolveAvailablePaymentMethods } from "@/lib/payment";

export const usePaymentMethodState = (methods?: readonly string[] | null) => {
  const availableMethods = useMemo(
    () => resolveAvailablePaymentMethods(methods),
    [methods],
  );
  const [selectedMethod, setSelectedMethod] = useState<PublicPaymentMethod | null>(null);
  const [paymentUrlLoading, setPaymentUrlLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedMethod((currentMethod) => {
      if (currentMethod && availableMethods.includes(currentMethod)) {
        return currentMethod;
      }

      if (availableMethods.length === 1) {
        return availableMethods[0];
      }

      return null;
    });
  }, [availableMethods]);

  return {
    availableMethods,
    selectedMethod,
    setSelectedMethod,
    paymentUrlLoading,
    setPaymentUrlLoading,
    paymentError,
    setPaymentError,
  };
};
