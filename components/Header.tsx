"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className={`site-header ${open ? "menu-open" : ""}`}>
      <div className="container header-inner">
        <a className="brand" href="#top" onClick={close} aria-label="Rehab Center — მთავარი გვერდი">
          <img
            className="brand-logo"
            src="/logo.png?v=20261006-final-v2"
            alt="Rehab Center"
            width={600}
            height={200}
            loading="eager"
            decoding="async"
          />
        </a>

        <button
          className={`menu-button ${open ? "is-open" : ""}`}
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? "მენიუს დახურვა" : "მენიუს გახსნა"}
          onClick={() => setOpen((v) => !v)}
        >
          <span></span><span></span><span></span><span className="sr-only">{open ? "მენიუს დახურვა" : "მენიუ"}</span>
        </button>

        {open && <button className="mobile-menu-backdrop" aria-label="მენიუს დახურვა" onClick={close} />}

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
