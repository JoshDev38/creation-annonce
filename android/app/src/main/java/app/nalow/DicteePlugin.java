package app.nalow;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

// Dictée vocale avec la reconnaissance d'Android (la WebView n'en a pas).
// Écoute en continu : après chaque phrase ou silence, l'écoute reprend jusqu'à
// « arreter » (bouton stop) ou jusqu'à ce que l'appli passe en arrière-plan.
// Événements : « partiel » {texte}, « final » {texte}, « fin », « erreur » {message}.
@CapacitorPlugin(name = "Dictee", permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "micro") })
public class DicteePlugin extends Plugin {

    private SpeechRecognizer reconnaisseur;
    private boolean continuer = false;
    private String langue = "fr-FR";
    private int echecsDeSuite = 0; // service occupé en boucle : on finit par abandonner

    @PluginMethod
    public void disponible(PluginCall call) {
        JSObject r = new JSObject();
        r.put("value", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void demarrer(PluginCall call) {
        if (getPermissionState("micro") != PermissionState.GRANTED) {
            requestPermissionForAlias("micro", call, "apresPermission");
            return;
        }
        lancer(call);
    }

    @PermissionCallback
    private void apresPermission(PluginCall call) {
        if (getPermissionState("micro") == PermissionState.GRANTED) lancer(call);
        else call.reject("Autorisez l’accès au micro pour dicter.", "micro-refuse");
    }

    private void lancer(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("La reconnaissance vocale n’est pas disponible sur ce téléphone.", "indisponible");
            return;
        }
        langue = call.getString("langue", "fr-FR");
        continuer = true;
        getActivity().runOnUiThread(() -> {
            try {
                ecouter();
                call.resolve();
            } catch (Exception e) {
                continuer = false;
                call.reject("Impossible de démarrer la dictée : " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void arreter(PluginCall call) {
        continuer = false;
        getActivity().runOnUiThread(() -> {
            if (reconnaisseur != null) reconnaisseur.stopListening();
            call.resolve();
        });
    }

    @Override
    protected void handleOnPause() {
        // Nalow n'est plus à l'écran : on arrête d'écouter.
        if (continuer) {
            continuer = false;
            if (reconnaisseur != null) reconnaisseur.stopListening();
        }
    }

    @Override
    protected void handleOnDestroy() {
        continuer = false;
        detruire();
    }

    private void detruire() {
        if (reconnaisseur != null) {
            reconnaisseur.destroy();
            reconnaisseur = null;
        }
    }

    private void ecouter() {
        detruire();
        reconnaisseur = SpeechRecognizer.createSpeechRecognizer(getContext());
        reconnaisseur.setRecognitionListener(new Ecouteur());
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, langue);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        reconnaisseur.startListening(intent);
    }

    // Reprend l'écoute après une phrase ou un silence, sinon signale la fin.
    private void suite() {
        if (continuer) {
            // petit délai : le service de reconnaissance doit se libérer
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                if (continuer) ecouter();
            }, 200);
        } else {
            continuer = false;
            getActivity().runOnUiThread(this::detruire);
            notifyListeners("fin", new JSObject());
        }
    }

    private static String premier(Bundle b) {
        if (b == null) return "";
        ArrayList<String> l = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return l == null || l.isEmpty() || l.get(0) == null ? "" : l.get(0);
    }

    private class Ecouteur implements RecognitionListener {

        @Override
        public void onPartialResults(Bundle partialResults) {
            String t = premier(partialResults);
            if (t.isEmpty()) return;
            JSObject r = new JSObject();
            r.put("texte", t);
            notifyListeners("partiel", r);
        }

        @Override
        public void onResults(Bundle results) {
            String t = premier(results);
            if (!t.isEmpty()) {
                        JSObject r = new JSObject();
                r.put("texte", t);
                notifyListeners("final", r);
            }
            suite();
        }

        @Override
        public void onError(int code) {
            // Silence ou rien compris : on continue d'écouter.
            if (code == SpeechRecognizer.ERROR_NO_MATCH || code == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                suite();
                return;
            }
            // Service occupé (souvent juste après une reprise) : on réessaie, sans boucler sans fin.
            if ((code == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || code == SpeechRecognizer.ERROR_CLIENT) && ++echecsDeSuite < 15) {
                suite();
                return;
            }
            continuer = false;
            String message;
            switch (code) {
                case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                    message = "Autorisez l’accès au micro pour dicter.";
                    break;
                case SpeechRecognizer.ERROR_NETWORK:
                case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                case SpeechRecognizer.ERROR_SERVER:
                    message = "La dictée a besoin d’internet. Vérifiez votre connexion.";
                    break;
                default:
                    message = "La dictée s’est interrompue. Réessayez.";
            }
            JSObject r = new JSObject();
            r.put("message", message);
            notifyListeners("erreur", r);
            suite();
        }

        @Override
        public void onReadyForSpeech(Bundle params) {
            echecsDeSuite = 0;
        }

        @Override
        public void onBeginningOfSpeech() {}

        @Override
        public void onRmsChanged(float rmsdB) {}

        @Override
        public void onBufferReceived(byte[] buffer) {}

        @Override
        public void onEndOfSpeech() {}

        @Override
        public void onEvent(int eventType, Bundle params) {}
    }
}
