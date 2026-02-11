export type Roles = 'ADMIN' | 'CHECKER' | 'SUPERADMIN';
export const Roles = {
  ADMIN: 'ADMIN' as const,
  CHECKER: 'CHECKER' as const,
  SUPERADMIN: 'SUPERADMIN' as const,
};

export type PaymentMethod = 'PAYME' | 'CLICK' | 'CASH';
export const PaymentMethod = {
  PAYME: 'PAYME' as const,
  CLICK: 'CLICK' as const,
  CASH: 'CASH' as const,
};

export type ContractPaymentStatus = 'PENDING' | 'PAID' | 'REVERSED';
export const ContractPaymentStatus = {
  PENDING: 'PENDING' as const,
  PAID: 'PAID' as const,
  REVERSED: 'REVERSED' as const,
};

export type ContractPaymentType = 'ONLINE' | 'BANK_ONLY';
export const ContractPaymentType = {
  ONLINE: 'ONLINE' as const,
  BANK_ONLY: 'BANK_ONLY' as const,
};

export type AttendancePayment = 'PAID' | 'UNPAID';
export const AttendancePayment = {
  PAID: 'PAID' as const,
  UNPAID: 'UNPAID' as const,
};

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
  total?: number;
  page?: number;
  limit?: number;
}



export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Roles ;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Owner {
  id: number;
  fullName: string;
  address: string | null;
  tin: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  archivedById?: number | null;
  archivedAt?: string | null;
  createdBy?: Partial<User>;
  archivedBy?: Partial<User>;
  contracts?: Partial<Contract>[];
}

export interface Store {
  id: number;
  storeNumber: string;
  area: number;
  click_payment_url: string | null;
  payme_payment_url: string | null;
  description: string | null;
  sectionId: number | null;
  Section?: Section | undefined;
  isOccupied?: boolean;
  contracts?: Contract[];
}

export interface Stall {
  id: number;
  stallNumber: string | null;
  area: number;
  saleTypeId: number | null;
  sectionId: number | null;
  click_payment_url: string | null;
  payme_payment_url: string | null;
  description: string | null;
  dailyFee: string | number;
  SaleType?: SaleType;
  Section?: Section;
  reserved: boolean;
  isOccupied?: boolean;
  attendances?: Attendance[];
}

export interface PaymentSnapshot {
  paidThrough: string | null;
  nextPeriodStart: string | null;
  monthsAhead: number;
  debtMonths: number;
  debtAmount: number;
  hasCurrentPeriodPaid: boolean;
}

export interface Contract {
  id: number;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  isActive: boolean;
  paymentType: ContractPaymentType;
  shopMonthlyFee: string | number | null;
  ownerId: number;
  storeId: number;
  isPaidCurrentMonth: boolean;
  createdById: number;
  archivedById?: number | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: Owner;
  store?: Store;
  createdBy?: User;
  archivedBy?: Partial<User>;
  transactions?: Transaction[];
  paymentSnapshot?: PaymentSnapshot;
}

export interface Attendance {
  id: number;
  date: string;
  stallId: number;
  status: AttendancePayment;
  amount: string | number | null;
  transactionId: number | null;
  createdAt: string;
  updatedAt: string | null;
  Stall?: Stall;
  transaction?: Transaction;
}

export interface Transaction {
  id: number;
  transactionId: string;
  amount: string | number;
  status: string;
  paymentMethod: PaymentMethod;
  contractId: number | null;
  attendanceId: number | null;
  createdAt: string;
  updatedAt: string;
  contract?: Partial<Contract>;
  attendance?: Partial<Attendance>;
  fiscalErrorCode?: number | null;
  fiscalErrorNote?: string | null;
  fiscalQrCode?: string | null;
}

export interface Section {
  id: number;
  name: string;
  description: string | null;
  assignedCheckerId: number;
  assignedChecker?: Partial<User>;
}

export interface SaleType {
  id: number;
  name: string;
  description: string | null;
  tax: number;
}

export type AttendanceListResponse = ListResponse<Attendance>

export interface ContractListResponse extends ListResponse<Contract> {
  total: number;
  page: number;
  limit: number;
}

export type OwnerListResponse = ListResponse<Owner>

export interface StallListResponse extends ListResponse<Stall> {
  total: number;
  page: number;
  limit: number;
}

export interface StoreListResponse extends ListResponse<Store> {
  total: number;
  page: number;
  limit: number;
}

export type TransactionListResponse = ListResponse<Transaction>
export type UserListResponse = ListResponse<User>
export type SaleTypeListResponse = ListResponse<SaleType>
export type SectionListResponse = Section[];
