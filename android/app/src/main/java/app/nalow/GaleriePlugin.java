package app.nalow;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.media.ExifInterface;
import android.os.ParcelFileDescriptor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

// Range les photos d'une annonce dans l'album « Nalow » de la galerie, datées de
// maintenant : elles arrivent en tête des « Récents » quand Vinted, Leboncoin…
// demandent de choisir des photos, la photo 1 en premier. Les copies d'une
// publication précédente de la même annonce sont remplacées.
// enregistrer({ photos: [base64 JPEG], prefixe }) → { chemins: [chemin du fichier] }
@CapacitorPlugin(name = "Galerie")
public class GaleriePlugin extends Plugin {

    private static final String ALBUM = "Nalow";

    @PluginMethod
    public void enregistrer(PluginCall call) {
        JSArray liste = call.getArray("photos");
        String prefixe = call.getString("prefixe", "annonce").replaceAll("[^A-Za-z0-9-]", "");
        if (liste == null || liste.length() == 0) {
            call.reject("Aucune photo");
            return;
        }
        new Thread(() -> {
            try {
                ContentResolver cr = getContext().getContentResolver();
                supprimerAnciennes(cr, prefixe);
                int n = liste.length();
                String[] chemins = new String[n];
                long maintenant = System.currentTimeMillis();
                // De la dernière à la première : la photo 1 est la plus récente.
                for (int i = n - 1; i >= 0; i--) {
                    byte[] octets = Base64.decode(liste.getString(i), Base64.DEFAULT);
                    long date = maintenant - (long) i * 1000;
                    String nom = "nalow-" + prefixe + "-" + (i + 1) + "-" + maintenant + ".jpg";
                    chemins[i] = Build.VERSION.SDK_INT >= 29 ? viaMediaStore(cr, octets, nom, date) : viaFichier(octets, nom, date);
                }
                JSArray resultat = new JSArray();
                for (String c : chemins) resultat.put(c == null ? "" : c);
                JSObject r = new JSObject();
                r.put("chemins", resultat);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Photos non enregistrées : " + e.getMessage());
            }
        }).start();
    }

    private String viaMediaStore(ContentResolver cr, byte[] octets, String nom, long date) throws Exception {
        ContentValues v = new ContentValues();
        v.put(MediaStore.Images.Media.DISPLAY_NAME, nom);
        v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + ALBUM);
        v.put(MediaStore.Images.Media.DATE_TAKEN, date);
        v.put(MediaStore.Images.Media.IS_PENDING, 1);
        Uri uri = cr.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
        if (uri == null) throw new Exception("insertion refusée");
        try (OutputStream sortie = cr.openOutputStream(uri)) {
            sortie.write(octets);
        }
        // La galerie relit la date de prise de vue dans la photo : on la met à maintenant.
        try (ParcelFileDescriptor fd = cr.openFileDescriptor(uri, "rw")) {
            if (fd != null) dater(new ExifInterface(fd.getFileDescriptor()), date);
        } catch (Exception e) {
            // photo sans métadonnées modifiables : la date d'ajout suffit
        }
        ContentValues fin = new ContentValues();
        fin.put(MediaStore.Images.Media.IS_PENDING, 0);
        fin.put(MediaStore.Images.Media.DATE_TAKEN, date);
        cr.update(uri, fin, null, null);
        // Chemin du fichier : la bulle Nalow s'en sert pour afficher les vignettes.
        try (Cursor c = cr.query(uri, new String[] { MediaStore.Images.Media.DATA }, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        }
        return uri.toString();
    }

    private String viaFichier(byte[] octets, String nom, long date) throws Exception {
        File dossier = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), ALBUM);
        if (!dossier.exists() && !dossier.mkdirs()) throw new Exception("album impossible à créer");
        File f = new File(dossier, nom);
        try (FileOutputStream sortie = new FileOutputStream(f)) {
            sortie.write(octets);
        }
        try {
            dater(new ExifInterface(f.getAbsolutePath()), date);
        } catch (Exception e) {
            // idem
        }
        f.setLastModified(date);
        MediaScannerConnection.scanFile(getContext(), new String[] { f.getAbsolutePath() }, new String[] { "image/jpeg" }, null);
        return f.getAbsolutePath();
    }

    private static void dater(ExifInterface exif, long date) throws Exception {
        String texte = new SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.US).format(new Date(date));
        exif.setAttribute(ExifInterface.TAG_DATETIME_ORIGINAL, texte);
        exif.setAttribute(ExifInterface.TAG_DATETIME_DIGITIZED, texte);
        exif.setAttribute(ExifInterface.TAG_DATETIME, texte);
        exif.saveAttributes();
    }

    // Retire les photos déjà rangées pour cette annonce (republication).
    private void supprimerAnciennes(ContentResolver cr, String prefixe) {
        try {
            String critere = MediaStore.Images.Media.DISPLAY_NAME + " LIKE ?";
            String[] valeurs = { "nalow-" + prefixe + "-%" };
            if (Build.VERSION.SDK_INT >= 29) {
                critere += " AND " + MediaStore.Images.Media.RELATIVE_PATH + " LIKE ?";
                valeurs = new String[] { "nalow-" + prefixe + "-%", Environment.DIRECTORY_PICTURES + "/" + ALBUM + "%" };
            }
            cr.delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, critere, valeurs);
        } catch (Exception e) {
            // photos d'une ancienne installation : on les laisse
        }
    }
}
