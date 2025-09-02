# PWA Liste Kontrol Uygulaması - Context Prompt

## Uygulama Genel Tanımı
Progressive Web App (PWA) mantığında, telefonda native app gibi çalışan bir liste kontrol uygulaması geliştirilecek. Android Studio kullanılmayacak, sadece HTML/CSS/JavaScript ile kodlanacak.

## Ana İşlevsellik

### 1. Dosya Yükleme
- Kullanıcı CSV veya Excel dosyası yükleyebilir
- Dosya içinde kod listesi bulunur
- Dosya yükleme sonrası ana kontrol ekranı açılır

### 2. Kod Arama ve Kontrol
- **Textbox özelliği**: Sadece numpad açılacak (mobilde numeric input)
- **Ön ek sistemi**: Sabit "LBL" ön eki kullanılır
- **Arama mantığı**: 
  - Kullanıcı sadece sayısal kısmı yazar (örn: "100011")
  - Sistem otomatik "LBL" ekleyip arar (örn: "LBL100011")
  - Büyük/küçük harf duyarsız arama (case-insensitive)
- **Görsel geri bildirim**:
  - **Bulunursa**: Tüm ekran 3 saniye yeşil renk
  - **Bulunmazsa**: Tüm ekran 3 saniye kırmızı renk
- **Bulunan kod işaretleme**: Bulunan kodların yanına "Bulundu" yazısı eklenir

### 3. Liste Görüntüleme
- İsteğe bağlı buton ile yüklenen liste Excel benzeri grid'de görüntülenebilir
- Hangi kodların bulunduğu/kontrol edildiği görülür

### 4. Rapor ve Paylaşım
- **"Kontrolü Tamamla" butonu**: Kontrol işlemini sonlandırır
- **Excel raporu oluşturma**: 
  - Sütunlar: Kod | Durum | Tarih
  - Kontrol edilen tüm kodları içerir
- **WhatsApp paylaşımı**: Oluşturulan Excel dosyası WhatsApp üzerinden paylaşılabilir

## Teknik Gereksinimler

### PWA Özellikleri
- Mobil uyumlu tasarım
- Offline çalışabilme
- Ana ekrana ekleme özelliği
- Native app benzeri deneyim

### UI/UX Gereksinimleri
- Modern, temiz tasarım
- Mobil-first yaklaşım
- Kolay kullanım
- Görsel geri bildirimler
- Hızlı performans

### Dosya İşleme
- CSV ve Excel dosya formatlarını destekleme
- Büyük dosyaları verimli işleme
- Hata yönetimi

### Teknoloji Stack
- HTML5, CSS3, JavaScript
- File API (dosya okuma)
- Web Workers (büyük dosyalar için)
- Service Worker (PWA özellikleri)
- SheetJS (Excel işleme)
- Web Share API (WhatsApp paylaşımı)

## Kullanım Senaryosu
1. Kullanıcı uygulamayı telefona yükler (PWA olarak)
2. CSV/Excel dosyasını yükler
3. Textbox'a kod numaralarını girer (sadece sayısal kısım)
4. Her arama sonrası yeşil/kırmızı geri bildirim alır
5. Bulunan kodlar işaretlenir
6. "Kontrolü Tamamla" butonuna basar
7. Excel raporu oluşur
8. WhatsApp'tan raporu paylaşır

## Önemli Notlar
- APK dosyası oluşturulmaz
- Web hosting üzerinden dağıtılır
- Kullanıcılar browser'dan "Ana ekrana ekle" ile yükler
- Cross-platform (Android + iOS) çalışır
- Güncelleme otomatik olur