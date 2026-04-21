# Project Q&A — UI (`web/`, Vite + React)

Bu dosya **frontend** tarafı için notlar içindir. **Backend / CQRS / API** soruları için: `BattleArena.Api/ProjectQandA.md`.

Yazım kuralı (diğer Q&A ile uyumlu): kısa madde veya düz paragraflar. Karşılaştırma gerekiyorsa **markdown tablo kullanma**; alt başlık veya “A tarafı / B tarafı” diye iki blok halinde yaz. Gereksiz süsleme yok.

---

## Genel (bu repo parçası nedir?)

### 1. `web/` klasörü solution’da nerede duruyor; .NET ile ilişkisi ne?

- **`BattleArena/web`** ayrı bir **Node.js / Vite** uygulamasıdır; **`.sln` içinde .csproj gibi otomatik görünmeyebilir** — bu normal. Visual Studio çoğunlukla C# projelerini listeler; UI klasörü çözümle aynı diskte durur, build/deploy ayrı komutlarla (`npm run build`, `dotnet publish`) birleştirilir.
- **Çalışma zamanında** tarayıcı, Vite’ın ürettiği **statik JS/CSS** ile konuşur; HTTP ile **BattleArena.Api**’ye gider (`VITE_API_BASE_URL`). Yani iki ayrı process: **API (Kestrel)** + **Vite dev server** (veya production’da statik dosya host’u).

---

## Gün 1 — `package.json`, Vite, `index.html`, `main.tsx`, CSS, `.ts` / `.tsx`

(`REACT-WEEK-COURSE.md` içindeki **Part 1** ile aynı okuma günü.)

### 1. `dependencies` ve `devDependencies` nedir; her yerde `import` edilebilir mi?

**`dependencies` (çalışma zamanı / bundle’a girenler)**

- Üretimde de uygulamanın ihtiyaç duyduğu paketler: örn. `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@tanstack/react-table`.
- Kaynak kodda `import 'paket-adı'` ile kullanılır; Vite bunları tarayıcıya giden bundle’a dahil eder.
- Tüm `.tsx` dosyaları aynı `node_modules`’a bakabilir; “sayfa” fark etmez, dosya fark eder.

**`devDependencies` (sadece geliştirme ve build araçları)**

- Örn. `vite`, `typescript`, `eslint`, `@vitejs/plugin-react`. Terminalde `npm run dev` / `npm run build` çalışırken devreye girer.
- Çoğu zaman **bileşen dosyalarından `import` edilmez**; istisna olarak nadiren sadece `vite.config.ts` gibi **Node’da çalışan** dosyalarda import görülebilir; bu kod tarayıcı bundle’ına gitmez.

**Kısa özet:** Ekranda kullandığın kütüphaneler neredeyse daima **`dependencies`**. **`devDependencies`** = tezgâh; **`dependencies`** = arabaya konan parça.

### 2. `vite.config.ts` içindeki `import` / `export default` ne işe yarar; React ile aynı mı?

- Bu dosya **tarayıcıda çalışmaz**; **Node ortamında** `vite` veya `vite build` komutu çalışırken okunur.
- `import { defineConfig } from 'vite'` — Vite’ın sunduğu **yapılandırma yardımcısı** (tip + IntelliSense).
- `import react from '@vitejs/plugin-react'` — JSX ve React Fast Refresh için **Vite eklentisi** (yine build/dev tarafı).
- `export default defineConfig({ ... })` — Bu modülün **varsayılan dışa aktarımı** “Vite’a şu ayarları kullan” demektir; **React bileşeninin `export default`’u ile aynı işlev değil** (biri build aracı, diğeri UI modülü).
- **Ortak nokta:** İkisi de ES modülü `import` / `export` sözdizimini kullanır; biri **Node’da config**, diğeri **bundle’lanıp tarayıcıda** çalışan uygulama kodu.

### 3. `index.html` içindeki `<meta>`, `<link>`, `<script type="module" src="/src/main.tsx">` ne işe yarar?

