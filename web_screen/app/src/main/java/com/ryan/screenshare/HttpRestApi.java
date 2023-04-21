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


public class HttpRestApi extends AsyncTask<String, Void, String> {
    private static final String TAG = HttpRestApi.class.getSimpleName();

    // Create URL
//    URL githubEndpoint = new URL("http://192.168.0.218:3000/test");
//
//    // Create connection
//    HttpsURLConnection myConnection = (HttpsURLConnection) githubEndpoint.openConnection();



    private String str, receiveMsg;
    @Override
    protected String doInBackground(String... params) {
        Log.d(TAG, "params=========2222222======" + params[0]);
        URL url = null;
        try {

            URI deviceUrlData = URI.create(params[0]);
            String deviceUrl = params[0].replace("https://", "");
            int port = deviceUrlData.getPort();

            Log.d(TAG, "deviceUrl=========2222222======" + deviceUrl);
            String deviceModel = android.os.Build.MODEL;
            Log.d(TAG, "android.os.Build.MODEL===============================" + deviceModel);
//            url = new URL("http://192.168.0.218:3000/test/"+deviceModel+"/192/1111");
            url = new URL("http://192.168.0.218:3000/test/"+deviceModel+"/"+deviceUrl+"/"+port);

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
//            conn.setRequestProperty("x-waple-authorization", clientKey);

            if (conn.getResponseCode() == conn.HTTP_OK) {
                InputStreamReader tmp = new InputStreamReader(conn.getInputStream(), "UTF-8");
                BufferedReader reader = new BufferedReader(tmp);
                StringBuffer buffer = new StringBuffer();
                while ((str = reader.readLine()) != null) {
                    buffer.append(str);
                }
                receiveMsg = buffer.toString();
                Log.i("receiveMsg : ", receiveMsg);

                reader.close();
            } else {
                Log.i("결과", conn.getResponseCode() + "Error");
            }
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

        return receiveMsg;
    }
}
