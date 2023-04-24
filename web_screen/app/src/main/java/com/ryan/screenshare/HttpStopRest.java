package com.ryan.screenshare;

import android.os.AsyncTask;
import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;


public class HttpStopRest extends AsyncTask<String, Void, String> {
    private static final String TAG = HttpStopRest.class.getSimpleName();

    // Create URL
//    URL githubEndpoint = new URL("http://192.168.0.218:3000/test");
//
//    // Create connection
//    HttpsURLConnection myConnection = (HttpsURLConnection) githubEndpoint.openConnection();



    private String str, receiveMsg;
    @Override
    protected String doInBackground(String... params) {
        URL url = null;
        try {

            Log.d(TAG, "params=del========0======" + params[0]);
            String deviceModel = android.os.Build.MODEL;
            url = new URL("http://"+params[0]+"/del/"+deviceModel);
            Log.d(TAG, "params=del========url0======" + url);

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "responseCode==============================" + responseCode);
//            if (conn.getResponseCode() == conn.HTTP_OK) {
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
