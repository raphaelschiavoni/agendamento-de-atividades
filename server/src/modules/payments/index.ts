import { env } from "../../config/env.js";
import type { PaymentProvider } from "./payment-provider.interface.js";
import { MockPixProvider } from "./mock-pix.provider.js";

let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!provider) {
    if (env.PAYMENT_PROVIDER === "mercadopago") {
      throw new Error("Provedor 'mercadopago' ainda não implementado — configure PAYMENT_PROVIDER=mock");
    }
    provider = new MockPixProvider();
  }
  return provider;
}

export * from "./payment-provider.interface.js";
