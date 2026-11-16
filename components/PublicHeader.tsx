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
  const menu = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const wideScreen = window.matchMedia("(min-width: 880px)");
    function closeWhenWide() {
      if (wideScreen.matches && menu.current?.open) menu.current.close();
    }

    wideScreen.addEventListener("change", closeWhenWide);
    return () => wideScreen.removeEventListener("change", closeWhenWide);
  }, []);

  function closeMenu() {
    menu.current?.close();
  }

  return (
    <header className={styles.header}>
      <div className={styles.wrap + " " + styles.burgerHeaderRow}>
        <a className={styles.brand} href="#top" onClick={closeMenu}>
          <Image src="/logo-symbol.png" alt="" width={44} height={44} />
          <span><strong>Reha Sachkhere</strong><small>რეაბილიტაციის ცენტრი</small></span>
        </a>
        <nav className={styles.inlineMenu} aria-label="მთავარი ნავიგაცია">
          {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          <a className={styles.headerAction} href="#booking">ჩაწერა <span aria-hidden="true">↗</span></a>
        </nav>
        <button type="button" className={styles.burgerToggle} aria-label="მთავარი მენიუს გახსნა" aria-haspopup="dialog" onClick={() => menu.current?.showModal()}>
          <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        </button>
        <dialog className={styles.burgerDialog} ref={menu} aria-labelledby="public-menu-title"
          onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
          <div className={styles.burgerCard}>
            <div className={styles.burgerCardHead}>
              <h2 id="public-menu-title">მენიუ</h2>
              <button type="button" className={styles.burgerClose} aria-label="მენიუს დახურვა" onClick={closeMenu}>×</button>
            </div>
            <nav className={styles.burgerPanel} aria-label="მთავარი ნავიგაცია">
              {links.map(([href, label]) => (
                <a key={href} href={href} onClick={closeMenu}>{label}<span aria-hidden="true">↗</span></a>
              ))}
              <a className={styles.menuBooking} href="#booking" onClick={closeMenu}>ვიზიტზე ჩაწერა <span aria-hidden="true">↗</span></a>
            </nav>
          </div>
        </dialog>
      </div>
    </header>
  );
}
