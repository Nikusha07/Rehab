import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import Patient from "@/models/Patient";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import Specialist from "@/models/Specialist";

const updateSchema=z.object({
 name:z.string().trim().min(2).max(120).optional(),
 email:z.string().trim().max(160).optional(),
 notes:z.string().trim().max(3000).optional(),
});
async function auth(request:NextRequest){return verifyAdminToken(request.cookies.get(adminCookie)?.value)}

export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 const {id}=await context.params;if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false},{status:400});
 await dbConnect();
 const patient=await Patient.findById(id).lean();if(!patient)return NextResponse.json({ok:false},{status:404});
 const bookings=await Booking.find({patientId:id}).sort({date:-1,time:-1}).limit(100).populate({path:"serviceId",select:"name",model:Service}).populate({path:"specialistId",select:"name title",model:Specialist}).lean();
 return NextResponse.json({ok:true,patient,bookings});
}

export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 const {id}=await context.params;if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false},{status:400});
 const parsed=updateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({ok:false,message:"არასწორი მონაცემებია."},{status:400});
 await dbConnect();const patient=await Patient.findByIdAndUpdate(id,parsed.data,{new:true,runValidators:true});if(!patient)return NextResponse.json({ok:false},{status:404});
 return NextResponse.json({ok:true,patient});
}
