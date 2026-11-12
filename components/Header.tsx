"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const mobile = window.matchMedia("(max-width: 1100px)");
    if (!mobile.matches) {
      setOpen(false);
      return;
    }

    const root = document.documentElement;
    root.classList.add("public-menu-open");
    const onViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches) setOpen(false);
    };
    mobile.addEventListener("change", onViewportChange);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      root.classList.remove("public-menu-open");
      mobile.removeEventListener("change", onViewportChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className={`site-header ${open ? "menu-open" : ""}`}>
      <div className="container header-inner">
        <a className="brand" href="#top" onClick={close} aria-label="Rehab Center — მთავარი გვერდი">
          <img
            className="brand-logo"
            src="/logo.svg?v=20261007-final"
            alt="Rehab Center"
            width={600}
            height={180}
            loading="eager"
            decoding="async"
          />
        </a>

        <button
          type="button"
          className={`menu-button ${open ? "is-open" : ""}`}
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? "მენიუს დახურვა" : "მენიუს გახსნა"}
          onClick={() => setOpen((v) => !v)}
        >
          <span></span><span></span><span></span><span className="sr-only">{open ? "მენიუს დახურვა" : "მენიუ"}</span>
        </button>

        {open && <button type="button" className="mobile-menu-backdrop" tabIndex={-1} aria-label="მენიუს დახურვა" onClick={close} />}

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
