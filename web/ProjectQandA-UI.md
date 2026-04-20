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
