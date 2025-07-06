package com.dreamclock.persistent;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "DreamClockBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "Boot receiver triggered with action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
            "com.htc.intent.action.QUICKBOOT_POWERON".equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(action)) {
            
            Log.d(TAG, "Device booted or app updated - starting alarm service");
            
            try {
                // Start the alarm service
                Intent serviceIntent = new Intent(context, AlarmService.class);
                serviceIntent.setAction("RESTART_ALARMS");
                context.startForegroundService(serviceIntent);
                
                // Also start the main activity to initialize the web app
                Intent activityIntent = new Intent(context, MainActivity.class);
                activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activityIntent.putExtra("auto_start", true);
                context.startActivity(activityIntent);
                
                Log.d(TAG, "Alarm service and main activity started successfully");
            } catch (Exception e) {
                Log.e(TAG, "Error starting services after boot", e);
            }
        }
    }
}
