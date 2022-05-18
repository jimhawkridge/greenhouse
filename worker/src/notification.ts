import { getForecast } from './forecast';

async function notify(
    token: string, user: string,
    title: string, message: string,
    url_title: string, url: string,
    priority: number, hours: number,
) {
    const payload = {
        token, user,
        title, message,
        url_title, url,
        priority,
        expire: hours * 3600,
        retry: 60,
    }

    const resp = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (resp.status != 200) {
        console.error('Error notifying', resp.text());
    }
}

async function notifyTooHot(token: string, user: string, kv: KVNamespace, temp: number) {
    const sent = await kv.get('notified:tooHot');
    if (sent !== null) {
        return; // Already sent one recently.
    }

    await notify(
        token, user,
        'Greenhouse temperature high!', 'Greenhouse temperature is ' + temp + '°',
        'View current status', 'https://greenhouse.jph.workers.dev',
        0, 4,
    );

    await kv.put('notified:tooHot', '1', { expirationTtl: 4 * 3600 });
}

async function notifyConsiderOpening(token: string, user: string, kv: KVNamespace, location: string, appid: string) {
    const sent = await kv.get('notified:considerOpening');
    if (sent !== null) {
        return; // Already sent one recently.
    }

    const forecast = await getForecast(kv, location, appid);
    await notify(
        token, user,
        'Open the greenhouse?', 'Consider opening the greenhouse? Expected high is ' + forecast.max + '°',
        'View current status', 'https://greenhouse.jph.workers.dev',
        0, 1,
    );

    await kv.put('notified:considerOpening', '1', { expirationTtl: 4 * 3600 });
}

async function notifyConsiderClosing(token: string, user: string, kv: KVNamespace, location: string, appid: string) {
    const sent = await kv.get('notified:considerClosing');
    if (sent !== null) {
        return; // Already sent one recently.
    }

    const forecast = await getForecast(kv, location, appid);
    await notify(
        token, user,
        'Close the greenhouse?', 'Consider closing the greenhouse? Expected low is ' + forecast.min + '°',
        'View current status', 'https://greenhouse.jph.workers.dev',
        0, 4,
    );

    await kv.put('notified:considerClosing', '1', { expirationTtl: 4 * 3600 });
}

function currentHour() {
    return parseInt(
        new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/London' })
    );
}

export { notifyTooHot, notifyConsiderOpening, notifyConsiderClosing, currentHour };