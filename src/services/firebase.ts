import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Firebase'i initialize et
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// PIN kodunu kaydet
export const setPinCode = async (pin: string) => {
  try {
    const pinRef = ref(database, 'pin');
    await set(pinRef, pin);
    console.log('PIN Firebase e kaydedildi');
  } catch (error) {
    console.error('PIN kaydetme hatası:', error);
    throw error;
  }
};

// PIN kodunu oku
export const getPinCode = async () => {
  return new Promise((resolve) => {
    const pinRef = ref(database, 'pin');
    onValue(pinRef, (snapshot) => {
      const value = snapshot.val();
      resolve(value);
    }, { onlyOnce: true });
  });
};

// Parmak izi dogrulama durumunu kaydet
export const setFingerprintVerified = async (verified: boolean) => {
  try {
    const verifiedRef = ref(database, 'fingerprint_verified');
    await set(verifiedRef, verified);
    console.log('Parmak izi durum kaydedildi:', verified);
  } catch (error) {
    console.error('Parmak izi durum kaydetme hatası:', error);
    throw error;
  }
};

// LED durumunu Firebase'e yaz
export const setLedStatus = async (isOn: boolean) => {
  try {
    const ledRef = ref(database, 'led/status');
    await set(ledRef, isOn ? 1 : 0);
    console.log('LED durumu Firebase e yazıldı:', isOn ? 'AÇIK' : 'KAPALI');
  } catch (error) {
    console.error('Firebase yazma hatası:', error);
    throw error;
  }
};

// LED durumunu dinle
export const listenToLedStatus = (callback: (status: boolean) => void) => {
  const ledRef = ref(database, 'led/status');
  return onValue(ledRef, (snapshot) => {
    const value = snapshot.val();
    callback(value === 1);
  });
};

// ESP32'den veri oku
export const listenToESP32Data = (callback: (data: any) => void) => {
  const esp32Ref = ref(database, 'esp32');
  return onValue(esp32Ref, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
};

export default database;
