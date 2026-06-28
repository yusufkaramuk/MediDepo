import React from 'react';
import { X } from 'lucide-react';

const LAST_UPDATED = '10 Mayıs 2026';
const APP_NAME = 'İlaç Takip Sistemi';
const CONTACT_EMAIL = 'info@yusufkaramuk.com.tr';
const APP_URL = 'https://ilac-stok-takip.web.app';

export const PrivacyModal = ({ onClose }) => (
  <LegalModal title="Gizlilik Politikası" onClose={onClose}>
    <p className="text-[12px] text-slate-400 mb-6">Son güncelleme: {LAST_UPDATED}</p>

    <Section title="1. Veri Sorumlusu">
      <p>{APP_NAME} uygulaması ("Uygulama"), kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel Veri Koruma Yönetmeliği (GDPR) kapsamında işlemektedir. Veri sorumlusuna <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--brand-600)] underline">{CONTACT_EMAIL}</a> adresi üzerinden ulaşabilirsiniz.</p>
    </Section>

    <Section title="2. Toplanan Veriler">
      <p>Uygulama aşağıdaki kişisel verileri işlemektedir:</p>
      <ul>
        <li><strong>Kimlik verileri:</strong> Ad-soyad, e-posta adresi (hesap oluştururken)</li>
        <li><strong>Sağlık verileri:</strong> Girdiğiniz ilaç adları, etken maddeler, son kullanma tarihleri, notlar</li>
        <li><strong>Kullanım verileri:</strong> Uygulama içi işlem geçmişi (ilaç ekleme, düzenleme, kullanım kaydı)</li>
        <li><strong>Teknik veriler:</strong> Cihaz tipi, tarayıcı türü, IP adresi (Firebase Analytics altyapısı aracılığıyla)</li>
      </ul>
      <p className="mt-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-[12.5px]">
        ⚠️ Girdiğiniz ilaç bilgileri KVKK kapsamında <strong>özel nitelikli kişisel veri</strong> (sağlık verisi) sayılmaktadır. Bu veriler açık rızanız olmaksızın üçüncü taraflarla paylaşılmaz.
      </p>
    </Section>

    <Section title="3. Verilerin İşlenme Amaçları">
      <ul>
        <li>Uygulama hizmetinin sunulması ve ilaç takip özelliklerinin çalıştırılması</li>
        <li>Hesap kimlik doğrulaması ve güvenliğinin sağlanması</li>
        <li>Son kullanma tarihi bildirimlerinin gönderilmesi</li>
        <li>Aile paylaşım özelliğinin yönetilmesi</li>
        <li>Teknik hataların tespit edilmesi ve giderilmesi</li>
      </ul>
    </Section>

    <Section title="4. Hukuki Dayanak">
      <p>Verileriniz aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir:</p>
      <ul>
        <li><strong>Açık rıza (KVKK m.5/1):</strong> Sağlık verileri dahil özel nitelikli veriler için</li>
        <li><strong>Sözleşmenin ifası (KVKK m.5/2-c):</strong> Hesap ve uygulama hizmetleri için</li>
        <li><strong>Meşru menfaat (KVKK m.5/2-f):</strong> Güvenlik ve hata izleme için</li>
      </ul>
    </Section>

    <Section title="5. Verilerin Saklanması ve Güvenliği">
      <ul>
        <li>Verileriniz Google Firebase altyapısında, AES-256-GCM şifreleme ile korunarak saklanır</li>
        <li>Bulut senkronizasyonu seçeneğini kullanmıyorsanız veriler yalnızca cihazınızda yerel olarak tutulur</li>
        <li>Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir</li>
        <li>Verileriniz Avrupa Ekonomik Alanı (EEA) içindeki Firebase sunucularında işlenebilir</li>
      </ul>
    </Section>

    <Section title="6. Üçüncü Taraflarla Paylaşım">
      <p>Kişisel verileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
      <ul>
        <li><strong>Firebase (Google LLC):</strong> Kimlik doğrulama, veritabanı ve barındırma hizmeti</li>
        <li><strong>Yasal zorunluluk:</strong> Yetkili kamu kurum ve kuruluşlarının talepleri</li>
        <li><strong>Aile paylaşımı:</strong> Yalnızca sizin davet ettiğiniz aile üyeleri, izin verdiğiniz ilaç bilgilerini görebilir</li>
      </ul>
    </Section>

    <Section title="7. Haklarınız">
      <p>KVKK m.11 ve GDPR m.15-22 kapsamında aşağıdaki haklara sahipsiniz:</p>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>Verilerinize erişim ve kopyasını talep etme</li>
        <li>Hatalı verilerin düzeltilmesini isteme</li>
        <li>Verilerinizin silinmesini talep etme ("unutulma hakkı")</li>
        <li>Veri işlemeye itiraz etme</li>
        <li>Veri taşınabilirliği talep etme</li>
      </ul>
      <p className="mt-2">Bu haklarınızı kullanmak için <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--brand-600)] underline">{CONTACT_EMAIL}</a> adresine başvurabilirsiniz. Talepleriniz en geç <strong>30 gün</strong> içinde yanıtlanır.</p>
    </Section>

    <Section title="8. Çerezler">
      <p>Uygulama yalnızca işlevsel çerezler (oturum yönetimi) kullanmaktadır. Pazarlama veya takip amaçlı çerez kullanılmamaktadır.</p>
    </Section>

    <Section title="9. Değişiklikler">
      <p>Bu politika değiştirildiğinde güncel versiyon {APP_URL} adresinde yayımlanır. Önemli değişikliklerde kayıtlı kullanıcılara e-posta ile bildirim gönderilir.</p>
    </Section>

    <Section title="10. Şikayet">
      <p>Kişisel veri işleme faaliyetlerimize ilişkin şikayetlerinizi <strong>Kişisel Verileri Koruma Kurumu'na (KVKK)</strong> iletebilirsiniz: <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-600)] underline">www.kvkk.gov.tr</a></p>
    </Section>
  </LegalModal>
);

