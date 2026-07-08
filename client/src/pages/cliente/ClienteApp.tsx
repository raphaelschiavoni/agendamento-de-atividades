import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listHotels, getHotelActivities } from "../../api/hotels";
import { createCharge, simulateApprove } from "../../api/bookings";
import { BackRow } from "../../components/BackRow";
import { FloatingCartButton } from "../../components/FloatingCartButton";
import { HotelPicker } from "./HotelPicker";
import { CategoryPicker } from "./CategoryPicker";
import { ActivityCard } from "./ActivityCard";
import { ScheduleModal } from "./ScheduleModal";
import { CartView } from "./CartView";
import { CheckoutView } from "./CheckoutView";
import { PaymentView } from "./PaymentView";
import { ConfirmationView } from "./ConfirmationView";
import type { Activity, Booking, CartItem, Category, Customer } from "../../types";

type Stage = "browse" | "cart" | "checkout" | "payment" | "done";

export function ClienteApp() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("hospede");
  const [scheduling, setScheduling] = useState<Activity | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stage, setStage] = useState<Stage>("browse");
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "" });
  const [guestHotelId, setGuestHotelId] = useState<string>("");
  const [roomNumber, setRoomNumber] = useState("");
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState("");
  const [paidVouchers, setPaidVouchers] = useState<Booking[]>([]);

  const { data: hotels = [], isLoading: hotelsLoading, isError: hotelsError, error: hotelsErrorObj } = useQuery({
    queryKey: ["hotels"],
    queryFn: listHotels,
  });
  const { data: activities = [], isLoading: activitiesLoading, isError: activitiesError } = useQuery({
    queryKey: ["hotel-activities", hotelId],
    queryFn: () => getHotelActivities(hotelId!),
    enabled: !!hotelId,
  });

  const hotel = hotels.find((h) => h.id === hotelId);
  const activeActivities = useMemo(() => activities.filter((a) => a.active), [activities]);

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  function addToCart(activity: Activity, date: string, time: string, adults: number, children: number) {
    setCart((c) => [
      ...c,
      {
        activityId: activity.id,
        hotelId: activity.hotelId,
        hotelName: hotel?.name ?? "",
        activityName: activity.name,
        category,
        date,
        time,
        qty: adults + children,
        adults,
        children,
        unitPrice: activity.prices[category] || 0,
      },
    ]);
    setScheduling(null);
    setStage("cart");
  }

  function removeFromCart(idx: number) {
    setCart((c) => c.filter((_, i) => i !== idx));
  }

  // "Hóspede" e "Passaporte dos Sonhos" são categorias de quem está hospedado.
  const isGuestCategory = cart.some((i) => i.category === "hospede" || i.category === "passaporte");
  const isPassaporte = cart.some((i) => i.category === "passaporte");

  async function createPixCharge() {
    const result = await createCharge(
      cart.map((i) => ({
        activityId: i.activityId,
        category: i.category,
        date: i.date,
        time: i.time,
        qty: i.qty,
        adults: i.adults,
        children: i.children,
      })),
      customer,
      {
        guestHotelId: isPassaporte && guestHotelId ? guestHotelId : undefined,
        roomNumber: isGuestCategory && roomNumber ? roomNumber : undefined,
      }
    );
    setChargeId(result.chargeId);
    setPixCode(result.pixCopyPaste);
    setStage("payment");
  }

  async function confirmPayment() {
    if (!chargeId) return;
    const { bookings } = await simulateApprove(chargeId);
    setPaidVouchers(bookings);
    setStage("done");
  }

  function startNewOrder() {
    setCart([]);
    setCustomer({ name: "", phone: "", email: "" });
    setGuestHotelId("");
    setRoomNumber("");
    setChargeId(null);
    setPixCode("");
    setPaidVouchers([]);
    setStage("browse");
    setHotelId(null);
  }

  if (stage === "cart") {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <CartView cart={cart} onRemove={removeFromCart} onBack={() => setStage("browse")} onCheckout={() => setStage("checkout")} total={cartTotal} />
      </div>
    );
  }
  if (stage === "checkout") {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <CheckoutView
          customer={customer}
          setCustomer={setCustomer}
          total={cartTotal}
          hotels={hotels}
          isGuest={isGuestCategory}
          isPassaporte={isPassaporte}
          activityHotelName={cart[0]?.hotelName ?? ""}
          guestHotelId={guestHotelId}
          setGuestHotelId={setGuestHotelId}
          roomNumber={roomNumber}
          setRoomNumber={setRoomNumber}
          onBack={() => setStage("cart")}
          onNext={createPixCharge}
        />
      </div>
    );
  }
  if (stage === "payment") {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <PaymentView total={cartTotal} pixCode={pixCode} onBack={() => setStage("checkout")} onConfirm={confirmPayment} />
      </div>
    );
  }
  if (stage === "done") {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <ConfirmationView vouchers={paidVouchers} onNewOrder={startNewOrder} />
      </div>
    );
  }

  if (!hotelId) {
    if (hotelsLoading) {
      return <p className="text-center text-sm opacity-60 p-10">Carregando hotéis…</p>;
    }
    if (hotelsError) {
      return (
        <div className="text-center text-sm p-10" style={{ color: "var(--danger)" }}>
          Não foi possível carregar os hotéis. Verifique se o servidor da API está rodando (porta 4000).
          <br />
          <span className="opacity-60 text-xs">{hotelsErrorObj instanceof Error ? hotelsErrorObj.message : ""}</span>
        </div>
      );
    }
    return <HotelPicker hotels={hotels} onPick={setHotelId} />;
  }

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <BackRow label={hotel?.name ?? ""} sub={hotel?.city ?? ""} onBack={() => setHotelId(null)} />
      <div className="my-4">
        <CategoryPicker category={category} setCategory={setCategory} />
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {activitiesLoading && <p className="text-sm opacity-60">Carregando atividades…</p>}
        {activitiesError && <p className="text-sm" style={{ color: "var(--danger)" }}>Não foi possível carregar as atividades.</p>}
        {activeActivities.map((a) => (
          <ActivityCard key={a.id} activity={a} category={category} hotelId={hotelId} onSchedule={() => setScheduling(a)} />
        ))}
        {!activitiesLoading && !activitiesError && activeActivities.length === 0 && (
          <p className="text-sm opacity-60">Nenhuma atividade cadastrada para este hotel ainda.</p>
        )}
      </div>

      {scheduling && (
        <ScheduleModal
          activity={scheduling}
          category={category}
          onClose={() => setScheduling(null)}
          onConfirm={(date, time, adults, children) => addToCart(scheduling, date, time, adults, children)}
        />
      )}

      {cart.length > 0 && <FloatingCartButton count={cart.length} total={cartTotal} onClick={() => setStage("cart")} />}
    </div>
  );
}
