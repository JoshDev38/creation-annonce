// Caméra de l'appli installée (Android / iOS via Capacitor).
// Le navigateur n'a souvent pas accès au flash ; le module natif, si.
// L'aperçu natif s'affiche DERRIÈRE la page : la page doit donc être
// transparente pendant la prise de vue (classe « camera-native » sur <html>).
import { Capacitor } from '@capacitor/core'
import { CameraPreview } from '@capacitor-community/camera-preview'

export const estAppliNative = () => Capacitor.isNativePlatform()

export async function demarrerCameraNative() {
  document.documentElement.classList.add('camera-native')
  await CameraPreview.start({
    position: 'rear',
    toBack: true,
    enableZoom: true, // zoom en pinçant l'écran (Android)
    disableAudio: true,
  })
  let modes = []
  try {
    modes = (await CameraPreview.getSupportedFlashModes()).result || []
  } catch {
    /* aucun flash */
  }
  // 'torch' = lampe allumée en continu ; 'on' = flash au déclenchement.
  return modes.includes('torch') ? 'torch' : modes.includes('on') ? 'capture' : null
}

export async function arreterCameraNative() {
  document.documentElement.classList.remove('camera-native')
  try {
    await CameraPreview.stop()
  } catch {
    /* déjà arrêtée */
  }
}

export async function reglerFlashNatif(mode, allume) {
  await CameraPreview.setFlashMode({ flashMode: allume ? (mode === 'torch' ? 'torch' : 'on') : 'off' })
}

export async function capturerNatif() {
  const { value } = await CameraPreview.capture({ quality: 85 })
  return value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}`
}