export const TermsModal = ({ onClose }) => (
  <LegalModal title="Kullanım Koşulları" onClose={onClose}>
    <p className="text-[12px] text-slate-400 mb-6">Son güncelleme: {LAST_UPDATED}</p>

    <Section title="1. Taraflar ve Kabul">
      <p>{APP_NAME} ("Uygulama") hizmetini kullanan kişi ("Kullanıcı"), işbu Kullanım Koşullarını ("Koşullar") okuduğunu ve tüm hükümleri kabul ettiğini beyan eder. Uygulamayı kullanmaya devam etmeniz bu koşulları kabul ettiğiniz anlamına gelir.</p>
    </Section>

    <Section title="2. Hizmetin Tanımı">
      <p>{APP_NAME}, kullanıcıların evdeki ilaçlarını dijital ortamda takip etmelerini sağlayan bir web uygulamasıdır. Uygulama şu hizmetleri sunar:</p>
      <ul>
        <li>İlaç stok ve son kullanma tarihi takibi</li>
        <li>Son kullanma tarihi bildirimleri</li>
        <li>Aile üyeleriyle ilaç listesi paylaşımı</li>
        <li>İlaç verilerinin şifreli bulut yedeklemesi</li>
      </ul>
    </Section>

    <Section title="3. Tıbbi Uyarı (Önemli)">
      <p className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
        ⚠️ <strong>{APP_NAME} bir tıbbi uygulama değildir.</strong> Uygulama içeriği hiçbir koşulda tıbbi tavsiye, teşhis veya tedavi yerine geçmez. İlaç kullanımı, dozu veya kesilmesi konusunda mutlaka bir sağlık profesyoneline danışınız. Uygulama yalnızca <strong>kişisel ilaç stok yönetimi</strong> amacıyla tasarlanmıştır.
      </p>
    </Section>

    <Section title="4. Kullanıcı Yükümlülükleri">
      <p>Kullanıcı aşağıdaki yükümlülükleri kabul eder:</p>
      <ul>
        <li>Uygulamayı yalnızca yasal amaçlar için kullanmak</li>
        <li>Gerçek ve doğru bilgi girmek</li>
        <li>Hesap güvenliğini sağlamak; şifresini üçüncü kişilerle paylaşmamak</li>
        <li>Uygulamayı başkalarına zarar verecek şekilde kullanmamak</li>
        <li>Sisteme yetkisiz erişim denemesinde bulunmamak</li>
        <li>Uygulamanın kaynak kodunu izinsiz kopyalamamak veya dağıtmamak</li>
      </ul>
    </Section>

    <Section title="5. Hesap ve Veri Sorumluluğu">
      <ul>
        <li>Hesabınıza girilen tüm verilerden siz sorumlusunuz</li>
        <li>Hesap bilgilerinizin güvenliğini sağlamak sizin sorumluluğunuzdadır</li>
        <li>Aile paylaşım özelliğini kullanarak davet ettiğiniz kişilerin verilere erişiminden siz sorumlusunuz</li>
        <li>Yerel depolama seçeneğinde verilerinizin yedeklenmesi kullanıcıya aittir</li>
      </ul>
    </Section>

    <Section title="6. Hizmet Sürekliliği">
      <ul>
        <li>Uygulama "olduğu gibi" sunulmakta olup %100 kesintisiz hizmet garantisi verilmemektedir</li>
        <li>Bakım, güncelleme veya teknik sebepler nedeniyle hizmet geçici olarak kesilebilir</li>
        <li>Veri kaybı riskine karşı kullanıcıların düzenli yedek alması önerilir</li>
      </ul>
    </Section>

    <Section title="7. Sorumluluk Sınırlaması">
      <p>Yürürlükteki mevzuatın izin verdiği azami ölçüde:</p>
      <ul>
        <li>Uygulamanın kullanımından doğabilecek dolaylı zararlardan sorumluluk kabul edilmez</li>
        <li>Hatalı ilaç bilgisi girişinden kaynaklanan sonuçlardan sorumluluk kabul edilmez</li>
        <li>Üçüncü taraf hizmetlerinin (Firebase vb.) kesintilerinden doğan zararlardan sorumluluk kabul edilmez</li>
      </ul>
    </Section>

    <Section title="8. Fikri Mülkiyet">
      <p>Uygulamanın tasarımı, kodu, logosu ve içeriği telif hukuku kapsamında koruma altındadır. Kullanıcılar yalnızca kişisel kullanım amacıyla uygulamaya erişim hakkına sahip olup ticari amaçla kullanım, kopyalama veya dağıtım yasaktır.</p>
    </Section>

    <Section title="9. Hesap Sonlandırma">
      <ul>
        <li>Kullanıcı dilediği zaman hesabını silebilir; tüm veriler kalıcı olarak silinir</li>
        <li>Bu Koşulların ihlali halinde hesap önceden bildirim yapılmaksızın askıya alınabilir</li>
      </ul>
    </Section>

    <Section title="10. Uygulanacak Hukuk ve Yetki">
      <p>İşbu Koşullar <strong>Türkiye Cumhuriyeti hukuku</strong>na tabidir. Uyuşmazlıklarda <strong>Türkiye mahkemeleri</strong> yetkilidir.</p>
    </Section>

    <Section title="11. Değişiklikler">
      <p>Bu Koşullar zaman zaman güncellenebilir. Değişiklikler {APP_URL} adresinde yayımlandığı tarihte yürürlüğe girer. Uygulamayı kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz anlamına gelir.</p>
    </Section>

    <Section title="12. İletişim">
      <p>Kullanım Koşullarına ilişkin sorularınız için: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--brand-600)] underline">{CONTACT_EMAIL}</a></p>
    </Section>
  </LegalModal>
);

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
    <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
      {children}
    </div>
  </div>
);

const LegalModal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
    <div className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <h2 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X size={18}/>
        </button>
      </div>
      {/* Content */}
      <div className="overflow-y-auto px-6 py-5 flex-1">
        {children}
      </div>
    </div>
  </div>
);
