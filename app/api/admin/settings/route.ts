import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookie, verifyAdminToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { SITE } from "@/lib/config";
import SiteSetting from "@/models/SiteSetting";

export const dynamic="force-dynamic";
const schema=z.object({
 centerName:z.string().trim().min(2).max(120),
 tagline:z.string().trim().min(2).max(300),
 phone:z.string().transform(v=>v.replace(/\D/g,"")).refine(v=>/^5\d{8}$/.test(v),"ტელეფონი უნდა იყოს 9 ციფრი და იწყებოდეს 5-ით"),
 address:z.string().trim().min(2).max(300),
 mapQuery:z.string().trim().min(2).max(300),
 hours:z.string().trim().min(2).max(120),
 facebook:z.string().trim().max(500).optional().default(""),
 instagram:z.string().trim().max(500).optional().default(""),
 whatsapp:z.string().trim().max(60).optional().default(""),
});
async function auth(request:NextRequest){return verifyAdminToken(request.cookies.get(adminCookie)?.value)}

export async function GET(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 await dbConnect();
 const doc:any=await SiteSetting.findOne({key:"main"}).lean();
 const item=doc||{key:"main",centerName:SITE.name,tagline:SITE.tagline,phone:SITE.phone,address:SITE.address,mapQuery:SITE.address,hours:SITE.hours,facebook:"",instagram:"",whatsapp:""};
 return NextResponse.json({ok:true,item,integrations:{mongo:Boolean(process.env.MONGODB_URI),auth:Boolean(process.env.AUTH_SECRET),gosms:Boolean(process.env.GOSMS_API_KEY&&process.env.GOSMS_SENDER)}});
}

export async function PUT(request:NextRequest){
 if(!(await auth(request)))return NextResponse.json({ok:false},{status:401});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({ok:false,message:parsed.error.issues[0]?.message||"შეამოწმეთ მონაცემები."},{status:400});
 await dbConnect();
 const item=await SiteSetting.findOneAndUpdate({key:"main"},{$set:{...parsed.data,key:"main"}},{new:true,upsert:true,runValidators:true});
 return NextResponse.json({ok:true,item});
}
