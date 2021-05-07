// Cognitive Services for spatial analysis: Accelerator app for all operations. 

/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

var milliSecondsPerMinute = 60000
var bucketCount = 6 // number of x axes
var maxLength = 25;

const labelsConfig = {
  'personZoneEnterExitEvent': [
    {
      subEventType: 'Enter',
      title: '# People Entered',
      aggregatedCountTitle: '# of people Entered in last 1 minute'
    },
    {
      subEventType: 'Exit',
      title: '# People Exited',
      aggregatedCountTitle: '# of people Exited in last 1 minute'
    }
  ],
  'personCountEvent': [
    {
      subEventType: '',
      title: 'People Count',
      aggregatedCountTitle: '# of people in checkout area'
    },
    {
      subEventType: 'face_mask',
      title: 'People Count with Facemask',
      aggregatedCountTitle: '# of people wearing face mask in checkout area'
    }
  ],
  'personDistanceEvent': [
    {
      subEventType: '',
      title: 'People Count',
      aggregatedCountTitle: '# of people in checkout area'
    },
    {
      subEventType: 'violation',
      title: 'ViolationCount',
      aggregatedCountTitle: '# of people in distance violation'
    }
  ],
  'personLineEvent': [
    {
      subEventType: 'CrossRight',
      title: '# People Entered',
      aggregatedCountTitle: '# of people Entered in last 1 minute'
    },
    {
      subEventType: 'CrossLeft',
      title: '# People Exited',
      aggregatedCountTitle: '# of people Exited in last 1 minute'
    }
  ]
}
class DeviceData {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.sources = new Array()
  }
  findSource(sourceId) {
    return this.sources.find(source => source.sourceId === sourceId);
  }
}

class SourceData {
  constructor(sourceId) {
    this.sourceId = sourceId;
    this.eventTypes = new Array();
    this.eventData = new Array();
  }

  addData(iotHubEvent, time) {
    iotHubEvent.events.forEach(event => {
      this.eventTypes.indexOf(event.type) === -1 && this.eventTypes.push(event.type);
      this.eventData.unshift(new TimeSeriesEvent(event, time, iotHubEvent.detections));
      var deleteIndex = this.eventData.length;
      var index = deleteIndex - 1;
      while (index > 0) {
        var lastEvent = this.eventData[index--];
        if (Date.now() - lastEvent.timestamp <= milliSecondsPerMinute) {
          break;
        }
        deleteIndex--;
      }
      this.eventData.splice(deleteIndex);
    });
  }

  // Called from setInterval, generate the chart and aggregated data
  getData() {
    var result = { "data": [], "labels": {}, "aggregatedCounts": [] }
    this.eventTypes.forEach(eventType => {
      var allEventsForSelectedEventType = this.eventData.filter(timeSerieEvent => timeSerieEvent.event.type == eventType);
      if (eventType == "personZoneDwellTimeEvent") {
        var exitCounts = this.getEventData(allEventsForSelectedEventType, "Exit");
        result["aggregatedCounts"].push({ "value": (exitCounts["aggregatedCounts"]) / allEventsForSelectedEventType.length, "title": "Avg checkout wait time(sec) in last 1 min" });
        result["labels"] = exitCounts["labels"];
      }
      else 
      {
        var dataset1 = this.getEventData(allEventsForSelectedEventType, labelsConfig[eventType][0].subEventType);
        var dataset2 = this.getEventData(allEventsForSelectedEventType, labelsConfig[eventType][1].subEventType);
        result["data"].push({ "counts": dataset1["data"], "title": labelsConfig[eventType][0].title });
        result["data"].push({ "counts": dataset2["data"], "title": labelsConfig[eventType][1].title });
        result["aggregatedCounts"].push({ "value": dataset1["aggregatedCounts"], "title": labelsConfig[eventType][0].aggregatedCountTitle });
        result["aggregatedCounts"].push({ "value": dataset2["aggregatedCounts"], "title": labelsConfig[eventType][1].aggregatedCountTitle });
        result["labels"] = dataset2["labels"];
      }
    });
    return result;
  }

  // Called for each event type
  // 1. Create an dataset array based on each event (e.g. set value 1 if line crossing enter event otherwise 0)
  // 2. Create date labels for last 1 minute with 10 sec time buckets
  // 3. Aggregate counts based on time bucket
  // 4. Caluclate overall counts for cards
  getEventData(events, eventSubType) {
    if (events.length == 0)
      return {}
    var countsWithTimeGrouping = events.reduce((a, o) => (a["data"].unshift(this.calculateCount(o, eventSubType)) && a["labels"].unshift(o.timestamp), a), { "data": [], "labels": [] })
    var dateLabels = [];
    var groupedData = new Array(bucketCount + 1).fill(0);
    if (countsWithTimeGrouping["labels"].length > 0) {
      var startDate = new Date(countsWithTimeGrouping["labels"][0]);
      dateLabels = Array.from({length: 6}, (_, i) => startDate.getTime() + 1000 * 10 * i)
      var data = countsWithTimeGrouping["data"];
      var index = 0;
      for (var i = 0; i < data.length; i++) {
        if (new Date(countsWithTimeGrouping["labels"][i]) > dateLabels[index + 1]) index++
        groupedData[index] = groupedData[index] + data[i];
      }
      //convert date to formatted string
      dateLabels.forEach((obj, index, array) => array[index] = new Date(array[index]).toLocaleString())
    }
    return { "data": groupedData, "labels": dateLabels, "aggregatedCounts": groupedData.reduce((a, b) => a + b, 0).toFixed(0) };
  }
  
