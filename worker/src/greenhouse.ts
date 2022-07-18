export type TH = {
    temp: number
    humid: number
}

export type Door = {
    open: boolean
}

export type Greenhouse = {
    timestamp: number
    roofL: Door
    roofR: Door
    in: TH
    out: TH
};

export type MinMax = {
    min: number
    minTime: number
    max: number
    maxTime: number
}

export type THMinMax = {
    temp: MinMax
    humid: MinMax
}

export type GreenhouseStats = {
    in: THMinMax
    out: THMinMax
}

export type GreenhouseWithStats = {
    current: Greenhouse
    stats: GreenhouseStats
};

function checkProps(message: any, props: Array<string>): boolean {
    return props.every(prop => message.hasOwnProperty(prop));
}

async function logToAnalytics(analytics: WorkersAnalyticsDataSet, report: Greenhouse) {
    analytics.writeDataPoint({
        blobs: [
            // blob1: source - just in case there is more than one greenhouse ;-)
            "jim",
        ],
        doubles: [
            // double1: source timestamp
            report.timestamp,
            // double2: in temp
            report.in.temp,
            // double3: in humid
            report.in.humid,
            // double4: out temp
            report.out.temp,
            // double5: out humid
            report.out.humid,
            // double6: left door
            report.roofL.open ? 1: 0,
            // double7: right door
            report.roofR.open ? 1: 0,
        ]
    })
}

export async function makeReport(kv: KVNamespace, rawReport: any, analytics?: WorkersAnalyticsDataSet) {
    // {"roofLOpen": false, "roofROpen": true, "tIn": 28, "hIn": 80, "tOut": 18, "hOut": 70}
    if (!checkProps(rawReport, ['roofLOpen', 'roofROpen', 'tIn', 'hIn', 'tOut', 'hOut'])) {
        console.error('Invalid raw message:', rawReport);
        return;
    }

    const report: Greenhouse = {
        timestamp: Math.floor(Date.now() / 1000),
        roofL: {
            open: rawReport.roofLOpen,
        },
        roofR: {
            open: rawReport.roofROpen,
        },
        in: {
            temp: rawReport.tIn,
            humid: rawReport.hIn,
        },
        out: {
            temp: rawReport.tOut,
            humid: rawReport.hOut,
        }
    };
    if (analytics) {
        await logToAnalytics(analytics, report);
    }

    const kvPayload = JSON.stringify(report);
    const logKey = 'report:' + report.timestamp;
    await Promise.all([
        kv.put('lastReport', kvPayload),
        kv.put(logKey, kvPayload, {
            expiration: report.timestamp + 24 * 3600,
            metadata: {
                payload: report,
            }
        })
    ]);

    return report;
}

function compareReading(acc: MinMax, curr: number, timestamp: number) {
    if (curr < acc.min) {
        acc.min = curr;
        acc.minTime = timestamp;
    }
    if (curr > acc.max) {
        acc.max = curr;
        acc.maxTime = timestamp;
    }
}

function compareProbe(acc: THMinMax, curr: TH, timestamp: number) {
    compareReading(acc.temp, curr.temp, timestamp);
    compareReading(acc.humid, curr.humid, timestamp);
}

async function getStats(kv: KVNamespace): Promise<GreenhouseStats> {
    let stats = {
        in: {
            temp: { min: 100, minTime: 0, max: -100, maxTime: 0 },
            humid: { min: 100, minTime: 0, max: -100, maxTime: 0 }
        },
        out: {
            temp: { min: 100, minTime: 0, max: -100, maxTime: 0 },
            humid: { min: 100, minTime: 0, max: -100, maxTime: 0 }
        }
    }

    let statsList = await kv.list({ prefix: 'report:' });
    let needMore = true;
    while (needMore) {
        stats = statsList.keys.reduce((acc: GreenhouseStats, curr: any): GreenhouseStats => {
            const data: Greenhouse = curr.metadata.payload;
            compareProbe(acc.in, data.in, data.timestamp);
            compareProbe(acc.out, data.out, data.timestamp);
            return acc;
        }, stats);
        if (statsList.list_complete) {
            needMore = false;
        }
        else {
            statsList = await kv.list({ prefix: 'report:', cursor: statsList.cursor })
        }
    }

    return stats;
}

export async function getData(kv: KVNamespace): Promise<GreenhouseWithStats> {
    const current: Greenhouse = await kv.get('lastReport', { type: 'json' });
    const stats = await getStats(kv);
    return { current, stats };
}