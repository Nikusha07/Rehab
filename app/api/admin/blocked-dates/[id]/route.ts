import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import BlockedDate from "@/models/BlockedDate";

export async function DELETE(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!(await verifyAdminToken(request.cookies.get(adminCookie)?.value)))return NextResponse.json({ok:false},{status:401});
 const {id}=await context.params;
 if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false},{status:400});
 await dbConnect();
 const item=await BlockedDate.findByIdAndDelete(id);
 if(!item)return NextResponse.json({ok:false},{status:404});
 return NextResponse.json({ok:true});
}
