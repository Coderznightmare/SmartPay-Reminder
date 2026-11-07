/*
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Payment = {
  id: string;
  client_id: string;
  amount: number | string;
  amount_paid: number | string | null;
  due_date: string;
  description: string | null;
};

type Client = {
  id: string;
  name: string;
  phone: string;
};

function getIndiaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function calculateDaysOverdue(dueDate: string, today: string): number {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);

  return Math.floor((current - due) / 86400000);
}

export async function GET(request: NextRequest) {
  try {
    // Verify that the request is authorized.
    const secret = process.env.CRON_SECRET;

    if (!secret) {
      return Response.json(
        { success: false, error: "CRON_SECRET is not configured" },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (authorization !== `Bearer ${secret}`) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = getIndiaToday();

    // Get all bills whose due dates have passed.
    const { data: payments, error: paymentError } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id, client_id, amount, amount_paid, due_date, description"
        )
        .lt("due_date", today);

    if (paymentError) {
      throw paymentError;
    }

    // Get client details.
    const { data: clients, error: clientError } =
      await supabaseAdmin
        .from("clients")
        .select("id, name, phone");

    if (clientError) {
      throw clientError;
    }

    const clientMap = new Map(
      (clients as Client[]).map((client) => [
        client.id,
        client,
      ])
    );

    // Keep only bills with an outstanding balance.
    const reminderItems = (payments as Payment[])
      .map((payment) => {
        const amount = Number(payment.amount);
        const amountPaid = Number(payment.amount_paid ?? 0);
        const balance = Number((amount - amountPaid).toFixed(2));

        const client = clientMap.get(payment.client_id);

        return {
          payment_id: payment.id,
          client_name: client?.name ?? "Unknown client",
          phone: client?.phone ?? "",
          due_date: payment.due_date,
          outstanding_amount: balance,
          days_overdue: calculateDaysOverdue(
            payment.due_date,
            today
          ),
          description: payment.description ?? "",
        };
      })
      .filter((item) => item.outstanding_amount > 0)
      .sort((a, b) => b.days_overdue - a.days_overdue);

    const totalOutstanding = Number(
      reminderItems
        .reduce(
          (total, item) => total + item.outstanding_amount,
          0
        )
        .toFixed(2)
    );

    // Save one digest per India calendar date.
    // Re-running the endpoint updates today's digest instead
    // of creating a duplicate.
    const { error: saveError } = await supabaseAdmin
      .from("daily_reminder_runs")
      .upsert(
        {
          run_date: today,
          overdue_count: reminderItems.length,
          total_outstanding: totalOutstanding,
          reminder_items: reminderItems,
        },
        { onConflict: "run_date" }
      );

    if (saveError) {
      throw saveError;
    }

    return Response.json({
      success: true,
      message: "Daily overdue check completed",
      timezone: "Asia/Kolkata",
      run_date: today,
      overdue_count: reminderItems.length,
      total_outstanding: totalOutstanding,
      reminders: reminderItems,
    });
  } catch (error) {
    console.error("Daily reminder error:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to process daily reminders",
      },
      { status: 500 }
    );
  }
} 
  */



import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function calculateDaysOverdue(dueDate: string, today: string) {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);

  return Math.floor((current - due) / 86400000);
}

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
      return NextResponse.json(
        { success: false, error: "CRON_SECRET is missing" },
        { status: 500 }
      );
    }

    if (
      request.headers.get("authorization") !== `Bearer ${secret}`
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = getIndiaToday();

    const { data: payments, error: paymentError } =
      await supabaseAdmin
        .from("payments")
        .select("id, client_id, amount, amount_paid, due_date, description")
        .lt("due_date", today);

    if (paymentError) throw paymentError;

    const { data: clients, error: clientError } =
      await supabaseAdmin
        .from("clients")
        .select("id, name, phone");

    if (clientError) throw clientError;

    const clientMap = new Map(
      (clients ?? []).map((client) => [client.id, client])
    );

    const reminders = (payments ?? [])
      .map((payment) => {
        const amount = Number(payment.amount);
        const amountPaid = Number(payment.amount_paid ?? 0);
        const balance = Number((amount - amountPaid).toFixed(2));
        const client = clientMap.get(payment.client_id);

        return {
          payment_id: payment.id,
          client_name: client?.name ?? "Unknown client",
          phone: client?.phone ?? "",
          due_date: payment.due_date,
          outstanding_amount: balance,
          days_overdue: calculateDaysOverdue(
            payment.due_date,
            today
          ),
          description: payment.description ?? "",
        };
      })
      .filter((item) => item.outstanding_amount > 0)
      .sort((a, b) => b.days_overdue - a.days_overdue);

    const totalOutstanding = Number(
      reminders
        .reduce((sum, item) => sum + item.outstanding_amount, 0)
        .toFixed(2)
    );

    const { error: saveError } = await supabaseAdmin
      .from("daily_reminder_runs")
      .upsert(
        {
          run_date: today,
          overdue_count: reminders.length,
          total_outstanding: totalOutstanding,
          reminder_items: reminders,
        },
        { onConflict: "run_date" }
      );

    if (saveError) throw saveError;

    return NextResponse.json({
      success: true,
      message: "Daily overdue check completed",
      run_date: today,
      timezone: "Asia/Kolkata",
      overdue_count: reminders.length,
      total_outstanding: totalOutstanding,
      reminders,
    });
  } catch (error) {
    console.error("Daily reminder error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}


