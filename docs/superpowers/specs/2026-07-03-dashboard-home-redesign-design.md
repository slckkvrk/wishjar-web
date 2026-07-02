# Ana Sayfa (Home) Üst Kart ve Topluluk Feed'i

**Date:** 2026-07-03
**Status:** Approved

## Overview

Giriş yapmış kullanıcının gördüğü ana ekranın (`/dashboard`) üst kısmı ve içeriği yeniden tasarlanıyor. Mevcut "All / Jars / Complete" sekmeli jar listesi kalkıyor; yerine (1) kullanıcıya özel, kişiselleştirilebilir bir üst kart ve (2) tüm kullanıcıların post'larından oluşan bir topluluk feed'i geliyor. Bu, daha büyük bir yeniden yapılanmanın ilk parçası (sub-project A) — bildirimler (`/feed`'in bildirime dönüşmesi) ve "Explore Jars" (alt bar "Jars" linkinin takip edilen/popüler/yeni jar'lar deneyimine dönüşmesi) ayrı spec'lerde ele alınacak, bu spec'in kapsamı dışındadır.

**Scope:** `/dashboard` sayfasının üst kartı, manifesto notu (Settings'ten düzenlenen özel not), avatar yükleme, post oluşturma ve post feed'inin Home'a taşınması. `/feed` sayfası ve alt bar "Jars" linki bu spec'te değiştirilmiyor.

---

## 1. Veri Modeli

### `profiles` tablosuna yeni kolonlar

| Kolon | Tip | Not |
|---|---|---|
| `manifest_line1` | `text` | nullable, uygulama seviyesinde max 60 karakter |
| `manifest_line2` | `text` | nullable, uygulama seviyesinde max 60 karakter |
| `avatar_url` | `text` | nullable, Supabase Storage public URL |

### Yeni Storage bucket: `avatars`

- Public bucket. Path: `avatars/{user_id}/{timestamp}-{filename}`.
- Storage policy: authenticated kullanıcı sadece kendi `user_id` prefix'ine yazabilir; herkes okuyabilir (public read) — profil/feed'de fotoğrafın herkese görünmesi gerektiği için.
- Kabul edilen dosya tipleri: jpg/png/webp. Max boyut: 5MB (client-side kontrol + storage policy).

---

## 2. Dashboard Üst Kart (`src/app/dashboard/page.tsx`)

Mevcut mobil header bloğu (greeting + quick actions + tab pills) ve boş-durum "Welcome to WishJar" banner'ı tamamen kaldırılıp yerine, jar sayısından bağımsız olarak **her zaman** görünen tek bir kart geliyor:

- **Sol:** Avatar dairesi. `avatar_url` varsa fotoğraf gösterir, yoksa mevcut `AvatarCircle` (baş harf) fallback'i kullanılır. Daireye tıklanınca dosya seçici açılır → seçilen görsel `avatars` bucket'ına yüklenir → `profiles.avatar_url` güncellenir → UI optimistic güncellenir.
- **Başlık:** "Hi, {username}" — emoji yok.
- **Manifesto notu** (bu kartta salt-okunur; düzenleme Bölüm 5'te): `manifest_line1` ve `manifest_line2` ikisi de boşsa tek satırlık, italik + altı çizili bir placeholder gösterilir: *"What you write here becomes real."* Doluysa: 1. satır düz metin, 2. satır italik + altı çizili — kullanıcının paylaştığı görsel referansla birebir aynı stil.
- **Sağ:** Dekoratif illüstrasyon. Gerçek bir illüstrasyon/asset pipeline'ımız olmadığından, uygulamanın zaten kullandığı emoji-temelli görsel dile uygun şekilde büyük ölçekli emoji kompozisyonuyla (🫙 + ✨ + 🎁 + 🌿) yumuşak gradient arka plan üzerinde oluşturulacak. Bu bir geçici yer tutucu değil, mevcut tasarım diliyle tutarlı gerçek üretim çözümü olarak öneriliyor; ileride gerçek bir SVG/illüstrasyon ile değiştirilmesi kolay olacak şekilde ayrı bir bileşen olarak yazılacak.
- **Sağ üst köşe:** 🔔 ve ⚙️ ikonları. ⚙️ mevcut `/settings` linkiyle aynı davranır. 🔔 şimdilik mevcut `/feed` sayfasına link verir (bildirimlere dönüşümü Bölüm 6'da not edilen ayrı bir spec'in konusu).
- **Arka plan:** Yumuşak lavanta/mor gradient, yuvarlak köşeli kart — paylaşılan görsel referansa uygun.

**Kaldırılanlar:** "Create Jar" / "My Profile" hızlı-aksiyon butonları; "All / Jars / Complete" sekme pilleri ve bunların filtreleme mantığı (`filteredJars`, `Tab` state); "Your Timeline" başlığı ve masaüstü "+ New Jar" butonu; jar grid render'ı; eski boş-durum banner'ı.

Jar oluşturma erişimi kaybolmuyor: alt bardaki (`BottomNav`) mevcut "+" butonu zaten `/jars/new`'e gidiyor. Kullanıcının kendi jar'larını görmesi de kaybolmuyor: profil sayfasındaki (`/u/[username]`) "Jars" alt-sekmesi zaten bunu sağlıyor — dashboard'da ayrıca göstermeye gerek yok.

---

## 3. Post Composer (Home'a ekleniyor)

`/u/[username]/page.tsx` içindeki mevcut post oluşturma mantığı (içerik + opsiyonel "kendi jar'ını etiketle" dropdown, 500 karakter sınırı, `sanitizeText` ile temizleme) dashboard'a da eklenir. Kod tekrarını önlemek için bu mantık ortak bir `PostComposer` component'ine çıkarılıp hem profil sayfasında hem dashboard'da kullanılır (kesin dosya/prop tasarımı implementasyon planında netleşecek).

---

## 4. Post Feed (Home'a taşınıyor)

`/feed` sayfasındaki mevcut post sorgusu ve render mantığı dashboard'a taşınır; `/feed` sayfası bu haliyle bırakılır (bkz. Bölüm 6 — geçici içerik çakışması bilinçli olarak kabul ediliyor):

- Sorgu aynen korunur: tüm kullanıcıların tüm post'ları (jar'a bağlı olsun olmasın fark etmez), `created_at DESC`, `limit(50)`.
- Jar etiketi artık düz "→ Başlık" linki değil, profil sayfasındaki rozet stiliyle (🫙 Başlık, pill/badge) gösterilir ve tıklanınca `/jars/{id}`'ye gider — iki yerde de aynı görsel dil.
- Jar kartları (`JarCard` listesi) dashboard'a **taşınmıyor**. Home sadece post'lardan oluşur.

---

## 5. Manifesto Düzenleme (`src/app/settings/page.tsx`)

Settings sayfasına yeni bir **"Manifesto"** bölümü eklenir (mevcut Profile/Account/Legal/Danger Zone bölümleri arasına uygun bir yere). Tıklanınca `manifest_line1` / `manifest_line2` için iki ayrı, net etiketli input alanı olan bir düzenleme arayüzü açılır (modal ya da kendi alt sayfası — implementasyon planında karar verilecek), altında kartın gerçek görünümünün canlı önizlemesi bulunur. Kaydedince `profiles` tablosu güncellenir ve dashboard kartına yansır.

---

## 6. Kapsam Dışı (YAGNI — gelecek faz)

- `/feed` sayfasının bildirimlere dönüştürülmesi — ayrı bir spec. Bu spec'te `/feed` **değiştirilmiyor**; bu yüzden geçici olarak hem Home hem `/feed` aynı post'ları gösterecek. Bilinçli olarak kabul edilen geçici bir çakışma.
- 🔔 ikonunun gerçek bildirim içeriğine (jar beğenilme, yardım alma vb.) bağlanması — ayrı spec'in konusu. Şimdilik sadece `/feed`'e link verir.
- Alt bar "Jars" linkinin Explore (takip edilen/popüler/yeni) deneyimine dönüştürülmesi — ayrı bir spec. Bu spec'te `/jars` route'una dokunulmuyor.
- Gerçek bir illüstrasyon/SVG asset pipeline'ı — şimdilik emoji-kompozisyon çözümü kullanılıyor.
- Post feed'de sayfalama/infinite scroll (mevcut `limit(50)` davranışı korunuyor).
- Post composer'da resim/medya ekleme (sadece metin + opsiyonel jar etiketi, mevcut davranışla aynı).

---

## 7. Hata ve Uç Durumlar

- Avatar yükleme başarısız olursa: kullanıcıya hata mesajı gösterilir, eski avatar/initials fallback korunur.
- Çok büyük veya desteklenmeyen formatlı dosya seçilirse: client-side validasyon ile engellenir (tip + boyut kontrolü), kullanıcıya net bir hata mesajı gösterilir.
- Manifesto notu boşsa: yukarıda tanımlı placeholder gösterilir.
- Post feed boşsa (hiç post yoksa): "No posts yet. Be the first to share!" tarzı bir boş-durum mesajı gösterilir.

---

## 8. Test / Doğrulama

Repoda otomatik test altyapısı yok; tarayıcıda uçtan uca doğrulama yapılacak:

- Avatar yükle, dashboard ve profil sayfasında güncel fotoğrafın göründüğünü doğrula.
- Manifesto notunu Settings'ten kaydet, dashboard kartında doğru satır/stil ile göründüğünü doğrula; boşken placeholder'ın göründüğünü doğrula.
- Home'dan post at (jar etiketli ve etiketsiz), feed'de doğru sırada ve doğru rozet ile göründüğünü doğrula.
- "All/Jars/Complete" sekmelerinin ve eski quick-action butonlarının dashboard'da artık olmadığını doğrula.
- Jar oluşturmanın hâlâ alt bar "+" butonundan çalıştığını doğrula.
