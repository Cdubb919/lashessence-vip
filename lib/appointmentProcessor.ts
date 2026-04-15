import { supabase } from "./supabase";

const servicePoints: Record<string, number> = {
  "full set": 20,
  "fill": 10,
  "lash lift": 15,
  "referral": 25,
};

export const processAppointmentByEmail = async (
  email: string,
  service: string
) => {
  console.log("📩 Processing:", email, service);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedService = service.toLowerCase();

  const points = servicePoints[normalizedService] || 0;

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("email", normalizedEmail)
    .single();

  if (!client) {
    console.log("❌ Client not found");
    return;
  }

  await supabase
    .from("clients")
    .update({
      points: client.points + points,
    })
    .eq("email", normalizedEmail);

  console.log(`🎉 Added ${points} points to ${normalizedEmail}`);
};