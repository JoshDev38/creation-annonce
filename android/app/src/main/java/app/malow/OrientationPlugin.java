package app.malow;

import android.view.OrientationEventListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// L'appli reste en portrait ; ce plugin donne l'orientation réelle du téléphone
// (0, 90, 180 ou 270 degrés, dans le sens des aiguilles d'une montre) pour
// redresser les photos prises en paysage et faire pivoter les icônes sur place.
// Événement : « changement » {degres}.
@CapacitorPlugin(name = "Orientation")
public class OrientationPlugin extends Plugin {

    private OrientationEventListener ecouteur;
    private int degres = 0;

    @Override
    public void load() {
        ecouteur = new OrientationEventListener(getContext()) {
            @Override
            public void onOrientationChanged(int angle) {
                if (angle == ORIENTATION_UNKNOWN) return; // téléphone à plat : on garde la dernière valeur
                // On ne change de quart que franchement (à ±30° du nouveau quart).
                for (int q = 0; q < 360; q += 90) {
                    int ecart = Math.abs(((angle - q + 540) % 360) - 180);
                    if (ecart <= 30 && q != degres) {
                        degres = q;
                        JSObject r = new JSObject();
                        r.put("degres", degres);
                        notifyListeners("changement", r);
                        break;
                    }
                }
            }
        };
        if (ecouteur.canDetectOrientation()) ecouteur.enable();
    }

    @PluginMethod
    public void lire(PluginCall call) {
        JSObject r = new JSObject();
        r.put("degres", degres);
        call.resolve(r);
    }

    @Override
    protected void handleOnResume() {
        if (ecouteur != null && ecouteur.canDetectOrientation()) ecouteur.enable();
    }

    @Override
    protected void handleOnPause() {
        if (ecouteur != null) ecouteur.disable();
    }

    @Override
    protected void handleOnDestroy() {
        if (ecouteur != null) ecouteur.disable();
    }
}
