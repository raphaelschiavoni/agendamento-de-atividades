import type { CreateChargeInput, CreateChargeResult, PaymentProvider } from "./payment-provider.interface.js";

function genPixCode(): string {
  const chars = "abcdef0123456789";
  let s = "00020126580014BR.GOV.BCB.PIX";
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "6304" + Math.floor(1000 + Math.random() * 9000);
}

/** Mirrors the prototype's manual "Simular pagamento aprovado" button: does not
 *  auto-confirm on its own. Approval is driven by POST /checkout/charges/:id/simulate-approve. */
export class MockPixProvider implements PaymentProvider {
  async createCharge(_input: CreateChargeInput): Promise<CreateChargeResult> {
    return {
      providerRef: "mock_" + Math.random().toString(36).slice(2, 10),
      pixCopyPaste: genPixCode(),
    };
  }
}
