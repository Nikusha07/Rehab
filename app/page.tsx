import Image from "next/image";
import BookingWizard from "@/components/BookingWizard";
import Header from "@/components/Header";
import { SITE } from "@/lib/config";

const services = [
  { icon: "01", title: "სარეაბილიტაციო კონსულტაცია", text: "მდგომარეობის შეფასება, ინდივიდუალური მიზნების განსაზღვრა და პერსონალური სარეაბილიტაციო გეგმა." },
  { icon: "02", title: "სამკურნალო ფიზკულტურა", text: "ფუნქციური მოძრაობის, ძალის, ბალანსისა და ყოველდღიური აქტივობის გაუმჯობესებაზე ორიენტირებული ვარჯიში." },
  { icon: "03", title: "ფიზიკური რეაბილიტაცია", text: "ტრავმის, ოპერაციის ან ხანგრძლივი უმოძრაობის შემდეგ უსაფრთხო და ეტაპობრივი აღდგენის პროგრამა." },
  { icon: "04", title: "მობილობის აღდგენა", text: "სახსრების მოძრაობის დიაპაზონის, კოორდინაციისა და დამოუკიდებელი გადაადგილების გაუმჯობესება." },
  { icon: "05", title: "ტკივილის მართვა", text: "ტკივილის შემცირებისკენ მიმართული ინდივიდუალური თერაპიული მიდგომები და მოძრაობის კორექცია." },
  { icon: "06", title: "ინდივიდუალური პროგრამა", text: "პაციენტის საჭიროებებზე, ასაკსა და ფუნქციურ მდგომარეობაზე მორგებული რეაბილიტაციის პროცესი." },
];

