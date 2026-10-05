import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Specialist from "@/models/Specialist";

export const dynamic = "force-dynamic";

const schema=z.object({
  name:z.string().trim().min(2).max(120),
  title:z.string().trim().max(160).optional().default(""),
  bio:z.string().trim().max(2000).optional().default(""),
  image:z.string().trim().max(500).optional().default(""),
  isActive:z.boolean().optional().default(true),
  showOnWebsite:z.boolean().optional().default(false),
  sortOrder:z.coerce.number().int().min(0).max(999).optional().default(0),
});
async function ok(request:NextRequest){return verifyAdminToken(request.cookies.get(adminCookie)?.value);}

export async function GET(request:NextRequest){
  if(!(await ok(request)))return NextResponse.json({ok:false},{status:401});
  await dbConnect();
  const items=await Specialist.find({}).sort({sortOrder:1,name:1}).lean();
  return NextResponse.json({ok:true,items});
}
export async function POST(request:NextRequest){
  if(!(await ok(request)))return NextResponse.json({ok:false},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({ok:false,message:"შეამოწმეთ მონაცემები."},{status:400});
  await dbConnect();
  const item=await Specialist.create(parsed.data);
  return NextResponse.json({ok:true,item},{status:201});
}
