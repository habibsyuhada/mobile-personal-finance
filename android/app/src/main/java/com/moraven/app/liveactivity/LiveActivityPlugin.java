package com.moraven.app.liveactivity;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Jembatan JS-to-native untuk live activity (Android ForegroundService).
 *
 * start({title, body, progress, total}) — memulai service dengan payload.
 * update({progress, total, body?})       — update notif (tidak restart).
 * stop()                                 — stop service & hapus notif.
 */
@CapacitorPlugin(name = "LiveActivity")
public class LiveActivityPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Context ctx = getContext();
        LiveActivityService.ensureChannel(ctx);

        JSObject data = call.getObject("data", new JSObject());
        String title = data.optString("title", "Today");
        String body = data.optString("body", "—");
        int progress = data.optInt("progress", 0);
        int total = data.optInt("total", 1);

        SharedPreferences prefs = ctx.getSharedPreferences(
            LiveActivityService.PREFS, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(LiveActivityService.KEY_TITLE, title)
            .putString(LiveActivityService.KEY_BODY, body)
            .putInt(LiveActivityService.KEY_PROGRESS, progress)
            .putInt(LiveActivityService.KEY_TOTAL, total)
            .apply();

        Intent i = new Intent(ctx, LiveActivityService.class);
        i.setAction(LiveActivityService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(i);
        } else {
            ctx.startService(i);
        }

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        JSObject data = call.getObject("data", new JSObject());
        SharedPreferences prefs = ctx.getSharedPreferences(
            LiveActivityService.PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor ed = prefs.edit();
        if (data.has("progress")) ed.putInt(LiveActivityService.KEY_PROGRESS, data.optInt("progress", 0));
        if (data.has("total")) ed.putInt(LiveActivityService.KEY_TOTAL, data.optInt("total", 1));
        if (data.has("body")) ed.putString(LiveActivityService.KEY_BODY, data.optString("body", ""));
        if (data.has("title")) ed.putString(LiveActivityService.KEY_TITLE, data.optString("title", ""));
        ed.apply();

        Intent i = new Intent(ctx, LiveActivityService.class);
        i.setAction(LiveActivityService.ACTION_UPDATE);
        ctx.startService(i);

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        Intent i = new Intent(ctx, LiveActivityService.class);
        i.setAction(LiveActivityService.ACTION_STOP);
        ctx.startService(i);

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }
}
