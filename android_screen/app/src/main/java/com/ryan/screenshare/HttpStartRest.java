package com.ryan.screenshare;

import android.os.AsyncTask;
import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;


public class HttpStartRest extends AsyncTask<String, Void, String> {
    private static final String TAG = HttpStartRest.class.getSimpleName();

    // Create URL
//    URL githubEndpoint = new URL("http://192.168.0.218:3000/test");
//
//    // Create connection
//    HttpsURLConnection myConnection = (HttpsURLConnection) githubEndpoint.openConnection();



    private String str, receiveMsg;
    @Override
    protected String doInBackground(String... params) {
        Log.d(TAG, "params=========0======" + params[0]);
        Log.d(TAG, "params=========1======" + params[1]);
        Log.d(TAG, "params=========2======" + params[2]);
        URL url = null;
        try {

            URI deviceUrlData = URI.create(params[0]);
            String deviceUrl = params[0].replace("https://", "");
            int port = deviceUrlData.getPort();

            Log.d(TAG, "deviceUrl=========2222222======" + deviceUrl);
            String deviceModel = android.os.Build.MODEL;
            Log.d(TAG, "android.os.Build.MODEL===============================" + deviceModel);

            url = new URL("http://"+params[1]+"/test/"+deviceModel+"/"+deviceUrl+"/"+ params[2]);

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");         // 통신방식
            conn.setDoInput(true);                // 읽기모드 지정
            conn.setUseCaches(false);             // 캐싱데이터를 받을지 안받을지
            conn.setConnectTimeout(15000);        // 통신 타임아웃

//            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "responseCode==============================" + responseCode);
//            if (conn.getResponseCode() == conn.HTTP_OK) {
//                Log.d(TAG, "11111conngetResponseCode==============================" );
//                InputStreamReader tmp = new InputStreamReader(conn.getInputStream(), "UTF-8");
//                BufferedReader reader = new BufferedReader(tmp);
//                StringBuffer buffer = new StringBuffer();
//                while ((str = reader.readLine()) != null) {
//                    buffer.append(str);
//                }
//                receiveMsg = buffer.toString();
//                Log.i("receiveMsg : ", receiveMsg);
//
//                reader.close();
//            } else {
//                Log.d(TAG, "11111conngetResponseCode222222222222==============================" );
//                Log.i("결과", conn.getResponseCode() + "Error");
//            }
            conn.disconnect();
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return receiveMsg;
    }
}
