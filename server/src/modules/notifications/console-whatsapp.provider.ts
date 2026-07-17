import { pool } from "../../db/pool.js";
import type { NotificationProvider, SendWhatsAppInput } from "./notification-provider.interface.js";

/** Replaces the prototype's `waLog` (window.storage array): logs to the console and
 *  persists to the `whatsapp_log` table so the admin panel's WhatsApp tab can list it. */
export class ConsoleWhatsAppProvider implements NotificationProvider {
  async sendWhatsApp(input: SendWhatsAppInput): Promise<{ status: "enviado" | "falhou" }> {
    console.log(`[WhatsApp stub] -> ${input.toNumber} (${input.hotelName}):\n${input.message}`);
    await pool.query(
      `INSERT INTO whatsapp_log (booking_id, to_number, hotel_name, hotel_id, message, status)
       VALUES ($1, $2, $3, $4, $5, 'enviado')`,
      [input.bookingId ?? null, input.toNumber, input.hotelName, input.hotelId ?? null, input.message]
    );
    return { status: "enviado" };
  }
}
