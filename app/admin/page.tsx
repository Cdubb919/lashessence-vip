"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { processAppointmentByEmail } from "@/lib/appointmentProcessor";

const ADMIN_PASSWORD = "vip2026"; // we will upgrade later 🔐

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  const [email, setEmail] = useState("");

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthed(true);
    } else {
      alert("Wrong password");
    }
  };

  const addPoints = async (points: number) => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email)
      .single();

    if (!data) return alert("Client not found");

    await supabase
      .from("clients")
      .update({ points: data.points + points })
      .eq("email", email);

    alert(`Added ${points} points`);
  };

  const redeemReward = async (email: string, cost: number, label: string) => {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("email", email)
    .single();

  if (!data) {
    alert("Client not found");
    return;
  }

  if (data.points < cost) {
    alert("Not enough points");
    return;
  }

  await supabase
    .from("clients")
    .update({ points: data.points - cost })
    .eq("email", email);

  alert(`${label} redeemed!`);
};

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f2]">
        <Card className="p-6 w-[320px] rounded-2xl shadow-xl">
          <h1 className="text-lg font-semibold mb-4">Admin Login</h1>

          <Input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />

          <Button className="w-full" onClick={login}>
            Enter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10 bg-[#f8f5f2]">
      <Card className="p-6 max-w-md mx-auto rounded-2xl shadow-xl">
        <h1 className="text-xl font-semibold mb-4">Admin Panel</h1>

        <Input
          placeholder="Client email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4"
        />

        <div className="flex flex-col gap-3">
          <Button onClick={() => addPoints(20)}>+20 Full Set</Button>
          <Button onClick={() => addPoints(10)}>+10 Fill</Button>
          <Button onClick={() => addPoints(25)}>+25 Referral</Button>
          <Button onClick={() => addPoints(10)}>+10 Review</Button>
        </div>
        <div className="mt-6 border-t pt-4 flex flex-col gap-3">
  <h2 className="text-sm font-semibold mb-2">
    Redeem Rewards
  </h2>

  <Button onClick={() => redeemReward(email, 50, "$10 Off")}>
    Redeem $10 Off (50 pts)
  </Button>

  <Button onClick={() => redeemReward(email, 100, "$25 Off")}>
    Redeem $25 Off (100 pts)
  </Button>

  <Button onClick={() => redeemReward(email, 150, "Free Add-On")}>
    Redeem Free Add-On (150 pts)
  </Button>

<Button
  onClick={async () => {
    console.log("🚀 Button clicked");

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
    console.log("✅ Response:", data);
  }}
>
  Test Webhook
</Button>
</div>
      </Card>
    </div>
  );
}