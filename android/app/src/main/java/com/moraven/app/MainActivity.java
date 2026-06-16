package com.moraven.app;

import android.os.Bundle;

import com.moraven.app.liveactivity.LiveActivityPlugin;
import com.moraven.app.widget.FinanceWidgetPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FinanceWidgetPlugin.class);
        registerPlugin(LiveActivityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
