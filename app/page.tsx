"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Wallet,
  Users,
  WalletCards,
  Clock3,
  ShieldCheck,
  ChevronRight,
  FileText,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Client management",
    text: "Keep client contact details and business information organized in one place.",
  },
  {
    icon: WalletCards,
    title: "Payment tracking",
    text: "Track bills, due dates, partial payments and outstanding balances.",
  },
  {
    icon: BellRing,
    title: "Daily follow-ups",
    text: "Quickly identify overdue bills and stay on top of pending collections.",
  },
];

const quickActions = [
  {
    icon: Users,
    title: "Manage Clients",
    description: "Add, edit and manage your clients.",
    href: "/clients",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: FileText,
    title: "Manage Payments",
    description: "Track bills and payment collections.",
    href: "/payments",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Clock3,
    title: "Overdue Payments",
    description: "Review pending and overdue bills.",
    href: "/overdue",
    color: "bg-rose-50 text-rose-600",
  },
];

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
  const [overview, setOverview] = useState({
  outstanding: 0,
  overdueCount: 0,
});

const [overviewLoading, setOverviewLoading] = useState(true);
const [overviewError, setOverviewError] = useState("");

useEffect(() => {
  async function loadOverview() {
    setOverviewLoading(true);
    setOverviewError("");

    const { data, error } = await supabase
      .from("payments")
      .select("amount, amount_paid, due_date, status");

    if (error) {
      console.error("Landing page overview error:", error);
      setOverviewError("Unable to load");
      setOverviewLoading(false);
      return;
    }

    const today = getIndiaToday();

    let totalOutstanding = 0;
    let overdueCount = 0;

    for (const payment of data ?? []) {
      const amount = Number(payment.amount ?? 0);
      const amountPaid = Number(payment.amount_paid ?? 0);
      const balance = Math.max(0, amount - amountPaid);

      if (payment.status !== "paid" && balance > 0) {
        totalOutstanding += balance;

        if (payment.due_date < today) {
          overdueCount++;
        }
      }
    }

    setOverview({
      outstanding: totalOutstanding,
      overdueCount,
    });

    setOverviewLoading(false);
  }

  loadOverview();
}, []);
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Wallet size={23} />
            </span>

            <span>
              <span className="block text-lg font-bold tracking-tight">
                Ratna Enterprise
              </span>
              <span className="block text-xs text-slate-500">
                SmartPay Reminder
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <Link href="/clients" className="hover:text-indigo-600">
              Clients
            </Link>
            <Link href="/payments" className="hover:text-indigo-600">
              Payments
            </Link>
            <Link href="/overdue" className="hover:text-indigo-600">
              Overdue
            </Link>
          </nav>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Dashboard
            <ArrowRight size={16} />
          </Link>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Hero */}
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">

          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              <CheckCircle2 size={16} />
              Payment follow-ups, made simpler
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Manage your business payments.
              <span className="mt-2 block text-indigo-600">
                Stay in control.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
              A smarter way to manage clients, track payment collections,
              monitor outstanding bills and never miss an important follow-up.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Open Dashboard
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/clients"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Manage Clients
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-600" />
                Organized records
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-600" />
                Easy tracking
              </span>
            </div>
          </div>

          {/* Business overview preview */}
          <div className="relative">

            <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />
            <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full bg-blue-100 blur-3xl" />

            <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-7">

              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-sm text-slate-500">
                    Business overview
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Payment snapshot
                  </h2>
                </div>

                <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <WalletCards size={25} />
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Outstanding
                    </span>
                    <Wallet size={18} className="text-indigo-600" />
                  </div>
                  <p className="mt-3 text-2xl font-bold">{overviewLoading
  ? "Loading..."
  : overviewError
    ? "Unavailable"
    : formatINR(overview.outstanding)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pending collections
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-rose-600">
                      Overdue bills
                    </span>
                    <BellRing size={18} className="text-rose-600" />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-rose-700">
                    {overviewLoading
  ? "..."
  : overviewError
    ? "—"
    : overview.overdueCount}
                  </p>
                  <p className="mt-1 text-xs text-rose-600">
                    Require attention
                  </p>
                </div>

              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-5">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                      <Clock3 size={19} />
                    </span>
                    <div>
                      <p className="font-semibold">Payment follow-ups</p>
                      <p className="text-xs text-slate-500">
                        Keep track of pending bills
                      </p>
                    </div>
                  </div>

                  <TrendingUp size={20} className="text-indigo-500" />
                </div>

                <div className="mt-5 space-y-3">

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                        01
                      </span>
                      <span className="text-sm font-medium">
                        Client management
                      </span>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                        02
                      </span>
                      <span className="text-sm font-medium">
                        Payment tracking
                      </span>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                        03
                      </span>
                      <span className="text-sm font-medium">
                        Daily follow-ups
                      </span>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>

                </div>

                <Link
                  href="/dashboard"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  View business dashboard
                  <ChevronRight size={17} />
                </Link>

              </div>
            </div>
          </div>

        </section>

        {/* Quick access */}
        <section className="pb-16">

          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Quick access
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Manage your business
            </h2>
            <p className="mt-2 text-slate-600">
              Jump directly to the section you need.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className={`rounded-xl p-3 ${action.color}`}>
                      <Icon size={23} />
                    </span>

                    <div>
                      <h3 className="font-bold">{action.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    size={19}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
                  />
                </Link>
              );
            })}
          </div>

        </section>

        {/* Features */}
        <section id="features" className="border-t border-slate-200 py-16">

          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Everything in one place
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Built to simplify everyday business management
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Spend less time organizing payment records and more time
              focusing on your business.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">

            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="inline-flex rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                  <Icon size={24} />
                </span>

                <h3 className="mt-5 text-lg font-bold">{title}</h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {text}
                </p>
              </div>
            ))}

          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 py-7 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p className="font-semibold text-slate-700">
            Ratna Enterprise · SmartPay Reminder
          </p>
          <p>Simple. Organized. Reliable.</p>
        </footer>

      </div>
    </main>
  );
}
