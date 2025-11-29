# Airsoft Topluluğu Uygulaması

Güvenli, KVKK uyumlu, Türkçe Airsoft topluluğu mobil uygulaması. React Native (Expo) ve Supabase ile geliştirilmiştir.

## Özellikler

### ✅ Tamamlanan Özellikler

#### 1. Kimlik Doğrulama
- Email/şifre ile kayıt ve giriş
- Şifre sıfırlama
- Güvenli session yönetimi
- KVKK uyumlu kullanıcı onayı

#### 2. Sosyal Medya Akışı
- ✅ Gönderi oluşturma (metin, resim, video, ses destekli)
- ✅ Gelişmiş medya yükleme (çoklu fotoğraf/video)
- ✅ Konum ekleme
- ✅ Medya önizleme ve düzenleme
- ✅ Beğeni sistemi
- ✅ Yorum yapma (alt yorumlar destekli)
- ✅ Gönderi kaydetme
- ✅ Hashtag desteği
- ✅ Gönderi raporlama
- ✅ Supabase Storage entegrasyonu

#### 3. Mesajlaşma
- Birebir direkt mesajlar
- Grup sohbetleri
- Medya paylaşımı
- Okundu bilgisi
- Emoji tepkileri

#### 4. Etkinlik Yönetimi
- Etkinlik oluşturma (admin/moderatör)
- Etkinlik katılımı
- Konum gösterimi
- Katılımcı listesi
- Etkinlik sohbet kanalları

#### 5. Profil Sistemi
- Kullanıcı profilleri
- XP ve Rank sistemi
  - Çaylak
  - Nişancı
  - Operatör
  - Kıdemli
  - Usta
  - Kırmızı Gölge
- Takım bilgisi
- Favori ekipman

#### 6. Admin Paneli
- İçerik moderasyonu
- Rapor inceleme
- Gönderi silme
- Audit logging
- Sınırlı yetki (KVKK uyumlu)

### 🎨 Tema
- Kırmızı-Siyah askeri/taktiksel tema
- Modern Material Design
- Yüksek kontrastlı kırmızı vurgular
- Karanlık tema

## Teknik Detaylar

### Teknoloji Stack
- **Frontend**: React Native (Expo SDK 54)
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **Dil**: TypeScript
- **State Management**: React Context API
- **Navigation**: Expo Router (file-based routing)
- **Icons**: Lucide React Native

### Veritabanı Şeması

Tüm tablolar Row Level Security (RLS) ile korumalıdır:

1. **profiles** - Kullanıcı profilleri
2. **user_privacy_settings** - Gizlilik ayarları
3. **user_data_exports** - Veri dışa aktarma talepleri
4. **blocked_users** - Engellenmiş kullanıcılar
5. **posts** - Gönderiler
6. **comments** - Yorumlar
7. **likes** - Beğeniler
8. **post_saves** - Kaydedilen gönderiler
9. **post_reports** - Raporlar
10. **direct_messages** - Direkt mesajlar
11. **group_chats** - Grup sohbetleri
12. **group_members** - Grup üyeleri
13. **group_messages** - Grup mesajları
14. **events** - Etkinlikler
15. **event_participants** - Etkinlik katılımcıları
16. **event_group_chats** - Etkinlik sohbet kanalları
17. **user_xp** - XP sistemi
18. **xp_transactions** - XP işlemleri
19. **admin_actions** - Admin audit log
20. **notifications** - Bildirimler

### Güvenlik ve KVKK Uyumu

#### Veri Koruma
- ✅ Row Level Security (RLS) tüm tablolarda aktif
- ✅ Kullanıcılar sadece kendi verilerine erişebilir
- ✅ Şifreler hash'lenmiş olarak saklanır
- ✅ HTTPS/TLS 1.3 ile şifrelenmiş iletişim

#### Kullanıcı Hakları
- ✅ Erişim hakkı (profil görüntüleme)
- ✅ Düzeltme hakkı (profil güncelleme)
- ✅ Silme hakkı (hesap silme)
- ✅ Veri taşınabilirliği (veri dışa aktarma)
- ✅ İtiraz hakkı

