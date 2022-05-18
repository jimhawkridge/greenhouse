typedef struct
{
    bool success;
    float temperature;
    float humidity;
} DHT22Reading;

DHT22Reading readDHTSync(int DHTgpio);