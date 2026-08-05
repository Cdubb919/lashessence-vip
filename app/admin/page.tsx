"use client";

import { useEffect, useMemo, useState } from "react";
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

type Redemption = {
  id: string;
  client_email: string;
  reward: string;
  points_used: number;
  created_at: string;
};

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingClient, setUpdatingClient] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);

    const [
      { data: clientData, error: clientError },
      { data: redemptionData, error: redemptionError },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, email, points, created_at")
        .order("points", { ascending: false }),

      supabase
        .from("reward_redemptions")
        .select("id, client_email, reward, points_used, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (clientError) {
      console.error("Load clients error:", clientError);
      alert("Unable to load client accounts.");
    } else {
      setClients(clientData || []);
    }

    if (redemptionError) {
      console.error("Load redemptions error:", redemptionError);
    } else {
      setRedemptions(redemptionData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
  const checkAdmin = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      console.error("Admin auth error:", userError);
      window.location.replace("/");
      return;
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from("clients")
      .select("is_admin")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (adminError) {
      console.error("Admin profile error:", adminError);
      window.location.replace("/");
      return;
    }

    if (adminProfile?.is_admin !== true) {
      window.location.replace("/");
      return;
    }

    await loadDashboardData();
  };

  checkAdmin();
}, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
      return;
    }

    window.location.href = "/";
  };

  const addPoints = async (
    client: Client,
    points: number,
    reason: string,
  ) => {
    setUpdatingClient(client.id);

    const newPoints = client.points + points;

    const { error: updateError } = await supabase
      .from("clients")
      .update({ points: newPoints })
      .eq("id", client.id);

    if (updateError) {
      console.error("Update points error:", updateError);
      alert("The points could not be added.");
      setUpdatingClient(null);
      return;
    }

    try {
      const response = await fetch("/api/send-points-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: client.email,
          points,
          reason,
        }),
      });

      if (!response.ok) {
        console.error("Points email failed:", await response.text());
      }
    } catch (error) {
      console.error("Points email error:", error);
    }

    await loadDashboardData();
    setUpdatingClient(null);

    alert(
      `${points} points were added to ${client.email}.\n\nNew balance: ${newPoints} points.`,
    );
  };

  const redeemReward = async (
    client: Client,
    cost: number,
    reward: string,
  ) => {
    if (client.points < cost) {
      alert(
        `${client.email} does not have enough points for ${reward}.\n\nCurrent balance: ${client.points} points.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Redeem ${reward} for ${client.email}?\n\nThis will deduct ${cost} points.`,
    );

    if (!confirmed) return;

    setUpdatingClient(client.id);

    const newPoints = client.points - cost;

    const { error: updateError } = await supabase
      .from("clients")
      .update({ points: newPoints })
      .eq("id", client.id);

    if (updateError) {
      console.error("Reward update error:", updateError);
      alert("The reward could not be redeemed.");
      setUpdatingClient(null);
      return;
    }

    const { error: redemptionError } = await supabase
      .from("reward_redemptions")
      .insert([
        {
          client_email: client.email,
          reward,
          points_used: cost,
        },
      ]);

    if (redemptionError) {
      console.error("Redemption history error:", redemptionError);

      await supabase
        .from("clients")
        .update({ points: client.points })
        .eq("id", client.id);

      alert(
        "The redemption could not be recorded, so the client's points were restored.",
      );

      setUpdatingClient(null);
      return;
    }

    await loadDashboardData();
    setUpdatingClient(null);

    alert(
      `${reward} was redeemed successfully for ${client.email}.\n\nRemaining balance: ${newPoints} points.`,
    );
  };

  const filteredClients = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) return clients;

    return clients.filter((client) =>
      client.email.toLowerCase().includes(cleanSearch),
    );
  }, [clients, search]);

  const totalPoints = useMemo(
    () => clients.reduce((sum, client) => sum + client.points, 0),
    [clients],
  );

  const averagePoints =
    clients.length > 0 ? Math.round(totalPoints / clients.length) : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#F8F4EE_52%,#EEE4D4_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/90 p-5 shadow-[0_20px_60px_rgba(55,42,23,0.12)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src="/logo.png"
                alt="Essence Beauty & Wellness"
                className="w-24 h-auto shrink-0"
              />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B7B3E]">
                  Essence Beauty & Wellness
                </p>

                <h1 className="mt-1 text-3xl font-semibold text-[#171717]">
                  Admin CRM
                </h1>

                <p className="mt-1 text-sm text-[#756D63]">
                  Manage VIP members, points, rewards, and redemptions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-[#C6A86B] px-4 py-2 text-sm font-semibold text-[#7A5D28] transition hover:bg-[#F4EAD7]"
              >
                View VIP Dashboard
              </a>

              <a
                href="https://essencebeautyandwellness.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-[#D4C6AF] px-4 py-2 text-sm font-semibold text-[#514A42] transition hover:bg-[#F5F0E8]"
              >
                Business Website
              </a>

              <Button
                onClick={handleLogout}
                className="rounded-xl bg-[#171717] text-white hover:bg-[#2B2B2B]"
              >
                Logout
              </Button>
            </div>
          </div>
        </Card>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[28px] border border-[#D9C59D]/60 bg-white/90 p-6 text-center shadow-[0_14px_40px_rgba(55,42,23,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9B7B3E]">
              Total VIP Members
            </p>
            <p className="mt-3 text-4xl font-semibold text-[#171717]">
              {clients.length}
            </p>
          </Card>

          <Card className="rounded-[28px] border border-[#D9C59D]/60 bg-[#171717] p-6 text-center text-white shadow-[0_14px_40px_rgba(23,23,23,0.16)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D8C18F]">
              Current Points
            </p>
            <p className="mt-3 text-4xl font-semibold">{totalPoints}</p>
          </Card>

          <Card className="rounded-[28px] border border-[#D9C59D]/60 bg-white/90 p-6 text-center shadow-[0_14px_40px_rgba(55,42,23,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9B7B3E]">
              Average Balance
            </p>
            <p className="mt-3 text-4xl font-semibold text-[#171717]">
              {averagePoints}
            </p>
          </Card>
        </div>

        {/* CLIENT MANAGEMENT */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/90 p-5 shadow-[0_16px_45px_rgba(55,42,23,0.08)] sm:p-7">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B7B3E]">
              Member Management
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#171717]">
              VIP Client Accounts
            </h2>

            <p className="mt-1 text-sm text-[#756D63]">
              Search accounts, award points, and redeem client rewards.
            </p>
          </div>

          <Input
            type="search"
            placeholder="Search by client email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-5 h-12 rounded-xl border-[#DCCBAA] bg-[#FBF8F2] text-[#171717] placeholder:text-[#9A9288] focus-visible:ring-[#C6A86B]"
          />

          <div className="max-h-[620px] space-y-4 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-2xl border border-[#E4D8C3] bg-[#FBF8F2] p-8 text-center">
                <p className="animate-pulse text-sm font-medium text-[#9B7B3E]">
                  Loading VIP members...
                </p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="rounded-2xl border border-[#E4D8C3] bg-[#FBF8F2] p-8 text-center">
                <p className="text-sm text-[#756D63]">
                  No client accounts match that search.
                </p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isUpdating = updatingClient === client.id;

                return (
                  <div
                    key={client.id}
                    className="rounded-[24px] border border-[#E4D8C3] bg-[#FBF8F2] p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="break-all text-base font-semibold text-[#171717]">
                          {client.email}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#171717] px-3 py-1 text-xs font-semibold text-[#D8C18F]">
                            {client.points} points
                          </span>

                          <span className="text-xs text-[#8C8379]">
                            Joined{" "}
                            {new Date(client.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B7B3E]">
                            Award Points
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={isUpdating}
                              className="rounded-lg bg-[#F1E5CF] text-[#6E5123] hover:bg-[#E5D2AF]"
                              onClick={() =>
                                addPoints(
                                  client,
                                  5,
                                  "Five-star review or referral bonus",
                                )
                              }
                            >
                              +5
                            </Button>

                            <Button
                              size="sm"
                              disabled={isUpdating}
                              className="rounded-lg bg-[#DCC69A] text-[#3C2D15] hover:bg-[#D0B67E]"
                              onClick={() =>
                                addPoints(
                                  client,
                                  10,
                                  "Essence Beauty & Wellness appointment visit",
                                )
                              }
                            >
                              +10
                            </Button>

                            <Button
                              size="sm"
                              disabled={isUpdating}
                              className="rounded-lg bg-[#171717] text-white hover:bg-[#2B2B2B]"
                              onClick={() =>
                                addPoints(
                                  client,
                                  25,
                                  "VIP bonus or promotional reward",
                                )
                              }
                            >
                              +25
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B7B3E]">
                            Redeem Reward
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isUpdating || client.points < 50}
                              className="rounded-lg border-[#C6A86B] text-[#7A5D28] hover:bg-[#F4EAD7]"
                              onClick={() =>
                                redeemReward(client, 50, "$10 Off")
                              }
                            >
                              $10 Off
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isUpdating || client.points < 100}
                              className="rounded-lg border-[#C6A86B] text-[#7A5D28] hover:bg-[#F4EAD7]"
                              onClick={() =>
                                redeemReward(client, 100, "$25 Off")
                              }
                            >
                              $25 Off
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isUpdating || client.points < 150}
                              className="rounded-lg border-[#C6A86B] text-[#7A5D28] hover:bg-[#F4EAD7]"
                              onClick={() =>
                                redeemReward(
                                  client,
                                  150,
                                  "Free Luxury Add-On",
                                )
                              }
                            >
                              Free Add-On
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* REDEMPTION HISTORY */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/90 p-5 shadow-[0_16px_45px_rgba(55,42,23,0.08)] sm:p-7">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B7B3E]">
              Rewards Activity
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#171717]">
              Recent Reward Redemptions
            </h2>

            <p className="mt-1 text-sm text-[#756D63]">
              Review rewards claimed by Essence Beauty & Wellness VIP members.
            </p>
          </div>

          {loading ? (
            <p className="animate-pulse text-sm text-[#9B7B3E]">
              Loading redemption history...
            </p>
          ) : redemptions.length === 0 ? (
            <div className="rounded-2xl border border-[#E4D8C3] bg-[#FBF8F2] p-8 text-center">
              <p className="text-sm text-[#756D63]">
                No rewards have been redeemed yet.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#E4D8C3] bg-[#FBF8F2] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-all font-semibold text-[#171717]">
                      {redemption.client_email}
                    </p>

                    <p className="mt-1 text-sm text-[#756D63]">
                      {redemption.reward}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm font-semibold text-[#9B7B3E]">
                      {redemption.points_used} points used
                    </p>

                    <p className="mt-1 text-xs text-[#8C8379]">
                      {new Date(redemption.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* FOOTER LINKS */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-[#171717] p-6 text-white shadow-[0_16px_45px_rgba(23,23,23,0.18)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D8C18F]">
                Essence Beauty & Wellness
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                VIP Rewards Administration
              </h3>

              <p className="mt-1 text-sm text-[#D5D0C8]">
                Manage member activity while keeping booking and service
                information close by.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://essencebeautyandwellness.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Visit Website
              </a>

              <a
                href="https://lashessence.square.site"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#C6A86B] px-5 py-3 text-sm font-semibold text-[#171717] transition hover:bg-[#D6BA7F]"
              >
                Booking & Services
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}