export default function HomePage() {
  const phoneDisplay = SITE.phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  return (
    <main id="top">
      <Header />

      <section className="hero-section">
        <div className="hero-glow one" /><div className="hero-glow two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><i /> პროფესიული ზრუნვა ყოველდღიური მოძრაობისთვის</span>
            <h1>აღდგენა იწყება <span>სწორი მოძრაობით.</span></h1>
            <p>{SITE.tagline}. ინდივიდუალური მიდგომა, პროფესიული გუნდი და მარტივი ონლაინ ჩაწერა ერთ სივრცეში.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#booking">ვიზიტზე ჩაწერა <span>→</span></a>
              <a className="button button-ghost" href="#services">სერვისების ნახვა</a>
            </div>
            <div className="trust-row">
              <div><b>ინდივიდუალური</b><small>მკურნალობის გეგმა</small></div>
              <div><b>მარტივი</b><small>ონლაინ ჩაწერა</small></div>
              <div><b>უსაფრთხო</b><small>დროის რეალური შემოწმება</small></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo"><Image src="/rehab-hero.jpg" alt="ფიზიკური რეაბილიტაცია" fill sizes="(max-width: 900px) 100vw, 48vw" priority /></div>
            <div className="hero-badge badge-top"><span className="badge-icon">✓</span><div><b>ონლაინ ჩაწერა</b><small>აირჩიეთ თავისუფალი დრო</small></div></div>
            <div className="hero-badge badge-bottom"><span className="pulse-dot" /><div><b>გრაფიკი რეალურ დროში</b><small>დაკავებული დრო ავტომატურად იბლოკება</small></div></div>
          </div>
        </div>
      </section>

      <section className="quick-strip">
        <div className="container quick-grid">
          <div><span>⌖</span><p><small>მისამართი</small><b>{SITE.address}</b></p></div>
          <div><span>◷</span><p><small>სამუშაო საათები</small><b>{SITE.hours}</b></p></div>
          <div><span>☎</span><p><small>დაგვიკავშირდით</small><b>{phoneDisplay}</b></p></div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <div className="section-heading split-heading">
            <div><span className="eyebrow green">ჩვენი მიმართულებები</span><h2>რეაბილიტაცია, რომელიც თქვენს მიზნებს ერგება</h2></div>
            <p>მკურნალობის გეგმა იქმნება ინდივიდუალურად — შეფასებიდან ყოველდღიურ აქტივობაში უსაფრთხო დაბრუნებამდე.</p>
          </div>
          <div className="service-grid">{services.map((item) => <article className="service-card" key={item.icon}><span className="service-index">{item.icon}</span><h3>{item.title}</h3><p>{item.text}</p><a href="#booking">ჩაწერა <span>↗</span></a></article>)}</div>
        </div>
      </section>

      <section className="section soft-section" id="about">
        <div className="container about-grid">
          <div className="about-visual">
            <div className="about-photo main"><Image src="/therapy.jpg" alt="რეაბილიტაციის პროცესი" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
            <div className="about-photo small"><Image src="/rehab-room.jpg" alt="სარეაბილიტაციო სივრცე" fill sizes="280px" /></div>
            <div className="about-stamp"><b>ზრუნვა</b><span>•</span><small>მოძრაობა • პროგრესი</small></div>
          </div>
          <div className="about-copy">
            <span className="eyebrow green">ჩვენ შესახებ</span>
            <h2>ფოკუსი არა მხოლოდ სიმპტომზე — არამედ ფუნქციის დაბრუნებაზე</h2>
            <p>ჩვენი მიზანია რეაბილიტაციის პროცესი იყოს გასაგები, თანმიმდევრული და რეალურ ყოველდღიურ შედეგზე ორიენტირებული. თითოეული პაციენტის გეგმა ეფუძნება მის მდგომარეობას, შესაძლებლობებსა და მიზნებს.</p>
            <ul className="check-list"><li><span>✓</span> ინდივიდუალური შეფასება და გეგმა</li><li><span>✓</span> პროგრესის ეტაპობრივი კონტროლი</li><li><span>✓</span> უსაფრთხო და ადაპტირებული დატვირთვა</li><li><span>✓</span> მარტივი ვიზიტების მართვა</li></ul>
            <a className="text-link" href="#booking">აირჩიეთ თქვენთვის მოსახერხებელი დრო <span>→</span></a>
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container">
          <div className="section-heading centered"><span className="eyebrow green">როგორ მუშაობს</span><h2>ჩაწერა რამდენიმე მარტივ ნაბიჯში</h2><p>აღარ არის საჭირო თავისუფალი დროის ტელეფონით დაზუსტება — სისტემა გაჩვენებთ მხოლოდ რეალურად ხელმისაწვდომ სლოტებს.</p></div>
          <div className="process-grid">
            <div className="process-card"><span>1</span><h3>აირჩიეთ სერვისი</h3><p>მიუთითეთ სასურველი მომსახურება და სპეციალისტი.</p></div>
            <div className="process-card"><span>2</span><h3>ნახეთ თავისუფალი დრო</h3><p>აირჩიეთ თარიღი და სისტემა ავტომატურად გაჩვენებთ თავისუფალ საათებს.</p></div>
            <div className="process-card"><span>3</span><h3>დაადასტურეთ ვიზიტი</h3><p>შეავსეთ სახელი და ტელეფონი — მიიღებთ დადასტურების კოდს.</p></div>
          </div>
        </div>
      </section>

      <section className="booking-section" id="booking">
        <div className="container booking-layout">
          <div className="booking-intro">
            <span className="eyebrow light">ონლაინ ჩაწერა</span><h2>დაჯავშნეთ ვიზიტი თქვენთვის მოსახერხებელ დროს</h2><p>აირჩიეთ მომსახურება, სპეციალისტი და თარიღი. სისტემა რეალურ დროში ამოწმებს თავისუფალ დროს და თავიდან გვარიდებს ორმაგ ჯავშანს.</p>
            <div className="booking-points"><div><span>01</span><p><b>მხოლოდ თავისუფალი დროები</b><small>დაკავებული სლოტები ავტომატურად იბლოკება.</small></p></div><div><span>02</span><p><b>დადასტურების კოდი</b><small>წარმატებული ჩაწერის შემდეგ მიიღებთ უნიკალურ კოდს.</small></p></div><div><span>03</span><p><b>SMS ინტეგრაციისთვის მზადაა</b><small>GoSMS-ის გასაღების დამატების შემდეგ შეტყობინება ავტომატურად გაიგზავნება.</small></p></div></div>
          </div>
          <div className="booking-shell"><BookingWizard /></div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact-card">
          <div><span className="eyebrow green">კონტაქტი</span><h2>კითხვა გაქვთ ვიზიტამდე?</h2><p>დაგვიკავშირდით სამუშაო საათებში ან გამოიყენეთ ონლაინ ჩაწერის ფორმა.</p></div>
          <div className="contact-actions"><a className="contact-pill" href={`tel:${SITE.phone}`}><small>ტელეფონი</small><b>{phoneDisplay}</b></a><div className="contact-pill"><small>მისამართი</small><b>{SITE.address}</b></div></div>
        </div>
      </section>

      <footer className="footer"><div className="container footer-inner"><div className="footer-brand"><Image src="/logo-symbol.png" alt="" width={48} height={56} /><p><b>{SITE.name}</b><small>{SITE.tagline}</small></p></div><span>© {new Date().getFullYear()} ყველა უფლება დაცულია.</span><a href="/admin/login">ადმინისტრაცია</a></div></footer>
      <a className="mobile-booking-cta" href="#booking">ვიზიტზე ჩაწერა <span>→</span></a>
    </main>
  );
}
