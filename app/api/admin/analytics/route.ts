import { NextRequest, NextResponse } from "next/server";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { nowInTbilisi } from "@/lib/time";
import Booking from "@/models/Booking";
import Patient from "@/models/Patient";
import Service from "@/models/Service";
import Specialist from "@/models/Specialist";

export const dynamic="force-dynamic";
function minusDays(date:string,days:number){const [y,m,d]=date.split("-").map(Number);const x=new Date(Date.UTC(y,m-1,d-days));return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,"0")}-${String(x.getUTCDate()).padStart(2,"0")}`}

export async function GET(request:NextRequest){
 if(!(await verifyAdminToken(request.cookies.get(adminCookie)?.value)))return NextResponse.json({ok:false},{status:401});
 await dbConnect();
 const today=nowInTbilisi().date;const from=minusDays(today,29);
 const [statusRows,dailyRows,serviceRows,specialistRows,patients,total,upcoming]=await Promise.all([
  Booking.aggregate([{$group:{_id:"$status",count:{$sum:1}}}]),
  Booking.aggregate([{$match:{date:{$gte:from,$lte:today}}},{$group:{_id:"$date",count:{$sum:1},completed:{$sum:{$cond:[{$eq:["$status","completed"]},1,0]}}}},{$sort:{_id:1}}]),
  Booking.aggregate([{$group:{_id:"$serviceId",count:{$sum:1},completed:{$sum:{$cond:[{$eq:["$status","completed"]},1,0]}}}},{$sort:{count:-1}},{$limit:10}]),
  Booking.aggregate([{$group:{_id:"$specialistId",count:{$sum:1},completed:{$sum:{$cond:[{$eq:["$status","completed"]},1,0]}}}},{$sort:{count:-1}},{$limit:10}]),
  Patient.countDocuments({}),Booking.countDocuments({}),Booking.countDocuments({date:{$gte:today},status:"confirmed"})
 ]);
 const serviceIds=serviceRows.map((x:any)=>x._id).filter(Boolean);const specialistIds=specialistRows.map((x:any)=>x._id).filter(Boolean);
 const [services,specialists]=await Promise.all([Service.find({_id:{$in:serviceIds}}).select("name price").lean(),Specialist.find({_id:{$in:specialistIds}}).select("name title").lean()]);
 const serviceMap=new Map(services.map((x:any)=>[String(x._id),x]));const specialistMap=new Map(specialists.map((x:any)=>[String(x._id),x]));
 const status=Object.fromEntries(statusRows.map((x:any)=>[x._id,x.count]));
 const byService=serviceRows.map((x:any)=>{const s:any=serviceMap.get(String(x._id));return {...x,name:s?.name||"უცნობი სერვისი",price:s?.price??null,estimatedRevenue:s?.price!=null?x.completed*s.price:null}});
 const bySpecialist=specialistRows.map((x:any)=>{const s:any=specialistMap.get(String(x._id));return {...x,name:s?.name||"უცნობი სპეციალისტი",title:s?.title||""}});
 return NextResponse.json({ok:true,today,from,total,patients,upcoming,status,daily:dailyRows.map((x:any)=>({date:x._id,count:x.count,completed:x.completed})),byService,bySpecialist});
}
