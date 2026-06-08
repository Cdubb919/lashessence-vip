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
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Profile error:", error);
      return;
    }

    setUser({
      email: data.email,
      points: data.points,
      isAdmin: data.is_admin,
    });
  };

  // INIT SESSION (fix refresh logout issue)
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
      }
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

  // SIGNUP + WELCOME EMAIL
  const handleSignup = async () => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) return alert(error.message);
    if (!data.user) return;

    // create client record
    const { error: insertError } = await supabase.from("clients").insert([
      {
        id: data.user.id,
        email: data.user.email,
        points: 10,
        is_admin: false,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      return;
    }

    // SEND WELCOME EMAIL
    try {
      await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.user.email }),
      });
    } catch (err) {
      console.error("Email error:", err);
    }

    setUser({
      email: data.user.email!,
      points: 10,
      isAdmin: false,
    });

    setIsNewUser(true);
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

          <img src="/logo.jpg" className="w-24 mx-auto mb-4 rounded-full shadow-md" />

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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* HEADER */}
        <Card className="p-6 rounded-3xl shadow-xl mb-6 bg-white/70 backdrop-blur-xl border border-pink-100">

          <div className="flex justify-between items-center mb-4">

            <div className="flex items-center gap-3">
              <img src="/logo.jpg" className="w-12 h-12 rounded-full shadow-md" />

              <div>
                <h2 className="text-lg font-semibold text-pink-700">
                  VIP Dashboard
                </h2>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-pink-600 border-pink-200"
            >
              Logout
            </Button>

          </div>

          {/* POINTS */}
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Your Balance</p>

            <motion.h1 className="text-5xl font-bold text-pink-600">
              {user.points}
            </motion.h1>

            <p className="text-xs text-gray-500 mt-1">
              {user.points < 50
                ? `${50 - user.points} points until reward`
                : "Reward unlocked ✨"}
            </p>
          </div>

        </Card>

        {/* ADMIN */}
        {user.isAdmin && (
          <Card className="p-4 mb-6 bg-pink-50 border border-pink-200">
            <p className="font-semibold text-pink-700">Admin Access Enabled</p>
          </Card>
        )}

        {/* REWARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {[50, 100, 150].map((r) => (
            <Card key={r} className="p-5 rounded-3xl shadow-md bg-white/70 border border-pink-100">

              <CardContent>
                <p className="text-lg font-semibold text-pink-700">
                  {r} Points
                </p>

                <p className="text-sm text-gray-600">
                  {r === 50
                    ? "$10 Off"
                    : r === 100
                    ? "$25 Off"
                    : "Free Luxury Add-On"}
                </p>
              </CardContent>

            </Card>
          ))}

        </div>

      </motion.div>
    </div>
  );
}