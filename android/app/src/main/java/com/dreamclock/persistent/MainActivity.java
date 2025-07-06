package com.dreamclock.persistent;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "DreamClockMainActivity";
    private static final int BATTERY_OPTIMIZATION_REQUEST = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "MainActivity created");

        // Start alarm service
        startAlarmService();

        // Request battery optimization exemption
        requestBatteryOptimizationExemption();

        // Handle auto-start from boot receiver
        if (getIntent().getBooleanExtra("auto_start", false)) {
            Log.d(TAG, "Auto-started after boot - minimizing app");
            moveTaskToBack(true);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity resumed");
        
        // Ensure alarm service is running
        startAlarmService();
    }

    private void startAlarmService() {
        try {
            Intent serviceIntent = new Intent(this, AlarmService.class);
            serviceIntent.setAction("START_ALARMS");
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            
            Log.d(TAG, "Alarm service started");
        } catch (Exception e) {
            Log.e(TAG, "Error starting alarm service", e);
        }
    }

    private void requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent();
                String packageName = getPackageName();
                
                if (!Settings.System.canWrite(this)) {
                    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    startActivityForResult(intent, BATTERY_OPTIMIZATION_REQUEST);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error requesting battery optimization exemption", e);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (requestCode == BATTERY_OPTIMIZATION_REQUEST) {
            if (resultCode == RESULT_OK) {
                Toast.makeText(this, "Battery optimization disabled for reliable alarms", 
                             Toast.LENGTH_LONG).show();
            } else {
                Toast.makeText(this, "Battery optimization still enabled - alarms may be unreliable", 
                             Toast.LENGTH_LONG).show();
            }
        }
    }
}
