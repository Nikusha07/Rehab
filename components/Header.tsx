"use client";

import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand rehab-brand" href="#top" onClick={close} aria-label="Rehab Center — მთავარი გვერდი">
          <span className="rehab-brand-mark">
            <Image
              src="/logo.png"
              alt=""
              width={64}
              height={64}
              priority
            />
          </span>
          <span className="rehab-brand-copy">
            <strong><b>Rehab</b> Center</strong>
            <small>რეაბილიტაციის ცენტრი</small>
          </span>
        </a>

        <button className="menu-button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((v) => !v)}>
          <span></span><span></span><span></span><span className="sr-only">მენიუ</span>
        </button>

        <nav id="main-nav" className={`main-nav ${open ? "is-open" : ""}`}>
          <a href="#services" onClick={close}>სერვისები</a>
          <a href="#about" onClick={close}>ჩვენ შესახებ</a>
          <a href="#gallery" onClick={close}>სივრცე</a>
          <a href="#contact" onClick={close}>კონტაქტი</a>
          <a className="nav-cta" href="#booking" onClick={close}>ვიზიტზე ჩაწერა</a>
        </nav>
      </div>
    </header>
  );
}
