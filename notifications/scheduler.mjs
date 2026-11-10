// Pure scheduling rules for the future Cloudflare notification Worker.
// No network access, no notification delivery, no claims of autonomous sentience.
export const DEFAULT_NOTIFICATION_POLICY = Object.freeze({
  enabled: false, // explicit owner opt-in required
  timezone: "Europe/Paris",
  quietStartHour: 23,
  quietEndHour: 8,
  dailyMinimumTarget: 3,
  dailyMaximum: 5,
  plannedHours: [9, 12, 17, 20], // four opportunities, never a delivery guarantee
  categories: ["conversation", "projects", "reminders", "affection"]
});
export function localParts(date, timezone = DEFAULT_NOTIFICATION_POLICY.timezone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year:"numeric", month:"2-digit",day:"2-digit",
    hour:"2-digit", minute:"2-digit",hourCycle:"h23"
  }).formatToParts(date);
  const get = k => Number(parts.find(p=>p.type===k)?.value);
  return {day:`${get("year")}-${String(get("month")).padStart(2,"0")}-${String(get("day")).padStart(2,"0")}`,hour:get("hour"),minute:get("minute")};
}
export function inQuietHours(hour, start=23, end=8) {
  if (start===end) return false;
  return start>end ? hour>=start||hour<end : hour>=start&&hour<end;
}
export function eligibleSlot({date, settings=DEFAULT_NOTIFICATION_POLICY, sentToday=0, sentSlotKeys=[]}) {
  if (!settings.enabled || settings.dailyMaximum <= 0 || sentToday >= Math.min(settings.dailyMaximum,5)) return null;
  const p=localParts(date,settings.timezone||"Europe/Paris");
  if(inQuietHours(p.hour,settings.quietStartHour??23,settings.quietEndHour??8)) return null;
  const hours=settings.plannedHours||[9,12,17,20];
  if(!hours.includes(p.hour)) return null;
  const key=`${p.day}:${p.hour}`;
  if(sentSlotKeys.includes(key)) return null;
  const types=(settings.categories||[]).filter(t=>["conversation","projects","reminders","affection"].includes(t));
  if(!types.length) return null;
  const index=hours.indexOf(p.hour);
  return {key, day:p.day, type:types[index%types.length],hour:p.hour};
}
