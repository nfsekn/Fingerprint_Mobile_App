#include <WiFi.h>
#include <FirebaseESP32.h>
#include <Keypad.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// --- FIREBASE VE WiFi AYARLARI ---
#define API_KEY "apikey"
#define DATABASE_URL "databaseurl"
#define WIFI_SSID "wifissid"
#define WIFI_PASSWORD "wifipassword"

// --- PİN TANIMLARI ---
#define SERVO_PIN 18
#define BUZZER_PIN 13
#define ACCESS_LED_PIN 19

// LCD ve Keypad Ayarları
LiquidCrystal_I2C lcd(0x27, 16, 2);
const byte ROWS = 4; 
const byte COLS = 3; 
char keys[ROWS][COLS] = {{'1','2','3'},{'4','5','6'},{'7','8','9'},{'*','0','#'}};
byte rowPins[ROWS] = {32, 33, 25, 26}; 
byte colPins[COLS] = {27, 14, 12}; 
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// Nesneler
FirebaseData fbdo;
FirebaseConfig config;
FirebaseAuth auth;
Servo myServo;

int hataliGirisSayisi = 0;

// Token durumu callback fonksiyonu
void tokenStatusCallback(TokenInfo info) {
  Serial.print("Token Status: ");
  if (info.status == token_status_ready) {
    Serial.println("READY");
  } else if (info.status == token_status_error) {
    Serial.println("ERROR");
    Serial.println(info.error.message.c_str());
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== SISTEM BASLATILIYOR ===");
  
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(ACCESS_LED_PIN, OUTPUT);
  digitalWrite(ACCESS_LED_PIN, LOW);

  // LCD Başlatma
  Serial.println("[1/4] LCD Baslatiiliyor...");
  lcd.init();
  lcd.backlight();
  lcd.print("Sistem Aciliyor");
  Serial.println("      LCD: OK");

  // Servo Başlatma
  Serial.println("[2/4] Servo Baslatiiliyor...");
  myServo.attach(SERVO_PIN);
  myServo.write(0);
  Serial.println("      Servo: OK");

  // WiFi Bağlantısı
  Serial.println("[3/4] WiFi Baglantisi...");
  Serial.print("      SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lcd.setCursor(0, 1);
  lcd.print("WiFi Baglan...");
  
  int wifiTry = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTry < 20) { 
    delay(500);
    Serial.print(".");
    wifiTry++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n      WiFi: HATA!");
    Serial.println("      SSID veya Sifre Yanlis!");
    lcd.clear();
    lcd.print("WiFi HATASI!");
    lcd.setCursor(0, 1);
    lcd.print("Kontrol Edin");
    buzzerSes(5, 300);
    while(1) { delay(1000); } // Sistem durur
  }
  
  Serial.println("\n      WiFi: BAGLANDI");
  Serial.print("      IP: ");
  Serial.println(WiFi.localIP());
  
  // Firebase Yapılandırması
  Serial.println("[4/4] Firebase Baglantisi...");
  Serial.print("      URL: ");
  Serial.println(DATABASE_URL);
  Serial.print("      API Key: ");
  Serial.println(API_KEY);
  
  // Firebase config ayarları
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = API_KEY;
  
  // Token handler ayarları
  config.token_status_callback = tokenStatusCallback;
  
  // Timeout ayarları
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Firebase.setReadTimeout(fbdo, 1000 * 60);
  Firebase.setwriteSizeLimit(fbdo, "tiny");
  
  // Firebase bağlantı kontrolü için biraz bekle
  lcd.setCursor(0, 1);
  lcd.print("Firebase Test..");
  delay(3000);
  
  Serial.println("      Firebase basladi, test ediliyor...");
  
  // Birkaç deneme yap
  bool firebaseOK = false;
  for(int i=0; i<3; i++) {
    Serial.print("      Deneme ");
    Serial.print(i+1);
    Serial.println("/3...");
    
    if (Firebase.getString(fbdo, "/pin")) {
      Serial.println("      Firebase: BAGLANDI!");
      Serial.print("      PIN Okundu: ");
      Serial.println(fbdo.stringData());
      firebaseOK = true;
      break;
    } else {
      Serial.println("      HATA!");
      Serial.print("      HTTP Code: ");
      Serial.println(fbdo.httpCode());
      Serial.print("      Hata Mesaji: ");
      Serial.println(fbdo.errorReason());
      delay(2000);
    }
  }
  
  if (!firebaseOK) {
    Serial.println("\n!!! FIREBASE BAGLANTI HATASI !!!");
    Serial.println("Olasi Sorunlar:");
    Serial.println("1. Database URL yanlis (https:// ile baslayip .com ile bitmeli)");
    Serial.println("2. API Key yanlis");
    Serial.println("3. Firebase veritabani kurallari kapali");
    Serial.println("4. Internet baglantisi zayif");
    
    lcd.clear();
    lcd.print("Firebase HATA!");
    lcd.setCursor(0, 1);
    lcd.print("Serial Kontrol");
    buzzerSes(5, 300);
    
    // Sistem durmaz, varsayılan PIN ile devam eder
    Serial.println("\n>>> Sistem VARSAYILAN PIN ile devam ediyor <<<");
    delay(3000);
  }
  
  lcd.clear();
  lcd.print("Sistem Hazir!");
  Serial.println("\n=== SISTEM HAZIR ===\n");
  buzzerSes(2, 100);
  delay(2000);
}

void loop() {
  // WiFi bağlantı kontrolü
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n!!! WiFi Baglanti Koptu !!!");
    lcd.clear();
    lcd.print("WiFi Koptu!");
    lcd.setCursor(0, 1);
    lcd.print("Yeniden Baglan");
    buzzerSes(3, 200);
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
      delay(500);
      Serial.print(".");
      retry++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi Tekrar Baglandi!");
      lcd.clear();
      lcd.print("WiFi OK!");
      delay(1000);
    } else {
      Serial.println("\nWiFi Baglanamiyor!");
      delay(5000);
      return;
    }
  }
  
  lcd.clear();
  lcd.print("PIN GIRIN:");
  lcd.setCursor(0, 1);
  lcd.print("Hak: " + String(3 - hataliGirisSayisi));

  if (checkPIN()) {
    hataliGirisSayisi = 0;
    lcd.clear();
    lcd.print("PIN DOGRU!");
    buzzerSes(1, 200);
    delay(1500);
    
    waitForFingerprint();
  } else {
    hataliGirisSayisi++;
    lcd.clear();
    lcd.print("HATALI PIN!");
    buzzerSes(2, 200);
    
    if (hataliGirisSayisi >= 3) {
      alarmVer();
    }
    delay(2000);
  }
}

