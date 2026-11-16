import type { Metadata } from "next";
import Image from "next/image";
import BookingWizard from "@/components/BookingWizard";
import styles from "./center.module.css";
import PublicHeader from "@/components/PublicHeader";
import { getSiteConfig } from "@/lib/site";
import { dbConnect } from "@/lib/db";
import Service from "@/models/Service";
import Specialist from "@/models/Specialist";

export const metadata: Metadata = { alternates: { canonical: "https://rehasackhere.ge/" } };

export const dynamic = "force-dynamic";

const fallbackServices = [
  { icon: "01", title: "სარეაბილიტაციო კონსულტაცია", text: "მდგომარეობის შეფასება, ინდივიდუალური მიზნების განსაზღვრა და პერსონალური სარეაბილიტაციო გეგმა." },
  { icon: "02", title: "სამკურნალო ფიზკულტურა", text: "ფუნქციური მოძრაობის, ძალის, ბალანსისა და ყოველდღიური აქტივობის გაუმჯობესებაზე ორიენტირებული ვარჯიში." },
  { icon: "03", title: "ფიზიკური რეაბილიტაცია", text: "ტრავმის, ოპერაციის ან ხანგრძლივი უმოძრაობის შემდეგ უსაფრთხო და ეტაპობრივი აღდგენის პროგრამა." },
];

