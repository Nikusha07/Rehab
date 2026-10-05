# Rehab Center — Next.js + MongoDB

ეს არის არსებული PHP/MySQL Rehab პროექტის ახალი ვერსიის პირველი MVP. ძველი პროექტიდან შენარჩუნებულია მთავარი ბიზნეს-ლოგიკა: სერვისები, სპეციალისტები, სამუშაო გრაფიკი, დაბლოკილი დღეები, თავისუფალი დროების გამოთვლა, სხვადასხვა ხანგრძლივობის ვიზიტები, ორმაგი ჩაწერის დაცვა, პაციენტი, SMS ინტეგრაციის საფუძველი და admin bookings dashboard.

## Stack

- Next.js + TypeScript
- MongoDB Atlas + Mongoose
- React
- Vercel-ready API Route Handlers
- Signed admin session cookie (JOSE)
- GoSMS-ready integration

## 1. Local setup

```bash
npm install
```

`.env.example` დააკოპირეთ `.env.local`-ად და შეავსეთ:

```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=very-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-password
GOSMS_API_KEY=
GOSMS_SENDER=
NEXT_PUBLIC_CENTER_PHONE=599000000
NEXT_PUBLIC_CENTER_ADDRESS=თბილისი, საქართველო
```

შემდეგ საწყისი მონაცემები:

```bash
npm run seed
```

გაშვება:

```bash
npm run dev
```

- Public: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## 2. MongoDB Atlas

შექმენით Atlas project/cluster, database user და connection string. Vercel deployment-ისთვის Network Access-ში გამოიყენეთ შესაბამისი წვდომა. `MONGODB_URI` შეინახეთ მხოლოდ Environment Variables-ში — არასოდეს commit-ში.

Booking-ის შექმნა MongoDB transaction-ს იყენებს. SlotLock კოლექციაში ყოველი 30-წუთიანი ერთეული უნიკალურია, ამიტომ 60-წუთიანი ვიზიტიც ვერ გადაიკვეთება სხვა ჯავშანთან.

## 3. Vercel

1. პროექტი ატვირთეთ GitHub-ზე.
2. Vercel-ში Import Project.
3. დაამატეთ `.env.example`-ში ჩამოთვლილი Environment Variables.
4. Deploy.
5. საჭიროების შემთხვევაში მიაბით custom domain.

> Production deployment uses Vercel Environment Variables; keep secrets out of Git.

## ამ MVP-ში უკვე არის

- სრულად responsive ახალი მთავარი გვერდი
- mobile sticky booking CTA
- სერვისებისა და სპეციალისტების MongoDB API
- რეალური availability API
- booking wizard თავისუფალი დროების ღილაკებით
- Georgian mobile validation
- confirmation code
- transaction + SlotLock double-booking protection
- პაციენტის upsert ტელეფონის ნომრით
- GoSMS integration (credentials-ის დამატების შემდეგ)
- admin login
- admin booking list, filters, stats
- booking complete / no-show / cancel
- cancellation-ისას დროის ავტომატურად გათავისუფლება

## შემდეგი ეტაპი

- Admin: Services CRUD
- Admin: Specialists CRUD
- Admin: weekly schedule editor
- Admin: blocked dates / holidays
- Admin: patient history
- Calendar day/week view
- Analytics
- audit log
- SMS history + reminder automation
- ძველი MySQL მონაცემების MongoDB-ში migration script
- რეალური მისამართი, ნომერი, ექიმების ფოტოები და ტექსტები