// Tuş sesi
void bip() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(50);
  digitalWrite(BUZZER_PIN, LOW);
}

// Buzzer sesleri
void buzzerSes(int tekrar, int sure) {
  for(int i=0; i<tekrar; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(sure);
    digitalWrite(BUZZER_PIN, LOW);
    delay(sure/2);
  }
}

void alarmVer() {
  lcd.clear();
  lcd.print("SISTEM KILITLI!");
  lcd.setCursor(0, 1);
  lcd.print("ALARM AKTIF!");
  
  for(int i=0; i<20; i++) {
    buzzerSes(1, 300);
    delay(100);
  }
  hataliGirisSayisi = 0;
  delay(2000);
}

bool checkPIN() {
  // Firebase'den PIN çek
  String firebasePin = "1234"; // Varsayılan
  
  Serial.println("\n--- PIN Kontrolu ---");
  Serial.println("Firebase'den PIN cekiliyor...");
  
  if (Firebase.getString(fbdo, "/pin")) {
    firebasePin = fbdo.stringData();
    Serial.print("PIN Basariyla Okundu: ");
    Serial.println(firebasePin);
  } else {
    Serial.println("HATA: Firebase'den PIN cekilemedi!");
    Serial.print("Hata Kodu: ");
    Serial.println(fbdo.errorReason());
    Serial.println("Varsayilan PIN kullaniliyor: 1234");
    
    lcd.clear();
    lcd.print("Firebase Hata!");
    lcd.setCursor(0, 1);
    lcd.print("Varsayilan PIN");
    buzzerSes(2, 150);
    delay(2000);
  }
  
  String input = "";
  lcd.clear();
  lcd.print("PIN GIRIN:");
  lcd.setCursor(0, 1);
  lcd.print("                ");
  lcd.setCursor(0, 1);
  
  unsigned long startTime = millis();
  while (millis() - startTime < 30000) {
    char key = keypad.getKey();
    if (key) {
      bip();
      
      if (key == '#') {
        Serial.print("Girilen PIN: ");
        Serial.println(input);
        Serial.print("Beklenen PIN: ");
        Serial.println(firebasePin);
        
        if (input == firebasePin) {
          Serial.println("Sonuc: DOGRU\n");
          return true;
        } else {
          Serial.println("Sonuc: YANLIS\n");
          return false;
        }
      }
      else if (key == '*') {
        if (input.length() > 0) {
          input.remove(input.length() - 1);
          lcd.setCursor(0, 1);
          lcd.print("                ");
          lcd.setCursor(0, 1);
          for(int i=0; i<input.length(); i++) lcd.print("*");
        }
      }
      else if (input.length() < 10) {
        input += key;
        lcd.setCursor(input.length()-1, 1);
        lcd.print("*");
      }
    }
  }
  
  Serial.println("Timeout: PIN girilmedi\n");
  return false;
}

