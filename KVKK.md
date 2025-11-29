# KVKK ve Veri Güvenliği Politikası

## Genel Bakış

Bu uygulama, Kişisel Verilerin Korunması Kanunu (KVKK) ve GDPR gerekliliklerine uygun olarak geliştirilmiştir. Kullanıcı gizliliği ve veri güvenliği en yüksek önceliğimizdir.

## Toplanan Veriler

### Minimal Veri Toplama Prensibi

Uygulama, yalnızca hizmet sunumu için gerekli olan minimum veriyi toplar:

1. **Zorunlu Veriler**
   - E-posta adresi (kimlik doğrulama için)
   - Kullanıcı adı (platform kimliği için)
   - Şifre (hash'lenmiş olarak saklanır)

2. **İsteğe Bağlı Veriler**
   - Ad Soyad
   - Biyografi
   - Takım bilgisi
   - Favori ekipman bilgisi
   - Profil ve kapak fotoğrafı

3. **Otomatik Toplanan Veriler**
   - Gönderi ve etkileşim verileri
   - Mesajlaşma geçmişi
   - Etkinlik katılım bilgisi
   - XP ve aktivite logları

## Veri Koruma Önlemleri

### 1. Row Level Security (RLS)

Tüm veritabanı tabloları RLS ile korunmaktadır:
- Kullanıcılar yalnızca kendi verilerine erişebilir
- Her tablo için özel güvenlik politikaları tanımlanmıştır
- Admin erişimi bile sınırlı ve loglanmıştır

### 2. Şifre Güvenliği

- Şifreler bcrypt ile hash'lenir
- Plain text şifre asla saklanmaz
- Minimum 6 karakter şifre gerekliliği

### 3. Veri Şifreleme

- Tüm veri transferi HTTPS üzerinden gerçekleşir
- Hassas veriler Supabase'de şifrelenmiş olarak saklanır

### 4. Erişim Kontrolü

- Kimlik doğrulama token'ları güvenli şekilde saklanır
- Session yönetimi Supabase Auth ile yapılır
- Otomatik timeout mekanizması

## Kullanıcı Hakları

### 1. Erişim Hakkı

Kullanıcılar, kendileri hakkında toplanan tüm verilere erişebilir:
- Profil sayfasından tüm bilgiler görüntülenebilir
- Aktivite geçmişi incelenebilir

### 2. Düzeltme Hakkı

Kullanıcılar verilerini düzeltebilir:
- Profil bilgileri güncellenebilir
- Yanlış bilgiler düzeltilebilir

### 3. Silme Hakkı (Unutulma Hakkı)

Kullanıcılar verilerinin silinmesini talep edebilir:
- Hesap silme işlemi tüm verileri siler
- Cascade delete ile ilişkili tüm veriler temizlenir
- Gönderiler ve yorumlar soft delete ile işaretlenir

### 4. Veri Taşınabilirliği

Kullanıcılar verilerini dışa aktarabilir:
- `user_data_exports` tablosu bu işlemi yönetir
- JSON formatında tüm veriler sağlanır
- 7 gün içinde indirme linki oluşturulur

### 5. İtiraz Hakkı

Kullanıcılar veri işleme süreçlerine itiraz edebilir:
- Destek üzerinden itiraz bildirilebilir
- İtirazlar değerlendirilir ve yanıtlanır

## Veri Saklama

### Saklama Süreleri

- **Aktif Hesaplar**: Veriler hesap silinene kadar saklanır
- **Silinen Hesaplar**: 30 gün içinde tamamen silinir
- **Mesajlar**: Soft delete ile saklanır, kullanıcı tarafından silinebilir
- **Admin Logları**: 1 yıl boyunca saklanır (denetim için)

### Otomatik Temizleme

- Veri export dosyaları 7 gün sonra otomatik silinir
- Silinen içerikler 30 gün sonra kalıcı olarak kaldırılır

## Admin Yetkiler ve Sınırlamalar

### Sınırlı Admin Erişimi

Admin ve moderatörler yalnızca şu işlemleri yapabilir:

1. **İçerik Moderasyonu**
   - Raporlanan gönderileri inceleme
   - Kural ihlali içeren gönderileri silme
   - Raporları değerlendirme

2. **Etkinlik Yönetimi**
   - Etkinlik oluşturma ve düzenleme
   - Etkinlik katılımcılarını görme

3. **YAPAMAZLAR**
   - Kullanıcı şifrelerine erişemezler
   - Özel mesajları okuyamazlar
   - Kullanıcı verilerini toplu olarak dışa aktaramazlar
   - Kullanıcı izni olmadan profil bilgilerini değiştiremezler

### Audit Logging

Tüm admin işlemleri loglanır:
- Hangi admin ne yaptı
- Ne zaman yapıldı
- Sebep nedir
- Hangi içerik etkilendi

## Üçüncü Taraf Paylaşımı

### Paylaşılmayan Veriler

Kullanıcı verileri ASLA üçüncü taraflarla paylaşılmaz:
- Pazarlama firmalarına satılmaz
- Reklam ağlarına verilmez
- Analytics dışında izleme yapılmaz

### Kullanılan Servisler

- **Supabase**: Veritabanı ve auth (GDPR uyumlu)
- **Expo**: Mobil framework (client-side)

## Veri İhlali Prosedürü

Veri ihlali durumunda:

1. **Tespit**: 24 saat içinde tespit
2. **Değerlendirme**: Etki analizi yapılır
3. **Bildirim**: Etkilenen kullanıcılar 72 saat içinde bilgilendirilir
4. **Çözüm**: Güvenlik açığı kapatılır
5. **Raporlama**: İlgili otoritelere bildirilir

## Gizlilik Ayarları

Kullanıcılar şu gizlilik ayarlarını kontrol edebilir:

- Profil görünürlüğü (herkes / takipçiler)
- Direkt mesaj kabul etme
- Grup davet kabul etme
- E-posta görünürlüğü

## İletişim

KVKK hakları ve veri koruma ile ilgili sorular için:

- Uygulama içi destek
- E-posta: [Eklenecek]
- Veri Koruma Sorumlusu: [Eklenecek]

## Güncelleme

Bu politika düzenli olarak gözden geçirilir ve güncellenebilir. Önemli değişiklikler kullanıcılara bildirilir.

**Son Güncelleme**: 2025-01-23

---

## Teknik Güvenlik Detayları

### Database Security

```sql
-- Tüm tablolar RLS korumalı
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi verilerine erişebilir
CREATE POLICY "Users can view own data"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### Authentication

- Supabase Auth ile JWT tabanlı kimlik doğrulama
- Otomatik token yenileme
- Güvenli session yönetimi

### Data Encryption

- At rest: Supabase encryption
- In transit: HTTPS/TLS 1.3
- Hassas alanlar: Additional encryption layer

## Compliance Checklist

- ✅ KVKK Madde 4: Kişisel verilerin işlenmesi ilkeleri
- ✅ KVKK Madde 5: Kişisel verilerin işlenmesinde temel şartlar
- ✅ KVKK Madde 11: İlgili kişinin hakları
- ✅ GDPR Article 5: Data processing principles
- ✅ GDPR Article 17: Right to erasure
- ✅ GDPR Article 20: Right to data portability
- ✅ GDPR Article 25: Data protection by design

## Veri İşleme Sözleşmeleri

### Supabase (Data Processor)

- GDPR uyumlu veri işleme sözleşmesi mevcut
- EU veri merkezleri kullanılabilir
- Sub-processors şeffaftır

## Çocukların Gizliliği

Bu uygulama 18 yaş altı kullanıcılar için tasarlanmamıştır. 18 yaş altı kullanıcıların ebeveyn onayı olmadan kayıt olmaması beklenir.

## Cookie Politikası

Uygulama minimal cookie kullanır:
- **Zorunlu**: Authentication tokens
- **Opsiyonel**: Preferences (tamamen local)

Tracking veya advertising cookies kullanılmaz.
