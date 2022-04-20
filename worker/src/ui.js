const ui = () => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Greenhouse</title>
    <link rel="manifest" href="/manifest.json">

    <style>
        .loading #content {
            display: none;
        }

        #loading {
            display: none;
        }

        .loading #loading {
            display: block;
        }
    </style>

    <script>
        function el(selector) {
            return document.querySelector(selector);
        }

        function time(ts) {
            const dt = new Date(ts * 1000);
            return dt.toLocaleTimeString().slice(0, 5);
        }

        function updateReading(base, current, stats) {
            el(base + ' .current .val').innerHTML = current;
            el(base + ' .min .val').innerHTML = stats.min;
            el(base + ' .min .valtime').innerHTML = time(stats.minTime);
            el(base + ' .max .val').innerHTML = stats.max;
            el(base + ' .max .valtime').innerHTML = time(stats.maxTime);
        }

        function updateProbe(base, current, stats) {
            updateReading(base + ' .temp', current.temp, stats.temp);
            updateReading(base + ' .humid', current.humid, stats.humid);
        }

        function updateUI(payload) {
            const data = payload.data;
            const current = data.current;
            const stats = data.stats;
            const forecast = payload.forecast;

            // Doors
            el('#doors #roofL .val').innerHTML = current.roofL.open;
            el('#doors #roofR .val').innerHTML = current.roofR.open;

            // Probes
            updateProbe('#in', current.in, stats.in);
            updateProbe('#out', current.out, stats.out);

            // Forecast
            el('#forecast .min .val').innerHTML = forecast.min;
            el('#forecast .min .valtime').innerHTML = time(forecast.minTime);
            el('#forecast .max .val').innerHTML = forecast.max;
            el('#forecast .max .valtime').innerHTML = time(forecast.maxTime);
        }

        async function getData() {
            const resp = await fetch('/data/');
            const payload = await resp.json();
            updateUI(payload);
        }

        window.onload = event => {
            el('#notifs').addEventListener('click', function () {
                Notification.requestPermission();
            });

            setInterval(getData, 60000);
            getData().then(() => document.body.classList.remove('loading'));
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/serviceworker.js');
        }
    </script>
</head>

<body class="loading">
    <img src="images/icon192.png">
    <div id="loading">Loading</div>
    <div id="content">
        <div id="doors">
            Doors:
            <div id="roofL">Left roof <span class="val"></span></div>
            <div id="roofR">Right roof <span class="val"></span></div>
        </div>
        <div id="in">
            Inside:
            <div class="temp">
                Temp:
                <div class="current"> <span class="val"></span></div>
                <div class="min">Min: <span class="val"></span> @ <span class="valtime"></span></div>
                <div class="max">Max: <span class="val"></span> @ <span class="valtime"></span></div>
            </div>
            <div class="humid">
                Humidity:
                <div class="current"> <span class="val"></span></div>
                <div class="min">Min: <span class="val"></span> @ <span class="valtime"></span></div>
                <div class="max">Max: <span class="val"></span> @ <span class="valtime"></span></div>
            </div>
        </div>
        <div id="out">
            Outside:
            <div class="temp">
                Temp:
                <div class="current"> <span class="val"></span></div>
                <div class="min">Min: <span class="val"></span> @ <span class="valtime"></span></div>
                <div class="max">Max: <span class="val"></span> @ <span class="valtime"></span></div>
            </div>
            <div class="humid">
                Humidity:
                <div class="current"> <span class="val"></span></div>
                <div class="min">Min: <span class="val"></span> @ <span class="valtime"></span></div>
                <div class="max">Max: <span class="val"></span> @ <span class="valtime"></span></div>
            </div>
        </div>
        <div id="forecast">
            Forecast:
            <div class="min">Min: <span class="val"></span> @ <span class="valtime"></span></div>
            <div class="max">Max: <span class="val"></span> @ <span class="valtime"></span></div>
        </div>
    </div>
    <button id="notifs">Enable notifications</button>
</body>

</html>
`;

export default ui;