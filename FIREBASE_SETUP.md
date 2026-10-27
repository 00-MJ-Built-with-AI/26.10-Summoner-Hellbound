# Turning on the online features

Cloud saves, Google sign-in, the real-player arena and the leaderboards all run on a free Firebase project. Until you do the steps below, the game hides every online button and works exactly as before.

It takes about 10 minutes. Everything here is on the free "Spark" plan.

## 1. Create the project

1. Go to https://console.firebase.google.com and sign in with your Google account.
2. Click **Create a project**, name it (for example `summoner-hellbound`), and finish the wizard. Google Analytics is not needed.

## 2. Turn on Google sign-in

1. In the left menu, open **Build → Authentication** and click **Get started**.
2. Under **Sign-in method**, choose **Google**, switch it on, pick a support email and **Save**.
3. Open the **Settings** tab → **Authorized domains** and add `00-mj-built-with-ai.github.io` (the live game). `localhost` is already there for testing.

## 3. Create the database

1. Open **Build → Firestore Database** and click **Create database**.
2. Pick a location close to your players, start in **production mode**, and create it.
3. Open the **Rules** tab, replace everything with the contents of [`firestore.rules`](firestore.rules) from this repo, and click **Publish**.
4. The arena search uses one simple index that Firestore creates automatically. If the browser console ever shows a link to "create index", open it and click Create.

## 4. Connect the game

1. Open **Project settings** (the gear icon) → **General** → **Your apps** → click the **Web** icon (`</>`), give it a name and register it. Hosting is not needed.
2. Copy the `firebaseConfig` object it shows.
3. Paste it into [`js/firebase-config.js`](js/firebase-config.js), replacing `null`:

   ```js
   const FIREBASE_CONFIG = { apiKey: '…', authDomain: '…', projectId: '…', storageBucket: '…', messagingSenderId: '…', appId: '…' };
   ```

4. Commit and push. GitHub Pages updates in about a minute.

These values are public by design (every Firebase web app ships them). The rules from step 3 are what keep each player's save private.

## 5. Check it

Open the game → **Settings → Account → Sign in with Google**. After signing in:

- your save uploads automatically (at most once a minute, and when you leave the page);
- on another device, sign in and pick which save to keep if both have progress;
- **Codex → Leaderboards** shows the tower, Boss Rush, arena, World Boss and Rift boards;
- **Village → Arena** mixes real players' loadouts in with the AI rivals.

## Good to know

- **Leaderboards trust the game client.** Someone who edits their browser data could post a fake score. For a hobby game this is normal; if it ever matters, scores can be checked with a Cloud Function later.
- **Free plan limits** (50,000 reads and 20,000 writes per day) are far above what a small game uses.
- **The Android app** uses the same project. When you build it, also add an Android app in Project settings and follow ANDROID.md.