export default async function HomePage() {
  const site = await getSiteConfig();
  const preview = process.env.VERCEL_ENV === "preview";
  let services = fallbackServices;
  let specialists: any[] = [];

  try {
    if (!preview || process.env.MONGODB_URI) await dbConnect();
    else throw new Error("Preview database is not configured");
    const [serviceDocs, specialistDocs] = await Promise.all([
      Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      Specialist.find({ isActive: true, showOnWebsite: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    if (serviceDocs.length) {
      services = serviceDocs.map((x: any, i: number) => ({
        icon: String(i + 1).padStart(2, "0"),
        title: x.name,
        text: x.description || `${x.durationMinutes || 30}-წუთიანი ინდივიდუალური სარეაბილიტაციო მომსახურება.`,
      }));
    }

    specialists = specialistDocs as any[];
  } catch {}

  const origin = "https://rehasackhere.ge";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": origin + "/#website", url: origin + "/", name: "Reha Sachkhere", alternateName: ["რეაბილიტაციის ცენტრი საჩხერეში", "rehasackhere"], inLanguage: "ka", publisher: { "@id": origin + "/#center" } },
      { "@type": "MedicalClinic", "@id": origin + "/#center", name: site.centerName, alternateName: ["Reha Sachkhere", "rehasackhere"], url: origin + "/", logo: { "@type": "ImageObject", url: origin + "/icon.png", width: 512, height: 512 }, image: origin + "/center/rehab8.jpg", description: "სამკურნალო ფიზკულტურისა და რეაბილიტაციის ცენტრი საჩხერეში. ონლაინ ჩაწერა ვიზიტზე.", telephone: site.phone.startsWith("+") ? site.phone : "+995" + site.phone, address: { "@type": "PostalAddress", addressLocality: "საჩხერე", addressCountry: "GE", streetAddress: site.address }, sameAs: [site.facebook, site.instagram].filter(value => /^https?:\/\//.test(value)) },
    ],
  };

  const phoneDisplay = site.phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  const mapQuery = encodeURIComponent(site.mapQuery || site.address);
  const whatsappHref = site.whatsapp
    ? site.whatsapp.startsWith("http")
      ? site.whatsapp
      : `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`
    : "";


  const photos = [
    [3, "მოსაცდელი"],
    [4, "თერაპიის კაბინეტი"],
    [6, "სავარჯიშო დარბაზი"],
    [2, "მისაღები"],
    [5, "პროცედურების კაბინეტი"],
    [7, "ბალანსისა და მოძრაობის სივრცე"],
    [8, "სამკურნალო ვარჯიშის სივრცე"],
  ] as const;
  const maps = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const hours = site.hours;
  const phone = `tel:${site.phone}`;

  return (
    <main id="top" className={styles.site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <PublicHeader />

      <section className={styles.hero}>
        <div className={styles.wrap + " " + styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>საჩხერე, საქართველო</p>
            <h1>მოძრაობის<br />აღდგენა<br /><em>იწყება აქ.</em></h1>
            <p className={styles.lede}>სამკურნალო ფიზკულტურა და ფიზიკური რეაბილიტაცია. პირველ ვიზიტზე შევაფასებთ თქვენს მდგომარეობას და ერთად დავგეგმავთ შემდეგ ნაბიჯებს.</p>
            <div className={styles.actions}>
              <a className={styles.primary} href="#booking">ვიზიტზე ჩაწერა <span aria-hidden="true">↗</span></a>
              <a className={styles.textLink} href="#services">მომსახურება <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <figure className={styles.heroPhoto}>
            <Image src="/center/rehab8.jpg" alt="ცენტრის სავარჯიშო სივრცე, სამკურნალო ბურთები და აღჭურვილობა" fill sizes="(max-width: 760px) 100vw, 55vw" preload />
            <figcaption><span>Reha Sachkhere</span><a href="#gallery">დაათვალიერეთ სივრცე ↘</a></figcaption>
          </figure>
        </div>
      </section>

      <div className={styles.contactBar}>
        <div className={styles.wrap + " " + styles.barGrid}>
          <a href={maps} target="_blank" rel="noreferrer"><small>მისამართი</small><strong>{site.address} ↗</strong></a>
          <div><small>სამუშაო საათები</small><strong>{hours}</strong></div>
          <a href={phone}><small>დაგვირეკეთ</small><strong>{phoneDisplay} ↗</strong></a>
        </div>
      </div>

      <section className={styles.section} id="services">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}><div><p className={styles.kicker}>მომსახურება</p><h2>რით შეგვიძლია<br />დაგეხმაროთ</h2></div><p>თუ არ იცით, რომელი მომსახურებით დაიწყოთ, ჩაიწერეთ პირველად კონსულტაციაზე.</p></div>
          <div className={styles.serviceGrid}>
            {services.map((item) => (
              <article className={styles.service} key={item.icon}>
                <h3>{item.title}</h3><p>{item.text}</p>
                <a href="#booking" aria-label={item.title + " — ვიზიტზე ჩაწერა"}>ჩაწერა <span aria-hidden="true">↗</span></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.about} id="about">
        <div className={styles.wrap + " " + styles.aboutGrid}>
          <div className={styles.aboutPhoto}><Image src="/center/rehab4.jpg" alt="თერაპიის კაბინეტი ცენტრში" fill sizes="(max-width: 760px) 100vw, 50vw" /></div>
          <div className={styles.aboutCopy}><p className={styles.kicker}>პირველი ვიზიტი</p><h2>რისგან იწყება რეაბილიტაცია?</h2>
            <p>სპეციალისტს გაესაუბრებით იმაზე, რა გიჭირთ ყოველდღიურ მოძრაობაში და რისი აღდგენა გსურთ. შეფასების შემდეგ ერთად შეარჩევთ თქვენზე მორგებულ ვარჯიშებსა და დატვირთვას.</p>
            <a className={styles.textLink} href="#booking">დაგეგმეთ პირველი ვიზიტი ↗</a>
          </div>
        </div>
      </section>

      {specialists.length > 0 && <section className={styles.section} id="team">
        <div className={styles.wrap}>
          <p className={styles.kicker}>ჩვენი გუნდი</p><h2>გაიცანით სპეციალისტები</h2>
          <div className={styles.teamGrid}>{specialists.map((person) => (
            <article className={styles.person} key={String(person._id)}>
              {person.image ? <img src={person.image} alt={person.name} loading="lazy" /> : <Image src="/logo-symbol.png" alt="" width={76} height={76} />}
              <div><h3>{person.name}</h3><p>{person.title || "რეაბილიტაციის სპეციალისტი"}</p>{person.bio && <p>{person.bio}</p>}</div>
            </article>
          ))}</div>
        </div>
      </section>}

      <section className={styles.section + " " + styles.gallerySection} id="gallery">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}><div><p className={styles.kicker}>ცენტრის ფოტოები</p><h2>გაიცანით ჩვენი სივრცე</h2></div><p>მისაღები, თერაპიის კაბინეტები და სამკურნალო ვარჯიშის დარბაზი.</p></div>
          <div className={styles.gallery}>{photos.map(([id, caption]) => (
            <figure key={id}><a className={styles.galleryImage} href={`/center/rehab${id}.jpg`} target="_blank" rel="noreferrer" aria-label={caption + " — სრული ფოტო"}>
              <Image src={`/center/rehab${id}.jpg`} alt={caption} fill sizes="(max-width: 480px) 50vw, (max-width: 760px) 45vw, 28vw" />
            </a><figcaption>{caption}</figcaption></figure>
          ))}</div>
        </div>
      </section>

      <section className={styles.booking} id="booking">
        <div className={styles.wrap + " " + styles.bookingGrid}>
          <div><p className={styles.kicker}>ონლაინ ჩაწერა</p><h2>დაგეგმეთ<br />თქვენი ვიზიტი</h2><p>აირჩიეთ მომსახურება, სპეციალისტი და თავისუფალი დრო. ჩაწერას ტელეფონზე მიღებული კოდით დაადასტურებთ.</p><a href={phone}>ტელეფონით ჩაწერა · {phoneDisplay} ↗</a></div>
          <div className={styles.wizard}><BookingWizard preview={preview} /></div>
        </div>
      </section>

      <section className={styles.section} id="contact">
        <div className={styles.wrap + " " + styles.location}>
          <div>
            <p className={styles.kicker}>ლოკაცია</p>
            <h2>გელოდებით<br />საჩხერეში</h2>
            <p className={styles.addressDetail}><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><><path d="M20 10c0 5-8 10-8 10s-8-5-8-10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></></svg><span>{site.address}<br />{hours}</span></p>
            <div className={styles.actions}>
              <a className={styles.primary} href={maps} target="_blank" rel="noreferrer" aria-label="ლოკაცია და მარშრუტი რუკაზე"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m21 3-6.5 18-3.7-7.8L3 9.5 21 3Z"/></svg> ლოკაცია</a>
              <a className={styles.locationPhone} href={phone}><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2 16 16 0 0 0 16 16 2 2 0 0 0 2-2v-3l-5-2-2 2a12 12 0 0 1-6-6l2-2-2-5Z"/></svg> {phoneDisplay}</a>
            </div>
          </div>
          <a className={styles.entrance} href={maps} target="_blank" rel="noreferrer" aria-label="ცენტრის მდებარეობა რუკაზე">
            <Image src="/center/rehab1.jpg" alt="რეაბილიტაციის ცენტრის შესასვლელი" fill sizes="(max-width: 760px) 100vw, 50vw" />
          </a>
        </div>
      </section>
      <footer className={styles.footer}>
        <div className={styles.wrap + " " + styles.footerRow}>
          <a className={styles.brand} href="#top">
            <Image src="/logo-symbol.png" alt="" width={38} height={38} />
            <span><strong>Reha Sachkhere</strong><small>რეაბილიტაციის ცენტრი</small></span>
          </a>
          <nav className={styles.footerNav} aria-label="დამატებითი ბმულები">
            <a href="#contact"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><><path d="M20 10c0 5-8 10-8 10s-8-5-8-10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></></svg> ლოკაცია</a>
            {site.facebook && <a href={site.facebook} target="_blank" rel="noreferrer"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path fill="currentColor" stroke="none" d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a20 20 0 0 0-2.5-.2c-2.5 0-4.2 1.5-4.2 4.3V10H8v3h2.6v8H14Z"/></svg> Facebook</a>}
            {site.instagram && <a href={site.instagram} target="_blank" rel="noreferrer"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></></svg> Instagram</a>}
            {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11.5a8 8 0 0 1-8 8 8.2 8.2 0 0 1-3.5-.8L4 20l1.3-4.1A8 8 0 1 1 20 11.5Z"/></svg> WhatsApp</a>}
            <a className={styles.footerAdmin} href="/admin/login"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></></svg> ადმინისტრაცია</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
