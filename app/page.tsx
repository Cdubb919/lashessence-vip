"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

type User = {
  name: string;
  points: number;
};

export default function App() {
 const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");

  const handleLogin = () => {
    setUser({ name: "Beautiful", points: 120 });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f2]">
        <Card className="p-8 rounded-2xl shadow-xl w-[350px] text-center">
          <h1 className="text-2xl font-semibold mb-4">VIP Rewards</h1>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4"
          />
          <Button className="w-full" onClick={handleLogin}>
            Enter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f2] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 rounded-2xl shadow-xl mb-6">
          <h2 className="text-xl mb-2">Welcome back, {user.name}</h2>
          <p className="text-4xl font-bold">{user.points} Points</p>
          <p className="text-sm mt-2">30 points until your next reward</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[50, 100, 150].map((reward) => (
            <Card key={reward} className="p-4 rounded-2xl shadow-md">
              <CardContent>
                <p className="text-lg font-medium">{reward} Points</p>
                <p className="text-sm">
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

        <Card className="mt-6 p-4 rounded-2xl shadow-md">
  <h3 className="mb-2 font-semibold">Points History</h3>
  <ul className="text-sm space-y-1">
    <li>+20 Lash Full Set</li>
    <li>+10 Fill</li>
    <li>-50 Reward Redeemed</li>
  </ul>
</Card>

<Card className="mt-6 p-4 rounded-2xl shadow-md">
  <h3 className="mb-3 font-semibold">How You Earn Points</h3>

  <ul className="text-sm space-y-2">
    <li>💎 Lash Full Set — +20 points</li>
    <li>💎 Lash Fill — +10 points</li>
    <li>💎 Lash Lift/Tint — +15 points</li>
    <li>💎 Referral — +25 points</li>
    <li>💎 Leave a Review — +10 points</li>
  </ul>
</Card>
      </motion.div>
    </div>
  );
}
