"use client";

import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#top" onClick={close} aria-label="Rehab Center — მთავარი გვერდი">
          <img
            className="brand-logo"
            src="/logo.png?v=20261006-premium"
            alt="Rehab Center"
            width={480}
            height={160}
            loading="eager"
            decoding="async"
          />
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
