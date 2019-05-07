//#region Variables

let def_url = 'ws://192.168.0.14:5678';
let websc;

let current_tp = 0;

let chartCustomColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)'
};


let Un_arr = [0, 0, 0];
let Uabc_arr = [0, 0, 0];
let Iabc_arr = [0, 0, 0];
let Pabc_arr = [0, 0, 0];
let cos_arr = [0, 0, 0];

let MaxUn_arr = [0, 0, 0];
let MaxUabc_arr = [0, 0, 0];
let MaxIabc_arr = [0, 0, 0];

let MinUn_arr = [0, 0, 0];
let MinUabc_arr = [0, 0, 0];
let MinIabc_arr = [0, 0, 0];

let P_val = 0;
let PA_val = 0;
let Pr_val = 0;
let cos_val = 0;

let freq = 0;

let chart_labels = ['Фазное напряжение', 'Линейное напряжение', 'Линейные токи', 'Полная мощность', 'Коэфициент мощности', 'Сбросить период'];
let chart_items = [['Ua-n', 'Ub-n', 'Uc-n'],['Ua-b', 'Ub-c', 'Ua-c'],['Ia','Ib','Ic'],['Pa','Pb','Pc'],['cosφ a', 'cosφ b', 'cosφ c']];
let measurement_units = ['B', 'A', 'KBA','KBAp', 'Hz', 'KBт'];
let wanted_data_args = ['Un', 'U', 'I', 'AP', 'cos'];
let tp_arr = ['tp630', 'tp7'];

let alert_types = ['alert-success', 'alert-danger', 'alert-warning', 'alert-info'];

let values_flag = 0;
let selected_chart = 0;

let time_range = [0, 0];

//#endregion

function viewInitialization() {
    selectTP();
    dataValuesSelector();
    openWsConnection();
}

function dataValuesSelector() {
    $('#cur_values').on('focus.bs.button', function (e) {
        values_flag = 0;
        document.getElementById("reset_min_max").classList.add('invisible');
    });
    $('#min_values').on('focus.bs.button', function (e) {
        values_flag = 1;
        document.getElementById("reset_min_max").classList.remove('invisible');
        let reset = document.getElementById("reset_min_max");
        reset.onclick = function () {
            websc.send(JSON.stringify({action: 'reset_min'}));
        }
    });
    $('#max_values').on('focus.bs.button', function (e) {
        values_flag = 2;
        document.getElementById("reset_min_max").classList.remove('invisible');
        let reset = document.getElementById("reset_min_max");
        reset.onclick = function () {
            websc.send(JSON.stringify({action: 'reset_max'}));
        }
    });
    $('#start_date').datepicker({
        maxDate: new Date(),
        position: "top right"
    });
    $('#end_date').datepicker({
        maxDate: new Date(),
        position: "top right"
    });
    $('#set_range').on('click', function (e) {
        chartDrawTypeSelector();
    });
    $('#reset_zoom').on('click', function (e) {
        window.myChart.resetZoom();
    });
    $('.dropdown-menu a').on('click', function () {
        drawSelectedGraph($(this).text());
    })

}

function selectTP() {
    let stp = document.getElementById('tp_selector');
    stp.addEventListener("change", function (f) {
        current_tp = stp.selectedIndex;
    });
}

function openWsConnection() {
    let ws = new WebSocket(def_url);
    websc = ws;

    ws.onmessage = function (event) {
        let data = JSON.parse(event.data);
        parseIncomingJson(data);
    };
    ws.onopen = function () {
        console.log("Connection established");
    };
    ws.onclose = function (ev) {
        if (ev.wasClean) {
            console.log("Connection closed clearly");
        } else {
            console.log("Connection interrupted");
        }
        console.log("Code: " + ev.code + ", reason: " + ev.reason);
    };
    drawRealtimeChart();
}

