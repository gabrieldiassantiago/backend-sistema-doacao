import type { BadgeMeta, LevelInfo } from "../donation/gamification.service";

export type CreatePaymentData = {
  amount:     number;
  message?:   string;
  userId:     string;
  causeId:    string;
  payerEmail: string;
};

export type PaymentStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type PaymentUpdate = {
  mpPaymentId?:  string;
  qrCode?:       string;
  qrCodeBase64?: string;
  donationId?:   string;
};

export type InitiatePaymentResult = {
  paymentId:    string;
  qrCode:       string;
  qrCodeBase64: string;
  amount:       number;
  causeTitle:   string;
  status:       string;
};

export type WebhookPayload = {
  type?:   string;
  action?: string;
  data?:   { id: string };
};

export type WebhookResult = {
  processed: boolean;
  reason?:   string;
  xpEarned?: number;
  newBadges?: BadgeMeta[];
  level?:     LevelInfo;
};

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByMpId(mpPaymentId: string): Promise<any | null>;
  updateStatus(id: string, status: PaymentStatusValue, extra?: PaymentUpdate): Promise<any>;
  findByUser(userId: string, skip: number, take: number): Promise<any[]>;
  findByCause(causeId: string, skip: number, take: number): Promise<any[]>;
}

export interface IPaymentService {
  initiatePayment(
    data: { causeId: string; amount: number; message?: string },
    userId: string,
    payerEmail: string,
  ): Promise<InitiatePaymentResult>;
  handleWebhook(body: WebhookPayload): Promise<WebhookResult>;
  findById(id: string): Promise<any | null>;
  findByUser(userId: string, skip?: number, take?: number): Promise<any[]>;
  findByCause(causeId: string, skip?: number, take?: number): Promise<any[]>;
}
