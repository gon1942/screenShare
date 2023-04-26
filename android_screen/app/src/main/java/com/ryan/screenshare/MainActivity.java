package com.ryan.screenshare;




import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.content.ContextCompat;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.media.projection.MediaProjectionManager;
import android.net.LinkAddress;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.provider.Settings;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.ToggleButton;

//import com.google.android.gms.ads.AdRequest;
//import com.google.android.gms.ads.AdSize;
//import com.google.android.gms.ads.AdView;
//import com.google.android.gms.ads.MobileAds;
//import com.google.android.gms.ads.initialization.InitializationStatus;
//import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
//import com.google.zxing.integration.android.IntentIntegrator;
//import com.google.zxing.integration.android.IntentResult;

import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.Inet6Address;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = MainActivity.class.getSimpleName();

    private static final int PERM_ACTION_ACCESSIBILITY_SERVICE = 100;
    private static final int PERM_MEDIA_PROJECTION_SERVICE = 101;

    private static final int HANDLER_MESSAGE_UPDATE_NETWORK = 0;

    private int httpServerPort;
    private String httpServerUserName;

    private AppService appService = null;
    private AppServiceConnection serviceConnection = null;

    private NetworkHelper networkHelper = null;
    private SettingsHelper settingsHelper = null;
    private PermissionHelper permissionHelper;

//    private AdView adView;
    private String str, receiveMsg, serverUrl;
    private HttpStartRest httpRestApi = null;
    TextView tv_qr_readTxt;

    //qr
    Button btnScan;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.d(TAG, "Activity create");

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Toolbar toolbar = findViewById(R.id.toolbar);

        //qr ===============================================================================================
        btnScan = (Button)findViewById(R.id.btnScan);
        tv_qr_readTxt = (TextView) findViewById(R.id.tv_qr_readTxt);
        btnScan.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                IntentIntegrator integrator = new IntentIntegrator(MainActivity.this);
                integrator.setDesiredBarcodeFormats(IntentIntegrator.ALL_CODE_TYPES);
                integrator.setPrompt("Scan");
                integrator.setCameraId(0);
                integrator.setBeepEnabled(false);
                integrator.setBarcodeImageEnabled(false);
                integrator.initiateScan();
            }
        });


        // qr ================================================================================================================

        setSupportActionBar(toolbar);

