import React from 'react';

// ── Gizlilik Politikası & Aydınlatma Metni ─────────────────────────────────────
export function PrivacyPolicy() {
  return (
    <LegalPage title="Gizlilik Politikası ve Aydınlatma Metni" lastUpdated="Haziran 2026">
      <Section title="1. Uygulama Geliştiricisi">
        <p>Bu uygulama, Yusuf Karamuk tarafından ev kullanımı, kişisel organizasyon ve eğitim amacıyla geliştirilmiştir.
        Kişisel verilerinizin gizliliğine önem veriyor ve uygulamamızı kullanırken sağladığınız bilgileri yalnızca uygulamanın temel işlevlerini yerine getirmek amacıyla koruyoruz.</p>
      </Section>

      <Section title="2. Toplanan Veriler">
        <ul>
          <li><strong>Hesap Bilgileri:</strong> Ad-soyad, e-posta adresi (kayıt sırasında)</li>
          <li><strong>İlaç Verileri:</strong> İlaç adı, etken maddeler, son kullanma tarihi, stok miktarı, etiketler, notlar</li>
          <li><strong>Teknik Veriler:</strong> Oturum bilgileri, tarayıcı türü (Firebase Analytics tarafından anonimleştirilmiş)</li>
        </ul>
      </Section>

      <Section title="3. Verilerin İşlenme Amacı">
        <ul>
          <li>Kişisel ilaç stoğunuzun takibi ve yönetimi</li>
          <li>Son kullanma tarihi uyarıları</li>
          <li>Aile üyeleriyle isteğe bağlı veri paylaşımı</li>
          <li>Hesap güvenliği ve kimlik doğrulama</li>
        </ul>
      </Section>

      <Section title="4. Verilerin Güvenliği">
        <p>İlaç adı, etken maddeler ve notlar gibi hassas veriler <strong>AES-256-GCM</strong> algoritmasıyla
        uçtan uca şifrelenerek saklanmaktadır. Şifreleme anahtarları yalnızca sizin cihazınızda bulunur;
        sunucularımız şifreli verilere erişemez. Paylaşım linkleri de aynı şekilde şifrelenir ve anahtar
        yalnızca URL içinde taşınır.</p>
      </Section>

      <Section title="5. Üçüncü Taraf Hizmetler">
        <p>Uygulama altyapısında Google Firebase kullanılmaktadır (Firebase Authentication, Firestore, Hosting).
        Google'ın gizlilik politikasına <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-600)] hover:underline">buradan</a> ulaşabilirsiniz.</p>
        <p>İlaç arama için TİTCK (Türkiye İlaç ve Tıbbi Cihaz Kurumu) kamuya açık veritabanı kullanılmaktadır.</p>
      </Section>

      <Section title="6. Veri Saklama ve Silme">
        <p>Hesabınızı sildiğinizde tüm kişisel verileriniz Firestore'dan kalıcı olarak silinir.
        Paylaşım linkleri 7 gün sonra otomatik olarak geçersiz hale gelir.</p>
      </Section>

      <Section title="7. Verileriniz Üzerindeki Kontrolünüz">
        <ul>
          <li>Hesabınızdaki tüm verileri görüntüleme ve dışa aktarma hakkı</li>
          <li>Kayıtlı ilaç bilgilerinizi düzenleme veya silme hakkı</li>
          <li>Hesabınızı tamamen silerek tüm verilerinizi sistemden kalıcı olarak temizleme hakkı</li>
        </ul>
        <p>Bu konularda veya uygulamayla ilgili diğer sorularınız için GitHub üzerinden iletişime geçebilirsiniz.</p>
      </Section>

      <Section title="8. Güvenlik İhlali Bildirimi">
        <p>Olası bir siber saldırı, veri sızıntısı veya güvenlik ihlali durumunda, durumun tespit edilmesinden itibaren en kısa sürede kayıtlı e-posta adresiniz üzerinden tarafınıza bildirim yapılacaktır.</p>
      </Section>
    </LegalPage>
  );
}

