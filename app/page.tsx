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

  // 🔁 CENTRAL: fetch client profile
  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile load error:", error);
      return;
    }

    if (!data) return;

    setUser({
      email: data.email,
      points: data.points,
      isAdmin: data.is_admin,
    });
  };

  // 🔐 INIT SESSION (REFRESH FIX)
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error);
        setLoading(false);
        return;
      }

      const session = data.session;

      if (session?.user) {
        await loadUserProfile(session.user.id);
      }

      setLoading(false);
    };

    init();

    // 👂 LIVE AUTH LISTENER (important for login/logout sync)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          return;
        }

        await loadUserProfile(session.user.id);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔐 LOGIN
  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      alert(error.message);
      return;
    }

    if (!data.session?.user) {
      alert("Login failed - no session returned");
      return;
    }

    await loadUserProfile(data.session.user.id);
    setIsNewUser(false);
  };

  // 🚪 LOGOUT (CLEAN)
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setUser(null);
    setIsNewUser(false);
  };

  // 🆕 SIGNUP
  const handleSignup = async () => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      console.error("Signup error:", error);
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
      return;
    }

    setUser({
      email: data.user.email!,
      points: 10,
      isAdmin: false,
    });

    setIsNewUser(true);
  };

  // ⏳ LOADING STATE (fixes “overlay stuck” feeling)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-pink-500">Loading...</p>
      </div>
    );
  }

  // 🔐 LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-100 p-6">
        <Card className="p-8 rounded-2xl shadow-xl w-[350px] text-center bg-white/80 backdrop-blur-md border border-pink-100">
          <img
            src="/logo.jpg"
            alt="Lash Essence Logo"
            className="w-28 mx-auto mb-4"
          />

          <h1 className="text-2xl font-semibold mb-4 text-pink-600">
            VIP Rewards
          </h1>

          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Login
          </Button>

          <Button
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            onClick={handleSignup}
          >
            Sign Up
          </Button>
        </Card>
      </div>
    );
  }

  // 📊 DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        <Card className="p-6 rounded-2xl shadow-xl mb-6 bg-white/80 backdrop-blur-md border border-pink-100">
          
          {/* LOGOUT */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-pink-600 border-pink-200"
            >
              Logout
            </Button>
          </div>

          <h2 className="text-xl mb-2 text-pink-700">
            {isNewUser ? "Welcome to VIP ✨" : "Welcome back ✨"}
          </h2>

          <p className="text-4xl font-bold text-pink-600">
            {user.points} Points
          </p>

          <p className="text-sm mt-2 text-gray-600">
            {user.points < 50
              ? `${50 - user.points} points until reward 🎉`
              : "Reward unlocked 🎉"}
          </p>
        </Card>

        {/* ADMIN */}
        {user.isAdmin && (
          <Card className="p-4 mb-6 border border-pink-300 bg-pink-50">
            <h3 className="font-bold text-pink-700">Admin Panel</h3>
            <p className="text-sm text-gray-600">
              Admin access enabled
            </p>
          </Card>
        )}

        {/* REWARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[50, 100, 150].map((reward) => (
            <Card
              key={reward}
              className="p-4 rounded-2xl shadow-md bg-white/80 backdrop-blur-md border border-pink-100"
            >
              <CardContent>
                <p className="text-lg font-medium text-pink-700">
                  {reward} Points
                </p>
                <p className="text-sm text-gray-600">
                  {reward === 50
                    ? "$10 Off"
                    : reward === 100
                    ? "$25 Off"
                    : "Free Add-On"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
