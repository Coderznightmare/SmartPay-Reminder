export type ClientRecord = {
  id: string;
  name: string;
  phone_number: string;
  preferred_language: string;
  notes: string | null;
  created_at: string;
};


export type PaymentRecord = {
  id: string;
  client_id: string;
  amount: number;
  amount_paid: number;
  bill_date: string;
  due_date: string;
  status: "unpaid" | "partially_paid" | "paid";
  description: string | null;
  created_at: string;
  reminder_dismissed?: boolean;
  clients?: {
    name: string;
    phone?: string;
  };
};


export function remainingBalance(payment: PaymentRecord) {
  return Math.max(0, Number(payment.amount) - Number(payment.amount_paid));
}

export function isOverdue(payment: PaymentRecord) {
  return payment.status !== "paid" && payment.due_date < new Date().toLocaleDateString("en-CA");
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
