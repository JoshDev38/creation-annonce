// Quota d'annonces IA de l'utilisateur (fonction quota_analyses dans Supabase) :
// { formule, limite, utilisees, restantes, decouverte_restantes, prochaine }
// « prochaine » vaut 'decouverte', 'premium', 'standard', ou null si le quota est épuisé.
import { supabase } from './supabase.js'

export async function lireQuota() {
  const { data, error } = await supabase.rpc('quota_analyses')
  if (error) throw error
  return data
}

// Phrase courte pour l'écran de description de l'objet.
export function phraseQuota(q) {
  if (!q) return ''
  if (q.prochaine === 'decouverte') {
    return `Offre découverte : annonce Premium offerte, avec estimation du prix (${q.decouverte_restantes} sur 2).`
  }
  if (q.prochaine === 'premium') return `Nalow+ : ${q.restantes} annonce${q.restantes > 1 ? 's' : ''} restante${q.restantes > 1 ? 's' : ''} ce mois-ci.`
  if (q.prochaine === 'standard') return `${q.restantes} annonce${q.restantes > 1 ? 's' : ''} gratuite${q.restantes > 1 ? 's' : ''} restante${q.restantes > 1 ? 's' : ''} ce mois-ci.`
  return ''
}
