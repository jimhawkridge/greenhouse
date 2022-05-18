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

        body {
            background-color: #333;
            color: #fefefe;
            font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        }

        #content {
            max-width: 400px;
            margin: 0 auto;
        }

        .title {
            font-size: 1.8em;
            font-weight: bold;
            border-bottom: 1px solid #555;
            margin-bottom: 5px;
        }

        .title img {
            width: 35px;
            height: 35px;
        }

        .section {
            margin-top: 10px;
            padding: 5px;
        }

        .section>.subtitle {
            background-color: #555;
            border-radius: 7px;
            font-weight: bold;
            padding: 3px 7px;
            margin-bottom: 3px;
        }

        .subsection {
            margin-bottom: 8px;
        }

        .val {
            background-color: #888;
            padding: 5px;
            border-radius: 5px;
            display: inline-block;
            width: 65px;
            text-align: center;
            margin-left: 5px;
            font-weight: bold;
            font-size: 1.2em;
        }

        .door {
            display: inline-block;
        }

        .door .val {
            background-color: #550;
        }

        .door .val.open {
            background-color: #990;
        }

        .current,
        .min,
        .max {
            vertical-align: middle;
            margin-bottom: 5px;
        }

        .min,
        .max {
            display: inline-block;
        }

        .temp .current .val {
            background-color: #848;
        }

        .humid .current .val {
            background-color: #484;
        }

        .temp .min .val,
        #forecast .min .val {
            background-color: #448;
        }

        .temp .max .val,
        #forecast .max .val {
            background-color: #844;
        }

        .humid .min .val {
            background-color: #555;
        }

        .humid .max .val {
            background-color: #999;
        }

        label {
            display: inline-block;
            text-align: right;
        }

        .current label,
        .min label,
        .left label {
            width: 105px;
        }

        .max label,
        .right label {
            width: 45px;
        }

        .time {
            text-align: right;
            font-size: 0.8em;
            color: #777;
        }

        #lastupdate {
            color: #555;
            font-style: italic;
            text-align: right;
            border-top: 1px solid #444;
            margin-top: 10px;
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

        function units(val, unit) {
            return val + unit;
        }

        function updateReading(base, current, stats, unit) {
            el(base + ' .current .val').innerHTML = units(current, unit);
            el(base + ' .min .val').innerHTML = units(stats.min, unit);
            el(base + ' .min .timeval').innerHTML = time(stats.minTime);
            el(base + ' .max .val').innerHTML = units(stats.max, unit);
            el(base + ' .max .timeval').innerHTML = time(stats.maxTime);
        }

        function updateProbe(base, current, stats) {
            updateReading(base + ' .temp', current.temp, stats.temp, '°');
            updateReading(base + ' .humid', current.humid, stats.humid, '%');
        }

        function updateDoor(sel, open) {
            const e = el(sel);
            e.innerHTML = open ? 'open' : 'closed';
            if (open) {
                e.classList.add('open');
            } else {
                e.classList.remove('open');
            }
        }

        function updateUI(payload) {
            const data = payload.data;
            const current = data.current;
            const stats = data.stats;
            const forecast = payload.forecast;

            // Doors
            updateDoor('#doors #roofL .val', current.roofL.open);
            updateDoor('#doors #roofR .val', current.roofR.open);

            // Probes
            updateProbe('#in', current.in, stats.in);
            updateProbe('#out', current.out, stats.out);

            // Forecast
            el('#forecast .min .val').innerHTML = forecast.min;
            el('#forecast .min .timeval').innerHTML = time(forecast.minTime);
            el('#forecast .max .val').innerHTML = forecast.max;
            el('#forecast .max .timeval').innerHTML = time(forecast.maxTime);

            // Last update
            el('#lastupdate span').innerHTML = new Date(current.timestamp * 1000).toLocaleTimeString();
        }

        async function getData() {
            const resp = await fetch('/data/');
            const payload = await resp.json();
            updateUI(payload);
        }

        window.onload = event => {
            setInterval(getData, 60000);
            getData().then(() => document.body.classList.remove('loading'));

            document.onvisibilitychange = event => {
                if (document.visibilityState === 'visible') {
                    getData();
                }
            };
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/serviceworker.js');
        }
    </script>
</head>

<body class="loading">
    <div class="title">
        <img src="images/icon192.png">
        Greenhouse Monitor
    </div>
    <div id="loading">Loading</div>
    <div id="content">
        <div id="doors" class="section">
            <div class="subtitle">Doors</div>
            <div class="subsection">
                <div id="roofL" class="door left"><label>Left:</label> <span class="val"></span></div>
                <div id="roofR" class="door right"><label>Right:</label> <span class="val"></span></div>
            </div>
        </div>
        <div id="in" class="section">
            <div class="subtitle">Inside</div>
            <div class="subsection temp">
                <div class="current"><label>Temperature:</label> <span class="val"></span></div>
                <div class="min"><label>Min:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
                <div class="max"><label>Max:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
            </div>
            <div class="subsection humid">
                <div class="current"><label>Humidity:</label> <span class="val"></span></div>
                <div class="min"><label>Min:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
                <div class="max"><label>Max:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
            </div>
        </div>
        <div id="out" class="section">
            <div class="subtitle">Outside</div>
            <div class="subsection temp">
                <div class="current"><label>Temperature:</label> <span class="val"></span></div>
                <div class="min"><label>Min:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
                <div class="max"><label>Max:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
            </div>
            <div class="subsection humid">
                <div class="current"><label>Humidity:</label> <span class="val"></span></div>
                <div class="min"><label>Min:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
                <div class="max"><label>Max:</label> <span class="val"></span>
                    <div class="time">@ <span class="timeval"></span></div>
                </div>
            </div>
        </div>
        <div id="forecast" class="section">
            <div class="subtitle">Forecast</div>
            <div class="min"><label>Min:</label> <span class="val"></span>
                <div class="time">@ <span class="timeval"></span></div>
            </div>
            <div class="max"><label>Max:</label> <span class="val"></span>
                <div class="time">@ <span class="timeval"></span></div>
            </div>
        </div>
        <div id="lastupdate">
            Last update: <span></span>
        </div>
    </div>
</body>

</html>
`;

export default ui;