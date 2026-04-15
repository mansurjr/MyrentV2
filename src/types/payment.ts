import type { ContractPaymentPeriod, ContractPaymentType } from "./api-responses";

export type PublicPaymentMethod = "click" | "payme";
export type PublicPaymentStatus = "PAID" | "UNPAID";

export interface PaymentUrlResponse {
  url: string;
}

export interface AdminAttendancePaymentItem {
  attendanceId: string | number;
  stallId: string;
  stallNumber: string;
  amount: number;
  date: string;
}

export interface AdminAttendancePaymentResponse extends PaymentUrlResponse {
  provider: string;
  totalAmount: number;
  count: number;
  attendanceIds: Array<string | number>;
  items: AdminAttendancePaymentItem[];
}

export interface AdminAttendanceSinglePaymentResponse extends PaymentUrlResponse {
  provider?: string;
  totalAmount?: number;
  count?: number;
  attendanceIds?: Array<string | number>;
  items?: AdminAttendancePaymentItem[];
}

export interface AdminAttendanceBulkPaymentByAttendanceIdsRequest {
  attendanceIds: Array<string | number>;
}

export interface AdminAttendanceBulkPaymentByStallIdsRequest {
  stallIds: string[];
  date: string;
}

export type AdminAttendanceBulkPaymentRequest =
  | AdminAttendanceBulkPaymentByAttendanceIdsRequest
  | AdminAttendanceBulkPaymentByStallIdsRequest;

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
  pendingPeriods?: ContractPaymentPeriod[];
  availableMethods?: PublicPaymentMethod[];
  paymentSelectionPolicy?: {
    mode?: string;
    allowArbitraryMonthCombination?: boolean;
    allowStartFromAnyPendingMonth?: boolean;
    autoGeneratesFuturePeriodsThroughExpiry?: boolean;
  };
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