//        initAds();

        initSettings();

        ToggleButton startButton = findViewById(R.id.startButton);
        startButton.setOnCheckedChangeListener(new ToggleButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (isChecked) {
                    buttonView.setBackground(getDrawable(R.drawable.bg_button_on));
                    start();
                }
                else {
                    buttonView.setBackground(getDrawable(R.drawable.bg_button_off));
                    stop();
                }
            }
        });

        ToggleButton remoteControl = findViewById(R.id.remoteControlEnableSwitch);
        remoteControl.setOnCheckedChangeListener(new Switch.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                buttonView.setBackground(getDrawable(isChecked ? R.drawable.bg_button_on :
                        R.drawable.bg_button_off));
                remoteControlEnable(isChecked);
            }
        });
        if (settingsHelper.isRemoteControlEnabled())
            remoteControl.setChecked(true);

        if (AppService.isServiceRunning())
            setStartButton();

        initPermission();

        initUrl();
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Activity destroy");

        if (networkHelper != null)
            networkHelper.close();
        unbindService();
        uninitSettings();
        super.onDestroy();
    }

    private void start() {
        Log.d(TAG, "Stream start");
        if (AppService.isServiceRunning()) {
            bindService();
            return;
        }

        permissionHelper.requestInternetPermission();
    }

    private void stop() {
        Log.d(TAG, "Stream stop");


        ToggleButton startButton = findViewById(R.id.startButton);
        startButton.setVisibility(View.GONE);


//        ToggleButton startButton = findViewById(R.id.startButton);
//        startButton.setVisibility(1);

        ToggleButton scanButton = findViewById(R.id.btnScan);
        scanButton.setVisibility(View.VISIBLE);

//        if( serverUrl == ""){
//            ToggleButton scanButton = findViewById(R.id.btnScan);
//            scanButton.setVisibility(View.GONE);
//        }
//        Log.d(TAG, "Stream stop ----serverUrl " + serverUrl);
        new HttpStopRest().execute(serverUrl);

        if (!AppService.isServiceRunning())
            return;

        stopService();
    }

    private void initPermission() {
        permissionHelper = new PermissionHelper(this, new OnPermissionGrantedListener());
    }

    private class OnPermissionGrantedListener implements
            PermissionHelper.OnPermissionGrantedListener {
        @Override
        public void onAccessNetworkStatePermissionGranted(boolean isGranted) {
            if (!isGranted)
                return;
            networkHelper = new NetworkHelper(getApplicationContext(), new OnNetworkChangeListener());
            urlUpdate();
        }

        @Override
        public void onInternetPermissionGranted(boolean isGranted) {
            if (isGranted)
                permissionHelper.requestReadExternalStoragePermission();
            else
                resetStartButton();
        }

        @Override
        public void onReadExternalStoragePermissionGranted(boolean isGranted) {
            if (isGranted)
                permissionHelper.requestWakeLockPermission();
            else
                resetStartButton();
        }

        @Override
        public void onWakeLockPermissionGranted(boolean isGranted) {
            if (isGranted)
                permissionHelper.requestForegroundServicePermission();
            else
                resetStartButton();
        }

        @Override
        public void onForegroundServicePermissionGranted(boolean isGranted) {
            if (isGranted) {
                //TODO permissionHelper.requestRecordAudioPermission();
                startService();
            }
            else
                resetStartButton();
        }

        @Override
        public void onRecordAudioPermissionGranted(boolean isGranted) {
            if (isGranted)
                startService();
            else
                resetStartButton();
        }

        @Override
        public void onCameraPermissionGranted(boolean isGranted) {
            if (isGranted)
                startService();
            else
                resetStartButton();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        permissionHelper.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    private void startService() {
        Intent serviceIntent = new Intent(this, AppService.class);
        ContextCompat.startForegroundService(this, serviceIntent);
        serviceConnection = new AppServiceConnection();
        bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE);
    }

    private void stopService() {
        unbindService();
        Intent serviceIntent = new Intent(this, AppService.class);
        stopService(serviceIntent);
    }

    private void bindService() {
        Intent serviceIntent = new Intent(this, AppService.class);
        serviceConnection = new AppServiceConnection();
        bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE);
    }

    private void unbindService() {
        if (serviceConnection == null)
            return;

        unbindService(serviceConnection);
        serviceConnection = null;

    }

    private class AppServiceConnection implements ServiceConnection {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            AppService.AppServiceBinder binder = (AppService.AppServiceBinder)service;
            appService = binder.getService();

            if (!appService.isServerRunning())
                askMediaProjectionPermission();
            else if (appService.isMouseAccessibilityServiceAvailable())
                setRemoteControlSwitch();
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            appService = null;
            resetStartButton();
            Log.e(TAG, "Service unexpectedly exited");
        }
    }

    private void askMediaProjectionPermission() {
        MediaProjectionManager mediaProjectionManager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        startActivityForResult(mediaProjectionManager.createScreenCaptureIntent(),PERM_MEDIA_PROJECTION_SERVICE);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "requestCode===============================" + requestCode);
        Log.d(TAG, "android.os.Build.DEVICE===============================" + android.os.Build.DEVICE);
        Log.d(TAG, "android.os.Build.MODEL===============================" + android.os.Build.MODEL);
        Log.d(TAG, "android.os.Build.PRODUCT===============================" + android.os.Build.PRODUCT);
        Log.d(TAG, "android.os.Build.VERSION.SDK  ===============================" + android.os.Build.BRAND  );
        Log.d(TAG, "android.os.Build.VERSION.BOARD  ===============================" + android.os.Build.BOARD  );
        Log.d(TAG, "android.os.Build.VERSION.HOST  ===============================" + android.os.Build.HOST  );
        Log.d(TAG, "android.os.Build.VERSION.ID  ===============================" + android.os.Build.ID  );
        Log.d(TAG, "android.os.Build.VERSION.MANUFACTURER  ===============================" + android.os.Build.MANUFACTURER  );




        switch (requestCode) {
            case PERM_MEDIA_PROJECTION_SERVICE:
                if (resultCode == RESULT_OK) {
                    if (!appService.serverStart(data, httpServerPort,
                            isAccessibilityServiceEnabled(), getApplicationContext())) {
                        resetStartButton();
                        return;
                    }
                }
                else
                    resetStartButton();
                break;
            case PERM_ACTION_ACCESSIBILITY_SERVICE:
                if (isAccessibilityServiceEnabled())
                    enableAccessibilityService(true);
                else
                    resetRemoteControlSwitch();
                break;
            default:



                IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
                TextView connectionURL = findViewById(R.id.connectionURL);
                String urlInfo = (String) connectionURL.getText();
                serverUrl = result.getContents();


                new HttpStartRest().execute(urlInfo, serverUrl, httpServerUserName);
//                GETFunction(urlInfo, serverUrl);



                ToggleButton startButton = findViewById(R.id.startButton);
                startButton.setVisibility(1);

                setStartButton();
                break;
        }


        super.onActivityResult(requestCode, resultCode, data);
    }


    public String GETFunction(String urlInfo, String serverUrl) {
        try {

            String deviceUrl = urlInfo.replace("https://", "");
            String deviceModel = android.os.Build.MODEL;
//            URL url = new URL("http://"+serverUrl+"/test/"+deviceModel+"/"+deviceUrl);
            String setUrl = "http://192.168.0.218:3000/api/users/user?user_id=1";
            URL url = new URL(setUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("content-type", "application/x-www-form-urlencoded");
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(10000);
            conn.setDoInput(true);
            conn.setDoOutput(true);


            InputStream is = conn.getInputStream();
            StringBuilder sb = new StringBuilder();
            BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
            String result;
            while ((result = br.readLine()) != null) {
                sb.append(result + '\n');
            }

            result = sb.toString();

            return result;

        } catch (Exception e) {
            e.printStackTrace();
        }

        Log.d("ERROR", "EXCEPTION_ERROR");
        return null;
    }

    private void setStartButton() {
        ToggleButton startButton = findViewById(R.id.startButton);
        startButton.setChecked(true);

        ToggleButton scanButton = findViewById(R.id.btnScan);
        scanButton.setVisibility(View.INVISIBLE);

    }

    private void resetStartButton() {
        ToggleButton startButton = findViewById(R.id.startButton);
        startButton.setChecked(false);
    }

    private void enableAccessibilityService(boolean isEnabled) {
        settingsHelper.setRemoteControlEnabled(isEnabled);

        if (appService != null)
            appService.accessibilityServiceSet(getApplicationContext(), isEnabled);
    }

    private boolean isAccessibilityServiceEnabled() {
        Context context = getApplicationContext();
        ComponentName compName = new ComponentName(context, MouseAccessibilityService.class);
        String flatName = compName.flattenToString();
        String enabledList = Settings.Secure.getString(context.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return enabledList != null && enabledList.contains(flatName);
    }

    private void setRemoteControlSwitch() {
        ToggleButton remoteControl = findViewById(R.id.remoteControlEnableSwitch);
        remoteControl.setChecked(true);
    }

    private void resetRemoteControlSwitch() {
        ToggleButton remoteControl = findViewById(R.id.remoteControlEnableSwitch);
        remoteControl.setChecked(false);
    }

    private void remoteControlEnable(boolean isEnabled) {
        if (isEnabled) {
            if (!isAccessibilityServiceEnabled()) {
                startActivityForResult(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
                        PERM_ACTION_ACCESSIBILITY_SERVICE);
            } else {
                enableAccessibilityService(true);
            }
        } else {
            enableAccessibilityService(false);
        }

    }

    public void initUrl() {
        LinearLayout urlLayout = findViewById(R.id.urlLinerLayout);
        urlLayout.setVisibility(View.INVISIBLE);
        permissionHelper.requestAccessNetworkStatePermission();
    }

    private class OnNetworkChangeListener implements NetworkHelper.OnNetworkChangeListener {
        @Override
        public void onChange() {
            // Interfaces need some time to update
            handler.sendEmptyMessageDelayed(HANDLER_MESSAGE_UPDATE_NETWORK, 1000);
        }
    }

    private Handler handler = new Handler(Looper.getMainLooper()) {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case HANDLER_MESSAGE_UPDATE_NETWORK:
                    urlUpdate();
                    break;
                default:
                    super.handleMessage(msg);
                    break;
            }
        }
    };

    private void urlUpdate() {
        TextView urlsHeader = findViewById(R.id.urls_header);
        urlsHeader.setText(getResources().getString(R.string.no_active_connections));
        LinearLayout urlLayout = findViewById(R.id.urlLinerLayout);
        urlLayout.setVisibility(View.INVISIBLE);

        List<NetworkHelper.IpInfo> ipInfoList = networkHelper.getIpInfo();
        for (NetworkHelper.IpInfo ipInfo : ipInfoList) {
            if (!ipInfo.interfaceType.equals("Wi-Fi"))
                continue;

            String type = ipInfo.interfaceType + " (" + ipInfo.interfaceName + ")";
            TextView connectionType = findViewById(R.id.connectionTypeHeader);
            connectionType.setText(type);

            List<LinkAddress> addresses = ipInfo.addresses;
            for (LinkAddress address : addresses) {
                if (address.getAddress() instanceof Inet6Address)
                    continue;

                String url = "https://" + address.getAddress().getHostAddress() + ":" + httpServerPort;
                TextView connectionURL = findViewById(R.id.connectionURL);
                connectionURL.setText(url);
                Log.d(TAG, "httpServerUserName 999===============================" + httpServerUserName);
                urlsHeader.setText(getResources().getString(R.string.urls_header));
                urlLayout.setVisibility(View.VISIBLE);

                Log.d(TAG, "urlUpdate serverUrl===============================" + serverUrl  );

                if(serverUrl != null ){
                    Log.d(TAG, "httpServerUserName========================" + httpServerUserName);
                    new HttpStartRest().execute(url, serverUrl, httpServerUserName);
//                    ToggleButton startButton = findViewById(R.id.startButton);
//                    startButton.setVisibility(1);
                }


                break;
            }
        }


    }

    private String getIpAddress() {
        String ipAddress = null;
//        TextView urlsHeader = findViewById(R.id.urls_header);
//        urlsHeader.setText(getResources().getString(R.string.no_active_connections));
//        LinearLayout urlLayout = findViewById(R.id.urlLinerLayout);
//        urlLayout.setVisibility(View.INVISIBLE);

        List<NetworkHelper.IpInfo> ipInfoList = networkHelper.getIpInfo();
        for (NetworkHelper.IpInfo ipInfo : ipInfoList) {
            if (!ipInfo.interfaceType.equals("Wi-Fi"))
                continue;

            String type = ipInfo.interfaceType + " (" + ipInfo.interfaceName + ")";
//            TextView connectionType = findViewById(R.id.connectionTypeHeader);
//            connectionType.setText(type);

            List<LinkAddress> addresses = ipInfo.addresses;
            for (LinkAddress address : addresses) {
                if (address.getAddress() instanceof Inet6Address)
                    continue;

                ipAddress = address.getAddress().getHostAddress();
//                String url = "https://" + address.getAddress().getHostAddress() + ":" + httpServerPort;
//                TextView connectionURL = findViewById(R.id.connectionURL);
//                connectionURL.setText(url);
//                urlsHeader.setText(getResources().getString(R.string.urls_header));
//                urlLayout.setVisibility(View.VISIBLE);
                break;
            }
        }
        return ipAddress;
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.xml.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();

        if (id == R.id.action_settings) {
            Intent intent = new Intent(MainActivity.this, SettingsActivity.class);
            startActivity(intent);
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

//    private void initAds() {
//        MobileAds.initialize(this, new OnInitializationCompleteListener() {
//            @Override
//            public void onInitializationComplete(InitializationStatus initializationStatus) {
//            }
//        });
//
//        RelativeLayout adLayout = findViewById(R.id.adLayout);
//        adView = new AdView(this);
//        RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(RelativeLayout.
//                LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
//        layoutParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
//
//        String adUnitId = getString(BuildConfig.DEBUG ? R.string.adaptive_banner_ad_unit_id_test : R.string.adaptive_banner_ad_unit_id);
//        adView.setAdUnitId(adUnitId);
//        adLayout.addView(adView, layoutParams);;
//
//        AdSize adSize = getAdSize();
//        adView.setAdSize(adSize);
//
//        AdRequest adRequest = new AdRequest.Builder().build();
//        adView.loadAd(adRequest);
//    }

//    private AdSize getAdSize() {
//        Display display = getWindowManager().getDefaultDisplay();
//        DisplayMetrics outMetrics = new DisplayMetrics();
//        display.getMetrics(outMetrics);
//
//        float widthPixels = outMetrics.widthPixels;
//        float density = outMetrics.density;
//
//        int adWidth = (int) (widthPixels / density);
//
//        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, adWidth);
//    }

    public void initSettings() {
        settingsHelper = new SettingsHelper(getApplicationContext(), new OnSettingsChangeListener());
        httpServerPort = settingsHelper.getPort();
        httpServerUserName = settingsHelper.getUserName();
        Log.d(TAG, "httpServerUserName=============00==================" + httpServerUserName);
    }

    public void uninitSettings() {
        settingsHelper.close();
        settingsHelper = null;
    }

    private class OnSettingsChangeListener implements SettingsHelper.OnSettingsChangeListener {
        @Override
        public void onPortChange(int port) {
            httpServerPort = port;
            urlUpdate();
            if (AppService.isServiceRunning()) {
                if (!appService.serverRestart(httpServerPort))
                    resetStartButton();
            }
        }

        @Override
        public void onUsernameChange(String username) {
            httpServerUserName = username;
            Log.d(TAG, "httpServerUserName=============11==================" + httpServerUserName);
            urlUpdate();
            if (AppService.isServiceRunning()) {
                if (!appService.serverRestart(httpServerPort))
                    resetStartButton();
            }
        }
    }
}


