import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from './configSupabase.js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

// Messages d'erreur de Supabase traduits pour l'utilisateur.
export function messageErreur(e) {
  const m = (e?.message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (m.includes('email not confirmed')) return 'Confirmez d’abord votre e-mail : un lien vous a été envoyé.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Un compte existe déjà avec cet e-mail. Connectez-vous.'
  if (m.includes('password should be') || m.includes('weak password'))
    return 'Mot de passe trop faible : 8 caractères minimum, avec des lettres et des chiffres.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  if (m.includes('invalid email') || m.includes('unable to validate email'))
    return 'Adresse e-mail invalide.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Pas de connexion internet.'
  return 'Une erreur est survenue. Réessayez.'
}
