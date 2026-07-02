# Bildirimler (Notifications)

**Date:** 2026-07-03
**Status:** Approved

## Overview

Kullanıcıların jar aktivitesinden (takip, yeni post, ilerleme, tamamlanma) haberdar olmasını sağlayan in-app bildirim sistemi. Şu an home ekranındaki çan (bell) ikonu `/feed`'e yönleniyor — bu spec ile gerçek bir `/notifications` sayfasına yönlenecek ve sadece o kullanıcıya ait bildirimleri gösterecek.

**Scope:** Dört bildirim tipi: `follow`, `new_post`, `jar_milestone`, `jar_completed`. Finansal "destek oldu" (bağış/ödeme) bildirimi bu fazın **dışındadır** — ödeme altyapısı henüz yok ve ayrı bir proje olarak ele alınacak (bkz. Kapsam Dışı). Veri modeli bu tipin ileride eklenmesine izin verecek şekilde (`type` alanı genişletilebilir) tasarlanmıştır.

---

## 1. Veri Modeli

### Yeni tablo: `notifications`

| Kolon | Tip | Not |
|---|---|---|
| `id` | `uuid` | primary key, `default gen_random_uuid()` |
| `recipient_id` | `uuid` | `auth.users(id)` referansı, `ON DELETE CASCADE` — bildirimi alan kişi |
| `actor_id` | `uuid`, nullable | `auth.users(id)` referansı, `ON DELETE SET NULL` — olayı tetikleyen kişi (`jar_milestone`/`jar_completed` için null, kimse tetiklemedi, jar'ın kendisi tetikledi) |
| `type` | `text` | `check (type in ('follow','new_post','jar_milestone','jar_completed'))` |
| `jar_id` | `uuid`, nullable | `jars(id)` referansı, `ON DELETE CASCADE` |
| `post_id` | `uuid`, nullable | `posts(id)` referansı, `ON DELETE CASCADE` — sadece `new_post` için |
| `percent` | `smallint`, nullable | sadece `jar_milestone` için: 25 / 50 / 75 |
| `read_at` | `timestamptz`, nullable | null = okunmadı |
| `created_at` | `timestamptz` | `default now()` |

İndeksler:
- `notifications_recipient_created_idx` on `(recipient_id, created_at desc)` — liste sorgusu için.
- `notifications_recipient_unread_idx` on `(recipient_id) where read_at is null` — çan ikonundaki kırmızı nokta için hızlı `exists` kontrolü.
- `wishes_jar_id_idx` on `wishes(jar_id)` — milestone trigger'ının toplam değer sorgusu için (`create index if not exists`, zaten varsa no-op).

### `jars` tablosuna yeni kolon: `last_milestone_notified`

`integer not null default 0`. Bir jar için en son bildirilen yüzde eşiğini tutar (0/25/50/75). Wish eklenip silinince yüzde dalgalanabildiği için, eşik yalnızca **yükselirken** bir kez bildirilir; düşüp tekrar aynı eşiğe çıkması yeni bildirim üretmez.

### RLS Politikaları (`notifications`)

RLS enabled.

- `SELECT`: `recipient_id = auth.uid()`
- `UPDATE`: `recipient_id = auth.uid()` (sadece `read_at` alanını "okundu" işaretlemek için kullanılır)
- `INSERT`/`DELETE` için authenticated role'e **politika tanımlanmaz** — client hiçbir zaman doğrudan bildirim satırı oluşturamaz veya silemez. Tüm insert'ler aşağıdaki `SECURITY DEFINER` trigger fonksiyonları üzerinden, RLS'i bypass ederek yapılır (mevcut `jar_follows_adjust_count()` deseniyle aynı).

---

## 2. Trigger'lar

Hepsi `security definer`, `set search_path = public`, `jar_follows_adjust_count()` ile aynı stil. Ortak kural: **actor kendine bildirim almaz** (`recipient_id != actor_id` olduğunda insert edilir).

### `notify_on_jar_follow()` — `AFTER INSERT ON jar_follows`

Jar sahibine `follow` bildirimi: `recipient_id = jars.user_id`, `actor_id = NEW.user_id`, `jar_id = NEW.jar_id`.

### `notify_on_new_post()` — `AFTER INSERT ON posts` (sadece `NEW.jar_id IS NOT NULL` ise)

O jar'ı takip eden herkese (`jar_follows WHERE jar_id = NEW.jar_id`) tek seferde `INSERT ... SELECT` ile `new_post` bildirimi: `actor_id = NEW.user_id`, `post_id = NEW.id`.

### `notify_on_wish_change()` — `AFTER INSERT OR UPDATE OR DELETE ON wishes`

1. İlgili jar'ın `goal_amount`'ı null/0 ise hiçbir şey yapma.
2. Jar'ın güncel toplam wish değerini (`SUM(price)`) hesapla, yüzdeyi bul (jar detay sayfasındaki `progressPct` ile aynı formül).
3. Geçilen en yüksek eşiği bul: `{25,50,75}` içinden yüzdeye eşit/altında olan ve `jars.last_milestone_notified`'tan büyük olan en büyük değer.
4. Eşik bulunduysa: jar'ı takip eden herkese `jar_milestone` bildirimi (`percent` = bulunan eşik), `jars.last_milestone_notified` güncellenir.

`DELETE` durumunda `NEW` mevcut olmadığı için `jar_id`, `TG_OP`'a göre `NEW.jar_id` ya da `OLD.jar_id`'den alınır (mevcut `jar_follows_adjust_count()`'taki `TG_OP` ayrımıyla aynı desen).

### `notify_on_jar_completed()` — `AFTER UPDATE ON jars`

`OLD.status <> 'completed' AND NEW.status = 'completed'` olduğunda, jar'ı takip eden herkese `jar_completed` bildirimi.

---

## 3. Arayüz

### `HomeHeroCard` — çan ikonu

- `href="/feed"` → `href="/notifications"` olarak değişir.
- Okunmamış bildirim varsa (`exists(select 1 from notifications where recipient_id = me and read_at is null)`), çanın sağ üstünde küçük kırmızı bir nokta gösterilir. Yoksa gösterilmez.

### Yeni sayfa: `/notifications` (`src/app/notifications/page.tsx`)

- `SiteHeader` + `BottomNav` ile diğer sayfalarla (ör. `/feed`, `/settings`) aynı iskelet.
- Sayfa mount olduğunda: `recipient_id = me` bildirimleri `created_at desc` sırayla çekilir, ekrana basılır, **ardından** o an okunmamış olanlar toplu `UPDATE notifications SET read_at = now() WHERE recipient_id = me AND read_at IS NULL` ile okundu işaretlenir (bir sonraki ziyarette kırmızı nokta kaybolmuş olur).
- Her satır, tipine göre İngilizce bir cümle + ilgili jar'a link (`/jars/{jar_id}`):
  - `follow` → *"{actor_username} started following your jar "{jar_title}"."* (kod içinde `{jar_title}` etrafında tırnak `“ ”` karakterleri kullanılır, çift tırnak çakışmasını önlemek için)
  - `new_post` → *"{actor_username} posted an update on "{jar_title}"."*
  - `jar_milestone` → *""{jar_title}" reached {percent}% of its goal."*
  - `jar_completed` → *""{jar_title}" is complete!"*
- Boş durum (hiç bildirim yoksa): **"No new notifications."**
- Yükleme hatası olursa: mevcut sayfalardaki basit inline hata mesajı deseni (ör. `PostComposer`'daki `error` state) kullanılır.

---

## 4. Kapsam Dışı (YAGNI — gelecek faz)

- "xxx size destek oldu" (finansal destek/bağış) bildirimi — ödeme altyapısı ayrı bir proje olarak tasarlanmalı, sonra `type`'a `support` eklenir.
- WishJar resmi hesabından duyuru bildirimi — resmi hesap özelliği şu an duraklatılmış durumda (bkz. proje hafızası), bu spec'e dahil değil.
- Push/email bildirimleri — sadece in-app.
- Bildirim tercihleri (hangi tipleri almak istediğini seçme).
- Tek tek "okundu" işaretleme / bildirim silme — sayfa açılınca hepsi toplu okundu sayılır.
- Sayfalama/infinite-scroll — liste tek seferde çekilir (mevcut feed/dashboard deseniyle tutarlı).

---

## 5. Hata ve Uç Durumlar

- Wish değeri dalgalanıp aynı eşiğe tekrar çıkarsa: `last_milestone_notified` monotonik arttığı için tekrar bildirim gitmez.
- Jar veya kullanıcı silinirse: `ON DELETE CASCADE`/`SET NULL` ile ilgili bildirim satırları tutarlı kalır (silinen jar'a ait bildirimler de silinir; actor silinirse bildirim durur ama `actor_id` null'a düşer).
- Kendi jar'ına kendi wish'ini ekleyip eşik geçilirse: jar sahibi kendi jar'ını takip etmiyorsa (UI zaten bunu engelliyor, bkz. jar-follow spec) zaten bildirim listesine dahil olmaz; olsa bile `actor_id`/`recipient_id` ayrımı yoktur burada (milestone/completed olaylarında `actor_id` zaten null) — jar sahibi kendi jar'ını takip ediyorsa bildirimi alması beklenen davranıştır (bu bir "kendine bildirim" değil, "takip ettiğin jar" bildirimidir).
- `goal_amount` null olan jarlar: milestone bildirimi hiç üretilmez (yüzde tanımsız).

---

## 6. Test / Doğrulama

Repoda otomatik test altyapısı yok; doğrulama tarayıcıda uçtan uca yapılacak:

- İkinci bir test kullanıcısıyla bir jar'ı takip et → jar sahibi `/notifications`'da `follow` bildirimini görsün, çanda kırmızı nokta çıksın.
- Takip edilen jar'a post at → takipçi `new_post` bildirimini görsün.
- Takip edilen jar'a wish ekleyerek değeri kademeli artır, %25/50/75 eşiklerini geçir → her eşikte tek bir bildirim gitsin, tekrar dalgalanma yeni bildirim üretmesin.
- Jar'ı "completed" olarak işaretle → takipçi `jar_completed` bildirimini görsün.
- `/notifications` sayfasını aç → kırmızı nokta kaybolsun, tekrar girince aynı bildirimler "okunmuş" görünsün ama listede kalsın.
- Hiç bildirimi olmayan taze bir kullanıcı için boş durum mesajının göründüğünü doğrula.
