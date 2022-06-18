
#include <stdio.h>
#include <stdbool.h>
#include "esp_log.h"

#include "monitor.h"
#include "server_details.h"
#include "wifi.h"

static const char *TAG = "MAIN";

void app_main()
{
    ESP_LOGI(TAG, "Greenhouse monitor starting!");

    wifi_init();
    wifi_connect();

    monitor_watchdog(true);
}
