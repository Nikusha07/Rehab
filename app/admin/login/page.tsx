import Image from "next/image";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata = { title: "ადმინისტრაცია | რეაბილიტაციის ცენტრი" };

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-logo">
          <Image src="/logo-symbol.png" alt="" width={54} height={62} />
          <div><b>რეაბილიტაციის ცენტრი</b><small>ადმინისტრაციის პანელი</small></div>
        </div>
        <h1>შესვლა</h1>
        <p>ჯავშნების, პაციენტებისა და გრაფიკის სამართავად გაიარეთ ავტორიზაცია.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