- `<meta charset="UTF-8">` — Sayfa metninin doğru kodlanması.
- `<meta name="viewport" ...>` — Mobil cihazlarda ölçekleme (responsive temel).
- `<link rel="icon" ...>` — Sekme ikonu.
- `<script type="module" src="/src/main.tsx">` — Tarayıcıya “bu giriş dosyasını **ES modülü** olarak yükle” der. Geliştirmede Vite bu yolu sanal olarak çözüp `main.tsx` ve bağımlılıklarını sunar; production build’de genelde tek veya birkaç hash’li `.js` dosyasına dönüşür.
- `<title>` — Sekme başlığı.

### 4. `main.tsx` dosyası ne yapıyor? (blokların anlamı)

- `StrictMode` — Geliştirmede ek kontroller (ör. efektlerin çift çalışması); üretimde farklı davranabilir; kullanıcıya hata penceresi açmaz, “sıkı mod” yaklaşımıdır.
- `QueryClient` / `QueryClientProvider` — TanStack Query’nin önbellek ve sunucu istekleri için **kök sağlayıcısı**; altındaki bileşenler `useQuery` / `useMutation` kullanabilir.
- `BrowserRouter` — **URL ile ekran** eşlemesi (React Router); `App` içindeki `Routes` bunun içinde çalışır.
- `createRoot(document.getElementById('root')!).render(...)` — React 18 kök API’si: DOM’daki `#root` elementine React ağacını bağlar. `!` TypeScript’e “bu element null değil” der; HTML’de `root` yoksa runtime’da hata olur.
- `staleTime: 30_000` — Veri en az 30 saniye “taze” sayılır; gereksiz refetch azalır.
- `retry: 1` — İstek hata verirse bir kez daha dener.

**Sarma sırası (dıştan içe):** `StrictMode` → `QueryClientProvider` → `BrowserRouter` → `App`. Router, Query kullanan sayfaların üstünde olmalıdır.

### 5. `index.css` projede nereleri etkiler; kapsamı nasıl görürüm?

- `main.tsx` içinde `import './index.css'` olduğu için dosya **bir kez yüklenir** ve kurallar **global**dir (CSS Modules değilse): `:root`, `body`, `#root`, genel `h1` vb. tüm uygulamayı etkileyebilir.
- **Kapsamı görmek için:** projede `import './index.css'` veya `index.css` import satırını ara — giriş noktası `main.tsx`’tir. Tarayıcıda DevTools → Elements → bir eleman → **Computed** sekmesinde hangi kuralın kazandığını gör. Büyük projede class önekleri (ör. `.app-shell__`) global çakışmayı azaltır.

### 6. `App.css` nereleri etkiler; kapsamı nasıl görürüm?

- `App.tsx` içinde `import './App.css'` vardır; yine **global** kurallar (şu an dosya neredeyse boş).
- Teknik olarak CSS tek başına “sadece App altı” diye sınır bilmez; pratikte anlam, `App.tsx` ağacında kullandığın sınıflar üzerinden gelir. Bileşen özel stilleri `CharactersGrid.css`, `AppLayout.css` gibi yan dosyalarda ve ilgili `.tsx` içinde import edilir.
- **Kapsamı görmek için:** `./App.css` veya `App.css` importunu ara; çoğunlukla sadece `App.tsx`’tir. `App.css` içindeki seçici isimlerini projede grep ile arat.

### 7. `.ts` ve `.tsx` dosyaları ne fark eder?

- **`.tsx`** — **TypeScript + JSX** demektir. Dosyada `<App />`, `<Routes>` gibi **HTML benzeri etiketler** yazabilirsin. React bileşenleri bu yüzden genelde **`.tsx`**: örn. `main.tsx`, `App.tsx`, `CharactersGrid.tsx`.
- **`.ts`** — Sadece **TypeScript**; içinde **JSX yok** (etiket yazamazsın). Saf mantık, yardımcı fonksiyonlar, API katmanı, tipler: örn. `vite.config.ts`, `charactersApi.ts`, `formatApiError.ts`.
- **Kural:** Ekran veya React ağacı döndüren dosya → çoğunlukla **`.tsx`**. Sadece fonksiyon/tip/iş mantığı → **`.ts`**. Yanlış uzantıda JSX yazarsan derleyici / Vite hata verir.

