
#include <stdio.h>
#include "esp_log.h"

#include "server_details.h"
#include "wifi.h"

static const char *TAG = "MAIN";

void app_main()
{
    ESP_LOGI(TAG, "Greenhouse monitor starting!");

    wifi_init();
    wifi_connect();
}
