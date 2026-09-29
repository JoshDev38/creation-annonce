// Programme de fidélité : points, paliers (niveaux) et récompenses.
// Tout se paramètre dans Supabase (tables fidelite_regles, fidelite_niveaux,
// fidelite_recompenses) ; les points sont attribués côté serveur.
import { supabase } from './supabase.js'

export async function chargerFidelite() {
  const [niveaux, regles, recompenses, points] = await Promise.all([
    supabase.from('fidelite_niveaux').select('*').order('points_min'),
    supabase.from('fidelite_regles').select('*').eq('actif', true).order('ordre'),
    supabase.from('fidelite_recompenses').select('*').eq('actif', true).order('ordre'),
    supabase.from('fidelite_points').select('action, points, created_at').order('created_at', { ascending: false }),
  ])
  for (const r of [niveaux, regles, recompenses, points]) if (r.error) throw r.error

  const total = points.data.reduce((s, p) => s + p.points, 0)
  const liste = niveaux.data
  const actuel = [...liste].reverse().find((n) => total >= n.points_min) || liste[0] || null
  const suivant = liste.find((n) => n.points_min > total) || null
  const base = actuel?.points_min ?? 0
  const progression = suivant ? Math.min(1, (total - base) / (suivant.points_min - base)) : 1

  return {
    total,
    niveaux: liste.map((n) => ({
      ...n,
      atteint: total >= n.points_min,
      recompenses: recompenses.data.filter((r) => r.niveau === n.niveau),
    })),
    regles: regles.data,
    historique: points.data,
    actuel,
    suivant,
    progression,
  }
}

// Actions déclenchées par l'appli (ex. publication) ; renvoie les points gagnés.
export async function gagnerPoints(action, annonceId = null) {
  const { data, error } = await supabase.rpc('gagner_points', { p_action: action, p_annonce: annonceId })
  if (error) throw error
  return data || 0
}
