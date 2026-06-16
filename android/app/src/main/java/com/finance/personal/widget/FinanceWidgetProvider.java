package com.finance.personal.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import com.finance.personal.MainActivity;
import com.finance.personal.R;

/**
 * Widget 4x2: 3 task due hari ini (belum selesai) + habit streak tertinggi
 * + ringkasan net expense hari ini. Data disajikan oleh JS via WidgetBridge
 * (satu SharedPreferences file yang sama).
 */
public class FinanceWidgetProvider extends AppWidgetProvider {

    public static final String PREFS = "finance_widget";
    public static final String KEY_TASK1 = "task1";
    public static final String KEY_TASK2 = "task2";
    public static final String KEY_TASK3 = "task3";
    public static final String KEY_STREAK = "streak";
    public static final String KEY_STREAK_NAME = "streak_name";
    public static final String KEY_NET = "net";

    /** Panggil dari JS (WidgetBridge) untuk refresh semua instance widget. */
    public static void refresh(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        ComponentName cn = new ComponentName(ctx, FinanceWidgetProvider.class);
        int[] ids = mgr.getAppWidgetIds(cn);
        if (ids.length > 0) {
            mgr.notifyAppWidgetViewDataChanged(ids, R.id.fw_task1);
        }
        Intent i = new Intent(ctx, FinanceWidgetProvider.class);
        i.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        ctx.sendBroadcast(i);
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        for (int id : ids) {
            RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_finance);

            String t1 = prefs.getString(KEY_TASK1, "—");
            String t2 = prefs.getString(KEY_TASK2, "");
            String t3 = prefs.getString(KEY_TASK3, "");
            v.setTextViewText(R.id.fw_task1, t1);
            v.setTextViewText(R.id.fw_task2, t2.isEmpty() ? "" : "• " + t2);
            v.setTextViewText(R.id.fw_task3, t3.isEmpty() ? "" : "• " + t3);

            int streak = prefs.getInt(KEY_STREAK, 0);
            String streakName = prefs.getString(KEY_STREAK_NAME, "");
            String streakText = streak > 0
                ? "🔥 " + streak + (streakName.isEmpty() ? "" : " · " + streakName)
                : "—";
            v.setTextViewText(R.id.fw_streak, streakText);

            String net = prefs.getString(KEY_NET, "Rp 0");
            v.setTextViewText(R.id.fw_net, net);

            // Tap widget → buka launcher (app).
            Intent open = new Intent(ctx, MainActivity.class);
            open.setData(Uri.parse("app://widget"));
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent pi = PendingIntent.getActivity(
                ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(R.id.fw_root, pi);

            mgr.updateAppWidget(id, v);
        }
    }
}
