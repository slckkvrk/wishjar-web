# Jar Follow (Takip) Sistemi

**Date:** 2026-07-02
**Status:** Approved

## Overview

Kullanıcıların jar'ları takip edebilmesini sağlayan özellik. Feed sayfası, tek bir harmanlanmış akışta üç kaynaktan jar gösterir: kullanıcının takip ettiği jarlar, popüler jarlar (en çok takipçisi olanlar), ve tamamlanan jarlar. Bu, gelecekte planlanan kullanıcı/jar puanlama (ranking) sisteminin ilk parçasıdır — bu spec sadece takip özelliğini ve onun feed entegrasyonunu kapsar.

**Scope:** Jar-seviyesinde takip (kullanıcı takibi değil). Kullanıcı puanlama/skorlama sistemi, takip bildirimleri ve "kim takip ediyor" public listesi bu fazın dışındadır (aşağıya bakınız).

---

## 1. Veri Modeli

### Yeni tablo: `jar_follows`

| Kolon | Tip | Not |
|---|---|---|
| `user_id` | `uuid` | `auth.users(id)` referansı, `ON DELETE CASCADE` |
| `jar_id` | `uuid` | `jars(id)` referansı, `ON DELETE CASCADE` |
| `created_at` | `timestamptz` | `default now()` |

Primary key: `(user_id, jar_id)` — aynı jar'ı iki kez takip etmeyi DB seviyesinde engeller, ve `user_id` ilk kolon olduğu için "kullanıcının takip ettiği jarlar" sorgusu index'ten doğrudan yararlanır.

### `jars` tablosuna yeni kolon: `follower_count`

`integer not null default 0`. Bir `AFTER INSERT/DELETE` trigger'ı ile senkron tutulur:

- INSERT `jar_follows` → `UPDATE jars SET follower_count = follower_count + 1 WHERE id = NEW.jar_id`
- DELETE `jar_follows` → `UPDATE jars SET follower_count = follower_count - 1 WHERE id = OLD.jar_id`

**Neden denormalize sayaç:** Popüler sıralama her feed yüklemesinde `jar_follows` üzerinde `COUNT(*) GROUP BY jar_id` çalıştırmak yerine, `jars.follower_count` üzerinde index'li `ORDER BY follower_count DESC` yapar. Sistemin uzun vadeli ölçek hedefi (milyonlarca kullanıcı, milyarlarca jar) göz önüne alındığında bu, ileride tam bir puanlama sistemi geldiğinde de yeniden kullanılabilecek ucuz ve doğru bir temel.

### RLS Politikaları (`jar_follows`)

RLS enabled. Kullanıcı yalnızca kendi satırlarını görebilir/değiştirebilir:

- `SELECT`: `user_id = auth.uid()`
- `INSERT`: `user_id = auth.uid()`
- `DELETE`: `user_id = auth.uid()`

Takipçi listesi public değildir — toplam sayı zaten `jars.follower_count` üzerinden herkese açıktır. Bu, kimin kimi takip ettiğini gizli tutarken toplam popülerlik bilgisini açık tutar.

---

## 2. UI Bileşenleri

### `JarCard` (`src/components/JarCard.tsx`)

