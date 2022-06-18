typedef struct
{
    bool success;
    float temperature;
    float humidity;
} DHT22Reading;

DHT22Reading dht22_read_sync(int DHTgpio);