---

## Gün 2 — `App.tsx` rotaları, `AppLayout`, `Outlet`, `NotFoundPage` (`REACT-WEEK-COURSE` Part 2–3)

### 0. `App.tsx` şimdilik bu kadar yeter mi; REACT-WEEK’teki madde ne anlama geliyor?

- **Evet, şu aşama için yeterli:** `App.tsx` sadece **hangi URL’de hangi ekranın** açılacağını tanımlar (route tablosu). İş mantığı veya layout burada olmaz; layout **`AppLayout`** içinde, liste **`CharactersGrid`** içinde.
- **Kurs maddelerinin özeti:** `App.tsx` içinde **`Routes` / `Route` / `Navigate`** var. **Layout route:** üst `Route`’un `element`’i `AppLayout`, **path yok** — alt route’ların içeriği **`AppLayout` içindeki `<Outlet />`** yerine basılır. **`/`** adresi **`/characters`**’e yönlendirilir. Tanımsız path’ler **`path="*"`** ile **404** sayfasına gider. **`pages/`** klasörü “adresi olan ekran” (`NotFoundPage`), **`components/`** paylaşılan parça (`AppLayout`, `Modal`).

### 1. `AppLayout.tsx` — import’lar, sabitler, state ve hook’lar (blok blok)

**Import satırları**

- `useState`, `useEffect`, `useCallback`, `useId` — React’ın yerleşik hook’ları: sırasıyla durum, yan etki, sabit referanslı fonksiyon, benzersiz DOM id üretimi.
- `NavLink`, `Outlet`, `useLocation` — React Router: tıklanabilir link + aktif stil, “çocuk route’un buraya çizilmesi”, şu anki URL bilgisi.
- `EnvironmentBadge` — header’daki DEV/PROD rozeti bileşeni.
- `'./AppLayout.css'` — bu bileşenin stillerini yükle (global CSS dosyası).

**`desktopMq`**

- Medya sorgusu metni: pencere genişliği **960px ve üzeri** “masaüstü” sayılır. JS ve CSS aynı eşikte uyumlu kalsın diye tek yerde tutulur.

**Bileşen gövdesi — state ve id**

- `useLocation()` — Örn. `/characters` veya `/foo`; **`pathname`** değişince aşağıdaki `useEffect` tetiklenir.
- `sidebarOpen` — Mobilde yan menü **açık mı** (true/false).
- `isDesktop` — Şu an ekran **masaüstü mü**; erişilebilirlik ve davranış için.
- `useId()` — `navId`: hamburger butonunun **`aria-controls`** ile **aside**’ı ilişkilendirmek için benzersiz string (çok kök bileşende çakışma riskini azaltır).

**`closeSidebar` / `toggleSidebar`**

- `useCallback(..., [])` — fonksiyon referansı render’lar arasında **stabil** kalsın diye; `useEffect` bağımlılık dizisinde güvenle kullanılır.

**İlk `useEffect` (genişlik dinleme)**

- `matchMedia(desktopMq)` — tarayıcıya “bu media query şu an eşleşiyor mu?” diye sorar.
- `sync` — eşleşiyorsa `isDesktop` true, ayrıca **masaüstüne geçince menüyü kapat** (overlay gereksiz).
- İlk render’da bir kez `sync()` çağrılır; pencere boyutu değişince `change` ile tekrar.
- `return` içindeki cleanup — bileşen unmount olunca veya effect yeniden çalışmadan önce **listener kaldırılır** (sızıntı olmasın).

**İkinci `useEffect` (route değişince)**

- `location.pathname` değişince **`closeSidebar()`** — mobilde yeni sayfaya gidince menü kapanır.

**Üçüncü `useEffect` (Escape)**

