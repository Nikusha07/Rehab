"use client";

import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#top" onClick={close} aria-label="მთავარი გვერდი">
          <Image
            src="/logo.png"
            alt="Rehab Center — რეაბილიტაციის ცენტრი"
            width={210}
            height={70}
            priority
            style={{ width: "clamp(168px, 18vw, 220px)", height: "auto", objectFit: "contain" }}
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