function parseIncomingJson(raw_data) {
    let root_key = Object.keys(raw_data)[0];
    let values;

    switch (current_tp) {
        case 0:
            if (root_key === 'tp630') {
                values = raw_data[root_key][0]
            } else if (root_key === 'graph_data') {
                drawCustomStaticChart(raw_data[root_key]);
            }
            break;
        case 1:
            if (root_key === 'tp7') {
                values = raw_data[root_key][0];
            } else if (root_key === 'graph_data') {
                drawCustomStaticChart(raw_data[root_key]);
            }
            break;
    }


    if (values !== undefined) {
        Un_arr = [values.Uan, values.Ubn, values.Ucn];
        Uabc_arr = [values.Uab, values.Ubc, values.Uac];
        Iabc_arr = [values.Ia, values.Ib, values.Ic];
        Pabc_arr = [VAtoKVA(values.APa), VAtoKVA(values.APb), VAtoKVA(values.APc)];
        cos_arr = [values.cosa, values.cosb, values.cosc];
        freq = values.freq;
        MaxUn_arr = [values.MaxUan, values.MaxUbn, values.MaxUcn];
        MaxUabc_arr = [values.MaxUab, values.MaxUbc, values.MaxUac];
        MaxIabc_arr = [values.MaxIa, values.MaxIb, values.MaxIc];
        MinUn_arr = [values.MinUan, values.MinUbn, values.MinUcn];
        MinUabc_arr = [values.MinUab, values.MinUbc, values.MinUac];
        MinIabc_arr = [values.MinIa, values.MinIb, values.MinIc];
        P_val = VAtoKVA(values.P);
        PA_val = VAtoKVA(values.Pa);
        Pr_val = VAtoKVA(values.Pr);
        cos_val = values.Pc;
    }

    if (values_flag === 1) {
        setMinValues();
    } else if (values_flag === 2) {
        setMaxValues();
    } else {
        setRealtimeValues();
    }
}

function VAtoKVA(value) {
    return parseInt(value)/1000;
}

function setRealtimeValues() {
    try {
        document.getElementById("uan").innerText = Un_arr[0].toString() + " " + measurement_units[0];
        document.getElementById("ubn").innerText = Un_arr[1].toString() + " " + measurement_units[0];
        document.getElementById("ucn").innerText = Un_arr[2].toString() + " " + measurement_units[0];

        document.getElementById("uab").innerText = Uabc_arr[0].toString() + " " + measurement_units[0];
        document.getElementById("ubc").innerText = Uabc_arr[1].toString() + " " + measurement_units[0];
        document.getElementById("uac").innerText = Uabc_arr[2].toString() + " " + measurement_units[0];

        document.getElementById("ia").innerText = Iabc_arr[0].toString() + " " + measurement_units[1];
        document.getElementById("ib").innerText = Iabc_arr[1].toString() + " " + measurement_units[1];
        document.getElementById("ic").innerText = Iabc_arr[2].toString() + " " + measurement_units[1];

        document.getElementById("pa").innerText = Pabc_arr[0].toString() + " " + measurement_units[2];
        document.getElementById("pb").innerText = Pabc_arr[1].toString() + " " + measurement_units[2];
        document.getElementById("pc").innerText = Pabc_arr[2].toString() + " " + measurement_units[2];

        document.getElementById("cosa").innerText = cos_arr[0].toString();
        document.getElementById("cosb").innerText = cos_arr[1].toString();
        document.getElementById("cosc").innerText = cos_arr[2].toString();

        document.getElementById("p").innerText = P_val.toString() + " " + measurement_units[2];
        document.getElementById("pr").innerText = Pr_val.toString() + " " + measurement_units[3];
        document.getElementById("p_a").innerText = PA_val.toString() + " " + measurement_units[5];
        document.getElementById("cos").innerText = cos_val.toString();

        document.getElementById("freq").innerText = freq.toString() + " " + measurement_units[4];
    } catch (e) {
        console.log(e);
    }
}

function setMinValues() {
    document.getElementById("uan").innerText = MinUn_arr[0].toString() + " " + measurement_units[0];
    document.getElementById("ubn").innerText = MinUn_arr[1].toString() + " " + measurement_units[0];
    document.getElementById("ucn").innerText = MinUn_arr[2].toString() + " " + measurement_units[0];

    document.getElementById("uab").innerText = MinUabc_arr[0].toString() + " " + measurement_units[0];
    document.getElementById("ubc").innerText = MinUabc_arr[1].toString() + " " + measurement_units[0];
    document.getElementById("uac").innerText = MinUabc_arr[2].toString() + " " + measurement_units[0];

    document.getElementById("ia").innerText = MinIabc_arr[0].toString() + " " + measurement_units[1];
    document.getElementById("ib").innerText = MinIabc_arr[1].toString() + " " + measurement_units[1];
    document.getElementById("ic").innerText = MinIabc_arr[2].toString() + " " + measurement_units[1];

    document.getElementById("pa").innerText = '';
    document.getElementById("pb").innerText = '';
    document.getElementById("pc").innerText = '';

    document.getElementById("cosa").innerText = '';
    document.getElementById("cosb").innerText = '';
    document.getElementById("cosc").innerText = '';

    document.getElementById("p").innerText = '';
    document.getElementById("pr").innerText = '';
    document.getElementById("p_a").innerText = '';
    document.getElementById("cos").innerText = '';

    document.getElementById("freq").innerText = freq.toString() + " " + measurement_units[4];
}

