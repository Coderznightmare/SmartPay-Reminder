
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BellRing,
  Wallet,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  RefreshCw,
  Users,
  WalletCards,
  Phone,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import {
  formatINR,
  isOverdue,
  PaymentRecord,
  remainingBalance,
} from "@/lib/types";

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getDaysOverdue(dueDate: string) {
  const today = getIndiaToday();

  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const current = new Date(`${today}T00:00:00Z`).getTime();

  return Math.max(0, Math.floor((current - due) / 86400000));
}

export default function DashboardPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [updatingPaymentId, setUpdatingPaymentId] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [paymentResult, clientResult] = await Promise.all([
        supabase
          .from("payments")
          .select("*, clients(name, phone)")
          .order("due_date", { ascending: true }),

        supabase
          .from("clients")
          .select("id", { count: "exact", head: true }),
      ]);

      if (paymentResult.error) throw paymentResult.error;
      if (clientResult.error) throw clientResult.error;

      setPayments((paymentResult.data ?? []) as PaymentRecord[]);
      setClientCount(clientResult.count ?? 0);
    } catch (err: any) {
      console.error("DASHBOARD ERROR:", err);

      setError(
        err?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Record the remaining balance as a real payment collection.
  async function handleMarkPaid(payment: PaymentRecord) {
    const balance = remainingBalance(payment);

    if (balance <= 0) {
      setActionError("This payment has no remaining balance.");
      return;
    }

    const confirmed = window.confirm(
      `Mark this bill as fully paid?\n\nRemaining balance: ${formatINR(balance)}`
    );

    if (!confirmed) return;

    setUpdatingPaymentId(payment.id);
    setActionError("");
    setActionSuccess("");

    try {
      const { error: recordError } = await supabase.rpc(
        "record_payment",
        {
          p_payment_id: payment.id,
          p_amount: balance,
          p_note: "Final payment recorded from dashboard",
        }
      );

      if (recordError) throw recordError;

      setActionSuccess("Payment successfully marked as paid.");
      await loadData();
    } catch (err: any) {
      setActionError(
        err?.message || "Unable to mark this payment as paid."
      );
    } finally {
      setUpdatingPaymentId("");
    }
  }

  // Reset the current bill balance without deleting transaction history.
  
async function handleMarkUnpaid(payment: PaymentRecord) {
  const confirmed = window.confirm(
    "Reset this bill to unpaid and remove it from Daily Reminders?\n\nIts existing payment transaction history will be preserved."
  );

  if (!confirmed) return;

  setUpdatingPaymentId(payment.id);
  setActionError("");
  setActionSuccess("");

  try {
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        amount_paid: 0,
        status: "unpaid",
        reminder_dismissed: true,
      })
      .eq("id", payment.id);

    if (updateError) throw updateError;

    setActionSuccess(
      "Bill reset to unpaid and removed from Daily Reminders."
    );

    await loadData();
  } catch (err: any) {
    setActionError(
      err?.message || "Unable to update payment status."
    );
  } finally {
    setUpdatingPaymentId("");
  }
}


  const outstanding = payments
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + remainingBalance(p), 0);

  const overdue = payments.filter(
  (p) =>
    p.status !== "paid" &&
    isOverdue(p) && 
    !p.reminder_dismissed);

  const dueToday = payments.filter(
    (p) =>
      p.status !== "paid" &&
      p.due_date === getIndiaToday()
  );

  const recent = payments
    .filter((p) => p.status !== "paid")
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <aside className="fixed hidden h-screen w-64 flex-col border-r border-slate-200 bg-white p-5 md:flex">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold"
        >
          <span className="rounded-xl bg-indigo-600 p-2 text-white">
            <Wallet size={20} />
          </span>
          Ratna Enterprise
        </Link>

        <p className="mb-3 mt-10 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 font-semibold text-indigo-700">
          <LayoutDashboard size={18} />
          Dashboard
        </div>

        <Link
          href="/clients"
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 hover:bg-slate-50"
        >
          <Users size={18} />
          Clients
        </Link>

        <Link
          href="/payments"
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 hover:bg-slate-50"
        >
          <WalletCards size={18} />
          Payments
        </Link>

        <div className="mt-auto rounded-2xl bg-slate-50 p-4">
          <BellRing className="text-indigo-600" size={20} />
          <p className="mt-3 text-sm font-semibold">
            Daily overdue reminders
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Check your dashboard every day to follow up on overdue bills.
          </p>
        </div>
      </aside>

      {/* Main dashboard */}
      <main className="px-4 py-6 sm:px-8 md:ml-64 md:px-10">

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Business overview
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Your payments at a glance.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <Link
              href="/payments"
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="mr-1 inline" size={16} />
              Add payment
            </Link>
          </div>
        </header>

        {/* Loading errors */}
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            <strong>Dashboard loading error:</strong> {error}
          </div>
        )}

        {/* Action messages */}
        {actionError && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle className="mr-2 inline" size={17} />
            {actionSuccess}
          </div>
        )}

        {/* Statistics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total outstanding",
              value: formatINR(outstanding),
              icon: Wallet,
              tone: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "Overdue payments",
              value: String(overdue.length),
              icon: BellRing,
              tone: "bg-rose-50 text-rose-600",
            },
            {
              label: "Due today",
              value: String(dueToday.length),
              icon: WalletCards,
              tone: "bg-amber-50 text-amber-700",
            },
            {
              label: "Total clients",
              value: String(clientCount),
              icon: Users,
              tone: "bg-emerald-50 text-emerald-700",
            },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{label}</p>
                <span className={`rounded-xl p-2.5 ${tone}`}>
                  <Icon size={20} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold">
                {loading ? (
                  <LoaderCircle className="animate-spin" size={22} />
                ) : (
                  value
                )}
              </p>
            </div>
          ))}
        </section>

        {/* DAILY OVERDUE REMINDERS */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-rose-200 bg-white">

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="text-rose-600" size={21} />
                <h2 className="font-bold text-slate-900">
                  Daily overdue reminders
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Bills that have crossed their due date.
              </p>
            </div>

            <span className="rounded-full bg-rose-100 px-3 py-1.5 text-sm font-bold text-rose-700">
              {loading ? "..." : `${overdue.length} overdue`}
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading overdue reminders...
            </div>
          ) : overdue.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle
                className="mx-auto text-emerald-500"
                size={36}
              />

              <p className="mt-3 font-semibold text-slate-800">
                No overdue payments!
              </p>

              <p className="mt-1 text-sm text-slate-500">
                All outstanding bills are either paid or not yet overdue.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {overdue.map((p) => {
                const phone = p.clients?.phone ?? "";
                const phoneLink = phone.replace(/[^\d+]/g, "");
                const balance = remainingBalance(p);
                const days = getDaysOverdue(p.due_date);
                const isUpdating = updatingPaymentId === p.id;

                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    {/* Client details */}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">
                        {p.clients?.name ?? "Client"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {phone || "No phone number available"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {p.description || "Payment"} · Due {p.due_date}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          <AlertTriangle
                            className="mr-1 inline"
                            size={13}
                          />
                          {days} {days === 1 ? "day" : "days"} overdue
                        </span>

                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.status === "partially_paid"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          {p.status === "partially_paid"
                            ? "Partially paid"
                            : "Unpaid"}
                        </span>
                      </div>
                    </div>

                    {/* Balance and controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="mr-2">
                        <p className="text-xs text-slate-500">
                          Outstanding balance
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {formatINR(balance)}
                        </p>
                      </div>

                      {phoneLink && (
                        <a
                          href={`tel:${phoneLink}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          <Phone size={16} />
                          Call
                        </a>
                      )}

                      <button
                        onClick={() => handleMarkPaid(p)}
                        disabled={isUpdating || balance <= 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <LoaderCircle className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Mark Paid
                      </button>

                      <button
                        onClick={() => handleMarkUnpaid(p)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={16} />
                        Mark Unpaid
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Existing payment follow-ups */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold">Payment follow-ups</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recent unpaid bills ordered by due date.
              </p>
            </div>

            <Link
              href="/payments"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading payments...
            </div>
          ) : recent.length === 0 ? (
            <div className="p-10 text-center">
              <WalletCards
                className="mx-auto text-slate-300"
                size={32}
              />

              <p className="mt-3 font-semibold">
                No outstanding payments
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add a payment to start tracking your follow-ups.
              </p>

              <Link
                href="/payments"
                className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Add your first payment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((p) => {
                const phone = p.clients?.phone ?? "";
                const phoneLink = phone.replace(/[^\d+]/g, "");

                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {p.clients?.name ?? "Client"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {phone || "No phone number available"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {p.description || "Payment"} · Due {p.due_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">
                          {formatINR(remainingBalance(p))}
                        </p>

                        <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.status === "partially_paid"
                            ? "bg-amber-50 text-amber-700"
                            : isOverdue(p)
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {p.status === "partially_paid"
                            ? "Partially paid"
                            : isOverdue(p)
                              ? "Overdue"
                              : "Unpaid"}
                        </span>
                      </div>

                      {phoneLink && (
                        <a
                          href={`tel:${phoneLink}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <Phone size={16} />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
