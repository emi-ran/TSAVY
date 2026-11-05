# TSAVY

YouTube videolarının transkriptini gösteren, OpenAI uyumlu bir API ile isteğe bağlı özetleyen ve video hakkında sohbet sunan Chrome eklentisi.

## Kurulum

1. Chrome'da `chrome://extensions` adresini aç ve **Geliştirici modu**nu etkinleştir.
2. **Paketlenmemiş öğe yükle** seçeneğiyle bu klasörü seç.
3. Bir YouTube video sayfası aç ve araç çubuğundaki TSAVY simgesine tıkla. Gerekirse eklentiyi yapboz menüsünden sabitle.

Panel etkin sekme veya video değiştiğinde yeniden yüklenir. Yenile düğmesi elle tekrar denemeyi sağlar.
Birbiriyle çakışan yüklemelerde yalnızca en son isteğin sonucu gösterilir.


Dosyalar güncellendikten sonra `chrome://extensions` sayfasında TSAVY kartındaki yenile simgesine tıkla; ardından YouTube sekmesini yenileyip paneli tekrar aç.

## Yapay zekâ ile özetleme

1. Panelde **API ayarları**nı aç. Sağlayıcının OpenAI uyumlu temel adresini gir (ör. `https://api.example.com/v1`; sonuna `/chat/completions` ekleme).
2. API anahtarını gir. Yerel, kimlik doğrulaması gerektirmeyen bir sunucuda boş bırakabilirsin. Uzak adresler HTTPS kullanmalıdır; HTTP yalnızca localhost için kabul edilir.
3. **Listele** ile destekleniyorsa modelleri getirip seç veya model kimliğini elle gir. **Kaydet**e bas ve Chrome'un ilgili API adresine erişim iznini onayla.
4. Transkript yüklendikten sonra **Videoyu özetle**ye bas. Model listesi alınamasa da elle girilmiş model ile özetleme denenebilir.

Özet kısa bir ana fikir ve en fazla üç önemli madde isteyecek şekilde hazırlanır; uzunluk ve doğruluk modelin yanıtına bağlıdır. Özette transkriptte bulunan bir zaman damgasına tıklayarak aynı videonun ilgili anına gidebilirsin. Reklam sırasında atlama yapılamaz. Altyazıların tamamını görmek için **Altyazılar** bölümünü aç.

Tamamlanan özetler panel açıkken sekme ve video bazında bellekte tutulur; başka sekmeye geçip dönünce yeniden gösterilir. Panel kapatıldığında bu bellek silinir.

Eklenti transkripti okumak için YouTube'un konuşma metni panelini açarsa işlemden sonra kapatır; önceden açık olan paneli açık bırakır. Model listesi açıldığında yazarak filtreleyebilir, ok tuşları ve Enter ile seçim yapabilir veya model adını elle girebilirsin.

## Video hakkında sohbet

Transkript yüklendikten ve API ayarlandıktan sonra **Merak ettiğini sor** alanına soru yaz. Enter gönderir, Shift+Enter yeni satır ekler. Modelden varsayılan olarak kısa yanıt istenir; daha ayrıntılı anlatmasını ayrıca isteyebilirsin. Her istekte video başlığı ve bağlantısı, kanal adı ve bağlantısı, video açıklaması, tam transkript ve mevcut sohbetin başarılı soru ve yanıtları seçilen API'ye gönderilir. Alınamayan bilgiler eksik olarak belirtilir. Yanıtların uzunluğu ve doğruluğu modele bağlıdır.

Gönderilen soru hemen görünür; yanıt beklenirken hareketli bir durum göstergesi çıkar. İstek başarısız olursa soru yeniden denemen için giriş alanına geri konur. Azaltılmış hareket tercihi desteklenir.

Sohbet panel açıkken bellekte tutulur; farklı sekme veya videoya geçince, panel kapanınca ya da **Temizle** ile silinir. Aynı videonun altyazılarını yenilemek sohbeti korur. Uzun konuşmalar ve transkriptler modelin bağlam sınırını aşabilir.

API, `GET /models` ve `POST /chat/completions` için OpenAI uyumlu JSON ve gerektiğinde Bearer anahtarı kullanmalıdır. Sağlayıcıların API uyumluluğu değişebilir. Transkript tek istekte gönderilir; uzun videolar modelin bağlam sınırını aşabilir ve sağlayıcı kullanım ücreti uygulayabilir.

API adresi, model ve anahtar Chrome'un yerel eklenti depolamasında şifrelenmeden saklanır; cihaza veya tarayıcı profiline erişimi olan kişiler anahtara erişebilir. **Bağlantıyı sil** kayıtlı bilgileri kaldırır. Özet isteğinde de video başlığı ve bağlantısı, kanal adı ve bağlantısı, açıklama ve transkript seçtiğin sağlayıcıya gönderilir; sağlayıcının gizlilik politikasını değerlendir. Video bağlantısı yalnızca video kimliğinden oluşturulur.

## Sınırlar ve gizlilik

Eklenti yalnızca `www.youtube.com/watch` sayfalarında çalışır ve YouTube'un video açıklamasını genişletip kendi transkript panelini açabilir. YouTube'un sağladığı seçili dildeki transkripti okur; transkripti olmayan veya YouTube'un erişim sunmadığı videoları yazıya dökmez. Transkript düğmesi şu an Türkçe ve İngilizce arayüzlerde aranır. YouTube arayüzündeki değişiklikler bu yöntemi bozabilir. Transkript yalnızca özetleme veya sohbet isteği üzerine seçilen API'ye gönderilir; eklenti transkripti kalıcı olarak saklamaz.