function setMaxValues() {
    document.getElementById("uan").innerText = MaxUn_arr[0].toString() + " " + measurement_units[0];
    document.getElementById("ubn").innerText = MaxUn_arr[1].toString() + " " + measurement_units[0];
    document.getElementById("ucn").innerText = MaxUn_arr[2].toString() + " " + measurement_units[0];

    document.getElementById("uab").innerText = MaxUabc_arr[0].toString() + " " + measurement_units[0];
    document.getElementById("ubc").innerText = MaxUabc_arr[1].toString() + " " + measurement_units[0];
    document.getElementById("uac").innerText = MaxUabc_arr[2].toString() + " " + measurement_units[0];

    document.getElementById("ia").innerText = MaxIabc_arr[0].toString() + " " + measurement_units[1];
    document.getElementById("ib").innerText = MaxIabc_arr[1].toString() + " " + measurement_units[1];
    document.getElementById("ic").innerText = MaxIabc_arr[2].toString() + " " + measurement_units[1];

    document.getElementById("pa").innerText = '';
    document.getElementById("pb").innerText = '';
    document.getElementById("pc").innerText = '';

    document.getElementById("cosa").innerText = '';
    document.getElementById("cosb").innerText = '';
    document.getElementById("cosc").innerText = '';

    document.getElementById("p").innerText = '';
    document.getElementById("pr").innerText = '';
    document.getElementById("p_a").innerText = '';
    document.getElementById("cos").innerText = '';

    document.getElementById("freq").innerText = freq.toString() + " " + measurement_units[4];
}

function drawSelectedGraph(value) {
    switch (value) {
        case chart_labels[0]:
            selected_chart = 0;
            break;
        case chart_labels[1]:
            selected_chart = 1;
            break;
        case chart_labels[2]:
            selected_chart = 2;
            break;
        case chart_labels[3]:
            selected_chart = 3;
            break;
        case chart_labels[4]:
            selected_chart = 4;
            break;
        case chart_labels[5]:
            clearRange();
            drawRealtimeChart();
            break;
        default:
            selected_chart = 0;
            break;
    }
    chartDrawTypeSelector();
}

function isRangeTimeValid() {
    let start = document.getElementById('start_date');
    let finish = document.getElementById('end_date');
    let begin = 0;
    let end = 0;

    if (isNotEmpty(start.value)) {
        begin = getMillisOfDate(start.value);
    }
    if (isNotEmpty(finish.value)) {
        end = getMillisOfDate(finish.value);
    }

    if (begin !== 0 && end !== 0) {
        if (isRangeValid(begin, end)) {
            return 1;
        } else {
            return -1;
        }
    } else {
        return 0;
    }
}

function isNotEmpty(value) {
    return value !== undefined || value !== '';
}

function getMillisOfDate(value) {
    let arr0 = value.split(" ");
    let arr1 = arr0[0].split(".");
    let newStr = arr1[1] + "." + arr1[0] + "." + arr1[2] + " " + arr0[1];
    if (!isNaN(Date.parse(newStr))) {
        return Date.parse(newStr);
    } else {
        return 0;
    }
}

function isRangeValid(start_value, end_value) {
    if (start_value > end_value) {
        let temp = start_value;
        start_value = end_value;
        end_value = temp;
    }
    if ((end_value - start_value) > 21600000) {
        return false;
    } else {
        time_range[0] = start_value;
        time_range[1] = end_value;
        return true;
    }
}

function showAlert(type, value){
    let parent_div = document.getElementById("notifications");
    let child_div = document.createElement("div");
    let close_button = document.createElement("button");
    let span1 = document.createElement("span");

    child_div.setAttribute("class", "alert alert-dismissible ztta-alert-top fade show");
    child_div.classList.add(type);
    child_div.setAttribute("role", "alert");
    child_div.innerText = value;

    close_button.setAttribute("type", "button");
    close_button.setAttribute("class", "close");
    close_button.setAttribute("data-dismiss", "alert");
    close_button.setAttribute("aria-label", "close");

    span1.setAttribute("aria-hidden", "true");
    span1.innerHTML = '&times';

    close_button.appendChild(span1);
    child_div.appendChild(close_button);
    parent_div.appendChild(child_div);
}

function chartDrawTypeSelector() {
    if (isRangeTimeValid() === 1) {
        drawStaticChart(wanted_data_args[selected_chart], time_range[0], time_range[1]);
    } else if (isRangeTimeValid() === 0) {
        drawRealtimeChart();
    } else {
        showAlert(alert_types[1], "Диапазон не должен превышать 6 часов");
    }
}

