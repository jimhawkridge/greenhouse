#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_tls.h"

#include "lwip/err.h"
#include "lwip/sockets.h"
#include "lwip/sys.h"
#include "lwip/netdb.h"
#include "lwip/dns.h"

#include "server_details.h"

static const char *TAG = "HTTPS";

// openssl s_client -showcerts -connect <hostname>:443 </dev/null
extern const uint8_t cert_pem_start[] asm("_binary_cert_pem_start");
extern const uint8_t cert_pem_end[] asm("_binary_cert_pem_end");

static const char *REQUEST = "POST %s HTTP/1.1\r\nHost: %s\r\nConnection: close\r\nAccept: */*\r\nUser-Agent: Mozilla/4.0 (compatible; esp32; Windows NT 5.1)\r\nContent-Type: application/json\r\nContent-Length: %d\r\n\r\n%s";

bool https_post(char *msg)
{
    const int wbuflen = 512;
    char wbuf[wbuflen];
    char rbuf[512];
    int ret, len;

    esp_tls_cfg_t cfg = {
        .cacert_pem_buf = cert_pem_start,
        .cacert_pem_bytes = cert_pem_end - cert_pem_start,
    };
    esp_tls_t *tls = esp_tls_init();
    int res = esp_tls_conn_http_new_sync(SERVER_URL, &cfg, tls);
    if (res != 1)
    {
        ESP_LOGE(TAG, "Connection failed...");
        return false;
    }
    ESP_LOGI(TAG, "Connection established...");

    snprintf(wbuf, wbuflen, REQUEST, SERVER_PATH, SERVER_HOST, strlen(msg), msg);
    size_t written_bytes = 0;
    do
    {
        ret = esp_tls_conn_write(tls, wbuf + written_bytes, strlen(wbuf) - written_bytes);
        if (ret >= 0)
        {
            ESP_LOGI(TAG, "%d bytes written", ret);
            written_bytes += ret;
        }
        else if (ret != MBEDTLS_ERR_SSL_WANT_READ && ret != MBEDTLS_ERR_SSL_WANT_WRITE)
        {
            ESP_LOGE(TAG, "esp_tls_conn_write returned 0x%x", ret);
            esp_tls_conn_destroy(tls);
            return false;
        }
    } while (written_bytes < strlen(wbuf));

    bool success = true;
    ESP_LOGI(TAG, "Reading HTTP response...");
    do
    {
        len = sizeof(rbuf) - 1;
        bzero(rbuf, sizeof(rbuf));
        ret = esp_tls_conn_read(tls, (char *)rbuf, len);

        if (ret == MBEDTLS_ERR_SSL_WANT_WRITE || ret == MBEDTLS_ERR_SSL_WANT_READ)
        {
            continue;
        }

        if (ret < 0)
        {
            putchar('\n');
            ESP_LOGE(TAG, "esp_tls_conn_read returned -0x%x", -ret);
            success = false;
            break;
        }

        if (ret == 0)
        {
            putchar('\n');
            ESP_LOGI(TAG, "connection closed");
            break;
        }

        len = ret;
        ESP_LOGD(TAG, "%d bytes read", len);
        for (int i = 0; i < len; i++)
        {
            putchar(rbuf[i]);
        }
    } while (1);
    putchar('\n');
    esp_tls_conn_destroy(tls);

    return success;
}
