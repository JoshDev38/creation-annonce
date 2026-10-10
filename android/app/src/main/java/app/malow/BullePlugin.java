package app.malow;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import java.util.ArrayList;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

// Bulle Nalow affichée par-dessus Vinted / Leboncoin : elle garde le titre,
// la description et le prix à portée de main pour les copier-coller.
@CapacitorPlugin(name = "Bulle")
public class BullePlugin extends Plugin {

    private boolean autorisee() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext());
    }

    private void repondre(PluginCall call, boolean valeur) {
        JSObject r = new JSObject();
        r.put("value", valeur);
        call.resolve(r);
    }

    @PluginMethod
    public void autorisee(PluginCall call) {
        repondre(call, autorisee());
    }

    // Ouvre le réglage « Afficher par-dessus les autres applis » ; répond au retour.
    @PluginMethod
    public void demanderAutorisation(PluginCall call) {
        if (autorisee()) {
            repondre(call, true);
            return;
        }
        Intent intent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName())
        );
        startActivityForResult(call, intent, "retourAutorisation");
    }

    @ActivityCallback
    private void retourAutorisation(PluginCall call, ActivityResult result) {
        if (call == null) return;
        repondre(call, autorisee());
    }

    @PluginMethod
    public void afficher(PluginCall call) {
        if (!autorisee()) {
            call.reject("Autorisation « Afficher par-dessus les autres applis » manquante");
            return;
        }
        Intent intent = new Intent(getContext(), BulleService.class);
        intent.putExtra("titre", call.getString("titre", ""));
        intent.putExtra("description", call.getString("description", ""));
        intent.putExtra("prix", call.getString("prix", ""));
        ArrayList<String> photos = new ArrayList<>();
        JSArray liste = call.getArray("photos");
        if (liste != null) {
            for (int i = 0; i < liste.length(); i++) {
                String chemin = liste.optString(i, "");
                if (!chemin.isEmpty()) photos.add(chemin);
            }
        }
        intent.putStringArrayListExtra("photos", photos);
        try {
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Impossible d’afficher la bulle : " + e.getMessage());
        }
    }

    // Icônes des applis installées (Vinted, Leboncoin…), telles qu'elles
    // apparaissent sur le téléphone : { icones: { "fr.vinted": "data:image/png;base64,…" } }
    @PluginMethod
    public void iconesApplis(PluginCall call) {
        JSArray paquets = call.getArray("paquets");
        JSObject icones = new JSObject();
        PackageManager pm = getContext().getPackageManager();
        int taille = Math.round(96 * getContext().getResources().getDisplayMetrics().density / 2);
        if (paquets != null) {
            for (int i = 0; i < paquets.length(); i++) {
                String paquet = paquets.optString(i, "");
                if (paquet.isEmpty()) continue;
                try {
                    Drawable d = pm.getApplicationIcon(paquet);
                    Bitmap b = Bitmap.createBitmap(taille, taille, Bitmap.Config.ARGB_8888);
                    Canvas c = new Canvas(b);
                    d.setBounds(0, 0, taille, taille);
                    d.draw(c);
                    ByteArrayOutputStream sortie = new ByteArrayOutputStream();
                    b.compress(Bitmap.CompressFormat.PNG, 100, sortie);
                    icones.put(paquet, "data:image/png;base64," + Base64.encodeToString(sortie.toByteArray(), Base64.NO_WRAP));
                } catch (Exception ignore) {
                    // appli absente : l'appli Nalow affichera l'icône du site
                }
            }
        }
        JSObject r = new JSObject();
        r.put("icones", icones);
        call.resolve(r);
    }

    @PluginMethod
    public void masquer(PluginCall call) {
        getContext().stopService(new Intent(getContext(), BulleService.class));
        call.resolve();
    }
}
