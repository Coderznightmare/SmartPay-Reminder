
"use client";

import { useEffect, useMemo, useState } from "react";
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
  due_date: string;
  status: string;
  description: string | null;
};

type Filter = "all" | "30plus" | "partial";

function getIndiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysBetween(start: string, end: string) {
  const startTime = Date.parse(start + "T00:00:00Z");
  const endTime = Date.parse(end + "T00:00:00Z");
  return Math.floor((endTime - startTime) / 86400000);
}

function money(value: number) {
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export default function OverduePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getIndiaToday();

  async function loadData() {
    setLoading(true);
    setError("");

    const [clientResult, paymentResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, phone"),

      supabase
        .from("payments")
        .select("id, client_id, amount, amount_paid, due_date, status, description")
        .order("due_date", { ascending: true }),
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

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const overduePayments = useMemo(() => {
    return payments
      .map((payment) => {
        const total = Number(payment.amount);
        const paid = Number(payment.amount_paid);
        const balance = Math.max(0, total - paid);
        const daysOverdue = daysBetween(payment.due_date, today);

        return {
          ...payment,
          balance,
          daysOverdue,
        };
      })
      .filter(
        (payment) =>
          payment.due_date < today && payment.balance > 0
      )
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [payments, today]);

  const totalOutstanding = overduePayments.reduce(
    (sum, payment) => sum + payment.balance,
    0
  );

  const oldPayments = overduePayments.filter(
    (payment) => payment.daysOverdue >= 30
  );

  const partialPayments = overduePayments.filter(
    (payment) =>
      Number(payment.amount_paid) > 0 &&
      payment.balance > 0
  );

  const displayedPayments = overduePayments.filter((payment) => {
    const client = clients.find(
      (item) => item.id === payment.client_id
    );

    const matchesSearch =
      (client?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (client?.phone ?? "").includes(search) ||
      (payment.description ?? "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "30plus") {
      return payment.daysOverdue >= 30;
    }

    if (filter === "partial") {
      return (
        Number(payment.amount_paid) > 0 &&
        payment.balance > 0
      );
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Overdue Payments
            </h1>
            <p className="mt-2 text-slate-600">
              Track bills with outstanding balances past their due dates.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/payments"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              Payments
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* SUMMARY CARDS */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Overdue bills
            </p>
            <p className="mt-2 text-3xl font-bold">
              {overduePayments.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total outstanding
            </p>
            <p className="mt-2 text-2xl font-bold">
              {money(totalOutstanding)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Overdue 30+ days
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {oldPayments.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Partially paid overdue
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {partialPayments.length}
            </p>
          </div>

        </section>

        {/* FILTERS */}

        <section className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-semibold">
                Outstanding Bills
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Date used: {today} (India time)
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, phone or bill..."
            className="mt-4 w-full rounded-lg border px-4 py-3"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "border bg-white"
              }`}
            >
              All Overdue
            </button>

            <button
              onClick={() => setFilter("30plus")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                filter === "30plus"
                  ? "bg-indigo-600 text-white"
                  : "border bg-white"
              }`}
            >
              30+ Days
            </button>

            <button
              onClick={() => setFilter("partial")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                filter === "partial"
                  ? "bg-indigo-600 text-white"
                  : "border bg-white"
              }`}
            >
              Partially Paid
            </button>
          </div>
        </section>

        {/* OVERDUE BILL LIST */}

        <section className="space-y-4">

          {loading ? (
            <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
              Loading overdue payments...
            </div>
          ) : displayedPayments.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <h3 className="font-semibold">
                No matching overdue bills
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                You're all caught up for this filter!
              </p>
            </div>
          ) : (
            displayedPayments.map((payment) => {
              const client = clients.find(
                (item) => item.id === payment.client_id
              );

              const isOld = payment.daysOverdue >= 30;

              return (
                <div
                  key={payment.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm ${
                    isOld ? "border-red-300" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div>
                      <h3 className="text-lg font-bold">
                        {client?.name ?? "Unknown client"}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {client?.phone ?? "No phone number"}
                      </p>

                      <p className="mt-2 text-sm text-slate-700">
                        {payment.description || "Bill"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isOld
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {payment.daysOverdue} days overdue
                    </span>

                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">

                    <div>
                      <p className="text-xs text-slate-500">
                        Bill amount
                      </p>
                      <p className="font-semibold">
                        {money(Number(payment.amount))}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Amount received
                      </p>
                      <p className="font-semibold text-green-700">
                        {money(Number(payment.amount_paid))}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Remaining balance
                      </p>
                      <p className="font-bold text-red-600">
                        {money(payment.balance)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Due date
                      </p>
                      <p className="font-semibold">
                        {new Date(
                          payment.due_date + "T00:00:00"
                        ).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">

                    <span className="text-xs font-medium text-slate-500">
                      {Number(payment.amount_paid) > 0
                        ? "Partially paid"
                        : "Unpaid"}
                    </span>

                    <Link
                      href="/payments"
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Manage Payment
                    </Link>

                  </div>
                </div>
              );
            })
          )}

        </section>

      </div>
    </main>
  );
}
