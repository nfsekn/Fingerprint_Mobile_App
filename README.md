# ESP32 Mobile App - Firebase Parmak İzi Sistemi 🔐

ESP32 ile entegre çalışan, parmak izi doğrulama ve PIN yönetimi için React Native mobil uygulaması.

## 🚀 Özellikler

- 📱 Parmak izi doğrulama
- 🔐 4 haneli PIN sistemi  
- 🔥 Firebase Realtime Database entegrasyonu
- 💡 ESP32 LED kontrolü
- ⚡ Gerçek zamanlı veri senkronizasyonu

## 📋 Gereksinimler

- Node.js 18+
- Expo CLI
- Android Studio (Android için) veya Xcode (iOS için)
- Firebase projesi

## ⚙️ Kurulum

1. Projeyi klonlayın:
```bash
git clone <repo-url>
cd esp32mobileapp
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Firebase yapılandırmasını ayarlayın:
   - `.env.example` dosyasını `.env` olarak kopyalayın
   - Firebase proje bilgilerinizi `.env` dosyasına ekleyin:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

## 🎯 Kullanım

### Geliştirme modunda çalıştırma:

```bash
npx expo start
```

### Android'de çalıştırma:

```bash
npx expo run:android
```

### iOS'ta çalıştırma:

```bash
npx expo run:ios
```

## 🔧 Firebase Yapılandırması

1. Firebase Console'da yeni bir proje oluşturun
2. Realtime Database'i etkinleştirin  
3. Veritabanı kurallarını ayarlayın (geliştirme için):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. Web uygulaması ekleyin ve yapılandırma bilgilerini `.env` dosyasına ekleyin

## 📱 ESP32 Entegrasyonu

Bu uygulama ESP32 mikrodenetleyici ile çalışmak üzere tasarlanmıştır. ESP32 kodu `ESP32_Fingerprint.ino` dosyasında bulunmaktadır.

### Firebase Veritabanı Yapısı:

```
esp32-database/
├── pin: "1234"
├── fingerprint_verified: true/false
└── led/
    └── status: 0/1
```

## 🛡️ Güvenlik Notları

- `.env` dosyası `.gitignore`'a eklenmiştir
- API anahtarlarınızı asla GitHub'a yüklemeyin
- Üretim ortamında Firebase güvenlik kurallarını mutlaka sıkılaştırın
- PIN kodlarını şifreli olarak saklamayı düşünün

## 📂 Proje Yapısı

```
├── app/              # Uygulama ekranları
│   ├── index.tsx     # Ana ekran
│   └── (tabs)/       # Tab navigation
├── src/
│   └── services/     
│       └── firebase.ts  # Firebase servisleri
├── assets/           # Görseller ve medya
├── components/       # Yeniden kullanılabilir componentler
├── constants/        # Sabitler ve tema
└── ESP32_Fingerprint.ino  # ESP32 Arduino kodu
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🙏 Teşekkürler

- [Expo](https://expo.dev)
- [Firebase](https://firebase.google.com)
- [React Native](https://reactnative.dev)

