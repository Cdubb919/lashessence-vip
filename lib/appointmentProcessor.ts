import { supabase } from "./supabase";

const servicePoints: Record<string, number> = {
  "full set": 20,
  "fill": 10,
  "lash lift": 15,
  "referral": 25,
};

export const processAppointment = async (appointmentId: string) => {
  console.log("🔥 Function started with ID:", appointmentId);

  const { data: appt, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .single();

  console.log("📦 Appointment fetched:", appt);
  console.log("❌ Error (if any):", error);

  if (!appt) {
    alert("Appointment not found");
    return;
  }

  if (appt.status !== "completed") {
    alert("Appointment not completed");
    return;
  }

  const points = servicePoints[appt.service.toLowerCase()] || 0;

  console.log("💎 Points to add:", points);

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("email", appt.email)
    .single();

  console.log("👤 Client found:", client);

  if (!client) {
    alert("Client not found");
    return;
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      points: client.points + points,
    })
    .eq("email", appt.email);

  console.log("⚡ Update result error:", updateError);

  alert(`Added ${points} points successfully! 🎉`);
};