- Sadece `sidebarOpen` true iken dinler; **Escape** ile menüyü kapatır. Cleanup ile tuş dinleyicisi kaldırılır.

**`return` — JSX yapısı**

- **`app-shell`** — tüm kabuğun dış sarmalayıcısı.
- **`header`** — hamburger, marka linki, boşluk (`header-spacer`), ortam rozeti.
- **Hamburger `button`** — `aria-expanded` menü açık mı; `aria-controls={navId}` hangi paneli kontrol ettiğini söyler; tıklanınca `toggleSidebar`.
- **Marka `NavLink`** — `/characters`’e gider; tıklanınca `closeSidebar` (mobilde menü kapanır).
- **Koşullu scrim** — `sidebarOpen` true iken tam ekran (header altından) yarı saydam **buton**: tıklanınca menü kapanır (overlay kapatma deseni).
- **`aside` (sidebar)** — `id={navId}` erişilebilirlik bağlantısı; class’ta `--open` ile mobilde kaydırma sınıfı; `aria-hidden` mobilde menü kapalıyken yardımcı teknolojilere “gizli” diyebilmek için (masaüstünde false).
- **`nav` içi `NavLink` (Characters)** — `end`: sadece tam `/characters` eşleşince “aktif” sayılır. `className` fonksiyonu `isActive`’e göre aktif sınıf ekler.
- **`main` + `<Outlet />`** — Router’ın seçtiği **alt route bileşeni** (ör. `CharactersGrid` veya `NotFoundPage`) **tam burada** render edilir; `AppLayout` bunu bilmez, Router bilir.
- **`footer`** — `import.meta.env.DEV` true iken “local development” metni; API adresi `VITE_API_BASE_URL`.

### 2. CSS şimdi ana konu değil — birkaç çekirdek kavram; `app-shell__*` neyi değiştirir?

**Kavram (kısa)**

- **Sınıf seçici (`.app-shell__header`)** — O elemana `className` ile verilir; kurallar genelde **o eleman ve görünümü** (renk, padding, flex) için geçerlidir.
- **Global CSS** — `AppLayout.css` import edildiği için kurallar **proje genelinde geçerli**; isim çakışmazsa başka yeri bozmaz. Önek (`BEM` benzeri) **`app-shell__`** öneki: “hepsi bu kabuğa ait” demek.
- **Medya sorgusu (`@media (min-width: 960px)`)** — Geniş ekranda grid alanları değişir; sidebar sabit sütun olur; hamburger gizlenir. Dar ekranda sidebar `fixed` + `transform` ile dışarıdan gelir (detay için dosyaya bak).

**Sınıfların kabaca rolü (dosya: `AppLayout.css`)**

- **`app-shell`** — Sayfa iskeleti: grid satırları (üst bar, orta, alt bilgi); arka plan rengi.
- **`app-shell__header`** — Üst bar rengi, flex hizalama.
- **`app-shell__menu-btn` / `__menu-icon`** — Hamburger çizgisi (span + pseudo görünümü CSS’te).
- **`app-shell__brand` / `__brand-link` / `__brand-title` / `__brand-sub`** — Logo metin hiyerarşisi ve link stili.
- **`app-shell__header-spacer`** — Esnek boşluk; rozeti sağa iter (`flex: 1`).
- **`app-shell__scrim`** — Yarı saydam tam alan; tıklanınca kapanma.
- **`app-shell__sidebar` / `--open`** — Mobilde panel kaydırma; masaüstünde normal sütun.
- **`app-shell__nav` / `__nav-link` / `--active`** — Sol menü linkleri ve seçili görünüm.
- **`app-shell__main`** — İçerik alanı; taşarsa kaydırma (`overflow`).
- **`app-shell__footer` / `__footer-code`** — Alt bilgi ve kod fontlu API satırı.

### 3. `NotFoundPage` bir “çok sayfada kullanılan çocuk bileşen” mi?