// ── Kullanım Koşulları ────────────────────────────────────────────────────────
export function TermsOfService() {
  return (
    <LegalPage title="Kullanım Koşulları ve Sorumluluk Reddi" lastUpdated="Haziran 2026">
      <Section title="1. Uygulamanın Amacı ve Kapsamı">
        <p>DrDepo uygulaması, kullanıcıların kişisel ilaç stoklarını takip edebilmeleri amacıyla
        tasarlanmış <strong>ev kullanımı ve eğitim amaçlı</strong> bir kişisel organizasyon aracıdır.
        Ticari bir sağlık hizmeti değildir.</p>
      </Section>

      <Section title="2. Tıbbi Tavsiye Değildir">
        <p className="font-semibold text-rose-700 dark:text-rose-400">⚠️ Bu uygulama bir sağlık hizmeti ya da tıbbi cihaz değildir.</p>
        <p>Sunulan hiçbir bilgi, ilaç bilgisi dahil, tıbbi tanı, tedavi tavsiyesi veya ilaç reçetesi
        yerine geçmez. İlaç kullanımına ilişkin her türlü karar için mutlaka bir hekim veya eczacıya danışınız.</p>
      </Section>

      <Section title="3. Sorumluluk Reddi">
        <p>Uygulama geliştirici(ler)i aşağıdaki durumlardan kaynaklanabilecek hiçbir doğrudan veya dolaylı
        zarardan hukuki açıdan sorumlu tutulamaz:</p>
        <ul>
          <li>Geç alınan, atlanan veya yanlış dozda kullanılan ilaçlar</li>
          <li>Son kullanma tarihi geçmiş ilaçların kullanımı</li>
          <li>Uygulama verilerindeki hatalar veya eksiklikler</li>
          <li>Teknik arızalar, sunucu kesintileri veya veri kayıpları</li>
          <li>TİTCK veritabanındaki güncel olmayan veya hatalı ilaç bilgileri</li>
        </ul>
      </Section>

      <Section title="4. Kullanıcı Yükümlülükleri">
        <ul>
          <li>Yalnızca kendi veya yetkili olduğunuz kişilerin ilaç bilgilerini girebilirsiniz</li>
          <li>Sistemi kötüye kullanmamayı, spam veya zararlı içerik göndermemeyi kabul edersiniz</li>
          <li>Hesap güvenliğinizden siz sorumlusunuz</li>
          <li>18 yaşından büyük olduğunuzu beyan edersiniz</li>
        </ul>
      </Section>

      <Section title="5. TİTCK Veri Kaynağı">
        <p>İlaç arama özelliğinde kullanılan veriler TİTCK'ın (Türkiye İlaç ve Tıbbi Cihaz Kurumu)
        kamuya açık veritabanından alınmaktadır. Veriler periyodik olarak güncellenmekle birlikte,
        anlık doğruluk için ilgili kurumun resmi kaynaklarına başvurmanız önerilir.</p>
      </Section>

      <Section title="6. Hizmet Değişiklikleri">
        <p>Geliştirici(ler), herhangi bir bildirim yapmaksızın uygulamayı değiştirme, kısıtlama veya
        sonlandırma hakkını saklı tutar. Bu uygulama, herhangi bir süreklilik garantisi verilmeden sunulmaktadır.</p>
      </Section>

      <Section title="7. Geçerli Hukuk">
        <p>Bu kullanım koşulları Türkiye Cumhuriyeti yasalarına tabidir. Olası uyuşmazlıklarda Türkiye
        mahkemeleri yetkilidir.</p>
      </Section>
    </LegalPage>
  );
}

// ── Ortak Sayfa Bileşenleri ───────────────────────────────────────────────────
function LegalPage({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Geri */}
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
          className="mb-6 flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
          </svg>
          Geri Dön
        </button>

        <h1 className="text-[26px] font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h1>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-8">Son güncelleme: {lastUpdated}</p>

        <div className="space-y-6">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-[12px] text-slate-400 dark:text-slate-500">
          <p>DrDepo · Ev kullanımı ve eğitim amaçlıdır</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="/gizlilik" className="hover:underline hover:text-slate-600 dark:hover:text-slate-300">Gizlilik Politikası</a>
            <a href="/kosullar" className="hover:underline hover:text-slate-600 dark:hover:text-slate-300">Kullanım Koşulları</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h2>
      <div className="text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
