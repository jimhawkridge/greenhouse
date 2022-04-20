export type Forecast = {
    min: number
    minTime: number
    max: number
    maxTime: number
};

export async function getForecast(kv: KVNamespace, location: string, appid: string): Promise<Forecast | null> {
    const cachedForecast: Forecast = await kv.get('forecast', { type: 'json' });
    if (cachedForecast !== null) {
        return cachedForecast;
    }

    const openweatherURL = `http://api.openweathermap.org/data/2.5/forecast?id=${location}&units=metric&appid=${appid}`;
    const response = await fetch(openweatherURL);
    if (!response.ok) {
        return null;
    }
    const responseData = await response.json();

    // 8 forecasts at 3 hourly intervals
    const forecast = responseData['list'].slice(0, 8).reduce((acc: Forecast, current: any): Forecast => {
        if (current.main.temp < acc.min) {
            acc.min = Math.round(current.main.temp);
            acc.minTime = current.dt;
        }
        if (current.main.temp > acc.max) {
            acc.max = Math.round(current.main.temp);
            acc.maxTime = current.dt;
        }
        return acc;
    }, {
        min: 100,
        minTime: null,
        max: -100,
        maxTime: null,
    })
    await kv.put('forecast', JSON.stringify(forecast), { expirationTtl: 3600 });
    return forecast;
}