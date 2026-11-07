
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Client = {
  id: string;
  name: string;
  phone: string;
};

type Payment = {
  id: string;
  client_id: string;
  amount: number;
  amount_paid: number;
  bill_date: string;
  due_date: string;
  status: string;
  description: string | null;
};

type Transaction = {
  id: string;
  payment_id: string;
  amount: number;
  note: string | null;
  paid_at: string;
};

export default function PaymentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [activePayment, setActivePayment] = useState("");
  const [collectionAmount, setCollectionAmount] = useState("");
  const [collectionNote, setCollectionNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const [clientResult, paymentResult, transactionResult] =
      await Promise.all([
        supabase.from("clients")
          .select("id, name, phone")
          .order("name"),

        supabase.from("payments")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase.from("payment_transactions")
          .select("*")
          .order("paid_at", { ascending: false }),
      ]);

    if (clientResult.error) {
      setError(clientResult.error.message);
    } else {
      setClients((clientResult.data ?? []) as Client[]);
    }

    if (paymentResult.error) {
      setError(paymentResult.error.message);
    } else {
      setPayments((paymentResult.data ?? []) as Payment[]);
    }

    if (transactionResult.error) {
      setError(transactionResult.error.message);
    } else {
      setTransactions(
        (transactionResult.data ?? []) as Transaction[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleAddPayment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const billAmount = Number(amount);

    if (!clientId || !Number.isFinite(billAmount) || billAmount <= 0) {
      setError("Please select a client and enter a valid amount.");
      setSaving(false);
      return;
    }

    const newPayment: {
      client_id: string;
      amount: number;
      amount_paid: number;
      status: string;
      description: string | null;
      due_date?: string;
    } = {
      client_id: clientId,
      amount: billAmount,
      amount_paid: 0,
      status: "unpaid",
      description: description.trim() || null,
    };

    if (dueDate) {
      newPayment.due_date = dueDate;
    }

    const { error: insertError } = await supabase
      .from("payments")
      .insert(newPayment);

    if (insertError) {
      setError(insertError.message);
    } else {
      setClientId("");
      setDescription("");
      setAmount("");
      setDueDate("");
      setSuccess("New bill added successfully!");
      await loadData();
    }

    setSaving(false);
  }

  async function handleRecordPayment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!activePayment) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const enteredAmount = Number(collectionAmount);

    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      setError("Enter a valid collection amount.");
      setSaving(false);
      return;
    }

    const { error: recordError } = await supabase.rpc(
      "record_payment",
      {
        p_payment_id: activePayment,
        p_amount: enteredAmount,
        p_note: collectionNote.trim() || null,
      }
    );

    if (recordError) {
      setError(recordError.message);
    } else {
      setActivePayment("");
      setCollectionAmount("");
      setCollectionNote("");
      setSuccess("Payment collection recorded successfully!");
      await loadData();
    }

    setSaving(false);
  }

  function getClient(id: string) {
    return clients.find((client) => client.id === id);
  }

  function getStatus(payment: Payment) {
    const paid = Number(payment.amount_paid);
    const total = Number(payment.amount);

    if (paid >= total) return "Paid";
    if (paid > 0) return "Partially Paid";
    return "Unpaid";
  }

  function getStatusStyle(status: string) {
    if (status === "Paid") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Partially Paid") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-red-100 text-red-700";
  }

  function money(value: number) {
    return Number(value).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  }
  
