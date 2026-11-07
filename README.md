# TSAVY

**TSAVY** (Transcript Any Video on YouTube), YouTube videolarının erişilebilir konuşma metinlerini Chrome yan panelinde okumanı sağlar. İstersen kendi seçtiğin OpenAI uyumlu bir API ile videoyu özetleyebilir ve video hakkında sorular sorabilirsin.

TSAVY konuşmayı kendisi yazıya dökmez: YouTube'un sunduğu transkripti kullanır. Transkript görüntülemek için API anahtarı gerekmez.

Geliştirici: [emi-ran](https://github.com/emi-ran) · Kaynak kodu: [GitHub'da TSAVY](https://github.com/emi-ran/TSAVY).

## Özellikler

- Normal YouTube videoları ve Shorts için transkripti zaman damgalarıyla yan panelde görüntüleme.
- Video başlığı, kanal bilgileri, açıklama ve transkriptten içeriğin kapsamına uygun özet oluşturma.
- Video hakkında soru sorma; önceki mesajları bağlam olarak kullanma ve istendiğinde ayrıntılı yanıt alma.
- Panel açıkken özetleri, sohbet geçmişini ve taslakları sekme ve video bazında koruma.
- Özetteki geçerli zaman damgalarından videonun ilgili anına gitme.
- OpenAI uyumlu servis adresini ve modeli seçme; destekleniyorsa model listesini görüntüleme.
- Azaltılmış hareket tercihine uygun arayüz geçişleri.

## Ekran görüntüleri

**Video özeti** — YouTube videosunun yanında özet ve transkriptteki zaman damgaları:

![YouTube videosunun yanında TSAVY ile oluşturulmuş özet](docs/images/ozet.png)

**Video hakkında sohbet** — Videoyla ilgili soru ve yanıt, altında transkript:

![TSAVY yan panelinde video hakkında soru ve yanıt](docs/images/sohbet.png)

**Transkript** — YouTube videosunun konuşma metni zaman damgalarıyla:

![TSAVY yan panelinde zaman damgalı transkript](docs/images/transkript.png)

## Gereksinimler

- Chrome 116 veya üzeri.
- YouTube'da erişilebilir transkripti olan bir video.
- Özet ve sohbet için OpenAI uyumlu bir API adresi ve model; sağlayıcı gerektiriyorsa API anahtarı. Yalnızca transkripti görüntülemek için API bağlantısı gerekmez.

## Kurulum

1. [En son sürümden](https://github.com/emi-ran/TSAVY/releases/latest) eklenti ZIP dosyasını indir ve kalıcı bir klasöre çıkar; alternatif olarak depoyu klonlayabilirsin.
2. Chrome'da `chrome://extensions` adresini aç ve **Geliştirici modu**nu etkinleştir.
3. **Paketlenmemiş öğe yükle** seçeneğine tıkla ve çıkardığın `manifest.json` dosyasını içeren klasörü seç.
4. YouTube'da bir video açıp araç çubuğundaki TSAVY simgesine tıkla. Gerekirse simgeyi eklentiler menüsünden sabitle.

Yeni bir sürüm kurarken ZIP dosyasını indirip mevcut eklenti klasöründeki dosyaları yenile. Ardından `chrome://extensions` sayfasında TSAVY'yi ve YouTube sayfasını yenileyip paneli tekrar aç. Klasörü taşımak veya silmek eklentinin çalışmasını etkiler.

Panel açıldığında GitHub'daki son yayımlanmış sürüm kontrol edilir. Daha yeni bir sürüm varsa sürümler sayfasına bağlantı gösterilir; indirme ve kurulum otomatik yapılmaz. Kontrol başarısız olursa bildirim gösterilmez ve panel çalışmaya devam eder.

## Kullanım

Panel etkin sekme veya video değiştiğinde altyazıyı yeniden yükler. Yenile düğmesiyle elle tekrar deneyebilirsin. **Altyazılar** bölümünü açarak tam metni görebilirsin. Başlığın altında kanal adı ve bulunabilirse kullanıcı adı gösterilir; bu bilgiler özet ve sohbet bağlamına da eklenir. Önce oynatıcının `timedtext` isteği denenir; başarısız olursa normal videoda YouTube'un transkript paneli okunur ve eklentinin açtığı panel işlemden sonra kapatılır.

### Shorts

Shorts videosunu açıp TSAVY panelini kullanabilirsin. Sonraki veya önceki Short'a geçtiğinde panel yeni videonun transkriptini yükler; özet ve sohbet normal videolardaki gibi çalışır. Özetteki zaman damgaları açık Shorts oynatıcısında ilgili ana gider.

İstek adresi sayfanın kendi oturumunda kullanılır; çerez veya imzalı adres girmen gerekmez. Altyazı isteği henüz yoksa eklenti oynatıcıya isteği oluşturtmayı dener. Altyazılar kapalıysa bu sırada kısa süreli açılabilir ve önceki duruma döndürülür. Doğrudan okuma başarısız olursa aynı videonun normal sayfası geçici, sessiz, etkin olmayan bir sekmede ve kapalı TSAVY grubunda açılır; işlem bitince veya iptal edilince sekme ve grubu kapatılır.

### API bağlantısı

1. Panelde **API ayarları**nı aç.
2. OpenAI uyumlu temel adresi gir; örneğin `https://api.example.com/v1`. Sonuna `/chat/completions` ekleme.
3. Sağlayıcı gerektiriyorsa API anahtarını gir. Kimlik doğrulaması gerektirmeyen yerel sunucularda boş bırakılabilir.
4. **Listele** ile destekleniyorsa modelleri getirip seç veya model kimliğini elle gir.
5. İstersen **Bağlantıyı test et** ile girili adresi, anahtarı ve modeli dene. Test seçili modele kısa bir sohbet isteği gönderir; sağlayıcı ücret uygulayabilir. Başarı, modelin metin yanıtı verdiğini gösterir.
6. **Kaydet**e basıp Chrome'un ilgili adrese erişim iznini onayla; test veya listeleme sırasında da izin istenebilir.

Uzak API adreslerinde HTTPS gerekir; HTTP yalnızca `localhost`, `127.0.0.1` ve `[::1]` için kullanılabilir. API, `POST /chat/completions` ve model listesi için `GET /models` uçlarında OpenAI uyumlu JSON desteklemelidir. Model listesi alınamasa da model adı elle girilebilir.

### Özet ve sohbet

Transkript yüklendikten sonra **Videoyu özetle**ye basabilir veya **Merak ettiğini sor** alanından soru sorabilirsin. Özet, ana fikri anlatan kısa bir giriş ve zaman damgalı açıklayıcı maddelerden oluşur. Sabit kelime veya madde kotası istenmez; kısa içerikte özlü kalması, kapsamlı içerikte önemli açıklamaları, gerekli örnekleri ve sonucu koruması beklenir. Tekrarlar ve dolgu çıkarılır; amaç, özeti okuyarak videonun ne anlattığını anlayabilmektir.

Sohbette Enter gönderir, Shift+Enter yeni satır ekler. Sohbet yanıtları varsayılan olarak kısadır; daha ayrıntılı anlatmasını ayrıca isteyebilirsin. Özetin ve sohbet yanıtlarının doğruluğu ve uzunluğu kullanılan modele bağlıdır.

Gönderilen soru hemen görünür; yanıt beklenirken durum göstergesi çıkar. İstek başarısız olursa soru yeniden denemen için giriş alanına döner. Özette yalnızca transkriptte bulunan zaman damgaları tıklanabilir; reklam sırasında videoda atlama yapılamaz.

Tamamlanan özetler ve sohbet geçmişi panel açıkken sekme ve video bazında bellekte tutulur; sekme veya video değiştirip geri dönünce ilgili geçmiş gösterilir. Bekleyen bir yanıt video değişiminde iptal edilir; soru taslak olarak korunur. **Temizle** yalnız o videonun sohbetini siler. Panel kapatıldığında bellekteki özet ve sohbetler silinir.

## Gizlilik ve izinler

- Transkript yalnızca görüntülendiğinde bir yapay zekâ servisine gönderilmez. Özet veya sohbet isteğinde video başlığı ve bağlantısı, kanal adı ve bağlantısı, video açıklaması ve transkript seçilen API'ye gönderilir. Sohbette önceki başarılı soru ve yanıtlar da gönderilir. Sağlayıcının gizlilik politikasını incele.
- Video bağlantısı yalnızca video kimliğinden oluşturulur; URL'deki oynatma listesi gibi ek parametreler gönderilmez. Kanal bağlantısının sorgu ve parça bilgileri çıkarılır.
- API adresi, model ve anahtar Chrome'un yerel eklenti depolamasında **şifrelenmeden** saklanır. Cihaza veya tarayıcı profiline erişebilen kişiler anahtara erişebilir. **Bağlantıyı sil**, onayından sonra kayıtlı bilgileri kaldırır.
- Eklenti yan panel, etkin sekme, YouTube altyazısı ve bağlantı ayarları için Chrome izinleri kullanır; Shorts yedek sekmesini gruplamak için `tabGroups` izni gerekir. Yedek yolda açılan normal video sayfası YouTube izleme etkinliğine yansıyabilir. Seçilen API adresine erişim izni ayrıca istenir. YouTube oturum çerezleri ve altyazı isteğinin imzalı adresi eklenti depolamasına veya AI isteğine eklenmez.
- Transkript kalıcı olarak saklanmaz. Uzun videolar ve sohbetler modelin bağlam sınırını aşabilir; sağlayıcı kullanım ücreti uygulayabilir.
- Sürüm kontrolü GitHub API'sine istek gönderir; video, sohbet ve API anahtarı bu isteğe eklenmez. Bağlantı başarısızsa panel çalışmaya devam eder.

## Sınırlamalar

- Eklenti `www.youtube.com/watch` ve `www.youtube.com/shorts/<video-kimliği>` sayfalarında YouTube'un sağladığı altyazıyla çalışır. İmzalı altyazı isteğine erişim YouTube tarafından engellenebilir; altyazısı veya erişim izni olmayan videoları yazıya dökmez.
- Doğrudan altyazı isteği başarısız olduğunda yedek okuma için normal videoda transkript paneline, Shorts'ta ise aynı videonun normal sayfasındaki transkripte erişim gerekir.
- Doğrudan okuma YouTube oynatıcı arayüzüne ve `json3` biçimine, yedek yol ise YouTube'un Türkçe veya İngilizce transkript arayüzüne bağlıdır. YouTube değişiklikleri bu yolları etkileyebilir.
- Otomatik altyazılar, video açıklamaları ve yapay zekâ yanıtları hatalı veya eksik olabilir. Önemli bilgileri videodan ve güvenilir kaynaklardan doğrula.

## Sorun giderme

| Durum | Kontrol |
| --- | --- |
| Transkript bulunamıyor | Videoda altyazı olduğunu kontrol et; YouTube altyazılarını açıp panelde yeniden dene. |
| Shorts için geçici sekme açılıyor | Doğrudan altyazı okuma başarısız olduğunda TSAVY yedek yöntem olarak geçici bir normal video sekmesi açar. |
| Model listesi alınamıyor | API adresini ve gerekiyorsa anahtarı kontrol et. Sağlayıcı listeleme uç noktasını desteklemiyorsa model kimliğini elle gir. |
| Özet veya sohbet yanıtı gelmiyor | API adresini, modeli ve erişim iznini kontrol et. Uzun transkriptler veya sohbetler modelin bağlam sınırını aşabilir. |

## Proje yapısı

| Dosya | Görev |
| --- | --- |
| `manifest.json`, `background.js` | Eklenti izinleri, yan panel ve geçici Shorts sekmesinin yaşam döngüsü |
| `panel.html`, `panel.css`, `panel.js` | Panel arayüzü, video takibi ve transkript yükleme |
| `captions.js` | Video ve Shorts oynatıcısının altyazı isteği, `json3` satırları ve video bilgileri |
| `transcript.js` | Normal video ve geçici Shorts sekmesinde kullanılan yedek transkript okuyucusu |
| `update.js` | GitHub sürüm kontrolü ve güncelleme bildirimi |
| `ai.js` | API bağlantısı, ayarlar ve özetleme |
| `chat.js`, `chat.css`, `chat-motion.css` | Sohbet akışı, görünümü ve geçişleri |
| `disclosure.css`, `icons/` | Açılır bölüm stilleri ve eklenti simgeleri |

## Lisans

[MIT Lisansı](LICENSE). YouTube, Google LLC'nin markasıdır; TSAVY YouTube veya Google tarafından sunulmaz ya da desteklenmez.
