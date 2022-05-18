#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_log.h"

#include "dht22.h"
#include "https.h"

static const char *TAG = "MON";

static void monitor_task(void *pvParameters)
{
    while (1)
    {
        DHT22Reading in_reading = readDHTSync(4);
        ESP_LOGI(TAG, "In temp %d: %.1f %.1f", in_reading.success, in_reading.temperature, in_reading.humidity);
        DHT22Reading out_reading = readDHTSync(5);
        ESP_LOGI(TAG, "Out temp %d: %.1f %.1f", out_reading.success, out_reading.temperature, out_reading.humidity);
        bool door_left = gpio_get_level(GPIO_NUM_18);
        bool door_right = gpio_get_level(GPIO_NUM_19);
        ESP_LOGI(TAG, "Doors %d, %d", door_left, door_right);

        char buf[256];
        sprintf(
            buf,
            "{\"roofLOpen\": %s, \"roofROpen\": %s, \"tIn\": %.1f, \"hIn\": %.1f, \"tOut\": %.1f, \"hOut\": %.1f}",
            door_left ? "true" : "false",
            door_right ? "true" : "false",
            in_reading.temperature, in_reading.humidity,
            out_reading.temperature, out_reading.humidity);
        ESP_LOGI(TAG, "Sending %s", buf);
        https_post(buf);

        vTaskDelay(15000 / portTICK_RATE_MS);
    }
}

void monitor_start()
{
    gpio_config_t switch_config = {
        .pin_bit_mask = 0x03 << 18, // Pins 18 and 19!
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&switch_config);

    xTaskCreate(&monitor_task, "monitor_task", 8192, NULL, 5, NULL);
}