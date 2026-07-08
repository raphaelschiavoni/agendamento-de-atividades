export interface CreateChargeInput {
  amountCents: number;
  chargeId: string; // our internal payment_charges.id, used as external reference
  customer: { name: string; phone: string; email?: string };
}

export interface CreateChargeResult {
  providerRef: string;
  pixCopyPaste: string;
}

export interface PaymentProvider {
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
}
