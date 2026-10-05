import mongoose from "mongoose";
import Service from "../models/Service";
import Specialist from "../models/Specialist";
import WorkingHours from "../models/WorkingHours";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI არ არის მითითებული .env.local ფაილში");

async function run() {
  await mongoose.connect(uri);

  const services = [
    { name: "სარეაბილიტაციო კონსულტაცია", description: "პირველადი შეფასება და ინდივიდუალური გეგმის შედგენა.", durationMinutes: 30, sortOrder: 1 },
    { name: "სამკურნალო ფიზკულტურა", description: "ინდივიდუალურად შერჩეული თერაპიული ვარჯიში.", durationMinutes: 60, sortOrder: 2 },
    { name: "ფიზიკური რეაბილიტაცია", description: "ფუნქციისა და მობილობის ეტაპობრივი აღდგენა.", durationMinutes: 60, sortOrder: 3 },
  ];
  for (const service of services) {
    await Service.updateOne({ name: service.name }, { $setOnInsert: service }, { upsert: true });
  }

  let specialist = await Specialist.findOne({ name: "რეაბილიტაციის სპეციალისტი" });
  if (!specialist) {
    specialist = await Specialist.create({
      name: "რეაბილიტაციის სპეციალისტი",
      title: "ფიზიკური რეაბილიტაცია",
      bio: "ინდივიდუალური შეფასება და სარეაბილიტაციო გეგმა.",
      sortOrder: 1,
    });
  }

  for (let weekday = 0; weekday <= 6; weekday++) {
    await WorkingHours.updateOne(
      { specialistId: specialist._id, weekday },
      { $setOnInsert: { specialistId: specialist._id, weekday, openTime: "10:00", closeTime: "18:00", isDayOff: weekday === 0 } },
      { upsert: true }
    );
  }

  console.log("Seed დასრულდა: services, specialist, working hours მზადაა.");
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