function drawStaticChart(type, begin, end) {
    websc.send(JSON.stringify({action: 'get', begin_ms: begin, end_ms: end, par: type, tp: tp_arr[current_tp]}));
}

function drawRealtimeChart() {
    clearCurrentChart();
    let config;

    switch (selected_chart) {
        case 0:
            config = buildCustomChartConfig(chart_labels[0], measurement_units[0], onRefreshUn, chart_items[0]);
            break;
        case 1:
            config = buildCustomChartConfig(chart_labels[1], measurement_units[0], onRefreshUabc, chart_items[1]);
            break;
        case 2:
            config = buildCustomChartConfig(chart_labels[2], measurement_units[1], onRefreshIabc, chart_items[2]);
            break;
        case 3:
            config = buildCustomChartConfig(chart_labels[3], measurement_units[2], onRefreshPabc, chart_items[3]);
            break;
        case 4:
            config = buildCustomChartConfig(chart_labels[4], '', onRefreshCos, chart_items[4]);
            break;
        default:
            config = buildCustomChartConfig(chart_labels[0], measurement_units[0], onRefreshUn, chart_items[0]);
            break;
    }

    let ctx = document.getElementById('myChart').getContext('2d');
    window.myChart = new Chart(ctx, config);
}

function clearRange() {
    document.getElementById('start_date').value = '';
    document.getElementById('end_date').value = '';
    time_range = [0, 0];
}

function buildCustomChartConfig(chart_name, y_axes_name, func, lbls) {
    let config = {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            title: {
                display: true,
                text: chart_name
            },
            scales: {
                xAxes: [{
                    type: 'realtime',
                    realtime: {
                        duration: 20000,
                        refresh: 1000,
                        delay: 2000,
                        onRefresh: onRefreshUn
                    }
                }],
                yAxes: [{
                    type: 'linear',
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: y_axes_name
                    }
                }]
            },
            responsive: true,
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            pan: {
                enabled: true,
                mode: 'x',
                rangeMax: {
                    x: 4000
                },
                rangeMin: {
                    x: 0
                }
            },
            zoom: {
                enabled: true,
                mode: 'x',
                rangeMax: {
                    x: 50000
                },
                rangeMin: {
                    x: 100
                }
            }
        }
    }

    config.options.scales.xAxes[0].realtime.onRefresh = func;
    config.data.datasets.push(buildCustomChartDataset(lbls[0], 0));
    config.data.datasets.push(buildCustomChartDataset(lbls[1], 2));
    config.data.datasets.push(buildCustomChartDataset(lbls[2], 3));

    return config;
}

function buildCustomChartDataset(name, _color) {
    let color = Chart.helpers.color;
    let colorNames = Object.keys(chartCustomColors);
    let colorName = colorNames[_color];
    let newColor = chartCustomColors[colorName];

    return {
        label: name,
        backgroundColor: color(newColor).alpha(0.5).rgbString(),
        borderColor: newColor,
        fill: false,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        data: []
    };
}

function onRefreshUn(chart) {
    chart.config.data.datasets[0].data.push({
        x: Date.now(),
        y: Un_arr[0]
    });
    chart.config.data.datasets[1].data.push({
        x: Date.now(),
        y: Un_arr[1]
    });
    chart.config.data.datasets[2].data.push({
        x: Date.now(),
        y: Un_arr[2]
    });
}

function onRefreshUabc(chart) {
    chart.config.data.datasets[0].data.push({
        x: Date.now(),
        y: Uabc_arr[0]
    });
    chart.config.data.datasets[1].data.push({
        x: Date.now(),
        y: Uabc_arr[1]
    });
    chart.config.data.datasets[2].data.push({
        x: Date.now(),
        y: Uabc_arr[2]
    });
}

function onRefreshIabc(chart) {
    chart.config.data.datasets[0].data.push({
        x: Date.now(),
        y: Iabc_arr[0]
    });
    chart.config.data.datasets[1].data.push({
        x: Date.now(),
        y: Iabc_arr[1]
    });
    chart.config.data.datasets[2].data.push({
        x: Date.now(),
        y: Iabc_arr[2]
    });
}

function onRefreshPabc(chart) {
    chart.config.data.datasets[0].data.push({
        x: Date.now(),
        y: Pabc_arr[0]
    });
    chart.config.data.datasets[1].data.push({
        x: Date.now(),
        y: Pabc_arr[1]
    });
    chart.config.data.datasets[2].data.push({
        x: Date.now(),
        y: Pabc_arr[2]
    });
}

