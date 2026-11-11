export type Org = {id:string; name:string; business_type:string; enabled_modules:string[]; role:string};
export type Item = {id:string; sku:string; name:string; description:string; category_id:string|null; tracking_mode:string; purchase_price:string; sale_price:string; low_stock_threshold:string; is_active:boolean; image_url:string|null};
export type Location = {id:string; name:string; type:string};
export type Balance = {item_id:string; item_name:string; sku:string; location_id:string; location_name:string; quantity:string};
export type Movement = {id:string; item_id:string; item_name:string; movement_type:string; quantity:string; source_location_id:string|null; destination_location_id:string|null; created_at:string; reference:string};
export type Summary = {total_items:number; total_quantity:string; estimated_value:string; low_stock:{id:string;name:string;quantity:string;threshold:string}[]; recent_movements:Movement[]; valuation_method:string};
export type Asset = {id:string; item_id:string; serial_number:string; status:string; current_location_id:string; assigned_to:string|null};
export type Rental = {id:string; asset_id:string; customer_id:string; start_date:string; expected_return_date:string; actual_return_date:string|null; status:string; overdue:boolean};
export type Contact = {id:string;kind:string;name:string;phone:string;email:string;address:string};
function cookie(name:string){ if(typeof document === "undefined") return ""; return decodeURIComponent(document.cookie.split("; ").find(x=>x.startsWith(name+"="))?.split("=")[1] || ""); }
export async function api<T>(path:string, opts:RequestInit={}, org?:string):Promise<T>{
  const headers:Record<string,string> = {...(opts.headers as Record<string,string> || {})};
  if(opts.body) headers["Content-Type"]="application/json";
  if(org) headers["X-Organization-ID"]=org;
  if(opts.method && !["GET","HEAD"].includes(opts.method)) headers["X-CSRF-Token"]=cookie("sl3ti_csrf");
  const response=await fetch("/api/v1"+path,{...opts,headers,credentials:"same-origin",cache:"no-store"});
  if(!response.ok){let data: {detail?:string}={}; try{data=await response.json()}catch{} throw new Error(typeof data.detail==="string"?data.detail:"Erreur de connexion");}
  return response.json();
}
export const post = <T>(path:string, body:unknown, org?:string, key?:string)=>api<T>(path,{method:"POST",body:JSON.stringify(body),headers:key?{"Idempotency-Key":key}:{}},org);
export const patch = <T>(path:string, body:unknown, org?:string)=>api<T>(path,{method:"PATCH",body:JSON.stringify(body)},org);
export const del = (path:string, org?:string)=>api<void>(path,{method:"DELETE"},org);


export async function uploadCsv(file:File,org:string){
  const form=new FormData(); form.append("file",file);
  const response=await fetch("/api/v1/items/import",{method:"POST",body:form,headers:{"X-Organization-ID":org,"X-CSRF-Token":cookie("sl3ti_csrf")},credentials:"same-origin"});
  if(!response.ok){const data=await response.json();throw new Error(data.detail||"Import impossible")}
  return response.json();
}
export async function downloadCsv(path:string,org:string,name:string){
  const response=await fetch("/api/v1"+path,{headers:{"X-Organization-ID":org},credentials:"same-origin"});
  if(!response.ok)throw new Error("Export impossible");
  const blob=await response.blob(); const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

