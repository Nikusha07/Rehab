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
  const fallback:SiteConfig={...SITE,centerName:SITE.name,facebook:"",instagram:"",whatsapp:"",mapQuery:SITE.mapQuery};
  try{
    await dbConnect();
    const doc:any=await SiteSetting.findOne({key:"main"}).lean();
    if(!doc)return fallback;
    const savedMapQuery = String(doc.mapQuery || "").trim();
    const compactMapQuery = savedMapQuery.split(" ").join("");
    const legacyMapQueries = new Set(["42.33825,43.40750", "42.3382498,43.4075005"]);
    const shouldMigrateMap = !savedMapQuery || legacyMapQueries.has(compactMapQuery);
    const mapQuery = shouldMigrateMap ? SITE.mapQuery : savedMapQuery;
    if (shouldMigrateMap && savedMapQuery) {
      await SiteSetting.updateOne({ key: "main" }, { $set: { mapQuery: SITE.mapQuery } }).catch(() => undefined);
    }
    return {
      ...fallback,
      centerName:doc.centerName||fallback.centerName,
      tagline:doc.tagline||fallback.tagline,
      phone:doc.phone||fallback.phone,
      address:doc.address||fallback.address,
      mapQuery,
      hours:doc.hours||fallback.hours,
      facebook:doc.facebook||"",
      instagram:doc.instagram||"",
      whatsapp:doc.whatsapp||"",
    };
  }catch{return fallback}
}
