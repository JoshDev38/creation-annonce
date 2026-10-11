package app.nalow;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Ouvre la page « déposer une annonce » d'une plateforme (ex. vinted.fr/items/new)
// directement dans son appli, au lieu de son accueil. Rejeté si l'appli n'est
// pas installée ou ne gère pas ce lien : Nalow l'ouvre alors normalement.
@CapacitorPlugin(name = "Plateforme")
public class PlateformePlugin extends Plugin {

    @PluginMethod
    public void ouvrirCreation(PluginCall call) {
        String paquet = call.getString("paquet");
        String url = call.getString("url");
        if (paquet == null || url == null) {
            call.reject("Paramètres manquants");
            return;
        }
        Intent lien = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        lien.setPackage(paquet);
        lien.addCategory(Intent.CATEGORY_BROWSABLE);
        lien.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (getContext().getPackageManager().queryIntentActivities(lien, 0).isEmpty()) {
            call.reject("Lien non géré par l'appli");
            return;
        }
        try {
            getContext().startActivity(lien);
            call.resolve();
        } catch (Exception e) {
            call.reject("Ouverture impossible : " + e.getMessage());
        }
    }
}