function onRefreshCos(chart) {
    chart.config.data.datasets[0].data.push({
        x: Date.now(),
        y: cos_arr[0]
    });
    chart.config.data.datasets[1].data.push({
        x: Date.now(),
        y: cos_arr[1]
    });
    chart.config.data.datasets[2].data.push({
        x: Date.now(),
        y: cos_arr[2]
    });
}

function clearCurrentChart() {
    try {
        window.myChart.destroy();
    } catch (e) {
        console.log(e);
    }
}

function drawCustomStaticChart(array) {
    clearCurrentChart();
    let config = buildStaticCustomDataset(selected_chart);

    switch (selected_chart) {
        case 0:
            fillDataUn(config, array);
            break;
        case 1:
            fillDataUabc(config, array);
            break;
        case 2:
            fillDataIabc(config, array);
            break;
        case 3:
            fillDataPabc(config, array);
            break;
        case 4:
            fillDataCos(config, array);
            break;
        default:
            fillDataUn(config, array);
            break;
    }

    let ctx = document.getElementById('myChart').getContext('2d');
    window.myChart = new Chart(ctx, config);
}

function buildStaticCustomDataset(selected) {
    let unit = selected;
    if (selected === 1) unit = 0;
    let config = buildStaticChartConfig(chart_labels[selected], measurement_units[unit]);
    for (let i = 0; i < 3; i++) {
        config.data.datasets.push(buildCustomChartDataset(chart_items[selected][i], i+1));
    }
    return config;
}

function buildStaticChartConfig(chart_name, y_axes_name) {
    return config = {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            title: {
                display: true,
                text: chart_name
            },
            scales: {
                yAxes: [{
                    type: 'linear',
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: y_axes_name
                    }
                }]
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            hover: {
                mode: 'nearest',
                intersect: false
            },
            pan: {
                enabled: false,
                mode: 'x',
                rangeMax: {
                    x: 4000
                },
                rangeMin: {
                    x: 0
                }
            },
            zoom: {
                enabled: true,
                mode: 'x',
                rangeMax: {
                    x: null
                },
                rangeMin: {
                    x: 1000
                }
            }
        }
    }
}

function fillDataUn(config, values) {
    for (let i = 0; i < values.length; i++) {
        config.data.datasets[0].data.push({
            x: values[i].time,
            y: values[i].Uan
        });
        config.data.datasets[1].data.push({
            x: values[i].time,
            y: values[i].Ubn
        });
        config.data.datasets[2].data.push({
            x: values[i].time,
            y: values[i].Ucn
        });
        config.data.labels.push(convertMsecToTime(values[i].time));
    }
}

function fillDataUabc(config, values) {
    for (let i = 0; i < values.length; i++) {
        config.data.datasets[0].data.push({
            x: values[i].time,
            y: values[i].Uab
        });
        config.data.datasets[1].data.push({
            x: values[i].time,
            y: values[i].Ubc
        });
        config.data.datasets[2].data.push({
            x: values[i].time,
            y: values[i].Uac
        });
        config.data.labels.push(convertMsecToTime(values[i].time));
    }
}

function fillDataIabc(config, values) {
    for (let i = 0; i < values.length; i++) {
        config.data.datasets[0].data.push({
            x: values[i].time,
            y: values[i].Ia
        });
        config.data.datasets[1].data.push({
            x: values[i].time,
            y: values[i].Ib
        });
        config.data.datasets[2].data.push({
            x: values[i].time,
            y: values[i].Ic
        });
        config.data.labels.push(convertMsecToTime(values[i].time));
    }
}

function fillDataPabc(config, values) {
    for (let i = 0; i < values.length; i++) {
        config.data.datasets[0].data.push({
            x: values[i].time,
            y: VAtoKVA(values[i].APa)
        });
        config.data.datasets[1].data.push({
            x: values[i].time,
            y: VAtoKVA(values[i].APb)
        });
        config.data.datasets[2].data.push({
            x: values[i].time,
            y: VAtoKVA(values[i].APc)
        });
        config.data.labels.push(convertMsecToTime(values[i].time));
    }
}

function fillDataCos(config, values) {
    for (let i = 0; i < values.length; i++) {
        config.data.datasets[0].data.push({
            x: values[i].time,
            y: values[i].cosa
        });
        config.data.datasets[1].data.push({
            x: values[i].time,
            y: values[i].cosb
        });
        config.data.datasets[2].data.push({
            x: values[i].time,
            y: values[i].cosc
        });
        config.data.labels.push(convertMsecToTime(values[i].time));
    }
}

function convertMsecToTime(value) {
    let date = new Date(parseInt(value));

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    //let msec  = date.getMilliseconds();

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return(hours + ":" + minutes + ":" + seconds);
}














