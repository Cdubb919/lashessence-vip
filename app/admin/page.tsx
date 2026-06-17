"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Client = {
  id: string;
  email: string;
  points: number;
  created_at: string;
};

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 📊 LOAD CLIENTS
  const loadClients = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("points", { ascending: false });

    if (error) {
      console.error("Load clients error:", error);
    } else {
      setClients(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/";
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (error || !data?.is_admin) {
        window.location.href = "/";
        return;
      }

      loadClients();
    };

    checkAdmin();
  }, []);

  // ➕ ADD POINTS + EMAIL TRIGGER
  const addPoints = async (email: string, points: number, reason: string) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      alert("Client not found");
      return;
    }

    const newPoints = data.points + points;

    const { error: updateError } = await supabase
      .from("clients")
      .update({ points: newPoints })
      .eq("email", email);

    if (updateError) {
      console.error("UPDATE ERROR:", updateError);
      alert(JSON.stringify(updateError));
      return;
    }

    // 💌 SEND POINTS EMAIL
    try {
      await fetch("/api/send-points-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          points,
          reason,
        }),
      });
    } catch (err) {
      console.error("Email error:", err);
    }

    loadClients();
  };

  // 🎁 REDEEM REWARD
  const redeemReward = async (email: string, cost: number, reward: string) => {
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
      alert("Client does not have enough points.");
      return;
    }

    const newPoints = data.points - cost;

    const { error: updateError } = await supabase
      .from("clients")
      .update({ points: newPoints })
      .eq("email", email);

    if (updateError) {
      console.error(updateError);
      alert("Failed to redeem reward");
      return;
    }

    alert(
      `${reward} redeemed successfully.\n\nClient should show this reward at their next visit.`,
    );

    loadClients();
  };

  // 🔍 FILTER SEARCH
  const filteredClients = clients.filter((c) =>
    c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 p-6">
      <Card className="max-w-4xl mx-auto p-6 rounded-3xl shadow-xl bg-white/70 backdrop-blur-xl border border-pink-100">
        <h1 className="text-2xl font-semibold text-pink-700 mb-4">
          Lash Essence Admin CRM
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Total Clients</p>
            <p className="text-3xl font-bold text-pink-600">{clients.length}</p>
          </Card>

          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Points Issued</p>
            <p className="text-3xl font-bold text-pink-600">
              {clients.reduce((sum, c) => sum + c.points, 0)}
            </p>
          </Card>

          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Average Points</p>
            <p className="text-3xl font-bold text-pink-600">
              {clients.length
                ? Math.round(
                    clients.reduce((sum, c) => sum + c.points, 0) /
                      clients.length,
                  )
                : 0}
            </p>
          </Card>
        </div>

        {/* SEARCH */}
        <Input
          placeholder="Search client email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {/* CLIENT LIST */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {loading ? (
            <p className="text-gray-500">Loading clients...</p>
          ) : filteredClients.length === 0 ? (
            <p className="text-gray-500">No clients found</p>
          ) : (
            filteredClients.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center p-4 bg-white rounded-xl border border-pink-100 shadow-sm"
              >
                {/* CLIENT INFO */}
                <div>
                  <p className="font-medium text-pink-800">{c.email}</p>
                  <p className="text-xs text-gray-500">{c.points} points</p>

                  <p className="text-xs text-gray-400">
                    Joined {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 flex-wrap justify-end">
                  <Button
                    size="sm"
                    className="bg-pink-100 text-pink-700 hover:bg-pink-200"
                    onClick={() =>
                      addPoints(c.email, 5, "Engagement bonus / review")
                    }
                  >
                    +5
                  </Button>

                  <Button
                    size="sm"
                    className="bg-pink-200 text-pink-800 hover:bg-pink-300"
                    onClick={() =>
                      addPoints(c.email, 10, "Lash appointment / visit")
                    }
                  >
                    +10
                  </Button>

                  <Button
                    size="sm"
                    className="bg-pink-300 text-pink-900 hover:bg-pink-400"
                    onClick={() =>
                      addPoints(c.email, 25, "Referral / premium reward")
                    }
                  >
                    +25
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => redeemReward(c.email, 50, "$10 Off")}
                  >
                    $10 Off
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => redeemReward(c.email, 100, "$25 Off")}
                  >
                    $25 Off
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => redeemReward(c.email, 150, "Free Add-On")}
                  >
                    Add-On
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
