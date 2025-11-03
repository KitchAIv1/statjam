import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function initializeFirebase(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }

  return firebaseApp;
}

export function getFirebaseDatabase(): Database {
  if (!database) {
    const app = initializeFirebase();
    database = getDatabase(app);
  }
  return database;
}

export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

