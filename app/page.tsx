"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type User = {
  email: string;
  points: number;
  isAdmin?: boolean;
};

type Tier = {
  name: string;
  icon: string;
  minimum: number;
  nextMinimum: number | null;
  badgeClass: string;
  progressClass: string;
};

const getTier = (points: number): Tier => {
  if (points >= 200) {
    return {
      name: "Platinum",
      icon: "💎",
      minimum: 200,
      nextMinimum: null,
      badgeClass:
        "border-[#C7CDD4] bg-gradient-to-r from-[#EEF1F4] to-white text-[#4D5660]",
      progressClass: "bg-gradient-to-r from-[#C7CDD4] via-white to-[#AEB6C0]",
    };
  }

  if (points >= 100) {
    return {
      name: "Gold",
      icon: "👑",
      minimum: 100,
      nextMinimum: 200,
      badgeClass: "border-[#C6A86B] bg-[#FFF4D6] text-[#765515]",
      progressClass:
        "bg-gradient-to-r from-[#9B7B3E] via-[#E0C47E] to-[#C6A86B]",
    };
  }

  if (points >= 50) {
    return {
      name: "Silver",
      icon: "✨",
      minimum: 50,
      nextMinimum: 100,
      badgeClass: "border-[#C8CDD2] bg-[#F1F3F5] text-[#59616A]",
      progressClass:
        "bg-gradient-to-r from-[#8E969E] via-[#DCE0E4] to-[#AEB5BC]",
    };
  }

  return {
    name: "Bronze",
    icon: "🤎",
    minimum: 0,
    nextMinimum: 50,
    badgeClass: "border-[#B9855A] bg-[#F5E4D3] text-[#784820]",
    progressClass: "bg-gradient-to-r from-[#8A552F] via-[#C78F62] to-[#A66B3F]",
  };
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // LOAD PROFILE
  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("clients")
      .select("email, points, is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      console.error("Profile load error:", error);
      return;
    }

    setUser({
      email: data.email,
      points: data.points ?? 0,
      isAdmin: data.is_admin === true,
    });
  };

  // INIT SESSION
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session load error:", error);
        setLoading(false);
        return;
      }

      if (data.session?.user) {
        await loadUserProfile(data.session.user.id);
      }

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          return;
        }

        await loadUserProfile(session.user.id);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // LOGIN
  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert("Please enter your email and password.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.session?.user) return;

    await loadUserProfile(data.session.user.id);
    setIsNewUser(false);
  };

  // LOGOUT
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
      return;
    }

    setUser(null);
    setIsNewUser(false);
    setEmail("");
    setPassword("");
  };

  // SIGNUP
  const handleSignup = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert("Please enter an email and password.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.user) return;

    const { error: insertError } = await supabase.from("clients").insert([
      {
        id: data.user.id,
        email: data.user.email,
        points: 10,
        is_admin: false,
      },
    ]);

    if (insertError) {
      console.error("Client insert error:", insertError);
      alert(
        "Your account was created, but your rewards profile could not be set up.",
      );
      return;
    }

    try {
      const response = await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.user.email,
        }),
      });

      if (!response.ok) {
        console.error("Welcome email failed:", await response.text());
      }
    } catch (err) {
      console.error("Welcome email error:", err);
    }

    setUser({
      email: data.user.email!,
      points: 10,
      isAdmin: false,
    });

    setIsNewUser(true);
  };

  // REDEEM REWARD
  const redeemReward = async (cost: number, label: string) => {
    if (!user) return;

    if (user.points < cost) {
      alert("Not enough points for this reward.");
      return;
    }

    const confirmed = window.confirm(`Redeem ${label} for ${cost} points?`);

    if (!confirmed) return;

    const newPoints = user.points - cost;

    const { error: updateError } = await supabase
      .from("clients")
      .update({ points: newPoints })
      .eq("email", user.email);

    if (updateError) {
      console.error("Redeem error:", updateError);
      alert("Something went wrong while redeeming your reward.");
      return;
    }

    const { error: redemptionError } = await supabase
      .from("reward_redemptions")
      .insert([
        {
          client_email: user.email,
          reward: label,
          points_used: cost,
        },
      ]);

    if (redemptionError) {
      console.error("Redemption history error:", redemptionError);

      await supabase
        .from("clients")
        .update({ points: user.points })
        .eq("email", user.email);

      alert("Your reward could not be recorded. Your points were restored.");
      return;
    }

    setUser({
      ...user,
      points: newPoints,
    });

    alert(
      `${label} redeemed successfully ✨\n\nShow this reward at your next appointment.`,
    );
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F4EE] px-6">
        <img
          src="/logo.png"
          alt="Essence Beauty & Wellness"
          className="w-28 h-auto mb-6"
        />

        <p className="text-[#9B7B3E] animate-pulse font-medium">
          Loading your VIP experience...
        </p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#ffffff_0%,#F8F4EE_48%,#EEE4D4_100%)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[390px]"
        >
          <Card className="overflow-hidden rounded-[32px] border border-[#D9C59D]/60 bg-white/85 p-8 text-center shadow-[0_24px_70px_rgba(55,42,23,0.14)] backdrop-blur-xl">
            <img
              src="/logo.png"
              alt="Essence Beauty & Wellness"
              className="w-36 h-auto mx-auto mb-5"
            />

            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9B7B3E]">
              Beauty • Wellness • Education
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-[#171717]">
              VIP Rewards
            </h1>

            <p className="mt-2 mb-7 text-sm leading-6 text-[#6F675D]">
              Earn points, advance through exclusive VIP tiers, and unlock
              luxury rewards.
            </p>

            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                className="h-12 rounded-xl border-[#DCCBAA] bg-white text-[#171717] placeholder:text-[#9A9288] focus-visible:ring-[#C6A86B]"
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                className="h-12 rounded-xl border-[#DCCBAA] bg-white text-[#171717] placeholder:text-[#9A9288] focus-visible:ring-[#C6A86B]"
              />

              <Button
                className="h-12 w-full rounded-xl bg-[#171717] text-white hover:bg-[#2B2B2B]"
                onClick={handleLogin}
              >
                Sign In
              </Button>

              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-[#C6A86B] bg-[#FBF8F2] text-[#7A5D28] hover:bg-[#F4EAD7]"
                onClick={handleSignup}
              >
                Create VIP Account
              </Button>
            </div>

            <a
              href="https://essencebeautyandwellness.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-xs font-medium text-[#8A6A32] underline-offset-4 hover:underline"
            >
              Visit Essence Beauty & Wellness
            </a>
          </Card>
        </motion.div>
      </div>
    );
  }

  const tier = getTier(user.points);

  const tierProgress =
    tier.nextMinimum === null
      ? 100
      : Math.min(
          ((user.points - tier.minimum) / (tier.nextMinimum - tier.minimum)) *
            100,
          100,
        );

  const pointsUntilNextTier =
    tier.nextMinimum === null ? 0 : Math.max(tier.nextMinimum - user.points, 0);

  // DASHBOARD
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#F8F4EE_52%,#EEE4D4_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-5xl space-y-6"
      >
        {/* HEADER */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/85 p-5 shadow-[0_20px_60px_rgba(55,42,23,0.12)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src="/logo.png"
                alt="Essence Beauty & Wellness"
                className="w-20 h-auto shrink-0"
              />

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B7B3E]">
                  Essence Beauty & Wellness
                </p>

                <h2 className="mt-1 text-2xl font-semibold text-[#171717]">
                  VIP Dashboard
                </h2>

                <p className="mt-1 truncate text-xs text-[#756D63]">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user.isAdmin && (
                <a
                  href="/admin"
                  className="rounded-xl border border-[#C6A86B] px-4 py-2 text-sm font-semibold text-[#7A5D28] transition hover:bg-[#F4EAD7]"
                >
                  Open Admin CRM
                </a>
              )}

              <Button
                onClick={handleLogout}
                variant="outline"
                className="rounded-xl border-[#D4C6AF] text-[#514A42] hover:bg-[#F5F0E8]"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* VIP BALANCE + TIER */}
          <div className="mt-7 rounded-[28px] bg-[#171717] px-6 py-8 text-center text-white shadow-inner">
            <div
              className={`mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${tier.badgeClass}`}
            >
              <span>{tier.icon}</span>
              <span>{tier.name} VIP Member</span>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-[#D8C18F]">
              Your VIP Balance
            </p>

            <motion.p
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              className="mt-2 text-6xl font-semibold"
            >
              {user.points}
            </motion.p>

            <p className="mt-1 text-sm text-[#D8D3CB]">VIP reward points</p>

            <div className="mx-auto mt-6 max-w-md">
              <div className="mb-2 flex items-center justify-between text-xs text-[#D8D3CB]">
                <span>{tier.name}</span>

                <span>
                  {tier.nextMinimum
                    ? `${pointsUntilNextTier} points to next tier`
                    : "Highest tier achieved"}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${tier.progressClass}`}
                  style={{
                    width: `${tierProgress}%`,
                  }}
                />
              </div>

              {tier.nextMinimum ? (
                <p className="mt-3 text-xs text-[#BDB7AE]">
                  Reach {tier.nextMinimum} points to become a{" "}
                  {getTier(tier.nextMinimum).name} VIP Member.
                </p>
              ) : (
                <p className="mt-3 text-xs text-[#D8C18F]">
                  You have reached our highest VIP membership level ✨
                </p>
              )}
            </div>

            <p className="mt-6 text-sm text-[#D8D3CB]">
              {user.points < 50
                ? `${50 - user.points} points until your first reward`
                : "You have a reward ready to redeem ✨"}
            </p>

            <a
              href="https://lashessence.square.site"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#C6A86B] px-6 py-3 text-sm font-semibold text-[#171717] transition hover:bg-[#D6BA7F]"
            >
              Book Appointment & View Services
            </a>
          </div>
        </Card>

        {isNewUser && (
          <Card className="rounded-2xl border border-[#D9C59D] bg-[#FFF9EC] p-4 text-center">
            <p className="font-semibold text-[#7A5D28]">
              Welcome to Essence Beauty & Wellness VIP ✨
            </p>
            <p className="mt-1 text-sm text-[#6F675D]">
              Your first 10 reward points have been added.
            </p>
          </Card>
        )}

        {/* VIP TIER GUIDE */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/85 p-5 shadow-[0_16px_45px_rgba(55,42,23,0.08)] sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B7B3E]">
            Membership Levels
          </p>

          <h3 className="mt-1 text-2xl font-semibold text-[#171717]">
            Essence VIP Tiers
          </h3>

          <p className="mt-1 text-sm text-[#756D63]">
            Keep earning points to advance through our VIP membership levels.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Bronze",
                icon: "🤎",
                range: "0–49 Points",
                minimum: 0,
                className: "border-[#B9855A] bg-[#F5E4D3] text-[#784820]",
              },
              {
                name: "Silver",
                icon: "✨",
                range: "50–99 Points",
                minimum: 50,
                className: "border-[#C8CDD2] bg-[#F1F3F5] text-[#59616A]",
              },
              {
                name: "Gold",
                icon: "👑",
                range: "100–199 Points",
                minimum: 100,
                className: "border-[#C6A86B] bg-[#FFF4D6] text-[#765515]",
              },
              {
                name: "Platinum",
                icon: "💎",
                range: "200+ Points",
                minimum: 200,
                className:
                  "border-[#C7CDD4] bg-gradient-to-br from-[#EEF1F4] to-white text-[#4D5660]",
              },
            ].map((membershipTier) => {
              const active = tier.name === membershipTier.name;
              const achieved = user.points >= membershipTier.minimum;

              return (
                <div
                  key={membershipTier.name}
                  className={`relative rounded-2xl border p-5 text-center transition ${membershipTier.className} ${
                    active
                      ? "scale-[1.02] shadow-lg ring-2 ring-[#171717]"
                      : achieved
                        ? "opacity-100"
                        : "opacity-55"
                  }`}
                >
                  {active && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#171717] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                      Current
                    </span>
                  )}

                  <p className="text-3xl">{membershipTier.icon}</p>

                  <p className="mt-3 text-lg font-bold">
                    {membershipTier.name}
                  </p>

                  <p className="mt-1 text-xs font-medium">
                    {membershipTier.range}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* REWARDS */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/85 p-5 shadow-[0_16px_45px_rgba(55,42,23,0.08)] sm:p-7">
          <CardContent className="p-0">
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B7B3E]">
                Member Benefits
              </p>

              <h3 className="mt-1 text-2xl font-semibold text-[#171717]">
                Your VIP Rewards
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { points: 50, label: "$10 Off" },
                { points: 100, label: "$25 Off" },
                { points: 150, label: "Free Luxury Add-On" },
              ].map((reward) => {
                const unlocked = user.points >= reward.points;

                return (
                  <div
                    key={reward.points}
                    className={`rounded-2xl border p-5 transition ${
                      unlocked
                        ? "border-[#C6A86B] bg-[#FFF9EC]"
                        : "border-[#E5DDD0] bg-[#FAF8F4]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#9B7B3E]">
                      {reward.points} Points
                    </p>

                    <p className="mt-2 text-lg font-semibold text-[#171717]">
                      {reward.label}
                    </p>

                    <p className="mt-1 text-xs text-[#756D63]">
                      {unlocked
                        ? "Available to redeem now"
                        : `${reward.points - user.points} more points needed`}
                    </p>

                    <Button
                      disabled={!unlocked}
                      className={`mt-5 w-full rounded-xl ${
                        unlocked
                          ? "bg-[#171717] text-white hover:bg-[#2B2B2B]"
                          : "cursor-not-allowed bg-[#DED8CE] text-[#8B847B]"
                      }`}
                      onClick={() => redeemReward(reward.points, reward.label)}
                    >
                      {unlocked ? "Redeem Reward" : "Locked"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* HOW TO EARN */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/85 p-5 shadow-[0_16px_45px_rgba(55,42,23,0.08)] sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B7B3E]">
            Keep Earning
          </p>

          <h3 className="mt-1 text-2xl font-semibold text-[#171717]">
            How You Earn Points
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                amount: "+10",
                title: "Appointment Visit",
                description: "Earn points after an eligible service visit.",
              },
              {
                amount: "+10",
                title: "VIP Sign-Up",
                description: "Your welcome bonus for joining the program.",
              },
              {
                amount: "+5",
                title: "Five-Star Review",
                description: "Share your experience and receive bonus points.",
              },
              {
                amount: "+5",
                title: "Client Referral",
                description: "Refer someone new to Essence Beauty & Wellness.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-[#E4D8C3] bg-[#FBF8F2] p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#171717] text-sm font-semibold text-[#D8C18F]">
                  {item.amount}
                </div>

                <div>
                  <p className="font-semibold text-[#171717]">{item.title}</p>
                  <p className="mt-1 text-sm leading-5 text-[#756D63]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* QUICK LINKS */}
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-[#171717] p-6 text-white shadow-[0_16px_45px_rgba(23,23,23,0.18)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D8C18F]">
                Essence Beauty & Wellness
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Ready for your next appointment?
              </h3>

              <p className="mt-1 text-sm text-[#D5D0C8]">
                Explore services, learn more about the studio, or reserve your
                next visit.
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
                Book Now
              </a>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
