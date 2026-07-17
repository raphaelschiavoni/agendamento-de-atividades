export interface SendWhatsAppInput {
  toNumber: string;
  hotelName: string;
  hotelId?: string;
  message: string;
  bookingId?: string;
}

export interface NotificationProvider {
  sendWhatsApp(input: SendWhatsAppInput): Promise<{ status: "enviado" | "falhou" }>;
}
