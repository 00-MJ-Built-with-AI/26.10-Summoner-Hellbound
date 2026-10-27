# Android app and rewarded ads

The `android/` folder is a ready Capacitor project that wraps the game. Rewarded ads use AdMob and only appear in the app, never on the website. Right now they use **Google's test ads**, which are safe to click while you develop.

## What players get from ads

Watching an ad is always optional, and each reward has a daily cap:

| Where | Reward | Per day |
|---|---|---|
| Results screen after a win | Double the magic stones from that stage | 3 |
| Village → Altar | One free draw | 2 |
| Village → Arena (when out of tickets) | One extra ticket | 2 |

Change the caps in `js/ads.js` (`ADS_CONFIG.dailyCap`).

## 1. Build the app on your PC

1. Install **Android Studio** from https://developer.android.com/studio. It includes the Java 17 that Android builds need; your PC currently has only Java 8.
2. In this folder, run:

   ```bash
   npm run android
   ```

   This copies the game into `www/`, syncs it into the Android project and opens Android Studio.
3. In Android Studio, wait for Gradle to finish, plug in your phone (USB debugging on) or start an emulator, and press **Run ▶**.

Every time you change the game, run `npm run android` again (or `npm run android:sync` if Android Studio is already open).

## 2. Switch to real ads (when you're ready to earn)

1. Create an account at https://admob.google.com and add an Android app.
2. Copy your **App ID** (`ca-app-pub-…~…`) into `android/app/src/main/AndroidManifest.xml`, replacing the test id.
3. Create a **Rewarded** ad unit and copy its id (`ca-app-pub-…/…`) into `js/ads.js` → `ADS_CONFIG.rewardedId`.
4. Set `ADS_CONFIG.testing` to `false`.
5. Never tap your own live ads; AdMob can suspend accounts for that. Keep `testing: true` on your own phone builds.

## 3. Publish on Google Play

1. Create a Google Play developer account at https://play.google.com/console (one-time $25 fee).
2. In Android Studio: **Build → Generate Signed App Bundle**, create a keystore (back it up; you need it for every update) and build an `.aab`.
3. In Play Console: create the app, fill in the store listing, content rating and **Data safety** form (ads collect a device advertising ID), set the price to free, upload the `.aab` and submit for review.

## 4. Cloud saves in the app

If you set up Firebase (see FIREBASE_SETUP.md), also add an **Android app** in the Firebase project settings with the package name `com.mjbuiltwithai.summoner`. Google sign-in in the app uses the redirect flow, which works inside the app's web view.
