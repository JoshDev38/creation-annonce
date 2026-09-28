// Connexion avec un compte Google (via Supabase).
// - Site web : redirection classique vers Google, puis retour sur le site.
// - Appli Android : Google interdit la connexion dans une WebView, on ouvre donc le
//   navigateur du téléphone ; Google renvoie ensuite vers app.malow://auth, que
//   l'appli intercepte pour récupérer la session.
import { App as AppNative } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { estAppliNative } from './cameraNative.js'
import { supabase } from './supabase.js'

const RETOUR_APPLI = 'app.malow://auth'

export async function connexionGoogle() {
  if (!estAppliNative()) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
    return // la page part chez Google
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: RETOUR_APPLI, skipBrowserRedirect: true },
  })
  if (error) throw error
  await Browser.open({ url: data.url, presentationStyle: 'popover' })
}

// À appeler une fois au démarrage de l'appli : récupère la session au retour de Google.
export function ecouterRetourGoogle(onErreur) {
  if (!estAppliNative()) return () => {}
  const ecoute = AppNative.addListener('appUrlOpen', async ({ url }) => {
    if (!url?.startsWith(RETOUR_APPLI)) return
    Browser.close().catch(() => {})
    const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '')
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) {
      onErreur(params.get('error_description') || 'Connexion Google annulée')
      return
    }
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) onErreur('Connexion Google impossible')
  })
  return () => ecoute.then((h) => h.remove())
}
