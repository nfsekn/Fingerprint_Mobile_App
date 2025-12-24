import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getPinCode,
  listenToLedStatus,
  setFingerprintVerified,
  setLedStatus,
  setPinCode
} from '../src/services/firebase';

type Screen = 'home' | 'changePin' | 'login';

export default function FingerprintScreen() {
  const [isFingerprintAvailable, setIsFingerprintAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  useEffect(() => {
    const initializeApp = async () => {
      checkFingerprintAvailability();
      
      // Firebase'den PIN kontrolü
      const storedPin = await getPinCode();
      setPinSet(!!storedPin);
      
      // Firebase'den LED durumunu dinle
      const unsubscribe = listenToLedStatus((status: boolean) => {
        console.log('Firebase LED durumu:', status);
      });

      return unsubscribe;
    };

    let cleanup: any;
    initializeApp().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  const checkFingerprintAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsFingerprintAvailable(compatible && enrolled);
      console.log('Parmak izi - Compatible:', compatible, 'Enrolled:', enrolled);
    } catch (error) {
      console.error('Parmak izi kontrolü hatası:', error);
    }
  };

  const handleChangePin = async () => {
    if (pinInput.length !== 4) {
      Alert.alert('Hata', 'PIN 4 haneli olmalıdır');
      return;
    }

    if (!/^\d+$/.test(pinInput)) {
      Alert.alert('Hata', 'PIN sadece rakamlardan oluşmalıdır');
      return;
    }

    try {
      setLoading(true);
      await setPinCode(pinInput);
      setPinSet(true);
      setPinInput('');
      setCurrentScreen('home');
      Alert.alert('✅ Başarılı', 'Yeni PIN kaydedildi!');
    } catch (error) {
      Alert.alert('Hata', 'PIN kaydedilemedi: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!isFingerprintAvailable) {
      Alert.alert('Hata', 'Parmak izi sensörü mevcut değil');
      return;
    }

    if (!pinSet) {
      Alert.alert('Hata', 'Lütfen önce PIN ayarlayın');
      return;
    }

    try {
      setLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Parmak izinizi tarayın',
        fallbackLabel: 'PIN kullan',
        disableDeviceFallback: false,
      });

      const isValid = result.success;
      
      // Firebase'ye parmak izi sonucunu kaydet
      await setFingerprintVerified(isValid);
      
      // Firebase'ye LED sinyal gönder
      if (isValid) {
        await setLedStatus(true);
        Alert.alert('✅ Başarılı', 'Parmak izi doğrulandı!\nESP32 LED açılıyor...');
      } else {
        await setLedStatus(false);
        Alert.alert('❌ Başarısız', 'Parmak izi eşleşmedi\nESP32 LED kapalı kalıyor.');
      }
      
      setCurrentScreen('home');
    } catch (error) {
      Alert.alert('Hata', 'Parmak izi taraması başarısız: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ESP32 Parmak İzi Sistemi</Text>
      </View>

      <View style={styles.content}>
        {currentScreen === 'home' && (
          // ANA EKRAN
          <>
            <Text style={styles.status}>🏠 Ana Menu</Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Hoş Geldiniz</Text>
              <Text style={styles.infoText}>
                PIN&apos;i değiştirmek veya giriş yapmak için{'\n'}
                aşağıdaki düğmelerden birini seçin.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.changePinButton]}
              onPress={() => {
                setPinInput('');
                setCurrentScreen('changePin');
              }}
              disabled={loading}
            >
              <Text style={styles.buttonText}>🔐 PIN Değiştir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => setCurrentScreen('login')}
              disabled={loading || !pinSet}
            >
              <Text style={styles.buttonText}>🔓 Giriş Yap</Text>
            </TouchableOpacity>

            {!pinSet && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Önce PIN ayarlamalısınız
                </Text>
              </View>
            )}
          </>
        )}

        {currentScreen === 'changePin' && (
          // PIN DEĞİŞTİR EKRANI
          <>
            <Text style={styles.status}>🔐 PIN Değiştir</Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Yeni 4 Haneli PIN</Text>
              <Text style={styles.infoText}>
                Lütfen yeni PIN kodunuzu girin.{'\n'}
                (Sadece rakamlar, 4 hane)
              </Text>
            </View>

            <TextInput
              style={styles.pinInput}
              placeholder="0000"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={true}
              value={pinInput}
              onChangeText={setPinInput}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, styles.setupButton, loading && styles.disabledButton]}
              onPress={handleChangePin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>✅ PIN Kaydet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setPinInput('');
                setCurrentScreen('home');
              }}
              disabled={loading}
            >
              <Text style={styles.buttonText}>❌ İptal</Text>
            </TouchableOpacity>
          </>
        )}

        {currentScreen === 'login' && (
          // GİRİŞ YAP EKRANI
          <>
            <Text style={styles.status}>🔓 Giriş Yap</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Parmak İzi Dogrulama</Text>
              <Text style={styles.infoText}>
                Parmak izinizi tarayarak giriş yapın.{'\n\n'}
                Durum: {isFingerprintAvailable ? '✅ Hazir' : '❌ Mevcut Degil'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                styles.fingerprintButton,
                (!isFingerprintAvailable || loading) && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={loading || !isFingerprintAvailable}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>👆 Parmak İzini Tarayın</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setCurrentScreen('home')}
              disabled={loading}
            >
              <Text style={styles.buttonText}>← Geri Dön</Text>
            </TouchableOpacity>

            <View style={styles.firebaseBox}>
              <Text style={styles.firebaseTitle}>📱 Bağlantı Bilgisi</Text>
              <Text style={styles.firebaseText}>
                Veritabanı: Firebase Realtime{'\n'}
                Durum: ✅ Çevrimiçi{'\n'}
                Protokol: WiFi/İnternet
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    fontSize: 18,
    marginBottom: 30,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
  },
  setupButton: {
    backgroundColor: '#4CAF50',
  },
  changePinButton: {
    backgroundColor: '#FF9800',
  },
  loginButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  fingerprintButton: {
    backgroundColor: '#FF9800',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pinInput: {
    width: '80%',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    letterSpacing: 10,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '500',
  },
  firebaseBox: {
    backgroundColor: '#f3e5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7c4dff',
  },
  firebaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5e35b1',
    marginBottom: 8,
  },
  firebaseText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});
