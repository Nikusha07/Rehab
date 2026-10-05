import { SITE } from "@/lib/config";
import { dbConnect } from "@/lib/db";
import SiteSetting from "@/models/SiteSetting";

export type SiteConfig = typeof SITE & {
  centerName: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  mapQuery: string;
};

export async function getSiteConfig():Promise<SiteConfig>{
  const fallback:SiteConfig={...SITE,centerName:SITE.name,facebook:"",instagram:"",whatsapp:"",mapQuery:SITE.address};
  try{
    await dbConnect();
    const doc:any=await SiteSetting.findOne({key:"main"}).lean();
    if(!doc)return fallback;
    return {
      ...fallback,
      centerName:doc.centerName||fallback.centerName,
      tagline:doc.tagline||fallback.tagline,
      phone:doc.phone||fallback.phone,
      address:doc.address||fallback.address,
      mapQuery:doc.mapQuery||doc.address||fallback.mapQuery,
      hours:doc.hours||fallback.hours,
      facebook:doc.facebook||"",
      instagram:doc.instagram||"",
      whatsapp:doc.whatsapp||"",
    };
  }catch{return fallback}
}
