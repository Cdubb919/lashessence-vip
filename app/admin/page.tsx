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
    loadClients();
  }, []);

  // ➕ ADD POINTS + EMAIL TRIGGER
  const addPoints = async (
    email: string,
    points: number,
    reason: string
  ) => {
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
      console.error("Update error:", updateError);
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

  // 🔍 FILTER SEARCH
  const filteredClients = clients.filter((c) =>
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 p-6">

      <Card className="max-w-4xl mx-auto p-6 rounded-3xl shadow-xl bg-white/70 backdrop-blur-xl border border-pink-100">

        <h1 className="text-2xl font-semibold text-pink-700 mb-4">
          Lash Essence Admin CRM
        </h1>

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
                  <p className="font-medium text-pink-800">
                    {c.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.points} points
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 flex-wrap justify-end">

                  <Button
                    size="sm"
                    className="bg-pink-100 text-pink-700 hover:bg-pink-200"
                    onClick={() =>
                      addPoints(
                        c.email,
                        5,
                        "Engagement bonus / review"
                      )
                    }
                  >
                    +5
                  </Button>

                  <Button
                    size="sm"
                    className="bg-pink-200 text-pink-800 hover:bg-pink-300"
                    onClick={() =>
                      addPoints(
                        c.email,
                        10,
                        "Lash appointment / visit"
                      )
                    }
                  >
                    +10
                  </Button>

                  <Button
                    size="sm"
                    className="bg-pink-300 text-pink-900 hover:bg-pink-400"
                    onClick={() =>
                      addPoints(
                        c.email,
                        25,
                        "Referral / premium reward"
                      )
                    }
                  >
                    +25
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