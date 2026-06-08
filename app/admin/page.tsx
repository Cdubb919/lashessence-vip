"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Client = {
  id: string;
  email: string;
  points: number;
};

const ADMIN_EMAILS = ["lashessence512@gmail.com"];

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [clientEmail, setClientEmail] = useState("");

  // =========================
  // LOAD CLIENTS
  // =========================
  const loadClients = async () => {
    try {
      setLoadingClients(true);

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("points", { ascending: false });

      if (error) {
        console.error("Load clients error:", error.message);
        alert("Failed to load clients");
        return;
      }

      setClients(data || []);
    } catch (err) {
      console.error("Unexpected load error:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const login = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        alert(error.message);
        return;
      }

      const userEmail = data.user?.email;

      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        await supabase.auth.signOut();
        alert("Not authorized as admin");
        return;
      }

      setIsAuthed(true);
      await loadClients();
    } catch (err) {
      console.error("Login exception:", err);
    }
  };

  // =========================
  // ADD POINTS
  // =========================
  const addPoints = async (email: string, points: number) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) {
        console.error("Find client error:", error);
        alert("Client not found");
        return;
      }

      const { error: updateError } = await supabase
        .from("clients")
        .update({ points: data.points + points })
        .eq("email", email);

      if (updateError) {
        console.error("Update error:", updateError.message);
        alert("Failed to update points");
        return;
      }

      await loadClients();
    } catch (err) {
      console.error("addPoints exception:", err);
    }
  };

  // =========================
  // REDEEM
  // =========================
  const redeemReward = async (email: string, cost: number, label: string) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) {
        alert("Client not found");
        return;
      }

      if (data.points < cost) {
        alert("Not enough points");
        return;
      }

      const { error: updateError } = await supabase
        .from("clients")
        .update({ points: data.points - cost })
        .eq("email", email);

      if (updateError) {
        alert("Redeem failed");
        return;
      }

      alert(`${label} redeemed!`);
      await loadClients();
    } catch (err) {
      console.error("redeem exception:", err);
    }
  };

  // =========================
  // UI: LOGIN SCREEN
  // =========================
  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f2]">
        <Card className="p-6 w-[320px] rounded-2xl shadow-xl">
          <h1 className="text-lg font-semibold mb-4">Admin Login</h1>

          <Input
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-2"
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />

          <Button className="w-full" onClick={login}>
            Login
          </Button>
        </Card>
      </div>
    );
  }

  // =========================
  // UI: DASHBOARD
  // =========================
  return (
    <div className="min-h-screen p-10 bg-[#f8f5f2]">
      <Card className="p-6 max-w-md mx-auto rounded-2xl shadow-xl">
        <h1 className="text-xl font-semibold mb-4">Admin Panel</h1>

        {/* CLIENT EMAIL INPUT */}
        <Input
          placeholder="Client email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          className="mb-4"
        />

        {/* POINTS ACTIONS */}
        <div className="flex flex-col gap-3">
          <Button onClick={() => addPoints(clientEmail, 20)}>
            +20 Full Set
          </Button>

          <Button onClick={() => addPoints(clientEmail, 10)}>
            +10 Fill
          </Button>

          <Button onClick={() => addPoints(clientEmail, 25)}>
            +25 Referral
          </Button>

          <Button onClick={() => addPoints(clientEmail, 10)}>
            +10 Review
          </Button>
        </div>

        {/* REDEEM */}
        <div className="mt-6 border-t pt-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold mb-2">Redeem Rewards</h2>

          <Button onClick={() => redeemReward(clientEmail, 50, "$10 Off")}>
            Redeem $10 Off (50 pts)
          </Button>

          <Button onClick={() => redeemReward(clientEmail, 100, "$25 Off")}>
            Redeem $25 Off (100 pts)
          </Button>

          <Button onClick={() => redeemReward(clientEmail, 150, "Free Add-On")}>
            Redeem Free Add-On (150 pts)
          </Button>
        </div>

        {/* CLIENT LIST */}
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Clients</h2>

            <Button size="sm" onClick={loadClients}>
              Refresh
            </Button>
          </div>

          {loadingClients ? (
            <p className="text-sm text-gray-500">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-gray-500">No clients found</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between items-center bg-white p-2 rounded"
                >
                  <div>
                    <p className="font-medium">{c.email}</p>
                    <p className="text-xs text-gray-500">
                      {c.points} points
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addPoints(c.email, 10)}>
                      +10
                    </Button>

                    <Button size="sm" onClick={() => addPoints(c.email, 25)}>
                      +25
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WEBHOOK TEST */}
        <div className="mt-6 border-t pt-4">
          <Button
            className="w-full"
            onClick={async () => {
              const res = await fetch("/api/square-webhook", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  data: {
                    object: {
                      customer: {
                        email_address: "test@gmail.com",
                      },
                      appointment: {
                        service_variation_name: "full set",
                      },
                    },
                  },
                }),
              });

              const data = await res.json();
              console.log("Webhook response:", data);
            }}
          >
            Test Webhook
          </Button>
        </div>
      </Card>
    </div>
  );
}