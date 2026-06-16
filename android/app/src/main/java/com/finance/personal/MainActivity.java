package com.finance.personal;

import android.os.Bundle;

import com.finance.personal.liveactivity.LiveActivityPlugin;
import com.finance.personal.widget.FinanceWidgetPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FinanceWidgetPlugin.class);
        registerPlugin(LiveActivityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