void waitForFingerprint() {
  Serial.println("\n--- Parmak Izi Kontrolu ---");
  
  // LED durumunu sıfırla
  Serial.println("LED status sifirlaniyor...");
  if (Firebase.setInt(fbdo, "/led/status", 0)) {
    Serial.println("LED status: 0 (BASARILI)");
  } else {
    Serial.println("HATA: LED status sifirlanamadi!");
    Serial.print("Hata Kodu: ");
    Serial.println(fbdo.errorReason());
  }
  
  lcd.clear();
  lcd.print("PARMAK IZI");
  lcd.setCursor(0, 1);
  lcd.print("BEKLENIYOR...");

  unsigned long start = millis();
  int checkCount = 0;
  
  while (millis() - start < 60000) {
    checkCount++;
    
    // LED status kontrolü
    if (Firebase.getInt(fbdo, "/led/status")) {
      int ledStatus = fbdo.intData();
      
      if (checkCount % 10 == 0) { // Her 5 saniyede bir logla
        Serial.print("LED Status Kontrol #");
        Serial.print(checkCount);
        Serial.print(": ");
        Serial.println(ledStatus);
      }
      
      if (ledStatus == 1) {
        Serial.println("\n*** PARMAK IZI ONAYLANDI! ***");
        
        // Erişim onaylandı!
        lcd.clear();
        lcd.print("ERISIM VERILDI!");
        digitalWrite(ACCESS_LED_PIN, HIGH);
        buzzerSes(3, 150);
        
        // Servo aç
        Serial.println("Servo 90 dereceye donuyor...");
        myServo.write(90);
        lcd.setCursor(0, 1);
        lcd.print("Kapi Aciliyor...");
        delay(5000);
        
        // Servo kapat
        Serial.println("Servo 0 dereceye donuyor...");
        myServo.write(0);
        digitalWrite(ACCESS_LED_PIN, LOW);
        
        // Firebase'i sıfırla
        Serial.println("LED status tekrar sifirlaniyor...");
        if (Firebase.setInt(fbdo, "/led/status", 0)) {
          Serial.println("LED status: 0 (Sistem Sifirlandi)");
        } else {
          Serial.println("UYARI: LED status sifirlanamadi!");
        }
        
        lcd.clear();
        lcd.print("Kapi Kapandi!");
        Serial.println("Islem Tamamlandi!\n");
        delay(2000);
        return;
      }
    } else {
      if (checkCount == 1) { // İlk hatayı logla
        Serial.println("HATA: LED status okunamadi!");
        Serial.print("Hata Kodu: ");
        Serial.println(fbdo.errorReason());
      }
    }
    delay(500);
  }
  
  Serial.println("TIMEOUT: 60 saniye doldu, parmak izi girilmedi\n");
  lcd.clear();
  lcd.print("Zaman Asimi!");
  buzzerSes(2, 500);
  delay(2000);
}