  // Called for each event type
  // 1. Return count value based on event type
  
  calculateCount(timeSeriesEvent, eventSubType) {
    if (timeSeriesEvent.event.type == "personZoneEnterExitEvent" || timeSeriesEvent.event.type == "personLineEvent") {
      return timeSeriesEvent.event.properties.status == eventSubType ? 1 : 0 // eventSubType = Enter|Exit|crossRight|CrossLeft
    }
    else if (timeSeriesEvent.event.type == "personCountEvent") {
      if (eventSubType == "face_mask") {
        return timeSeriesEvent.detections.filter((detection) => eventSubType in detection.metadata.attributes).length;
      }
      else {
        return timeSeriesEvent.event.properties.personCount
      }
    }
    else if (timeSeriesEvent.event.type == "personZoneDwellTimeEvent") {
      return (timeSeriesEvent.event.properties.durationMs / 1000)
    }
    else if (timeSeriesEvent.event.type == "personDistanceEvent") {
      if (eventSubType == "violation") {
        return timeSeriesEvent.event.properties.distanceViolationPersonCount
      }
      else {
        return timeSeriesEvent.event.properties.personCount
      }
    }
    return []
  }
}

class TimeSeriesEvent {
  constructor(insightEvent, time, detections) {
    this.event = insightEvent;
    this.detections = detections
    this.timestamp = new Date(time);
  }
}

// Class reponsible for binding views and data

// eslint-disable-next-line no-unused-vars
class Controller {
  constructor() {
    const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
    this.webSocket = new WebSocket(protocol + location.host)  
    this.webSocket.onmessage = this.onMessage.bind(this);
    
    this.deviceList = new Array();
    this.dataChart = new DataChart();
    this.latencyChart = new LatencyChart();
    
    this.deviceListView = new ListView("listOfDevices", this.onDeviceChanged.bind(this));
    this.sourceListView = new ListView("listOfSources", this.onSourceChanged.bind(this))
    
    this.cardViews = Array.from({length: 3}, (_, i) => new CardView(i + 1))
    setInterval(this.updateData.bind(this), 1000);
  }

  onDeviceChanged(newDeviceId) {
    const device = this.findDevice(newDeviceId);
    if (device) {
      this.sourceListView.addItems(device.sources.map(source => source.sourceId));
    }
  }
  onSourceChanged() { }

  findDevice(deviceId) {
    return this.deviceList.find(device => device.deviceId === deviceId);
  }

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Find or create a cached device
  // 3. Find or create a cached camera/source to hold the event data
  // 4. Append the event data
  onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      //console.log(messageData);

      // In this sample personCountEvent is required
      if (!messageData.MessageDate || !messageData.IotData.events || !messageData.IotData.events[0].type) {
        return;
      }

      var newDeviceId = messageData.DeviceId;
      var sourceId = messageData.IotData.sourceInfo.id
      var latency = (Date.now() - new Date(messageData.IotData.sourceInfo.timestamp).getTime()) / 1000;
      this.latencyChart.chartData.datasets[0].data.push(latency)
      this.latencyChart.chartData.labels.push(messageData.MessageDate);

      if (this.latencyChart.chartData.labels.length > maxLength) {
        this.latencyChart.chartData.labels.shift();
        this.latencyChart.chartData.datasets[0].data
      }

      // find or add device to list of tracked devices
      var device = this.findDevice(newDeviceId);
      if (!device) {
        device = new DeviceData(newDeviceId);
        this.deviceListView.addItem(newDeviceId);
        this.deviceList.push(device);
      }

      // find or add source to list of sources
      var source = device.findSource(sourceId)
      if (!source) {
        source = new SourceData(sourceId);
        if (device.deviceId == this.deviceListView.getSelectedItem()) {
          this.sourceListView.addItem(sourceId);
        }
        device.sources.push(source);
      }
      source.addData(messageData.IotData, messageData.MessageDate);
      const lastEvent = document.getElementById('lastEvent');
      lastEvent.innerText = JSON.stringify(messageData.IotData.events[0]);

    } catch (err) {
      console.error(err);
    }
  }

  // Called by setInterval
  // 1. It will get the data from the currently selected source
  // 2. Update the chart
  // 3. Update the all cards (aggregated counts)
  updateData() {
    var deviceId = this.deviceListView.getSelectedItem()
    var device = this.findDevice(deviceId);
    if (!device) {
        return 
    }
    var source = device.sources.find(source => source.sourceId == this.sourceListView.getSelectedItem());

    if (source) {
      var chartData = source.getData(this.sourceListView.getSelectedItem());
      if (chartData && chartData["data"].length > 0) {
        this.dataChart.updateChart(chartData);
        [1, 2, 3].forEach(index => {
          if (chartData["aggregatedCounts"][index - 1]) {
            var aggregatedCount = chartData["aggregatedCounts"][index - 1];
            this.cardViews[index - 1].updateCard(aggregatedCount["value"], aggregatedCount["title"]);
          }
          else {
            this.cardViews[index - 1].hideCard()
          }
        });
        this.latencyChart.chart.update();
        this.dataChart.chart.update();
      }
    }
  }
}