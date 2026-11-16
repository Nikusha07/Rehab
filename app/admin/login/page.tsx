import Image from "next/image";
import AdminLoginForm from "@/components/AdminLoginForm";
import styles from "./login.module.css";

export const metadata = { title: "ადმინისტრაცია | რეაბილიტაციის ცენტრი" };

export default function AdminLoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-login-title">
        <div className={styles.brand}>
          <Image src="/logo-symbol.png" alt="" width={42} height={42} />
          <div>
            <strong>Reha Sachkhere</strong>
            <small>რეაბილიტაციის ცენტრი</small>
          </div>
        </div>
        <div className={styles.heading}>
          <p>ადმინისტრაციის პანელი</p>
          <h1 id="admin-login-title">შესვლა</h1>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
