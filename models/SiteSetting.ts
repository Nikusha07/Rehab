import { model, models, Schema } from "mongoose";

const SiteSettingSchema=new Schema({
  key:{type:String,default:"main",unique:true,index:true},
  centerName:{type:String,default:"რეაბილიტაციის ცენტრი"},
  tagline:{type:String,default:"სამკურნალო ფიზკულტურისა და რეაბილიტაციის ცენტრი"},
  phone:{type:String,default:"599000000"},
  address:{type:String,default:"თბილისი, საქართველო"},
  mapQuery:{type:String,default:"42.332196, 43.403760"},
  hours:{type:String,default:"10:00 – 18:00"},
  facebook:{type:String,default:""},
  instagram:{type:String,default:""},
  whatsapp:{type:String,default:""},
},{timestamps:true});

export default models.SiteSetting||model("SiteSetting",SiteSettingSchema);
