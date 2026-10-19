import { NextRequest, NextResponse } from "next/server";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Patient from "@/models/Patient";
import Booking from "@/models/Booking";
import { registrationSchema } from "@/lib/invoice";
import { writeAudit } from "@/lib/audit";

export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
 const auth=await verifyAdminToken(request.cookies.get(adminCookie)?.value);if(!auth)return NextResponse.json({ok:false},{status:401});if(!hasAdminPermission(auth,"patients.read"))return NextResponse.json({ok:false},{status:403});
 await dbConnect();
 const q=(request.nextUrl.searchParams.get("q")||"").trim();
 const escaped=q.slice(0,120).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 const filter=q?{$or:[{name:{$regex:escaped,$options:"i"}},{phone:{$regex:escaped}},{personalId:{$regex:escaped}}]}:{};
 const patients=await Patient.find(filter).sort({updatedAt:-1}).limit(300).lean();
 const ids=patients.map(p=>p._id);
 const stats=ids.length?await Booking.aggregate([{$match:{patientId:{$in:ids}}},{$group:{_id:"$patientId",visits:{$sum:1},confirmed:{$sum:{$cond:[{$eq:["$status","confirmed"]},1,0]}},completed:{$sum:{$cond:[{$eq:["$status","completed"]},1,0]}},lastDate:{$max:"$date"}}}]):[];
 const map=new Map(stats.map((x:any)=>[String(x._id),x]));
 const items=patients.map((p:any)=>({...p,stats:map.get(String(p._id))||{visits:0,confirmed:0,completed:0,lastDate:null}}));
 return NextResponse.json({ok:true,items});
}

export async function POST(request:NextRequest){
 const auth=await verifyAdminToken(request.cookies.get(adminCookie)?.value);
 if(!auth)return NextResponse.json({ok:false},{status:401});
 if(!hasAdminPermission(auth,"patients.write"))return NextResponse.json({ok:false},{status:403});
 const parsed=registrationSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({ok:false,message:"შეამოწმეთ სახელი, ტელეფონი, ელფოსტა და პირადი ნომერი (11 ციფრი)."},{status:400});
 try {
  await dbConnect();
  await Patient.init();
  const patient=await Patient.create(parsed.data);
  await writeAudit({actor:String(auth.username||"admin"),action:"patient.create",entity:"patient",entityId:String(patient._id),summary:"პაციენტი დარეგისტრირდა"});
  return NextResponse.json({ok:true,patient},{status:201});
 } catch(error) {
  if((error as {code?:number}).code===11000)return NextResponse.json({ok:false,message:"ამ ტელეფონით პაციენტი უკვე არსებობს. მოძებნეთ არსებული ჩანაწერი."},{status:409});
  return NextResponse.json({ok:false,message:"რეგისტრაცია ვერ მოხერხდა. სცადეთ ხელახლა."},{status:500});
 }
}
