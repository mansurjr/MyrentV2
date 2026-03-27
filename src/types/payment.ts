import type { ContractPaymentPeriod, ContractPaymentType } from "./api-responses";

export type PublicPaymentMethod = "click" | "payme";
export type PublicPaymentStatus = "PAID" | "UNPAID";

export interface PaymentUrlResponse {
  url: string;
}

export interface PublicContractSearchResult {
  id: number;
  paymentType: ContractPaymentType;
  certificateNumber: string | null;
  store?: {
    storeNumber: string;
  };
  owner?: {
    fullName: string | null;
  };
  pendingPeriods?: ContractPaymentPeriod[];
  availableMethods?: PublicPaymentMethod[];
  paymentUrl?: string | null;
}

export interface PublicContractDetail {
  id: number;
  certificateNumber: string | null;
  paymentType: ContractPaymentType;
  store?: {
    storeNumber: string;
  };
  owner?: {
    fullName: string | null;
  };
  paymentPeriods: ContractPaymentPeriod[];
  availableMethods?: PublicPaymentMethod[];
}

export interface PublicContractPaymentUrlRequest {
  periodIds: string[];
  method: PublicPaymentMethod;
}

export interface PublicStallDetail {
  stallNumber: string;
  description: string | null;
  dailyFee: number;
  section?: {
    id: number;
    name: string;
  } | null;
  status: PublicPaymentStatus;
  attendanceId: number | null;
  date: string;
  availableMethods?: PublicPaymentMethod[];
}

export interface PublicStallPaymentUrlRequest {
  date: string;
  method: PublicPaymentMethod;
}
