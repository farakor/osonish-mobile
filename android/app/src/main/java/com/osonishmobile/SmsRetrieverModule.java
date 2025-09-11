package com.osonishmobile;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;

import javax.annotation.Nonnull;

public class SmsRetrieverModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final String TAG = "SmsRetrieverModule";
    private static final int SMS_CONSENT_REQUEST = 2;
    
    private ReactApplicationContext reactContext;
    private SmsBroadcastReceiver smsBroadcastReceiver;
    private boolean isListening = false;

    public SmsRetrieverModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
    }

    @Nonnull
    @Override
    public String getName() {
        return "SmsRetrieverModule";
    }

    @ReactMethod
    public void startSmsRetriever(int timeoutMillis, Promise promise) {
        if (isListening) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "SMS Retriever уже запущен");
            promise.resolve(result);
            return;
        }

        try {
            SmsRetrieverClient client = SmsRetriever.getClient(reactContext);
            
            // Запускаем SMS Retriever API
            Task<Void> task = client.startSmsRetriever();
            
            task.addOnSuccessListener(new OnSuccessListener<Void>() {
                @Override
                public void onSuccess(Void aVoid) {
                    Log.d(TAG, "SMS Retriever запущен успешно");
                    
                    // Регистрируем BroadcastReceiver
                    registerSmsReceiver();
                    isListening = true;
                    
                    WritableMap result = Arguments.createMap();
                    result.putBoolean("success", true);
                    result.putString("message", "SMS Retriever запущен");
                    result.putString("appHash", getAppHash());
                    promise.resolve(result);
                }
            });
            
            task.addOnFailureListener(new OnFailureListener() {
                @Override
                public void onFailure(@Nonnull Exception e) {
                    Log.e(TAG, "Ошибка запуска SMS Retriever", e);
                    
                    WritableMap result = Arguments.createMap();
                    result.putBoolean("success", false);
                    result.putString("error", e.getMessage());
                    promise.resolve(result);
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Исключение при запуске SMS Retriever", e);
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("error", e.getMessage());
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void stopSmsRetriever() {
        if (!isListening) {
            return;
        }

        try {
            unregisterSmsReceiver();
            isListening = false;
            Log.d(TAG, "SMS Retriever остановлен");
        } catch (Exception e) {
            Log.e(TAG, "Ошибка остановки SMS Retriever", e);
        }
    }

    @ReactMethod
    public void getAppHash(Promise promise) {
        try {
            String appHash = getAppHash();
            
            WritableMap result = Arguments.createMap();
            result.putString("appHash", appHash);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("GET_APP_HASH_ERROR", e.getMessage());
        }
    }

    private void registerSmsReceiver() {
        smsBroadcastReceiver = new SmsBroadcastReceiver();
        IntentFilter intentFilter = new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION);
        reactContext.registerReceiver(smsBroadcastReceiver, intentFilter);
        Log.d(TAG, "SMS BroadcastReceiver зарегистрирован");
    }

    private void unregisterSmsReceiver() {
        if (smsBroadcastReceiver != null) {
            try {
                reactContext.unregisterReceiver(smsBroadcastReceiver);
                smsBroadcastReceiver = null;
                Log.d(TAG, "SMS BroadcastReceiver отменен");
            } catch (Exception e) {
                Log.e(TAG, "Ошибка отмены SMS BroadcastReceiver", e);
            }
        }
    }

    private String getAppHash() {
        try {
            String packageName = reactContext.getPackageName();
            String signature = getAppSignature();
            
            String appInfo = packageName + " " + signature;
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            messageDigest.update(appInfo.getBytes());
            
            byte[] hashSignature = messageDigest.digest();
            String hashString = bytesToHex(hashSignature);
            
            // Берем первые 11 символов и добавляем +
            String appHash = hashString.substring(0, 11);
            
            Log.d(TAG, "App Hash: " + appHash);
            return appHash;
        } catch (Exception e) {
            Log.e(TAG, "Ошибка получения App Hash", e);
            return "";
        }
    }

    private String getAppSignature() {
        try {
            android.content.pm.PackageManager pm = reactContext.getPackageManager();
            android.content.pm.PackageInfo packageInfo = pm.getPackageInfo(
                reactContext.getPackageName(), 
                android.content.pm.PackageManager.GET_SIGNATURES
            );
            
            android.content.pm.Signature[] signatures = packageInfo.signatures;
            if (signatures.length > 0) {
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                md.update(signatures[0].toByteArray());
                return bytesToHex(md.digest());
            }
        } catch (Exception e) {
            Log.e(TAG, "Ошибка получения подписи приложения", e);
        }
        return "";
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    private void sendSmsEvent(String message) {
        if (reactContext.hasActiveCatalystInstance()) {
            WritableMap params = Arguments.createMap();
            params.putString("message", message);

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onSmsReceived", params);
                
            Log.d(TAG, "SMS событие отправлено в React Native");
        }
    }

    private void sendTimeoutEvent() {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onSmsTimeout", null);
                
            Log.d(TAG, "SMS timeout событие отправлено");
        }
    }

    // BroadcastReceiver для SMS Retriever API
    private class SmsBroadcastReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction())) {
                Bundle extras = intent.getExtras();
                Status status = (Status) extras.get(SmsRetriever.EXTRA_STATUS);

                switch (status.getStatusCode()) {
                    case CommonStatusCodes.SUCCESS:
                        // Получено SMS сообщение
                        String message = (String) extras.get(SmsRetriever.EXTRA_SMS_MESSAGE);
                        Log.d(TAG, "SMS получено: " + message);
                        sendSmsEvent(message);
                        break;
                        
                    case CommonStatusCodes.TIMEOUT:
                        // Таймаут ожидания SMS
                        Log.d(TAG, "SMS Retriever таймаут");
                        sendTimeoutEvent();
                        stopSmsRetriever();
                        break;
                }
            }
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        // Обработка результатов активности (если нужно)
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Обработка новых интентов (если нужно)
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        stopSmsRetriever();
        reactContext.removeActivityEventListener(this);
    }
}
