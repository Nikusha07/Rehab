import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { sendBookingSms } from "@/lib/sms";
import SmsLog from "@/models/SmsLog";

export const dynamic="force-dynamic";
const schema=z.object({phone:z.string().transform(v=>v.replace(/\D/g,"")).refine(v=>/^5\d{8}$/.test(v),"არასწორი ნომერია"),message:z.string().trim().min(1).max(500)});
async function auth(request:NextRequest){return verifyAdminToken(request.cookies.get(adminCookie)?.value)}

export async function GET(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 await dbConnect();
 const items=await SmsLog.find({}).sort({createdAt:-1}).limit(250).lean();
 return NextResponse.json({ok:true,items,configured:Boolean(process.env.GOSMS_API_KEY?.trim()&&process.env.GOSMS_SENDER?.trim()),sender:process.env.GOSMS_SENDER?.trim()||""});
}

export async function POST(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({ok:false,message:"შეამოწმეთ ნომერი და ტექსტი."},{status:400});
 await dbConnect();
 const result=await sendBookingSms(parsed.data.phone,parsed.data.message);
 const status=result.success?"sent":("skipped" in result&&result.skipped)?"skipped":"failed";
 const item=await SmsLog.create({phone:parsed.data.phone,message:parsed.data.message,status,payload:result});
 if(!result.success)return NextResponse.json({ok:false,message:status==="skipped"?"GoSMS ჯერ არ არის კონფიგურირებული.":"SMS-ის გაგზავნა ვერ მოხერხდა.",item},{status:status==="skipped"?400:502});
 return NextResponse.json({ok:true,item});
}
