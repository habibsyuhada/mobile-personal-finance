package com.moraven.app.widget;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Jembatan JS-to-native untuk widget. JS memanggil setSnapshot() setiap kali
 * task/habit/transaction berubah, dan kita panggil FinanceWidgetProvider.refresh()
 * agar home-screen widget ikut ter-update.
 */
@CapacitorPlugin(name = "FinanceWidget")
public class FinanceWidgetPlugin extends Plugin {

    @PluginMethod
    public void setSnapshot(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(
            FinanceWidgetProvider.PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor ed = prefs.edit();

        JSObject data = call.getObject("data", new JSObject());
        ed.putString(FinanceWidgetProvider.KEY_TASK1, data.optString("task1", "—"));
        ed.putString(FinanceWidgetProvider.KEY_TASK2, data.optString("task2", ""));
        ed.putString(FinanceWidgetProvider.KEY_TASK3, data.optString("task3", ""));
        ed.putInt(FinanceWidgetProvider.KEY_STREAK, data.optInt("streak", 0));
        ed.putString(FinanceWidgetProvider.KEY_STREAK_NAME, data.optString("streakName", ""));
        ed.putString(FinanceWidgetProvider.KEY_NET, data.optString("net", "Rp 0"));
        ed.apply();

        FinanceWidgetProvider.refresh(ctx);

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }
}
