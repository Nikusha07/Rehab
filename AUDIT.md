# Legacy PHP → Next.js migration audit

## რაც ძველ პროექტში უკვე კარგად იყო გაკეთებული

- მომსახურებები (`services`)
- სპეციალისტები (`specialists`)
- სამუშაო საათები (`working_hours`)
- დაბლოკილი თარიღები (`blocked_dates`)
- პაციენტები (`patients`)
- ჯავშნები (`bookings`)
- confirmation code
- GoSMS გაგზავნა და SMS log
- admin authentication
- audit log-ის საფუძველი
- availability logic
- duplicate slot protection (`slot_key` + unique key)

## ახალ MVP-ში რა გადავიტანეთ

- PHP/MySQL → Next.js/MongoDB Atlas
- `slot_key`-ის იდეა გაძლიერდა `SlotLock` მოდელით: 60 წუთიანი ვიზიტი 2 ცალკე 30-წუთიან lock-ს იკავებს, ამიტომ გადაფარვაც ბლოკდება.
- booking შექმნა transaction-ში ხდება.
- cancellation-ისას lock-ები იშლება და დრო ისევ თავისუფლდება.
- availability ითვალისწინებს სპეციალისტის სამუშაო დღეს, გლობალურ/სპეციალისტის blocked date-ს, წარსულ დროს და სერვისის ხანგრძლივობას.
- public booking UX გადაკეთდა responsive wizard-ად.
- admin auth გადავიდა signed HttpOnly cookie-ზე.

## შემდეგი migration ნაბიჯები

1. ძველი MySQL ბაზიდან export (`services`, `specialists`, `working_hours`, `blocked_dates`, `patients`, `bookings`).
2. migration script, რომელიც ძველ numeric ID-ებს ახალ MongoDB ObjectId-ებზე map-ს გაუკეთებს.
3. cancelled booking-ებისთვის lock არ შეიქმნება; active/history records სწორად გადაიტანება.
4. production cutover-მდე ძველი სისტემა რჩება read-only/reference მდგომარეობაში.
