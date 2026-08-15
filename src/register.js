// Shared by Predict and Wait for Result. Only ever shown once per student.

export async function isRegistered(supabase, telegramId) {
  const { data } = await supabase
    .from('students')
    .select('full_name, registration_number')
    .eq('telegram_id', telegramId)
    .single();
  return Boolean(data?.full_name && data?.registration_number);
}

export async function completeRegistration(supabase, telegramId, { fullName, registrationNumber }) {
  const { error } = await supabase
    .from('students')
    .update({
      full_name: fullName,
      registration_number: registrationNumber,
    })
    .eq('telegram_id', telegramId);
  if (error) throw error;
}
