interface WorkersAnalyticsDataPoint {
  blobs?: Uint8Array[] | string[];
  doubles?: number[];
}
interface WorkersAnalyticsDataSet {
  writeEvent: (e: WorkersAnalyticsDataPoint) => Promise<void>;
  writeDataPoint: (e: WorkersAnalyticsDataPoint) => Promise<void>;
}

interface Bindings {
  GREENHOUSE: KVNamespace;
  OPENWEATHER_LOCATION: string;
  OPENWEATHER_APPID: string;
  PUSHOVER_TOKEN: string;
  PUSHOVER_USER: string;
  WARN_TEMP: number;
  OPEN_HOUR: number;
  CLOSE_HOUR: number;
  GREENHOUSE_DATASET: WorkersAnalyticsDataSet;
}