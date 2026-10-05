"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "owner" | "reception" | "doctor";
const navItems: { href: string; label: string; icon: string; roles: Role[] }[] = [
  { href: "/admin", label: "ჯავშნები", icon: "◫", roles: ["owner","reception","doctor"] },
  { href: "/admin/calendar", label: "კალენდარი", icon: "▦", roles: ["owner","reception","doctor"] },
  { href: "/admin/patients", label: "პაციენტები", icon: "♙", roles: ["owner","reception","doctor"] },
  { href: "/admin/services", label: "სერვისები", icon: "✚", roles: ["owner"] },
  { href: "/admin/specialists", label: "სპეციალისტები", icon: "♟", roles: ["owner"] },
  { href: "/admin/schedule", label: "სამუშაო გრაფიკი", icon: "◷", roles: ["owner"] },
  { href: "/admin/blocked-dates", label: "დაბლოკილი დღეები", icon: "⊘", roles: ["owner"] },
  { href: "/admin/sms", label: "SMS ჟურნალი", icon: "✉", roles: ["owner","reception"] },
  { href: "/admin/analytics", label: "ანალიტიკა", icon: "⌁", roles: ["owner","reception","doctor"] },
  { href: "/admin/audit", label: "Audit log", icon: "◎", roles: ["owner"] },
  { href: "/admin/users", label: "Admin მომხმარებლები", icon: "♚", roles: ["owner"] },
  { href: "/admin/settings", label: "პარამეტრები", icon: "⚙", roles: ["owner"] },
];
const roleLabels: Record<Role,string> = { owner: "Owner", reception: "Reception", doctor: "Doctor" };

export default function AdminShell({ username, children }: { username: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("doctor");

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (["owner","reception","doctor"].includes(d.role)) setRole(d.role);
    }).catch(() => undefined);
  }, []);

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
          {navItems.filter((item) => item.roles.includes(role)).map((item) => {
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
          <div className="adm-user"><span className="adm-user-dot">{username.slice(0,1).toUpperCase()}</span><span><small>{roleLabels[role]}</small><b>{username}</b></span></div>
        </header>
        <div className="adm-content">{children}</div>
      </div>
    </div>
  );
}
