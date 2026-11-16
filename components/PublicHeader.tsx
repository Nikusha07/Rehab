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

const menuIcons = {
  "#services": <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M9 5V4h6v1m-3 4v7m-3.5-3.5h7" /></>,
  "#about": <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  "#gallery": <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-4 3 2 4-5 4 5" /></>,
  "#contact": <><path d="M19 10c0 4.5-7 9-7 9s-7-4.5-7-9a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
  "#booking": <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4m8-4v4M4 10h16m-11 5 2 2 4-4" /></>,
};

function MenuIcon({ link }: { link: keyof typeof menuIcons }) {
  return (
    <span className={styles.menuIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {menuIcons[link]}
      </svg>
    </span>
  );
}

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
                <a key={href} href={href} onClick={closeMenu}>
                  <span className={styles.menuLabel}><MenuIcon link={href} />{label}</span><span aria-hidden="true">↗</span>
                </a>
              ))}
              <a className={styles.menuBooking} href="#booking" onClick={closeMenu}>
                <span className={styles.menuLabel}><MenuIcon link="#booking" />ვიზიტზე ჩაწერა</span><span aria-hidden="true">↗</span>
              </a>
            </nav>
          </div>
        </dialog>
      </div>
    </header>
  );
}
