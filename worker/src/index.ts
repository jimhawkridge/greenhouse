import { getForecast } from "./forecast";
import { getData, makeReport } from "./greenhouse";
import { manifest, icon192, icon512 } from "./manifest";
import { notifyTooHot, notifyConsiderOpening, notifyConsiderClosing, currentHour } from "./notification";
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
        const report = await makeReport(env.GREENHOUSE, rawReport);
        if (report.in.temp > env.WARN_TEMP) {
          await notifyTooHot(env.PUSHOVER_TOKEN, env.PUSHOVER_USER, env.GREENHOUSE, report.in.temp);
        }
        const isOpen = report.roofL || report.roofR;
        if (!isOpen && currentHour() == env.OPEN_HOUR) {
          await notifyConsiderOpening(env.PUSHOVER_TOKEN, env.PUSHOVER_USER, env.GREENHOUSE, env.OPENWEATHER_LOCATION, env.OPENWEATHER_APPID);
        }
        if (isOpen && currentHour() == env.CLOSE_HOUR) {
          await notifyConsiderClosing(env.PUSHOVER_TOKEN, env.PUSHOVER_USER, env.GREENHOUSE, env.OPENWEATHER_LOCATION, env.OPENWEATHER_APPID);
        }
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
