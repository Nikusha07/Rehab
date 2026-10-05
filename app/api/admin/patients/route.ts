import { NextRequest, NextResponse } from "next/server";
import { adminCookie, hasAdminPermission, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Patient from "@/models/Patient";
import Booking from "@/models/Booking";

export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
 const auth=await verifyAdminToken(request.cookies.get(adminCookie)?.value);if(!auth)return NextResponse.json({ok:false},{status:401});if(!hasAdminPermission(auth,"patients.read"))return NextResponse.json({ok:false},{status:403});
 await dbConnect();
 const q=(request.nextUrl.searchParams.get("q")||"").trim();
 const filter=q?{$or:[{name:{$regex:q,$options:"i"}},{phone:{$regex:q.replace(/\D/g,""),$options:"i"}}]}:{};
 const patients=await Patient.find(filter).sort({updatedAt:-1}).limit(300).lean();
 const ids=patients.map(p=>p._id);
 const stats=ids.length?await Booking.aggregate([{$match:{patientId:{$in:ids}}},{$group:{_id:"$patientId",visits:{$sum:1},confirmed:{$sum:{$cond:[{$eq:["$status","confirmed"]},1,0]}},completed:{$sum:{$cond:[{$eq:["$status","completed"]},1,0]}},lastDate:{$max:"$date"}}}]):[];
 const map=new Map(stats.map((x:any)=>[String(x._id),x]));
 const items=patients.map((p:any)=>({...p,stats:map.get(String(p._id))||{visits:0,confirmed:0,completed:0,lastDate:null}}));
 return NextResponse.json({ok:true,items});
}
