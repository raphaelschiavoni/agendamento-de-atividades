import { env } from "../../config/env.js";
import type { NotificationProvider } from "./notification-provider.interface.js";
import { ConsoleWhatsAppProvider } from "./console-whatsapp.provider.js";

let provider: NotificationProvider | null = null;

export function getNotificationProvider(): NotificationProvider {
  if (!provider) {
    if (env.NOTIFICATION_PROVIDER === "whatsapp-cloud-api") {
      throw new Error("Provedor 'whatsapp-cloud-api' ainda não implementado — configure NOTIFICATION_PROVIDER=console");
    }
    provider = new ConsoleWhatsAppProvider();
  }
  return provider;
}

export * from "./notification-provider.interface.js";
