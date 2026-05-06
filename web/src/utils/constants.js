const defaultHost = `${window.location.protocol}//${window.location.hostname}:3000`;

export const API_URL = import.meta.env.VITE_API_URL || defaultHost;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultHost;

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
