// Cognitive Services for spatial analysis: Accelerator app for Person Counting. 

/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
$(document).ready(() => {
  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
  const webSocket = new WebSocket(protocol + location.host);

  // A class for holding the last N points of Insights for a device. Each data point represents the event timestamp, person count, and latency
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.isSelected = false;
      this.personCount = 0; //default value
      this.maxLen = 25; //length of enties in view
      this.timeData = new Array(this.maxLen);
      this.countData = new Array(this.maxLen);
      this.latencyData = new Array(this.maxLen);
    }

    addData(time, count, latency) {
      this.timeData.push(time);
      this.countData.push(count);      
      this.latencyData.push(latency || null);

      if (this.timeData.length > this.maxLen) {
        this.timeData.shift();
        this.countData.shift();
        this.latencyData.shift();
      }
    }

    getLastCount(){
      return this.personCount;
    }
  }

  // Each operation configured in the spatial analysis container is mapped to a TrackedDevice
  class TrackedDevices {
    constructor() {
      this.devices = [];
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          return this.devices[i];
        }
      }

      return undefined;
    }

    getDevicesCount() {
      return this.devices.length;
    }
  }

  const trackedDevices = new TrackedDevices();

  const latencyChartData = {
    datasets: [
      {
        fill: true,
        label: 'Latency',
        yAxisID: 'Latency',
        borderColor: 'rgba(29,115,170,1)',
        pointBoarderColor: 'rgba(255, 204, 0, 1)',
        backgroundColor:  'rgba(29,115,170,0.7)',
        pointHoverBackgroundColor: 'rgba(255, 204, 0, 1)',
        pointHoverBorderColor: 'rgba(255, 204, 0, 1)',
        spanGaps: true,
      }
    ]
  };

  const latencyChartOptions = {
    legend: {
      display: false,
    },
    scales: {
      yAxes: [{
        id: 'Latency',
        type: 'linear',
        ticks:{
          fontSize: 30
        },
        scaleLabel: {
          labelString: 'Latency (sec)',
          display: true,
          fontSize: 40,
          fontColor: 'rgba(29,115,170,1)',
        },
        position: 'left',
      }
    ],
    xAxes: [{
      ticks: {
        fontSize: 20
      }
    }]
    }
  };

  const countChartData = {
    datasets: [
      {
        fill: true,
        label: 'Live Person Count',
        yAxisID: 'Count',
        borderColor: 'rgba(140, 188, 79, 1)',
        pointBoarderColor: 'rgba(24, 120, 240, 1)',
        backgroundColor: 'rgba(140, 188, 79, 0.6)',
        pointHoverBackgroundColor: 'rgba(24, 120, 240, 1)',
        pointHoverBorderColor: 'rgba(24, 120, 240, 1)',
        spanGaps: true,
        pointRadius: 10,
      },
    ]
  };

  const countChartOptions = {
    legend: {
      display: false,
    },
    scales: {
      yAxes: [{
        id: 'Count',
        type: 'linear',
        ticks:{
          fontSize: 30
        },
        scaleLabel: {
          labelString: 'Live Person Count',
          display: true,
          fontSize: 40,
          fontColor: 'rgba(140, 188, 79, 1)',
        },
        position: 'left',
      },
    ],
    xAxes: [{
      ticks: {
        display: false //this will remove only the label
      }
    }]
    }
  };
  // Get the context of the canvas element we want to select
    const latencyChartctx = document.getElementById('latencyChart').getContext('2d');
    const latencyLineChart = new Chart(
      latencyChartctx,
      {
        type: 'line',
        data: latencyChartData,
        options: latencyChartOptions,
      });

      const personCountChartctx = document.getElementById('personCountChart').getContext('2d');
      const personCountLineChart = new Chart(
        personCountChartctx,
        {
          type: 'line',
          data: countChartData,
          options: countChartOptions,
        });

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection. Each device is mapped to an operation in the spatial analysis container.
  let needsAutoSelect = true;
  const deviceCount = document.getElementById('deviceCount');
  const listOfDevices = document.getElementById('listOfDevices');
  function OnSelectionChange() {
    const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);

    for(var i=0; i<trackedDevices.devices.length; i++){
      trackedDevices.devices[i].isSelected = false;
    }

    device.isSelected = true;

    latencyChartData.labels = device.timeData;
    latencyChartData.datasets[0].data = device.latencyData;

    countChartData.labels = device.timeData;
    countChartData.datasets[0].data = device.countData;

    document.getElementById('personCount').innerText = parseInt(device.getLastCount());
  }
  listOfDevices.addEventListener('change', OnSelectionChange, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it is a personCountEvent
  // 3. Find or create a cached device to hold the event data
  // 4. Append the event data
  // 5. Update the chart UI
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      console.log(messageData);

      // In this sample personCountEvent is required
      if (!messageData.MessageDate || !messageData.IotData.events || !messageData.IotData.events[0].type || messageData.IotData.events[0].type !="personCountEvent") {
        return;
      }

      var newDeviceId = messageData.DeviceId + "::" + messageData.IotData.sourceInfo.id;
      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(newDeviceId);

      var countValue = messageData.IotData.events[0].properties.personCount;      
      var latency = (Date.now() - new Date(messageData.IotData.sourceInfo.timestamp).getTime())/1000;

      if (existingDeviceData) {
        existingDeviceData.personCount = countValue;

        if(existingDeviceData.isSelected){
          const personCount = document.getElementById('personCount');
          personCount.innerText = existingDeviceData.personCount;
          const lastEvent = document.getElementById('lastEvent');
          lastEvent.innerText = JSON.stringify(messageData.IotData.events[0]);
        }

        existingDeviceData.addData(messageData.MessageDate, existingDeviceData.personCount, latency);
      } else {
        const newDeviceData = new DeviceData(newDeviceId);

        newDeviceData.personCount = parseInt(newDeviceData.personCount) + countValue;

        if(newDeviceData.isSelected){
          const personCount = document.getElementById('personCount');
          personCount.innerText = newDeviceData.personCount;
          const lastEvent = document.getElementById('lastEvent');
          lastEvent.innerText = JSON.stringify(messageData.IotData.events[0]);
        }

        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText = numDevices === 1 ? `${numDevices} Pipeline` : `${numDevices} Pipelines`;
        newDeviceData.addData(messageData.MessageDate, newDeviceData.personCount, latency);

        // add device to the UI list
        const node = document.createElement('option');
        const nodeText = document.createTextNode(newDeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }

    latencyLineChart.update();
    personCountLineChart.update();
    } catch (err) {
      console.error(err);
    }
  };
});