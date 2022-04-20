import { getForecast } from "./forecast";
import { getData, makeReport } from "./greenhouse";
import { manifest, icon192, icon512 } from "./manifest";
import sw from "./serviceworker";
import ui from "./ui";

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    let url = new URL(request.url);
    switch (url.pathname) {
      case '/data/':
        const data = await getData(env.GREENHOUSE);
        const forecast = await getForecast(env.GREENHOUSE, env.OPENWEATHER_LOCATION, env.OPENWEATHER_APPID);
        return new Response(
          JSON.stringify({
            data,
            forecast
          }),
          { headers: { 'content-type': 'application/json' } }
        )

      case '/report/':
        const rawReport = await request.json();
        await makeReport(env.GREENHOUSE, rawReport);
        return new Response('{}', { headers: { 'content-type': 'application/json' } });

      case '/manifest.json':
        return new Response(manifest(), { headers: { 'content-type': 'application/json' } });

      case '/images/icon192.png':
        return new Response(icon192(), { headers: { 'content-type': 'image/png' } });

      case '/images/icon512.png':
        console.log(`zero is '${icon512()[1]}'`);
        return new Response(icon512(), { headers: { 'content-type': 'image/png' } });

      case '/serviceworker.js':
        return new Response(sw(), { headers: { 'content-type': 'application/javascript' } });

      default:
        return new Response(ui(), { headers: { 'content-type': 'text/html' } });
    }
  }
};
