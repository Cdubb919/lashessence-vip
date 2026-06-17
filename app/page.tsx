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
      .single();

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

      const { data } = await supabase.auth.getSession();

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return alert(error.message);
    if (!data.session?.user) return;

    await loadUserProfile(data.session.user.id);
    setIsNewUser(false);
  };

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsNewUser(false);
  };

  // SIGNUP
  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return alert(error.message);
    if (!data.user) return;

    await supabase.from("clients").insert([
      {
        id: data.user.id,
        email: data.user.email,
        points: 10,
        is_admin: false,
      },
    ]);

    try {
      await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.user.email }),
      });
    } catch (err) {
      console.error(err);
    }

    setUser({
      email: data.user.email!,
      points: 10,
      isAdmin: false,
    });

    setIsNewUser(true);
  };

  // 💎 REDEEM FUNCTION (NEW)
  const redeemReward = async (cost: number, label: string) => {
    if (!user) return;

    if (user.points < cost) {
      alert("Not enough points for this reward.");
      return;
    }

    const newPoints = user.points - cost;

    const { error } = await supabase
      .from("clients")
      .update({ points: newPoints })
      .eq("email", user.email);

    if (error) {
      console.error("Redeem error:", error);
      alert("Something went wrong redeeming reward.");
      return;
    }

    await supabase.from("reward_redemptions").insert([
      {
        client_email: user.email,
        reward: label,
        points_used: cost,
      },
    ]);

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
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <p className="text-pink-500 animate-pulse">
          Loading Lash Essence VIP...
        </p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-100 p-6">
        <Card className="p-8 rounded-3xl shadow-2xl w-[360px] text-center bg-white/70 backdrop-blur-xl border border-pink-100">
          <img src="/logo.jpg" className="w-24 mx-auto mb-4 rounded-full" />

          <h1 className="text-2xl font-semibold text-pink-600">
            Lash Essence VIP
          </h1>

          <p className="text-xs text-gray-500 mb-6">
            Luxury Rewards Experience
          </p>

          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-2"
          />

          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />

          <Button
            className="w-full mb-2 bg-pink-500 hover:bg-pink-600 text-white"
            onClick={handleLogin}
          >
            Sign In
          </Button>

          <Button
            className="w-full bg-white border border-pink-200 text-pink-600 hover:bg-pink-50"
            onClick={handleSignup}
          >
            Create Account
          </Button>
        </Card>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* HEADER */}
        <Card className="p-6 rounded-3xl shadow-xl bg-white/70 backdrop-blur-xl border border-pink-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" className="w-12 h-12 rounded-full" />

              <div>
                <h2 className="text-lg font-semibold text-pink-700">
                  VIP Dashboard
                </h2>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user.isAdmin && (
                <a
                  href="/admin"
                  className="text-pink-600 text-sm font-medium hover:underline"
                >
                  Open Admin CRM →
                </a>
              )}

              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-pink-600 border-pink-200"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* POINTS */}
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">Your Balance</p>

            <motion.h1 className="text-5xl font-bold text-pink-600">
              {user.points}
            </motion.h1>

            <p className="text-xs text-gray-500 mt-2">
              {user.points < 50
                ? `${50 - user.points} points until reward`
                : "Reward unlocked ✨"}
            </p>
          </div>
        </Card>

        {/* ADMIN */}
        {user.isAdmin && (
          <Card className="p-4 bg-pink-50 border border-pink-200">
            <p className="font-semibold text-pink-700">Admin Access Enabled</p>
          </Card>
        )}

        {/* REWARDS (WITH REDEEM BUTTONS) */}
        <Card className="p-5 rounded-3xl shadow-md bg-white/70 border border-pink-100">
          <CardContent>
            <h3 className="text-lg font-semibold text-pink-700 mb-4">
              Rewards
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { points: 50, label: "$10 Off" },
                { points: 100, label: "$25 Off" },
                { points: 150, label: "Free Add-On" },
              ].map((r) => (
                <div
                  key={r.points}
                  className="p-4 border rounded-xl bg-white space-y-2"
                >
                  <p className="font-semibold text-pink-700">
                    {r.points} Points
                  </p>

                  <p className="text-sm text-gray-600">{r.label}</p>

                  <Button
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={() => redeemReward(r.points, r.label)}
                  >
                    Redeem
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* HOW TO EARN */}
        <Card className="p-5 rounded-3xl shadow-md bg-white/70 border border-pink-100">
          <h3 className="text-lg font-semibold text-pink-700 mb-3">
            How You Earn Points ✨
          </h3>

          <div className="space-y-2 text-sm text-gray-600">
            <p>💖 +10 — Lash appointment visit</p>
            <p>🎉 +10 — Sign up bonus</p>
            <p>💬 +5 — 5-star review</p>
            <p>👯 +5 — Referral</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
