export const onRequest: PagesFunction = async (context) => {
  const country = context.request.headers.get("cf-ipcountry");
  const allowedCountries = ["JP"]; // 許可する国だけ列挙

  if (!country || !allowedCountries.includes(country)) {
    return new Response("Access denied", { status: 403 });
  }

  return context.next();
};