- **Hayır, o kalıp değil.** `NotFoundPage` **tek bir route’un** (`path="*"`) hedefidir: URL hiçbir tanımlı route ile eşleşmezse Router **bu bileşeni bir kez** o an için render eder.
- **“Çocuk”** dediğimiz şey: `AppLayout` içindeki **`<Outlet />`** yerine gelen içerik; yani layout **etrafında** (header/sidebar/footer) 404 metni görünür. Aynı layout altında `CharactersGrid` de `NotFoundPage` de **Outlet** ile değişir; ikisi aynı anda dolmaz.

### 4. REACT-WEEK’teki “sahte Route ekle, sonra geri al” alıştırması ne demek?

- **Amaç:** Router’ın “yeni path = yeni ekran” davranışını **elle denemek**; kalıcı kod değil.
- **Ne yaparsın (örnek):** `App.tsx` içinde, `AppLayout` altına geçici bir satır eklersin: örn. `path="test"` ve `element={<p>Test sayfası</p>}` gibi basit bir JSX. Tarayıcıda **`/test`** açıp Outlet’in bu metni gösterdiğini görürsün. Sonra **satırı sil** veya geri al (git revert / Ctrl+Z).
- **Öğrendiğin şey:** `Route`’un `path` + `element` ikilisinin URL’yi nasıl eşlediği; `AppLayout`’un kendisinin değişmediği, sadece **Outlet içeriğinin** değiştiği.

### 5. `<Outlet />` ile CSS grid birlikte nasıl çalışıyor? (İkisi aynı şey değil)

- **CSS grid (`app-shell`)** — `AppLayout`’un dış **`div`’ine** uygulanır: “üst şerit, sol sütun, orta alan, alt bilgi” gibi **sabit iskelet** çizer. Header, sidebar, **main**, footer bu ızgaranın **hücreleridir**.
- **`<Outlet />`** — Sadece **`<main className="app-shell__main">` içinde duran bir delik**tir. React Router, URL’ye göre eşleşen child route’un bileşenini (**`CharactersGrid`**, **`NotFoundPage`**, …) **tam o deliğin yerine** koyar. Yani grid “kutu”yu çizer; Outlet “kutunun içine hangi sayfa gelecek”i Router’a bırakır.
- **Tablo (TanStack Table)** — `CharactersGrid` **içinde** başka bir düzen: sayfa içi tablo. **`app-shell` grid’i ile karışmaz**; çünkü tablo, Outlet’e gelen içeriğin **kendi JSX’inin** içindedir.
- **Akış:** URL değişir → Router `Outlet`’e farklı bileşen basar → **Aynı `main` hücresi** içinde artık başka içerik görünür; header/sidebar/footer aynı kalır (layout route sayesinde).

### 6. Router hangi child bileşeni (`CharactersGrid` vs `NotFoundPage`) seçeceğini nereden “biliyor”?

- **Kaynak:** Tamamen **`App.tsx` içindeki `Routes` / `Route` ağacı**dır. Orada her child için **`path`** (veya **`index`**) ve **`element`** yazılmıştır; Router tarayıcıdaki **gerçek URL**’yi bu kurallarla **eşleştirir**.
- **Bu projede:** Üst `Route` sadece **`element={<AppLayout />}`** verir (**path yok** — “layout route”); alt satırlar kök URL’ye göre eşlenir: `path="characters"` → URL **`/characters`** ise **`CharactersGrid`**. **`path="*"`** → hiçbiri tutmazsa **`NotFoundPage`**. **`index` + `Navigate`** → **`/`** açılınca **`/characters`**’e yönlendirme.
- **`<Outlet />`** — Eşleşen **o bir child** `Route`’un **`element`** prop’unu (ör. `<CharactersGrid />`) **render edilen yer**dir; `AppLayout` dosyasında isim geçmez, eşleşme **`App.tsx`**’tedir.
- Özet: **“Hangi child?”** sorusunun cevabı = **adres çubuğu + `App.tsx`’teki `path`/`index`/`*` sırası ve kuralları** (React Router’un eşleştirme algoritması).


AppLayout.tsx bir daha okunacak *****************************************************************