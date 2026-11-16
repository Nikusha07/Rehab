"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "@/app/center.module.css";

const links = [
  ["#services", "მომსახურება"],
  ["#about", "ცენტრის შესახებ"],
  ["#gallery", "ფოტოგალერეა"],
  ["#contact", "ლოკაცია"],
] as const;

export default function PublicHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const toggle = useRef<HTMLElement>(null);

  useEffect(() => {
    const details = menu.current;
    if (!details) return;

    function dismissOutside(event: PointerEvent) {
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && details?.open) {
        details.open = false;
        toggle.current?.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside, { passive: true });
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, []);

  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }

  return (
    <header className={styles.header}>
      <div className={styles.wrap + " " + styles.burgerHeaderRow}>
        <a className={styles.brand} href="#top" onClick={closeMenu}>
          <Image src="/logo-symbol.png" alt="" width={44} height={44} />
          <span><strong>Reha Sachkhere</strong><small>რეაბილიტაციის ცენტრი</small></span>
        </a>
        <details className={styles.burgerMenu} ref={menu}>
          <summary className={styles.burgerToggle} ref={toggle} aria-label="მთავარი მენიუ">
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </summary>
          <nav className={styles.burgerPanel} aria-label="მთავარი ნავიგაცია">
            {links.map(([href, label]) => (
              <a key={href} href={href} onClick={closeMenu}>{label}<span aria-hidden="true">↗</span></a>
            ))}
            <a className={styles.menuBooking} href="#booking" onClick={closeMenu}>ვიზიტზე ჩაწერა <span aria-hidden="true">↗</span></a>
          </nav>
        </details>
      </div>
    </header>
  );
}
