package com.osonishmobile;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nonnull;

public class SmsReaderModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmsReaderModule";
    private static final String SMS_RECEIVED_ACTION = "android.provider.Telephony.SMS_RECEIVED";
    
    private ReactApplicationContext reactContext;
    private SmsReceiver smsReceiver;
    private boolean isListening = false;

    public SmsReaderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Nonnull
    @Override
    public String getName() {
        return "SmsReaderModule";
    }

    @ReactMethod
    public void startListening() {
        if (isListening) {
            Log.d(TAG, "SMS Reader уже прослушивает");
            return;
        }

        try {
            smsReceiver = new SmsReceiver();
            IntentFilter filter = new IntentFilter(SMS_RECEIVED_ACTION);
            filter.setPriority(1000); // Высокий приоритет
            
            reactContext.registerReceiver(smsReceiver, filter);
            isListening = true;
            
            Log.d(TAG, "SMS Reader запущен");
        } catch (Exception e) {
            Log.e(TAG, "Ошибка при запуске SMS Reader", e);
        }
    }

    @ReactMethod
    public void stopListening() {
        if (!isListening || smsReceiver == null) {
            return;
        }

        try {
            reactContext.unregisterReceiver(smsReceiver);
            smsReceiver = null;
            isListening = false;
            
            Log.d(TAG, "SMS Reader остановлен");
        } catch (Exception e) {
            Log.e(TAG, "Ошибка при остановке SMS Reader", e);
        }
    }

    private void sendSmsEvent(String address, String body, long timestamp) {
        if (reactContext.hasActiveCatalystInstance()) {
            WritableMap params = Arguments.createMap();
            params.putString("address", address);
            params.putString("body", body);
            params.putDouble("timestamp", timestamp);

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onSMSReceived", params);
                
            Log.d(TAG, "SMS событие отправлено в React Native");
        }
    }

    private class SmsReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!SMS_RECEIVED_ACTION.equals(intent.getAction())) {
                return;
            }

            try {
                Bundle bundle = intent.getExtras();
                if (bundle == null) {
                    return;
                }

                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus == null || pdus.length == 0) {
                    return;
                }

                StringBuilder messageBody = new StringBuilder();
                String address = "";
                long timestamp = System.currentTimeMillis();

                for (Object pdu : pdus) {
                    SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                    if (smsMessage != null) {
                        messageBody.append(smsMessage.getMessageBody());
                        if (address.isEmpty()) {
                            address = smsMessage.getOriginatingAddress();
                            timestamp = smsMessage.getTimestampMillis();
                        }
                    }
                }

                String body = messageBody.toString();
                Log.d(TAG, "Получено SMS от " + address + ": " + body);

                // Отправляем событие в React Native
                sendSmsEvent(address, body, timestamp);

            } catch (Exception e) {
                Log.e(TAG, "Ошибка при обработке SMS", e);
            }
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        stopListening();
    }
}
