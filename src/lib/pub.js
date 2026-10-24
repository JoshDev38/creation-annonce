// Publicité vidéo de la formule gratuite (Google AdMob, annonce « avec récompense » :
// le vendeur choisit de la regarder pour créer son annonce gratuitement).
// Tant que les vrais identifiants AdMob ne sont pas renseignés, ce sont ceux de test
// de Google : des pubs « Test Ad », sans revenus. L'identifiant de l'appli est aussi
// dans android/app/src/main/AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID).
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob'
import { estAppliNative } from './cameraNative.js'

const PUB_RECOMPENSE = 'ca-app-pub-3940256099942544/5224354917' // test Google : à remplacer
const EN_TEST = PUB_RECOMPENSE.startsWith('ca-app-pub-3940256099942544/')

let pret = null

// Consentement (RGPD, formulaire Google) puis démarrage d'AdMob, une seule fois.
export function initialiserPub() {
  if (!estAppliNative()) return Promise.resolve(false)
  pret ??= (async () => {
    let consentement = await AdMob.requestConsentInfo()
    if (consentement.isConsentFormAvailable && consentement.status === AdmobConsentStatus.REQUIRED) {
      consentement = await AdMob.showConsentForm()
    }
    if (!consentement.canRequestAds) return false
    await AdMob.initialize()
    return true
  })().catch((e) => {
    console.warn('AdMob indisponible', e)
    pret = null
    return false
  })
  return pret
}

// Montre la vidéo et attend sa fermeture. Ne bloque jamais l'annonce : si la pub ne
// se charge pas (pas de réseau, pas de pub disponible), on continue sans.
export async function montrerPub() {
  try {
    if (!(await initialiserPub())) return false
    await AdMob.prepareRewardVideoAd({ adId: PUB_RECOMPENSE, isTesting: EN_TEST })
    await AdMob.showRewardVideoAd()
    return true
  } catch (e) {
    console.warn('Pub non affichée', e)
    return false
  }
}
