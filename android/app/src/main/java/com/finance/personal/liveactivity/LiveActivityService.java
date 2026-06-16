package com.finance.personal.liveactivity;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

import com.finance.personal.MainActivity;
import com.finance.personal.R;

/**
 * ForegroundService yang menampilkan persistent notification
 * dengan progress habit/task hari ini. Dimulai dari JS via plugin,
 * dan berhenti otomatis saat user keluar dari Today.
 *
 * ID notification 1001 — disimpan konstan agar update() tidak double-create.
 */
public class LiveActivityService extends Service {

    public static final String CHANNEL_ID = "live_activity";
    public static final int NOTIF_ID = 1001;
    public static final String PREFS = "live_activity";
    public static final String KEY_TITLE = "title";
    public static final String KEY_BODY = "body";
    public static final String KEY_PROGRESS = "progress";
    public static final String KEY_TOTAL = "total";

    public static final String ACTION_START = "com.finance.personal.LIVE_ACTIVITY_START";
    public static final String ACTION_STOP = "com.finance.personal.LIVE_ACTIVITY_STOP";
    public static final String ACTION_UPDATE = "com.finance.personal.LIVE_ACTIVITY_UPDATE";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            stopForeground(STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_UPDATE.equals(action)) {
            // Update notif tanpa restart service.
            Notification n = buildNotification(this);
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(NOTIF_ID, n);
            return START_STICKY;
        }
        // ACTION_START (default): masuk foreground
        startForeground(NOTIF_ID, buildNotification(this));
        return START_STICKY;
    }

    public static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
            if (existing != null) return;
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Today progress", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Live progress for habits and tasks");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
    }

    private static Notification buildNotification(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String title = prefs.getString(KEY_TITLE, "Today");
        String body = prefs.getString(KEY_BODY, "—");
        int progress = prefs.getInt(KEY_PROGRESS, 0);
        int total = Math.max(1, prefs.getInt(KEY_TOTAL, 1));

        Intent open = new Intent(ctx, MainActivity.class);
        open.setAction(Intent.ACTION_MAIN);
        open.addCategory(Intent.CATEGORY_LAUNCHER);
        PendingIntent pi = PendingIntent.getActivity(
            ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setProgress(total, progress, total <= 0)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
}