async function handleDeletePayment(payment: Payment, clientName: string) {
  const confirmed = window.confirm(
    `WARNING: Permanently delete this bill?\n\n` +
    `Client: ${clientName}\n` +
    `Bill amount: ${money(Number(payment.amount))}\n` +
    `Amount received: ${money(Number(payment.amount_paid))}\n\n` +
    `All collection transactions associated with this bill will also be deleted.\n\n` +
    `This action cannot be undone.`
  );

  if (!confirmed) return;

  setDeletingPaymentId(payment.id);
  setError("");
  setSuccess("");

  const { error: deleteError } = await supabase.rpc(
    "delete_payment_with_history",
    {
      p_payment_id: payment.id,
    }
  );

  if (deleteError) {
    setError("Unable to delete payment: " + deleteError.message);
  } else {
    if (activePayment === payment.id) {
      setActivePayment("");
      setCollectionAmount("");
      setCollectionNote("");
    }

    setSuccess("Bill and its collection history deleted successfully.");

    await loadData();
  }

  setDeletingPaymentId(null);
}


  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Payment Management
            </h1>
            <p className="mt-2 text-slate-600">
              Manage bills and payment collections.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold"
          >
            Dashboard
          </Link>
        </div>

        {/* ADD NEW BILL */}

        <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold">
            Add New Bill
          </h2>

          <form onSubmit={handleAddPayment} className="space-y-4">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Select client
              </label>

              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="">Choose a client</option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} — {client.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Bill description
              </label>

              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Website development"
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Total bill amount (₹)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Due date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />

              <p className="mt-1 text-xs text-slate-500">
                Leave blank for the automatic two-day deadline.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || clients.length === 0}
              className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Bill"}
            </button>
          </form>
        </section>

        {/* ALL BILLS */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              All Bills
            </h2>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-slate-500">
              No bills added yet.
            </p>
          ) : (
            <div className="space-y-5">

              {payments.map((payment) => {
                const client = getClient(payment.client_id);
                const status = getStatus(payment);
                const total = Number(payment.amount);
                const paid = Number(payment.amount_paid);
                const balance = Math.max(0, total - paid);

                const history = transactions.filter(
                  (transaction) =>
                    transaction.payment_id === payment.id
                );

                return (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          {client?.name ?? "Unknown client"}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {client?.phone ?? "—"}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {payment.description || "Bill"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Bill amount</p>
                        <p className="font-semibold">{money(total)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Received</p>
                        <p className="font-semibold text-green-700">
                          {money(paid)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Balance</p>
                        <p className="font-semibold text-red-600">
                          {money(balance)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>Payment progress</span>
                        <span>
                          {total > 0
                            ? Math.min(100, (paid / total) * 100).toFixed(0)
                            : 0}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{
                            width: `${total > 0 ? Math.min(100, (paid / total) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Due date: {new Date(
                        payment.due_date + "T00:00:00"
                      ).toLocaleDateString("en-IN")}
                    </p>

                    
{/* DELETE INDIVIDUAL PAYMENT */}

<div className="mt-4">
  <button
    type="button"
    onClick={() =>
      void handleDeletePayment(
        payment,
        client?.name ?? "Unknown client"
      )
    }
    disabled={saving || deletingPaymentId !== null}
    className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {deletingPaymentId === payment.id
      ? "Deleting..."
      : "Delete Payment"}
  </button>
</div>


                    {/* PAYMENT HISTORY */}

                    <div className="mt-5 border-t pt-4">
                      <h4 className="mb-2 font-semibold text-sm">
                        Collection History
                      </h4>

                      {history.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No collections recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {history.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"
                            >
                              <div>
                                <p className="font-medium text-green-700">
                                  + {money(Number(item.amount))}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(item.paid_at).toLocaleString("en-IN")}
                                </p>
                                {item.note && (
                                  <p className="text-xs text-slate-600">
                                    {item.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RECORD ANOTHER PAYMENT */}
                    
{/* RECORD ANOTHER PAYMENT */}

{balance > 0 && (
  <div className="mt-5 flex flex-wrap gap-3">

    {/* PARTIAL PAYMENT BUTTON */}

    {activePayment === payment.id ? (
      <form
        onSubmit={handleRecordPayment}
        className="w-full space-y-3 rounded-xl bg-slate-50 p-4"
      >
        <h4 className="font-semibold">
          Record Partial Payment
        </h4>

        <p className="text-sm text-slate-600">
          Outstanding balance: {money(balance)}
        </p>

        <input
          type="number"
          min="0.01"
          max={balance}
          step="0.01"
          required
          value={collectionAmount}
          onChange={(e) =>
            setCollectionAmount(e.target.value)
          }
          placeholder="Enter received amount"
          className="w-full rounded-lg border bg-white px-4 py-3"
        />

        <input
          type="text"
          maxLength={200}
          value={collectionNote}
          onChange={(e) =>
            setCollectionNote(e.target.value)
          }
          placeholder="Note (optional)"
          className="w-full rounded-lg border bg-white px-4 py-3"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Collection"}
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePayment("");
              setCollectionAmount("");
              setCollectionNote("");
            }}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    ) : (
      <button
        type="button"
        onClick={() => {
          setActivePayment(payment.id);
          setCollectionAmount("");
          setCollectionNote("");
          setError("");
          setSuccess("");
        }}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
      >
        + Record Partial Payment
      </button>
    )}

    {/* FULL PAYMENT BUTTON */}

    <button
      type="button"
      disabled={saving}
      onClick={async () => {
        const confirmed = window.confirm(
          `Confirm that you received the full remaining amount of ${money(balance)} from ${client?.name ?? "this client"}?`
        );

        if (!confirmed) return;

        setSaving(true);
        setError("");
        setSuccess("");

        const { error: fullPaymentError } = await supabase.rpc(
          "record_payment",
          {
            p_payment_id: payment.id,
            p_amount: balance,
            p_note: "Full payment received",
          }
        );

        if (fullPaymentError) {
          setError(fullPaymentError.message);
        } else {
          setActivePayment("");
          setCollectionAmount("");
          setCollectionNote("");
          setSuccess("Full payment received successfully!");
          await loadData();
        }

        setSaving(false);
      }}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
    >
      {saving ? "Processing..." : "✓ Mark as Fully Paid"}
    </button>

  </div>
)}


                    
                           

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

      </div>
    </main>
  );
}
