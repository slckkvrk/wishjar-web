# Bilgi Mimarisi (IA) Revizyonu — Home / Jars / Create / Profile

**Date:** 2026-07-03
**Status:** Approved

## Overview

Bu bir tema/görsel tasarım değişikliği **değildir** — mevcut renk paleti, warm-modern tasarım dili, component stilleri, spacing, border-radius, gölge ve genel görsel tema aynen korunur. Amaç: ekranların görevlerini netleştirmek, Home / Jars / Create / Profile ayrımını doğru kurmak, postların jar'a bağlı olmasını sağlamak, profile yapısını güven odaklı hale getirmek, bottom nav ve route mantığını hatasız oturtmak.

**Scope:** Route restructuring, bottom nav davranışı, Home timeline, Jars keşif sayfası, Profile header genişletme (kapak şablonu, isim/soyisim, şehir/ülke, iletişim, sosyal linkler, doğrulanmış rozet), post-jar zorunlu ilişkisi, jar oluşturma için hesap doğrulama gate'i. Bu tek bir bütünsel IA revizyonu olarak ele alınır (parçalar birbirine bağımlı — nav sırası, route'lar ve profile yapısı aynı kararın parçaları), tek spec + tek plan.

---

## 1. Route Değişiklikleri

| Route | Şu an | Yeni |
|---|---|---|
| `/` | Herkese açık landing page | Signed-out: aynı landing page. Signed-in: **Home Timeline** (mevcut `/dashboard` içeriğinin taşınmış/dönüştürülmüş hali). |
| `/dashboard` | Home (hero + composer + post feed) | **Kaldırılır**, `/`'e redirect. |
| `/feed` | Jar-blend (takip/popüler/tamamlanan) + community posts | **Kaldırılır**, `/jars`'a redirect. Jar-blend mantığı `/jars`'a taşınır; post-timeline mantığı `/`'e taşınır. |
| `/jars` | Kullanıcının kendi jar'ları ("My Jars") | **Keşif sayfası** — takip edilen + popüler + tamamlanan jar'lar (mevcut `/feed`'in jar-kartı kısmının taşınmış hali). Kullanıcının kendi jar'ları burada gösterilmez. |
| `/jars/new` | Jar oluşturma formu | Aynı, önüne **verification gate** eklenir. |
| `/jars/[id]` | Jar detay | Değişmez. |
| `/u/[username]` | Profile (Posts/Jars tab) | Genişletilmiş header (kapak, isim, konum, iletişim, sosyal, rozet). Tab etiketleri: **Posts / My Jars**. |
| `/settings` | Profil/Manifesto/Account | Yeni "Profile details" alanları (isim, soyisim, şehir, ülke, telefon, sosyal linkler, kapak şablonu). |
| `/settings/profile` | Username/bio düzenleme | Yukarıdaki yeni alanlar buraya eklenir (ayrı bir alt sayfa açılmaz — mevcut sayfa genişler). |
| `/notifications` | Bildirimler | Değişmez, ama "← Home" linki `/dashboard` yerine `/` olmalı. |

**İç link güncellemeleri gereken yerler** (route değişikliğinin yayılma etkisi — kod üzerinde `"/dashboard"` için grep edilip doğrulandı, aşağıdaki liste eksiksiz):

- `src/app/page.tsx:10` — **en kritik olan**: signed-in kullanıcıyı `/dashboard`'a yönlendiren redirect. Redesign'ın kendisi bu satırı kaldırıp yerine Home Timeline'ı `/`'in içinde render etmek demek (ayrı bir redirect değil).
- `src/components/BottomNav.tsx:39` — home nav linki.
- `src/components/SiteHeader.tsx:44,53` — logo linki + "Home" nav linki. (`:54`'teki `/feed` linki de `/jars`'a değişecek.)
- `src/app/settings/page.tsx:52` — "← Home" linki.
- `src/app/settings/profile/page.tsx:103` — kaydetme sonrası fallback linki (`savedUsername` yoksa `/dashboard`'a düşüyor).
- `src/app/jars/[id]/page.tsx:98` — "← Back to Home" linki.
- `src/app/jars/new/page.tsx:116,140,228` — üç ayrı "← Home" linki.
- `src/app/jars/[id]/edit/page.tsx:72` — kayıt sonrası `window.location.href` redirect'i.
- `src/app/setup/username/page.tsx:18,39` — kullanıcı adı zaten varsa / yeni set edildiğinde redirect.
- `src/app/u/[username]/page.tsx:80` — "kullanıcı bulunamadı" durumundaki "← Home" linki.
- `src/app/reset-password/page.tsx:66` — şifre sıfırlama sonrası redirect.
- `src/app/login/page.tsx:32` — giriş sonrası redirect.
- `src/app/notifications/page.tsx:93` — "← Home" linki.
- `HomeHeroCard.tsx` bell linki: `/notifications` zaten doğru, değişmiyor.
- `NotificationRow`'un jar linkleri: değişmiyor, zaten `/jars/[id]`.

**Düzeltme:** önceki taslakta `PostCard.tsx`'in bir "← Home" linki içerdiği yazılmıştı — kontrol edildi, **yanlış**: `PostCard.tsx` sadece `/u/${username}` ve `/jars/${jarId}`'e link veriyor, ikisi de değişmiyor, bu dosyada güncellenecek bir şey yok.

---

## 2. Component Değişiklikleri

- **`BottomNav.tsx`**: `<span>` etiket satırları tamamen silinir (bu nav zaten `md:hidden`, yani sadece mobilde render ediliyor — etiketi koşullu gizlemeye gerek yok, direkt kaldırılıyor), `aria-label` ikonun bulunduğu `<a>`'ya eklenir (erişilebilirlik için). İkon `w-6 h-6` → `w-7 h-7` (etiket yokken görsel denge için). Sıra zaten doğru: Home / Jars / Create(+) / Profile.
- **`HomeHeroCard.tsx`**: post composer'ı artık içermiyor (composer ayrı, timeline'ın parçası olarak Home sayfasında oturuyor). Hero, kısaltılmış: avatar + "Hi, {username}" + manifesto + jar görseli.
- **Yeni `HowItWorksBar.tsx`**: Home'da hero'nun altında, composer'ın üstünde. Kapatılabilir (X butonu), `localStorage` içinde `wj_how_it_works_dismissed` anahtarıyla kalıcı kapatılır. İçerik (sade İngilizce, 3 kısa madde): "🫙 Create a jar" · "⭐ Add wishes to it" · "📢 Share updates with your followers". Tek satırlık, yatay, küçük yazı — modal değil, ince bir bar.
- **Yeni `CoverPicker.tsx`** (`/settings/profile` içinde): 6 hazır şablon arasından seçim, her biri küçük bir önizleme kare + seçili olduğunda kenarlık.
- **Yeni `ProfileHeader.tsx`**: `/u/[username]/page.tsx` içine gömülü olan header JSX'i (şu an ~60 satır, dosya zaten 200+ satır) ayrı bileşene çıkar. Kapak + avatar + isim soyisim + `@username` + doğrulanmış rozet + şehir/ülke + bio + sosyal ikonlar satırı + iletişim (mail) ikonu. Sadece dolu alanlar gösterilir (boş sosyal link ikonu render edilmez).
- **Yeni `VerificationGate.tsx`**: `/jars/new` mount olduğunda `isVerified === false` ise form yerine gösterilir. İçerik: "Verify your account to create a jar." + hangi alanların eksik olduğunu listeleyen kısa metin + `/settings/profile`'a link.
- **`PostComposer.tsx`**: `<select>` placeholder'ı "Link a jar (optional)" → **"Which jar is this about?"**, `required` davranışı eklenir (jar seçilmeden `Post` butonu disabled). `jars.length === 0` ise composer yerine "You need a jar to post yet. Create one first." + `/jars/new` linki gösterilir (composer hiç render edilmez).
- **`JarCard.tsx`**: `by @username` satırı zaten var (opsiyonel prop değil, `jar.username` her zaman geçiliyor) — davranışsal değişiklik yok, sadece spec'in "zorunlu" ifadesiyle teyit ediliyor. Yeni: "kalan gün" alanı — `goal_date` gibi bir kolon **yok**, bu yüzden bu alan sadece `goal_amount` dolu VE `created_at`'ten türetilen bir tahmini süre yerine, basitçe **eklenmiyor** (spec'te "varsa" notu vardı; veri yok, YAGNI — bkz. Kapsam Dışı).

---

## 3. Data/Model İhtiyaçları

### `profiles` tablosuna yeni kolonlar

```sql
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists country text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists is_verified boolean not null default false;
alter table profiles add column if not exists cover_template text;
alter table profiles add column if not exists social_instagram text;
alter table profiles add column if not exists social_tiktok text;
alter table profiles add column if not exists social_youtube text;
alter table profiles add column if not exists social_facebook text;
alter table profiles add column if not exists contact_email text;
```

`cover_template`: `'1'` ile `'6'` arası bir string, null = varsayılan (template 3 — lavanta gradyan, hero card ile uyumlu). Şablonlar kod içinde sabit tanımlı (yeni görsel varlık yok):

| id | CSS |
|---|---|
| 1 | `linear-gradient(135deg, #3D1A24, #6B2D40)` |
| 2 | `linear-gradient(135deg, #C9973A, #F0D080)` |
| 3 (varsayılan) | `linear-gradient(135deg, #EDE6FB, #F7F1FC)` |
| 4 | solid `#F5EDD5` |
| 5 | `linear-gradient(135deg, #3D1A24, #C9973A)` |
| 6 | solid `#FDFAF3` |

### `is_verified` otomatik trigger

`first_name`, `last_name`, `city`, `country`, `phone` hepsi doluysa (`trim() <> ''`) `is_verified = true` olur; herhangi biri boşalırsa `false`'a döner (kullanıcı bilgisini silerse doğrulama da geri alınır — tutarlılık için). `AFTER INSERT OR UPDATE` trigger, `jar_follows_adjust_count()` ile aynı `security definer` deseni (bu alan kullanıcı tarafından doğrudan `update ... set is_verified = true` ile taklit edilemesin diye — RLS `update` policy'si zaten kullanıcının kendi satırını güncellemesine izin veriyor, ama `is_verified`'ı sadece trigger yazsın, kullanıcının gönderdiği `update` payload'ında bu alan varsa bile trigger onu her zaman yeniden hesaplayıp ezer).

### `posts.jar_id` → NOT NULL

**Riskli adım.** Migration üç aşamalı, insan onayı gerektiren bir ara adımla:

1. Önce sadece bir **kontrol sorgusu** çalıştırılır (insan Supabase Studio'da çalıştırıp sonucu bildirir):
   ```sql
   select count(*) from posts where jar_id is null;
   ```
2. Sonuç 0 ise: doğrudan `alter table posts alter column jar_id set not null;`.
3. Sonuç 0'dan büyükse: **insan karar verir** — o postları silmek mi (`delete from posts where jar_id is null;`) yoksa başka bir jar'a bağlamak mı (mümkün değil, hangi jar olduğu bilinmiyor) net değil; bu spec siler diyor ama **gerçek sayı görülmeden migration'ın silme kısmı çalıştırılmaz**. Plan bu adımı ayrı, açıkça onay bekleyen bir görev olarak işaretleyecek.

### Manifesto gizliliği (gerçek DB-seviyesi kısıtlama)

**Doğrulanmış canlı durum** (bu spec yazılırken REST üzerinden kontrol edildi): `profiles` tablosunda `manifest_line1` şu an **anon (giriş yapmamış) role bile** doğrudan okunabiliyor — `select` grant'i/policy'si tamamen açık. Bu, önceki "authenticated bir kullanıcı teorik olarak başkasının manifesto'sunu okuyabilir" tahmininden daha ciddi: şu an oturum bile gerekmiyor. Sadece bir view eklemek bu açığı kapatmaz — biri view'ı atlayıp tabloya doğrudan sorgu atabilir. Gerçek kapatma iki adım gerektirir:

1. **Taban tablodan grant'i kaldır**: `manifest_line1`, `manifest_line2`, `phone` kolonlarında `anon` ve `authenticated` rollerinin doğrudan `select` hakkı olmasın.
   ```sql
   revoke select (manifest_line1, manifest_line2, phone) on profiles from anon, authenticated;
   ```
2. **İki ayrı view** — biri herkese açık alanlar için, biri sadece "kendi satırın" için:
   ```sql
   create or replace view profiles_public as
   select
     id, username, bio, avatar_url, is_premium, is_verified,
     first_name, last_name, city, country, cover_template,
     social_instagram, social_tiktok, social_youtube, social_facebook, contact_email,
     created_at
   from profiles;
   grant select on profiles_public to anon, authenticated;

   create or replace view profiles_private as
   select id, manifest_line1, manifest_line2, phone
   from profiles
   where id = auth.uid();
   grant select on profiles_private to authenticated;
   ```
   `profiles_private`'daki `where id = auth.uid()` view sorgusunun bir parçası olduğu için, kim çağırırsa çağırsın sadece kendi satırını görür — `auth.uid()` istek sahibinin JWT'sinden okunur, view sahibinden değil.

Başka kullanıcının profilini okuyan her yer (`/u/[username]`, feed/post-author lookup, notifications actor lookup) `profiles_public`'ten okur. Kendi manifesto'sunu okuyan yerler (Settings, Home'un manifesto'yu göstermesi) `profiles_private`'tan okur. Kullanıcı adı/bio/avatar gibi public alanlar için kendi satırını okurken de `profiles_public` kullanılabilir (zaten herkese açık, ekstra kısıtlama gerekmiyor) — yalnızca `manifest_line1/2` ve `phone` için `profiles_private` şart.

---

## 4. Auth / Verification Kontrol Noktaları

- `src/lib/requireUsername.ts`: dönüş tipine `isVerified: boolean` eklenir (profil sorgusuna `is_verified` kolonu eklenir).
- `/jars/new`: mount olduğunda `auth.isVerified === false` ise `VerificationGate` gösterilir, form hiç render edilmez.
- Doğrulanmamış kullanıcı: timeline'ı görebilir, `/jars`'ı keşfedebilir, profilini düzenleyebilir (verified olmak için gereken alanları da dahil), post atabilir (**not**: post atmak jar'a bağlı olduğu için, hiç jar'ı yoksa zaten composer yerine "jar oluştur" CTA'sı görür — ama en az bir jar'ı varsa post atabilir, post atmak verification gerektirmez, sadece jar *oluşturmak* gerektirir).
- Premium/3-jar-limiti kuralı **korunur ve ek kalır**: verified olmayan hiç jar oluşturamaz (gate'te durur); verified ama premium olmayan max 3 aktif jar oluşturabilir (mevcut `MAX_JARS` mantığı değişmez, `VerificationGate`'in ardından çalışır).

---

## 5. Bottom Nav Davranışı

Route hedefleri güncellenir: `Home` → `/` (şu an `/dashboard`), diğerleri aynı (`/jars`, `/jars/new`, `/u/[username]`). Etiket kaldırma detayı §2'de.

---

## 6. Profile Tab Yapısı

Mevcut `tab: "posts" | "jars"` state'i ve pill UI'ı **korunur**. Tek değişiklik görünen metin: `t.charAt(0).toUpperCase() + t.slice(1)` → `t === "jars" ? "My Jars" : "Posts"` (sabit string map, dinamik capitalize yerine). Sekme sayısı, davranışı, boş durum mesajları değişmez.

---

## 7. Home Timeline Yapısı

`/` (signed-in), yukarıdan aşağı:
1. `HomeHeroCard` (kısaltılmış — composer'sız).
2. `HowItWorksBar` (kapatılabilir, ilk ziyarette görünür).
3. `PostComposer` (jar seçimi zorunlu; jar yoksa CTA).
4. **Timeline**: mevcut `interleaveByRatio` (jar-follow özelliğinden, `src/lib/interleave.ts`) ile üç kaynağın harmanı — **postlar** üzerinden, jar'lar üzerinden değil:
   - Takip edilen jar'ların postları (jar_id, takip edilen jar'lar arasında olan postlar).
   - Popüler postlar (jar'ın `follower_count`'una göre popüler jar'lara ait postlar — "popular near you/today" ifadesi **konum bazlı değil**, mevcut popülerlik/`follower_count` sıralaması olarak yorumlandı; konum verisi sistemde yok).
   - Tamamlanan jar'lara ait postlar.
   
   Oran, jar-follow'daki 2:2:1 deseniyle tutarlı tutulur (varsayılan `interleaveByRatio` pattern `[0,1,0,1,2]`). Bir kaynak boşsa diğerleri doldurur (mevcut fallback mantığı).

---

## 8. Jars Keşif Sayfası Yapısı

`/jars`: mevcut `/feed`'in jar-kartı kısmının taşınmış hali — takip edilen + popüler + tamamlanan jar'lar `JarCard` grid'inde (`interleaveByRatio` jar-seviyesinde, mevcut `/feed` mantığı birebir). Kullanıcının kendi jar'ları hariç (mevcut `.neq("user_id", auth.userId)` filtresi korunur). Post'lar burada **gösterilmez** (onlar Home'da) — `/feed`'in "Community Posts" bölümü kaldırılır, Home'un timeline'ına taşınır.

---

## 9. Post Composer Akışı

- Kullanıcının hiç jar'ı yok → composer render edilmez, yerine "You need a jar to post. Create one first." + `/jars/new` linki.
- Kullanıcının jar'ı var → `"Which jar is this about?"` dropdown zorunlu, boşsa `Post` butonu disabled (mevcut `disabled={posting || !content.trim()}` ifadesine `|| !jarId` eklenir).
- Post gönderiminde `jar_id` her zaman dolu gönderilir (`jar_id: jarId || null` → `jar_id: jarId`, artık `null` yolu yok çünkü UI zaten boş bırakmıyor).

---

## 10. Riskli Noktalar ve Dikkat Edilmesi Gerekenler

- **`posts.jar_id` NOT NULL migration**: canlı veri silme riski — §3'te anlatılan count-önce-sil akışıyla, insan onayı olmadan hiçbir satır silinmez.
- **Route değişikliğinin yayılma etkisi**: `/dashboard` ve `/feed`'e giden tüm iç referanslar (§1'de listelendi) tek tek güncellenmeli; kaçırılırsa kırık link riski. Plan bu referansları dosya dosya listeleyecek.
- **Manifesto gizliliği**: kod, migration uygulanmadan önce commit edilecek (bu projenin yerleşik deseni — bkz. bildirimler özelliği) ve `profiles_private`/`profiles_public`'i kullanacak şekilde yazılacak. Migration insan tarafından Studio'ya yapıştırılana kadar bu view'lar yok, yani manifesto okuyan sayfalar (Settings, `/settings/manifesto`, Home) o ara dönemde hata alır — bildirimler özelliğindeki gibi **çökmeden, nazik bir hata mesajıyla** karşılamalı (crash değil). Migration uygulandığı an her şey çalışmaya başlar. Ayrıca: `manifest_line1/2`/`phone`'u hâlâ eski şekilde taban tablodan okumaya çalışan unutulmuş bir dosya kalırsa, migration sonrası o dosya sessizce veri sızdırmak yerine **açıkça 403 hatası alır** (revoke sayesinde) — bu, kaçırılmış bir yeri sessiz sızıntı yerine görünür hata olarak ortaya çıkarır, ki bu iyi bir şey.
- **`is_verified` trigger'ı** kullanıcı `update profiles set is_verified = true` gibi bir payload gönderirse trigger onu ezip yeniden hesaplayacak — ama trigger `AFTER` çalışır, yani `INSERT`/`UPDATE` önce kullanıcının gönderdiği (yanlış) değeri yazar, trigger hemen ardından düzeltir; net sonuç doğru olur, ama bu **yalnızca trigger her zaman doğru çalışırsa** garanti — trigger'ın kendisi düzgün test edilmeli.
- **`HowItWorksBar`'ın `localStorage` durumu** sunucu tarafında bilinmiyor (SSR yok, `"use client"` component, mount sonrası okunacak) — ilk render'da kısa bir "flash of visible bar" olabilir, kabul edilebilir (mevcut projede zaten tüm sayfalar client-side veri çekiyor, aynı desen).
- **Bildirimler özelliği** (`/notifications`) `/dashboard`'a "← Home" linki veriyor — bu route değişikliğiyle güncellenmesi gereken bir yer daha.
- **`/feed` route'unun dışarıdan bilinen linkleri olabilir** (paylaşılan URL, bookmark) — kod içi referansları güncelleyebiliyorum ama üçüncü taraf linkleri bilemem; redirect ile bu risk azaltılıyor.

---

## Kapsam Dışı (YAGNI — gelecek faz)

- Jar kartında "kalan gün" — `goal_date`/bitiş tarihi kolonu yok, veri olmadan eklenmiyor.
- Gerçek kimlik doğrulama (KYC, SMS OTP, belge yükleme) — `is_verified` tamamen self-declared (alan doldurma), dış doğrulama yok.
- Kapak görseli yükleme — sadece 6 hazır şablon, kullanıcı kendi görselini yükleyemiyor (spec'in kendi isteği).
- Sosyal linklerin doğrulanması (gerçekten o hesaba mı ait) — sadece URL/kullanıcı adı metni, doğrulama yok.
- `profiles` tablosunun `select` RLS'sinin tam kolon-seviyesi kısıtlanması — view yeterli görüldü, RLS'e dokunulmuyor (mevcut public okuma davranışı bozulmasın diye).
- İletişim butonunun mailto: dışında bir mekanizması (in-app mesajlaşma) — sistemde mesajlaşma altyapısı yok, kapsam dışı.

---

## Hata ve Uç Durumlar

- Kullanıcı sosyal link alanlarına geçersiz URL girerse: mevcut `isValidUrl` validasyonu (zaten `wishes/new` sayfasında kullanılıyor) aynı şekilde uygulanır.
- `cover_template` geçersiz bir id'ye ayarlanırsa (örn. manuel DB düzenlemesiyle): component bilinmeyen id'yi varsayılan (template 3) olarak render eder, hata fırlatmaz.
- `is_verified` true iken kullanıcı `city` alanını silerse: bir sonraki `profiles` update'inde trigger `is_verified`'ı `false`'a döndürür — kullanıcı daha önce oluşturduğu jar'lar etkilenmez (retroaktif silme/gizleme yok), sadece *yeni* jar oluşturma tekrar kilitlenir.
- Hiç jar'ı olmayan kullanıcı `/jars/new`'e gitmeden postComposer'ı görmeye çalışırsa: composer hiç render edilmez (§9), boş bir form/hata durumu oluşmaz.

---

## Test / Doğrulama

Repoda otomatik test altyapısı yok; doğrulama tarayıcıda uçtan uca yapılacak:

- `/` (signed-out) hâlâ eski landing page'i gösteriyor mu?
- `/` (signed-in) Home Timeline'ı gösteriyor, `/dashboard`'a giden eski bir link `/`'e redirect oluyor mu?
- `/feed`'e giden eski bir link `/jars`'a redirect oluyor mu?
- `/jars`'ta kendi jar'larım görünmüyor, keşif içeriği (takip/popüler/tamamlanan) görünüyor mu?
- Doğrulanmamış bir hesapla `/jars/new`'e gidince gate mesajı çıkıyor, form gizli mi?
- Settings'te isim/soyisim/şehir/ülke/telefon doldurulunca `is_verified` otomatik `true` oluyor mu (bir alanı silince `false`'a dönüyor mu)?
- Jar'sız bir kullanıcı Home'da composer yerine CTA görüyor mu; jar seçmeden post gönderilemiyor mu?
- Profile sayfasında My Jars sekmesi eskisi gibi çalışıyor, kapak/isim/konum/sosyal/rozet doğru görünüyor mu (boş alanlar gizleniyor mu)?
- Başka bir kullanıcının profilini ziyaret ederken manifesto **hiçbir yerde** görünmüyor mu (network sekmesinden `profiles_public` view'ının kullanıldığı, manifest alanlarının response'ta olmadığı doğrulanmalı)?
- `curl` ile anon key kullanarak `profiles?select=manifest_line1` denendiğinde artık `42501 permission denied` mi dönüyor (bu spec'in yazılma anında `200` dönüyordu — migration sonrası kapanmalı)?
- BottomNav mobilde sadece ikon gösteriyor, sıra Home/Jars/Create/Profile mi?