- Yeni bir Follow/Unfollow toggle butonu eklenir.
- `isOwn === true` olduğunda buton gösterilmez (sahip kendi jar'ını takip edemez) — mevcut "View Jar" mantığıyla tutarlı.
- Takipçi sayısı (`follower_count`) kart üzerinde küçük bir etiket olarak gösterilir.
- Kartın hangi kaynaktan (popüler/tamamlanan/takip edilen) geldiğini belirten bir etiket **eklenmez** — kart tasarımı sade kalır.

### Jar detay sayfası (`src/app/jars/[id]/page.tsx`)

- Aynı Follow/Unfollow butonu ve takipçi sayısı, sahip olmayan ziyaretçiler için gösterilir.

### Toggle davranışı

- Takip et: `jar_follows` tablosuna insert.
- Takibi bırak: aynı satırı delete.
- Optimistic UI: buton state'i hemen değişir, hata durumunda geri alınır (mevcut kod tabanındaki diğer mutasyonlarla tutarlı basit bir pattern).

---

## 3. Feed Entegrasyonu (`src/app/feed/page.tsx`)

Feed, üç kaynağı **tek bir harmanlanmış akışta** ağırlıklı oranla karıştırır:

**Oran: 5 kart başına 2 Takip Edilen : 2 Popüler : 1 Tamamlanan**

- **Takip Edilen:** Kullanıcının `jar_follows` ile takip ettiği, `status = 'active'` jarlar. Kendi içi sıralama: `jars.created_at DESC` (tabloda `updated_at` kolonu yok).
- **Popüler:** `status = 'active'` jarlar, `follower_count DESC` sıralı (mevcut wish-sayısına dayalı trend mantığının yerini alır).
- **Tamamlanan:** `status = 'completed'` jarlar, `completed_at DESC` sıralı.

Her üç kaynaktan da kullanıcının zaten gördüğü/kendi jarları hariç tutulur (mevcut `neq("user_id", auth.userId)` filtresiyle tutarlı).

**Kaynak tükenmesi:** Bir kaynakta yeterli jar yoksa (örn. kullanıcı hiç jar takip etmiyorsa), o slotlar diğer iki kaynaktan doldurulur — feed asla eksik/boş kalmaz. Üç kaynak da tükenirse mevcut boş-durum mesajı gösterilir.

**Sayfalama:** Mevcut feed'de zaten sayfalama/infinite-scroll yok (tek seferde `limit`li çekiliyor); bu spec de aynı basitliği korur — her kaynaktan yeterli sayıda (örn. 20'şer) çekilip client-side harmanlanır. Infinite scroll bu fazın kapsamı dışındadır.

---

## 4. Kapsam Dışı (YAGNI — gelecek faz)

- Kullanıcı-seviyesinde takip (sadece jar takibi var).
- Kullanıcı/jar puanlama (ranking/scoring) sistemi.
- Takip bildirimleri (push/email/in-app).
- "Bu jar'ı kimler takip ediyor" public listesi.
- Ayrı bir "Takip Ettiğim Jar'lar" liste sayfası (feed içindeki harmanlanmış görünüm yeterli).
- Feed infinite scroll / sayfalama.

---

## 5. Hata ve Uç Durumlar

- Aynı jar'ı iki kez takip etme: `(user_id, jar_id)` primary key constraint'i engeller; UI zaten toggle state'iyle bunu önler.
- Jar veya kullanıcı silinirse: `ON DELETE CASCADE` ile `jar_follows` satırları otomatik temizlenir, `follower_count` tutarlılığı bozulmaz.
- Bir kaynağın boş olması: yukarıdaki "kaynak tükenmesi" mantığıyla diğer kaynaklardan doldurulur.
- Sahibin kendi jar'ını takip etmesi: yalnızca UI-seviyesinde engellenir (mevcut C1-C3 güvenlik yaklaşımıyla tutarlı — bu projede UI-layer guard'lar zaten kabul edilmiş bir pattern).

---

## 6. Test / Doğrulama

Repoda otomatik test altyapısı yok; doğrulama tarayıcıda uçtan uca yapılacak (reset-password akışında izlenen yöntemle tutarlı):

- Bir jar'ı takip et/bırak, `follower_count`'un doğru arttığını/azaldığını doğrula.
- Feed'de üç kaynağın da (takip edilen, popüler, tamamlanan) yaklaşık 2:2:1 oranında karıştığını gözle doğrula.
- Bir kaynak boşken (örn. hiç takip yokken) feed'in diğer kaynaklarla dolduğunu doğrula.
- Kendi jar'ında Follow butonunun görünmediğini doğrula.
