package app.malow;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;
import java.util.ArrayList;

// Bulle flottante : un rond avec l'icône Malow, déplaçable. Un appui ouvre un
// panneau « Titre / Description / Prix » ; un appui sur un champ le copie,
// le panneau se replie et on peut coller dans Vinted ou Leboncoin.
public class BulleService extends Service {

    private static final String CANAL = "bulle";
    private static final String ACTION_FERMER = "app.malow.FERMER_BULLE";
    private static final int NOTIFICATION = 7;

    private static final int MARRON = Color.parseColor("#7A4532");
    private static final int TEXTE = Color.parseColor("#3B2A22");
    private static final int TEXTE_DOUX = Color.parseColor("#7D6A60");
    private static final int BLEU_VOILE = Color.parseColor("#E6F0F6");
    private static final int CREME = Color.parseColor("#FBF8F2");
    private static final int VERT = Color.parseColor("#3E8E5A");

    private final Handler handler = new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private View bulle;
    private WindowManager.LayoutParams pBulle;
    private LinearLayout panneau;
    private WindowManager.LayoutParams pPanneau;
    private boolean panneauVisible = false;

    private String titre = "";
    private String description = "";
    private String prix = "";
    private ArrayList<String> photos = new ArrayList<>();

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        demarrerPremierPlan();
        if (intent == null || ACTION_FERMER.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        titre = texte(intent.getStringExtra("titre"));
        description = texte(intent.getStringExtra("description"));
        prix = texte(intent.getStringExtra("prix"));
        ArrayList<String> recues = intent.getStringArrayListExtra("photos");
        photos = recues == null ? new ArrayList<>() : recues;

        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (bulle == null) creerBulle();
        if (panneau != null) {
            retirer(panneau);
            panneau = null;
            panneauVisible = false;
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        retirer(panneau);
        retirer(bulle);
        panneau = null;
        bulle = null;
        super.onDestroy();
    }

    private static String texte(String s) {
        return s == null ? "" : s;
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private int largeurEcran() {
        return getResources().getDisplayMetrics().widthPixels;
    }

    private int hauteurEcran() {
        return getResources().getDisplayMetrics().heightPixels;
    }

    private void retirer(View v) {
        if (v == null || wm == null) return;
        try {
            wm.removeView(v);
        } catch (Exception ignore) {
            // déjà retirée
        }
    }

    // ----- Notification (obligatoire pour rester actif derrière une autre appli) -----

    private void demarrerPremierPlan() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CANAL) == null) {
            NotificationChannel canal = new NotificationChannel(CANAL, "Bulle Malow", NotificationManager.IMPORTANCE_LOW);
            canal.setDescription("Bulle pour copier votre annonce dans Vinted ou Leboncoin");
            nm.createNotificationChannel(canal);
        }
        Intent fermer = new Intent(this, BulleService.class).setAction(ACTION_FERMER);
        PendingIntent pi = PendingIntent.getService(
            this,
            0,
            fermer,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Notification n = new NotificationCompat.Builder(this, CANAL)
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setContentTitle("Bulle Malow active")
            .setContentText("Touchez la bulle pour copier votre annonce")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(0, "Fermer la bulle", pi)
            .build();
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIFICATION, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION, n);
        }
    }

    // ----- Bulle -----

    private int typeFenetre() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
    }

    @SuppressLint("ClickableViewAccessibility")
    private void creerBulle() {
        final int taille = dp(58);
        FrameLayout rond = new FrameLayout(this);
        GradientDrawable fond = new GradientDrawable();
        fond.setShape(GradientDrawable.OVAL);
        fond.setColor(Color.WHITE);
        fond.setStroke(dp(2), MARRON);
        rond.setBackground(fond);
        rond.setElevation(dp(6));
        rond.setClipToOutline(true);

        ImageView icone = new ImageView(this);
        icone.setImageResource(R.mipmap.ic_launcher_round);
        icone.setScaleType(ImageView.ScaleType.CENTER_CROP);
        rond.addView(icone, new FrameLayout.LayoutParams(taille, taille));
        bulle = rond;

        pBulle = new WindowManager.LayoutParams(
            taille,
            taille,
            typeFenetre(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        pBulle.gravity = Gravity.TOP | Gravity.START;
        pBulle.x = largeurEcran() - taille - dp(8);
        pBulle.y = hauteurEcran() / 3;

        final int seuil = ViewConfiguration.get(this).getScaledTouchSlop();
        bulle.setOnTouchListener(new View.OnTouchListener() {
            private int x0, y0;
            private float rx0, ry0;
            private boolean glisse;

            @Override
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        x0 = pBulle.x;
                        y0 = pBulle.y;
                        rx0 = e.getRawX();
                        ry0 = e.getRawY();
                        glisse = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = e.getRawX() - rx0;
                        float dy = e.getRawY() - ry0;
                        if (!glisse && Math.hypot(dx, dy) > seuil) {
                            glisse = true;
                            masquerPanneau();
                        }
                        if (glisse) {
                            pBulle.x = x0 + Math.round(dx);
                            pBulle.y = Math.max(0, Math.min(hauteurEcran() - taille, y0 + Math.round(dy)));
                            wm.updateViewLayout(bulle, pBulle);
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (glisse) {
                            // se range contre le bord le plus proche
                            boolean aGauche = pBulle.x + taille / 2 < largeurEcran() / 2;
                            pBulle.x = aGauche ? dp(8) : largeurEcran() - taille - dp(8);
                            wm.updateViewLayout(bulle, pBulle);
                        } else {
                            basculerPanneau();
                        }
                        return true;
                    default:
                        return false;
                }
            }
        });
        wm.addView(bulle, pBulle);
    }

    // ----- Panneau -----

    private void basculerPanneau() {
        if (panneauVisible) masquerPanneau();
        else afficherPanneau();
    }

    private void masquerPanneau() {
        if (panneau != null) panneau.setVisibility(View.GONE);
        panneauVisible = false;
    }

    @SuppressLint("ClickableViewAccessibility")
    private void afficherPanneau() {
        if (panneau == null) {
            panneau = construirePanneau();
            int largeur = Math.min(largeurEcran() - dp(24), dp(380));
            pPanneau = new WindowManager.LayoutParams(
                largeur,
                WindowManager.LayoutParams.WRAP_CONTENT,
                typeFenetre(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT
            );
            pPanneau.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            panneau.setOnTouchListener((v, e) -> {
                if (e.getAction() == MotionEvent.ACTION_OUTSIDE) masquerPanneau();
                return false;
            });
            placerPanneau();
            wm.addView(panneau, pPanneau);
        } else {
            placerPanneau();
            wm.updateViewLayout(panneau, pPanneau);
        }
        panneau.setVisibility(View.VISIBLE);
        panneauVisible = true;
    }

    // Sous la bulle, ou au-dessus si elle est en bas de l'écran.
    private void placerPanneau() {
        int sous = pBulle.y + dp(66);
        int hauteur = photos.isEmpty() ? dp(340) : dp(460);
        pPanneau.y = sous + hauteur < hauteurEcran() ? sous : Math.max(dp(24), pBulle.y - hauteur - dp(10));
    }

    private LinearLayout construirePanneau() {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setPadding(dp(16), dp(14), dp(16), dp(16));
        GradientDrawable fond = new GradientDrawable();
        fond.setColor(CREME);
        fond.setCornerRadius(dp(20));
        p.setBackground(fond);
        p.setElevation(dp(10));

        // En-tête : titre + fermer
        LinearLayout tete = new LinearLayout(this);
        tete.setOrientation(LinearLayout.HORIZONTAL);
        tete.setGravity(Gravity.CENTER_VERTICAL);
        TextView nom = new TextView(this);
        nom.setText("Votre annonce Malow");
        nom.setTextColor(MARRON);
        nom.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        nom.setTypeface(Typeface.SERIF, Typeface.BOLD);
        tete.addView(nom, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        TextView fermer = new TextView(this);
        fermer.setText("Fermer ✕");
        fermer.setTextColor(TEXTE_DOUX);
        fermer.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        fermer.setPadding(dp(10), dp(6), 0, dp(6));
        fermer.setOnClickListener(v -> stopSelf());
        tete.addView(fermer);
        p.addView(tete);

        TextView aide = new TextView(this);
        aide.setText("Touchez un champ pour le copier, puis collez-le dans l’appli.");
        aide.setTextColor(TEXTE_DOUX);
        aide.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        aide.setPadding(0, dp(2), 0, dp(10));
        p.addView(aide);

        if (!photos.isEmpty()) ajouterPhotos(p);
        ajouterChamp(p, "Titre", titre, 1);
        ajouterChamp(p, "Description", description, 3);
        if (!prix.isEmpty()) ajouterChamp(p, "Prix", prix + " €", 1);
        return p;
    }

    // Les photos ne peuvent pas être glissées d'une appli à l'autre : on les montre
    // en rappel, elles sont déjà en tête de la galerie (album « Malow »).
    private void ajouterPhotos(LinearLayout parent) {
        LinearLayout carte = new LinearLayout(this);
        carte.setOrientation(LinearLayout.VERTICAL);
        carte.setPadding(dp(14), dp(10), dp(14), dp(12));
        GradientDrawable fond = new GradientDrawable();
        fond.setColor(BLEU_VOILE);
        fond.setCornerRadius(dp(14));
        carte.setBackground(fond);

        TextView etiquette = new TextView(this);
        etiquette.setText("PHOTOS  ·  " + photos.size() + " dans votre galerie");
        etiquette.setTextColor(MARRON);
        etiquette.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        etiquette.setTypeface(Typeface.DEFAULT_BOLD);
        etiquette.setLetterSpacing(0.04f);
        carte.addView(etiquette);

        HorizontalScrollView defilement = new HorizontalScrollView(this);
        defilement.setHorizontalScrollBarEnabled(false);
        LinearLayout rangee = new LinearLayout(this);
        rangee.setOrientation(LinearLayout.HORIZONTAL);
        int cote = dp(58);
        for (int i = 0; i < photos.size(); i++) {
            Bitmap vignette = vignette(photos.get(i), cote);
            if (vignette == null) continue;
            FrameLayout cadre = new FrameLayout(this);
            GradientDrawable arrondi = new GradientDrawable();
            arrondi.setColor(Color.WHITE);
            arrondi.setCornerRadius(dp(10));
            cadre.setBackground(arrondi);
            cadre.setClipToOutline(true);
            ImageView image = new ImageView(this);
            image.setImageBitmap(vignette);
            image.setScaleType(ImageView.ScaleType.CENTER_CROP);
            cadre.addView(image, new FrameLayout.LayoutParams(cote, cote));
            TextView numero = new TextView(this);
            numero.setText(String.valueOf(i + 1));
            numero.setTextColor(Color.WHITE);
            numero.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            numero.setTypeface(Typeface.DEFAULT_BOLD);
            numero.setShadowLayer(3, 0, 1, Color.BLACK);
            numero.setPadding(dp(5), dp(2), 0, 0);
            cadre.addView(numero);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(cote, cote);
            lp.rightMargin = dp(6);
            rangee.addView(cadre, lp);
        }
        defilement.addView(rangee);
        LinearLayout.LayoutParams lpDef = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        lpDef.topMargin = dp(6);
        carte.addView(defilement, lpDef);

        TextView aide = new TextView(this);
        aide.setText("Dans l’appli, touchez « Ajouter des photos » : elles sont en tête de votre galerie, dans cet ordre (album « Malow »).");
        aide.setTextColor(TEXTE);
        aide.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        aide.setPadding(0, dp(6), 0, 0);
        carte.addView(aide);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        lp.topMargin = dp(8);
        parent.addView(carte, lp);
    }

    // Charge une photo en petit, sans lire l'image entière en mémoire.
    private static Bitmap vignette(String chemin, int cote) {
        try {
            String fichier = chemin.startsWith("file://") ? chemin.substring(7) : chemin;
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(fichier, o);
            int echelle = 1;
            while (o.outWidth / (echelle * 2) >= cote && o.outHeight / (echelle * 2) >= cote) echelle *= 2;
            BitmapFactory.Options o2 = new BitmapFactory.Options();
            o2.inSampleSize = echelle;
            return BitmapFactory.decodeFile(fichier, o2);
        } catch (Exception e) {
            return null;
        }
    }

    private void ajouterChamp(LinearLayout parent, final String nom, final String valeur, int lignes) {
        final String aCopier = nom.equals("Prix") ? prix : valeur;
        LinearLayout carte = new LinearLayout(this);
        carte.setOrientation(LinearLayout.VERTICAL);
        carte.setPadding(dp(14), dp(10), dp(14), dp(12));
        GradientDrawable fond = new GradientDrawable();
        fond.setColor(BLEU_VOILE);
        fond.setCornerRadius(dp(14));
        carte.setBackground(fond);

        final TextView etiquette = new TextView(this);
        etiquette.setText(nom.toUpperCase() + "  ·  toucher pour copier");
        etiquette.setTextColor(MARRON);
        etiquette.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        etiquette.setTypeface(Typeface.DEFAULT_BOLD);
        etiquette.setLetterSpacing(0.04f);
        carte.addView(etiquette);

        TextView contenu = new TextView(this);
        contenu.setText(valeur);
        contenu.setTextColor(TEXTE);
        contenu.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        contenu.setMaxLines(lignes);
        contenu.setEllipsize(TextUtils.TruncateAt.END);
        contenu.setPadding(0, dp(3), 0, 0);
        carte.addView(contenu);

        carte.setOnClickListener(v -> {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            cm.setPrimaryClip(ClipData.newPlainText("Malow – " + nom, aCopier));
            etiquette.setText("✓  COPIÉ : MAINTENANT, COLLEZ");
            etiquette.setTextColor(VERT);
            handler.postDelayed(() -> {
                masquerPanneau();
                etiquette.setText(nom.toUpperCase() + "  ·  toucher pour copier");
                etiquette.setTextColor(MARRON);
            }, 700);
        });

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        lp.topMargin = dp(8);
        parent.addView(carte, lp);
    }
}
