"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "ჯავშნები", icon: "◫" },
  { href: "/admin/calendar", label: "კალენდარი", icon: "▦" },
  { href: "/admin/patients", label: "პაციენტები", icon: "♙" },
  { href: "/admin/services", label: "სერვისები", icon: "✚" },
  { href: "/admin/specialists", label: "სპეციალისტები", icon: "♟" },
  { href: "/admin/schedule", label: "სამუშაო გრაფიკი", icon: "◷" },
  { href: "/admin/blocked-dates", label: "დაბლოკილი დღეები", icon: "⊘" },
  { href: "/admin/sms", label: "SMS ჟურნალი", icon: "✉" },
  { href: "/admin/analytics", label: "ანალიტიკა", icon: "⌁" },
  { href: "/admin/audit", label: "Audit log", icon: "◎" },
  { href: "/admin/settings", label: "პარამეტრები", icon: "⚙" },
];

export default function AdminShell({ username, children }: { username: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="adm-shell">
      <aside className={`adm-sidebar ${open ? "open" : ""}`}>
        <div className="adm-brand">
          <span className="adm-brand-logo"><Image src="/logo-symbol.png" alt="" width={42} height={48} /></span>
          <span><b>რეაბილიტაციის ცენტრი</b><small>ადმინისტრაცია</small></span>
        </div>
        <nav className="adm-nav" aria-label="ადმინისტრაციის მენიუ">
          {navItems.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setOpen(false)}>
                <span className="adm-nav-icon">{item.icon}</span><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="adm-sidebar-foot">
          <a href="/" target="_blank" rel="noreferrer">საიტის ნახვა <span>↗</span></a>
          <button onClick={logout}>გასვლა</button>
        </div>
      </aside>

      {open && <button className="adm-overlay" aria-label="მენიუს დახურვა" onClick={() => setOpen(false)} />}

      <div className="adm-workspace">
        <header className="adm-topbar">
          <button className="adm-menu" onClick={() => setOpen((v) => !v)} aria-label="მენიუ"><span /><span /><span /></button>
          <div className="adm-topbar-title"><b>მართვის პანელი</b><small>ცენტრის ყოველდღიური ოპერაციები</small></div>
          <div className="adm-user"><span className="adm-user-dot">{username.slice(0,1).toUpperCase()}</span><span><small>ადმინისტრატორი</small><b>{username}</b></span></div>
        </header>
        <div className="adm-content">{children}</div>
      </div>
    </div>
  );
}
