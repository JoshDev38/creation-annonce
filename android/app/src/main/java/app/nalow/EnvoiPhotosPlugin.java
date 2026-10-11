package app.nalow;

import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

// Envoie les photos de l'annonce (déjà rangées dans l'album « Nalow ») directement
// à l'appli de vente choisie (Vinted, Leboncoin…) : elle ouvre son formulaire avec
// les photos ajoutées. Rejeté si l'appli n'accepte pas de photos partagées : Nalow
// se contente alors de l'ouvrir.
@CapacitorPlugin(name = "EnvoiPhotos")
public class EnvoiPhotosPlugin extends Plugin {

    @PluginMethod
    public void envoyer(PluginCall call) {
        String paquet = call.getString("paquet");
        JSArray liste = call.getArray("chemins");
        if (paquet == null || liste == null || liste.length() == 0) {
            call.reject("Paramètres manquants");
            return;
        }
        String[] chemins;
        try {
            chemins = new String[liste.length()];
            for (int i = 0; i < chemins.length; i++) chemins[i] = liste.getString(i).replaceFirst("^file://", "");
        } catch (Exception e) {
            call.reject("Chemins invalides");
            return;
        }
        // Le scan donne l'adresse « content:// » de chaque photo dans la galerie,
        // que l'autre appli a le droit de lire.
        Uri[] uris = new Uri[chemins.length];
        int[] restantes = { chemins.length };
        MediaScannerConnection.scanFile(getContext(), chemins, new String[] { "image/jpeg" }, (chemin, uri) -> {
            for (int i = 0; i < chemins.length; i++) if (chemins[i].equals(chemin)) uris[i] = uri;
            synchronized (restantes) {
                if (--restantes[0] == 0) getActivity().runOnUiThread(() -> lancer(call, paquet, uris));
            }
        });
    }

    private void lancer(PluginCall call, String paquet, Uri[] uris) {
        ArrayList<Uri> photos = new ArrayList<>();
        for (Uri u : uris) if (u != null) photos.add(u);
        if (photos.isEmpty()) {
            call.reject("Photos introuvables");
            return;
        }
        Intent envoi = new Intent(photos.size() == 1 ? Intent.ACTION_SEND : Intent.ACTION_SEND_MULTIPLE);
        envoi.setType("image/jpeg");
        envoi.setPackage(paquet);
        if (photos.size() == 1) envoi.putExtra(Intent.EXTRA_STREAM, photos.get(0));
        else envoi.putParcelableArrayListExtra(Intent.EXTRA_STREAM, photos);
        ClipData clip = ClipData.newRawUri("", photos.get(0));
        for (int i = 1; i < photos.size(); i++) clip.addItem(new ClipData.Item(photos.get(i)));
        envoi.setClipData(clip);
        envoi.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

        PackageManager pm = getContext().getPackageManager();
        if (pm.queryIntentActivities(envoi, 0).isEmpty()) {
            call.reject("Cette appli n'accepte pas de photos partagées");
            return;
        }
        try {
            getContext().startActivity(envoi);
            call.resolve();
        } catch (Exception e) {
            call.reject("Envoi impossible : " + e.getMessage());
        }
    }
}
