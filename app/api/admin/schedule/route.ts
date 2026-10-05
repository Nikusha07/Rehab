import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Specialist from "@/models/Specialist";
import WorkingHours from "@/models/WorkingHours";

export const dynamic="force-dynamic";
const time=/^([01]\d|2[0-3]):[0-5]\d$/;
const rowSchema=z.object({weekday:z.number().int().min(0).max(6),openTime:z.string().regex(time),closeTime:z.string().regex(time),isDayOff:z.boolean()});
const schema=z.object({specialistId:z.string(),rows:z.array(rowSchema).length(7)});
async function auth(request:NextRequest){return verifyAdminToken(request.cookies.get(adminCookie)?.value)}

export async function GET(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 await dbConnect();
 const [specialists,hours]=await Promise.all([Specialist.find({}).sort({sortOrder:1,name:1}).lean(),WorkingHours.find({}).sort({weekday:1}).lean()]);
 return NextResponse.json({ok:true,specialists,hours});
}

export async function PUT(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success||!mongoose.isValidObjectId(parsed.data.specialistId))return NextResponse.json({ok:false,message:"არასწორი მონაცემებია."},{status:400});
 for(const row of parsed.data.rows){if(!row.isDayOff&&row.openTime>=row.closeTime)return NextResponse.json({ok:false,message:"დაწყების დრო დასრულების დროზე ადრე უნდა იყოს."},{status:400})}
 await dbConnect();
 const exists=await Specialist.exists({_id:parsed.data.specialistId});
 if(!exists)return NextResponse.json({ok:false},{status:404});
 await WorkingHours.bulkWrite(parsed.data.rows.map(row=>({updateOne:{filter:{specialistId:parsed.data.specialistId,weekday:row.weekday},update:{$set:{openTime:row.openTime,closeTime:row.closeTime,isDayOff:row.isDayOff}},upsert:true}})));
 const hours=await WorkingHours.find({specialistId:parsed.data.specialistId}).sort({weekday:1}).lean();
 return NextResponse.json({ok:true,hours});
}
