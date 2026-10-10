// Annonces enregistrées dans le compte (table « annonces » + photos dans le bucket « photos »).
import { supabase } from './supabase.js'
import { allegerPhoto } from './stockage.js'

const BUCKET = 'photos'
const DUREE_LIEN = 60 * 60 // les liens des photos sont valables 1 heure

const estUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || '')

async function versBlob(dataUrl) {
  return (await fetch(dataUrl)).blob()
}

function depuisLigne(ligne, urls) {
  const photos = ligne.photos.map((chemin) => urls[chemin]).filter(Boolean)
  return {
    id: ligne.id,
    date: ligne.created_at,
    titre: ligne.titre,
    description: ligne.description,
    prix: ligne.prix?.conseille ? ligne.prix : null,
    tags: ligne.tags,
    infos: ligne.infos,
    explicationPrix: ligne.explication_prix,
    marqueProbable: ligne.marque_probable,
    marqueTraitee: true,
    modeleTraite: true,
    source: ligne.source,
    photos,
    photo: photos[0] || null,
    cheminsPhotos: ligne.photos,
    enLigne: true,
  }
}

export async function listerAnnoncesCloud() {
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  const chemins = data.flatMap((l) => l.photos)
  const urls = {}
  if (chemins.length) {
    const { data: liens, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrls(chemins, DUREE_LIEN)
    if (e2) throw e2
    for (const l of liens) if (l.signedUrl) urls[l.path] = l.signedUrl
  }
  return data.map((l) => depuisLigne(l, urls))
}

// Crée ou met à jour l'annonce ; envoie les photos qui ne sont pas encore en ligne.
export async function enregistrerAnnonceCloud(annonce, userId) {
  const id = estUuid(annonce.id) ? annonce.id : crypto.randomUUID()
  const photos = annonce.photos?.length ? annonce.photos : annonce.photo ? [annonce.photo] : []
  const dejaEnLigne = annonce.cheminsPhotos?.length === photos.length && photos.every((p) => !p.startsWith('data:'))

  let chemins = annonce.cheminsPhotos || []
  if (!dejaEnLigne) {
    chemins = []
    for (let i = 0; i < photos.length; i++) {
      const chemin = `${userId}/${id}/${i + 1}.jpg`
      const source = photos[i].startsWith('data:') ? await allegerPhoto(photos[i], 1600, 0.85) : photos[i]
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(chemin, await versBlob(source), { contentType: 'image/jpeg', upsert: true })
      if (error) throw error
      chemins.push(chemin)
    }
  }

  const { error } = await supabase.from('annonces').upsert({
    id,
    user_id: userId,
    titre: annonce.titre,
    description: annonce.description,
    prix: annonce.prix || {},
    tags: annonce.tags,
    infos: annonce.infos || '',
    explication_prix: annonce.explicationPrix || '',
    marque_probable: annonce.marqueProbable || '',
    source: annonce.source || '',
    photos: chemins,
    ...(annonce.date ? { created_at: annonce.date } : {}),
  })
  if (error) throw error
  return { ...annonce, id, cheminsPhotos: chemins, enLigne: true }
}

export async function supprimerAnnonceCloud(annonce) {
  if (annonce.cheminsPhotos?.length) {
    await supabase.storage.from(BUCKET).remove(annonce.cheminsPhotos)
  }
  const { error } = await supabase.from('annonces').delete().eq('id', annonce.id)
  if (error) throw error
}

// Supprime toutes les photos puis le compte (la base supprime les annonces en cascade).
export async function supprimerCompte(userId) {
  const { data: dossiers } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 })
  for (const d of dossiers || []) {
    const { data: fichiers } = await supabase.storage.from(BUCKET).list(`${userId}/${d.name}`, { limit: 100 })
    const chemins = (fichiers || []).map((f) => `${userId}/${d.name}/${f.name}`)
    if (chemins.length) await supabase.storage.from(BUCKET).remove(chemins)
  }
  const { error } = await supabase.rpc('supprimer_mon_compte')
  if (error) throw error
  await supabase.auth.signOut()
}
