import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Specialist from "@/models/Specialist";
import Booking from "@/models/Booking";
import WorkingHours from "@/models/WorkingHours";
import BlockedDate from "@/models/BlockedDate";

const schema=z.object({
  name:z.string().trim().min(2).max(120).optional(),
  title:z.string().trim().max(160).optional(),
  bio:z.string().trim().max(2000).optional(),
  image:z.string().trim().max(500).optional(),
  isActive:z.boolean().optional(),
  showOnWebsite:z.boolean().optional(),
  sortOrder:z.coerce.number().int().min(0).max(999).optional(),
});
async function auth(request:NextRequest){return verifyAdminToken(request.cookies.get(adminCookie)?.value);}

export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
  if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
  const {id}=await context.params;
  if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false},{status:400});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({ok:false,message:"არასწორი მონაცემებია."},{status:400});
  await dbConnect();
  const item=await Specialist.findByIdAndUpdate(id,parsed.data,{new:true,runValidators:true});
  if(!item)return NextResponse.json({ok:false},{status:404});
  return NextResponse.json({ok:true,item});
}

export async function DELETE(request:NextRequest,context:{params:Promise<{id:string}>}){
  if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
  const {id}=await context.params;
  if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false},{status:400});
  await dbConnect();
  const used=await Booking.exists({specialistId:id});
  if(used){
    const item=await Specialist.findByIdAndUpdate(id,{isActive:false,showOnWebsite:false},{new:true});
    if(!item)return NextResponse.json({ok:false},{status:404});
    return NextResponse.json({ok:true,softDeleted:true,item});
  }
  const item=await Specialist.findByIdAndDelete(id);
  if(!item)return NextResponse.json({ok:false},{status:404});
  await Promise.all([WorkingHours.deleteMany({specialistId:id}),BlockedDate.deleteMany({specialistId:id})]);
  return NextResponse.json({ok:true,softDeleted:false});
}
