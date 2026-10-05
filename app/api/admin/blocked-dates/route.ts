import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import BlockedDate from "@/models/BlockedDate";
import Specialist from "@/models/Specialist";

export const dynamic="force-dynamic";
const schema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),specialistId:z.union([z.string(),z.null()]).optional().default(null),title:z.string().trim().min(2).max(120),reason:z.string().trim().max(500).optional().default("")});
async function auth(request:NextRequest){return verifyAdminToken(request.cookies.get(adminCookie)?.value)}

export async function GET(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 await dbConnect();
 const [items,specialists]=await Promise.all([
  BlockedDate.find({}).sort({date:1}).populate({path:"specialistId",select:"name title",model:Specialist}).lean(),
  Specialist.find({}).sort({sortOrder:1,name:1}).select("name title isActive").lean()
 ]);
 return NextResponse.json({ok:true,items,specialists});
}
export async function POST(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({ok:false,message:"შეამოწმეთ მონაცემები."},{status:400});
 if(parsed.data.specialistId&& !mongoose.isValidObjectId(parsed.data.specialistId))return NextResponse.json({ok:false},{status:400});
 await dbConnect();
 try{const item=await BlockedDate.create(parsed.data);return NextResponse.json({ok:true,item},{status:201})}catch(e:any){if(e?.code===11000)return NextResponse.json({ok:false,message:"ამ თარიღზე შეზღუდვა უკვე არსებობს."},{status:409});throw e}
}
