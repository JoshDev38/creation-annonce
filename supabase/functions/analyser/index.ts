// Fonction Supabase (Edge Function) « analyser » : remplace /api/analyser de Vercel.
// Elle reprend tel quel api/analyser.js (même code que sur Vercel) grâce à un petit
// adaptateur requête/réponse. Au déploiement, les fichiers sont envoyés avec ces
// chemins : index.ts, deno.json, api/analyser.js, src/lib/configSupabase.js,
// src/lib/paragraphes.js. Secret requis : ANTHROPIC_API_KEY (Edge Functions › Secrets).
// Déployée sans vérification JWT par Supabase : la fonction vérifie elle-même la
// session (et doit laisser passer la requête OPTIONS de l'appli, sans jeton).
import process from 'node:process'

// api/analyser.js lit process.env, comme sur Vercel.
;(globalThis as any).process ??= process
const { default: handler } = await import('./api/analyser.js')

Deno.serve(async (req: Request) => {
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => (headers[k] = v))
  let body = {}
  if (req.method === 'POST') body = await req.json().catch(() => ({}))

  let statut = 200
  let contenu: string | null = null
  const enTetes = new Headers()
  const res = {
    setHeader: (k: string, v: string) => enTetes.set(k, v),
    status(s: number) {
      statut = s
      return res
    },
    json(o: unknown) {
      enTetes.set('Content-Type', 'application/json')
      contenu = JSON.stringify(o)
      return res
    },
    end() {
      return res
    },
  }
  try {
    await handler({ method: req.method, headers, body }, res)
  } catch (e) {
    console.error(e)
    statut = 500
    contenu = JSON.stringify({ erreur: 'Erreur pendant l’analyse' })
  }
  return new Response(contenu, { status: statut, headers: enTetes })
})