#### Admin Sınırlamaları
- ❌ Şifrelere erişemez
- ❌ Özel mesajları okuyamaz
- ❌ Kullanıcı verilerini toplu dışa aktaramaz
- ✅ Sadece içerik moderasyonu yapabilir
- ✅ Tüm işlemler loglanır

## Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Expo CLI
- Supabase hesabı

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone [repo-url]
cd airsoft-community
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Supabase ayarlarını yapın**

`.env` dosyası zaten hazır. Kendi Supabase projenizi kullanmak için:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. **Veritabanı migrations'larını uygulayın**

Supabase Dashboard'dan migrations klasöründeki SQL dosyalarını sırayla çalıştırın:
- `001_create_users_and_auth_tables.sql`
- `002_create_posts_and_interactions.sql`
- `003_create_messaging_tables.sql`
- `004_create_events_tables.sql`
- `005_create_xp_rank_and_admin_tables.sql`

5. **Uygulamayı başlatın**
```bash
npx expo start
```

## Bilinen Sorunlar

### Path Alias Sorunu

Şu anda `@/lib` path alias'ı Metro bundler tarafından çözülemiyor. Bu sorunu çözmek için:

**Geçici Çözüm**:
Tüm `@/lib` importlarını relative path'e çevirin:

```typescript
// Eski
import { colors } from '@/lib/colors';

// Yeni
import { colors } from '../../lib/colors';
```

**Kalıcı Çözüm** (önerilir):
1. `babel-plugin-module-resolver` paketi zaten yüklü
2. `babel.config.js` dosyasına şu eklemeyi yapın:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
          extensions: ['.tsx', '.ts', '.js', '.json'],
        },
      ],
    ],
  };
};
```

3. Cache'i temizleyin:
```bash
rm -rf .expo node_modules/.cache
npx expo start --clear
```

## Geliştirme

### Dosya Yapısı

```
project/
├── app/                    # Expo Router routes
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Ana sayfa (feed)
│   │   ├── messages.tsx   # Mesajlar
│   │   ├── events.tsx     # Etkinlikler
│   │   ├── profile.tsx    # Profil
│   │   └── admin.tsx      # Admin paneli
│   ├── auth/              # Auth screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset-password.tsx
│   └── _layout.tsx        # Root layout
├── lib/                    # Shared libraries
│   ├── supabase.ts        # Supabase client
│   ├── auth-context.tsx   # Auth context
│   └── colors.ts          # Theme colors
├── assets/                 # Static assets
├── KVKK.md                # KVKK politika dökümanı
└── README.md              # Bu dosya
```

### Yeni Özellik Ekleme

1. Gerekiyorsa yeni migration oluşturun
2. RLS policies tanımlayın
3. İlgili ekranı/componenti oluşturun
4. Supabase client kullanarak veri işlemlerini yapın
5. Hata yönetimini ekleyin
6. KVKK.md dosyasını güncelleyin

### Test Etme

```bash
# Type checking
npm run typecheck

# Web build
npm run build:web

# Dev server
npm run dev
```

## Roadmap

### Yakında Eklenecekler
- [ ] Path alias sorununu çöz
- [ ] Medya yükleme (Supabase Storage)
- [ ] Push notification
- [ ] Arama functionality
- [ ] Hashtag takip
- [ ] Kullanıcı engelleme UI
- [ ] Dark/Light tema toggle
- [ ] Dil seçeneği (TR/EN)

### Gelecek Özellikler
- [ ] Video oynatıcı
- [ ] Ses kaydı
- [ ] GIF desteği
- [ ] Story özelliği
- [ ] Live streaming
- [ ] E-ticaret entegrasyonu

## Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'feat: Add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

[Lisans bilgisi eklenecek]

## İletişim

- Proje Sahibi: [Eklenecek]
- E-posta: [Eklenecek]
- Discord: [Eklenecek]

## Teşekkürler

- Supabase ekibine
- Expo ekibine
- Lucide Icons ekibine
- Airsoft topluluğuna

---

**Not**: Bu proje hala geliştirme aşamasındadır. Production'a almadan önce kapsamlı test edilmelidir.
