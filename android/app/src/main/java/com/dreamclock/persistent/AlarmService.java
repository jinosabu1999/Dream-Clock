package com.dreamclock.persistent;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private static final String TAG = "DreamClockAlarmService";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "alarm_service_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Alarm service created");
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Alarm service started with action: " + 
              (intent != null ? intent.getAction() : "null"));

        // Start foreground service
        startForeground(NOTIFICATION_ID, createNotification());

        // Keep service running
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Alarm service destroyed - attempting restart");
        
        // Restart service if it gets killed
        Intent restartIntent = new Intent(this, AlarmService.class);
        restartIntent.setAction("RESTART_SERVICE");
        startForegroundService(restartIntent);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Dream Clock Background Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps Dream Clock alarms active in background");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Dream Clock")
            .setContentText("Alarms are active in background")
            .setSmallIcon(R.drawable.ic_stat_icon_config_sample)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build();
    }
}
