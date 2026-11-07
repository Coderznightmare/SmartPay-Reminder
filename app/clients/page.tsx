
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Client = {
  id: string;
  name: string;
  phone: string;
  created_at?: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadClients() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setClients([]);
    } else {
      setClients((data ?? []) as Client[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadClients();
  }, []);

  function resetForm() {
    setName("");
    setPhone("");
    setEditingClientId(null);
    setError("");
    setSuccess("");
  }

  function handleEdit(client: Client) {
    setEditingClientId(client.id);
    setName(client.name);
    setPhone(client.phone);

    setError("");
    setSuccess("Editing " + client.name);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone) {
      setError("Please enter both the client's name and phone number.");
      setSaving(false);
      return;
    }

    if (editingClientId) {
      // UPDATE EXISTING CLIENT
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          name: cleanName,
          phone: cleanPhone,
        })
        .eq("id", editingClientId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess("Client details updated successfully.");
        resetForm();
        await loadClients();
      }
    } else {
      // ADD NEW CLIENT
      const { error: insertError } = await supabase
        .from("clients")
        .insert({
          name: cleanName,
          phone: cleanPhone,
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess("Client added successfully.");
        setName("");
        setPhone("");
        await loadClients();
      }
    }

    setSaving(false);
  }

  
async function handleDelete(client: Client) {
  const confirmed = window.confirm(
    `WARNING: Permanently delete ${client.name}?\n\n` +
    `This will also delete ALL payment records and payment transactions ` +
    `belonging to this client.\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  setDeletingId(client.id);
  setError("");
  setSuccess("");

  const { error: deleteError } = await supabase.rpc(
    "delete_client_with_history",
    {
      p_client_id: client.id,
    }
  );

  if (deleteError) {
    setError("Unable to delete client: " + deleteError.message);
  } else {
    setSuccess(
      `${client.name} and all associated payment history were deleted.`
    );

    if (editingClientId === client.id) {
      resetForm();
    }

    await loadClients();
  }

  setDeletingId(null);
}


    // SAFETY CHECK: See whether this client has any payment records.
   /* const { data: payments, error: paymentCheckError } = await supabase
      .from("payments")
      .select("id")
      .eq("client_id", client.id)
      .limit(1);

    if (paymentCheckError) {
      setError(
        "Could not verify this client's payment history. No deletion was performed. " +
        paymentCheckError.message
      );
      setDeletingId(null);
      return;
    }

    if (payments && payments.length > 0) {
      setError(
        `${client.name} cannot be deleted because this client has payment records. ` +
        "This protects your existing financial history."
      );
      setDeletingId(null);
      return;
    }*/

    // Delete only if no payment records exist.
    /*const { data: deletedClient, error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      setError("Unable to delete client: " + deleteError.message);
    } else if (!deletedClient) {
      setError("Client was not deleted. Please check your database permissions.");
    } else {
      setSuccess("Client deleted successfully.");

      if (editingClientId === client.id) {
        resetForm();
      }

      await loadClients();
    }

    setDeletingId(null);
  }*/

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">

        {/* PAGE HEADER */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="mt-2 text-slate-600">
              Add and manage your business clients.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Dashboard
          </Link>
        </div>

        {/* ADD / EDIT CLIENT FORM */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold">
            {editingClientId ? "Edit Client Details" : "Add New Client"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="client-name"
                className="mb-1 block text-sm font-medium"
              >
                Client name
              </label>

              <input
                id="client-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Rahul Sharma"
                maxLength={120}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="client-phone"
                className="mb-1 block text-sm font-medium"
              >
                Phone number
              </label>

              <input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. +91 9876543210"
                maxLength={25}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                {success}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingClientId
                    ? "Save Changes"
                    : "Add Client"}
              </button>

              {editingClientId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* CLIENT LIST */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Clients</h2>

            <button
              type="button"
              onClick={() => void loadClients()}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-slate-500">
              No clients yet. Add your first client using the form above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Added</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-4 font-medium">
                        {client.name}
                      </td>

                      <td className="px-3 py-4">
                        {client.phone}
                      </td>

                      <td className="px-3 py-4 text-slate-500">
                        {client.created_at
                          ? new Date(client.created_at).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(client)}
                            disabled={saving || deletingId !== null}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(client)}
                            disabled={deletingId !== null || saving}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === client.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
