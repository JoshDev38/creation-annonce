// Profil de l'utilisateur (table « profils ») : pseudo, photo et formule d'abonnement.
import { supabase } from './supabase.js'

const BUCKET = 'photos'
export const PSEUDO_VALIDE = /^[\p{L}\p{N}_.\- ]{2,30}$/u

export async function lireProfil(userId) {
  const { data, error } = await supabase.from('profils').select('pseudo, avatar, formule, formule_fin').eq('id', userId).maybeSingle()
  if (error) throw error
  let avatarUrl = null
  if (data?.avatar) {
    const { data: lien } = await supabase.storage.from(BUCKET).createSignedUrl(data.avatar, 60 * 60)
    avatarUrl = lien?.signedUrl || null
  }
  return { pseudo: data?.pseudo || '', avatar: data?.avatar || null, avatarUrl, formule: data?.formule || 'gratuit', formuleFin: data?.formule_fin || null }
}

export async function pseudoDisponible(pseudo) {
  const { data, error } = await supabase.rpc('pseudo_disponible', { p: pseudo })
  if (error) throw error
  return data === true
}

export async function changerPseudo(userId, pseudo) {
  const { error } = await supabase.from('profils').upsert({ id: userId, pseudo: pseudo.trim(), updated_at: new Date().toISOString() })
  if (error) {
    if (error.code === '23505') throw new Error('Ce pseudo est déjà pris.')
    throw error
  }
}

// Envoie la nouvelle photo, l'associe au profil, puis supprime l'ancienne.
export async function changerAvatar(userId, dataUrl, ancien) {
  const chemin = `${userId}/profil/avatar-${Date.now()}.jpg`
  const blob = await (await fetch(dataUrl)).blob()
  const { error } = await supabase.storage.from(BUCKET).upload(chemin, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { error: e2 } = await supabase.from('profils').upsert({ id: userId, avatar: chemin, updated_at: new Date().toISOString() })
  if (e2) throw e2
  if (ancien) await supabase.storage.from(BUCKET).remove([ancien])
  return chemin
}
