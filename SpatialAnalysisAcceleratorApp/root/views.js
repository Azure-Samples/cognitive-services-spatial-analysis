/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
class LatencyChart {
    constructor() {
      this.chartData = {
        datasets: [
          {
            fill: true,
            label: 'Latency',
            yAxisID: 'Latency',
            borderColor: 'rgba(29,115,170,1)',
            pointBoarderColor: 'rgba(255, 204, 0, 1)',
            backgroundColor: 'rgba(29,115,170,0.7)',
            pointHoverBackgroundColor: 'rgba(255, 204, 0, 1)',
            pointHoverBorderColor: 'rgba(255, 204, 0, 1)',
            spanGaps: true,
          }
        ]
      };
  
      this.options = {
        legend: {
          display: false,
        },
        scales: {
          yAxes: [{
            id: 'Latency',
            type: 'linear',
            ticks: {
              fontSize: 30
            },
            scaleLabel: {
              labelString: 'Latency (sec)',
              display: true,
              fontSize: 20,
              fontColor: 'rgba(29,115,170,1)',
            },
            position: 'left'
          }
          ],
          xAxes: [{
            ticks: {
              fontSize: 20
            }
          }]
        }
      };
  
      const latencyChartctx = document.getElementById('latencyChart').getContext('2d');
      this.chart = new Chart(
        latencyChartctx,
        {
          type: 'line',
          data: this.chartData,
          options: this.options,
        });
    }
  }
  
  class DataChart {
    constructor() {
      this.options = {
  
        scales: {
          yAxes: [{
            id: 'Count',
            type: 'linear',
            ticks: {
              fontSize: 30,
              max: 25
            },
            scaleLabel: {
              labelString: 'Counts',
              display: true,
              fontSize: 20,
              fontColor: 'rgba(140, 188, 79, 1)',
            },
            position: 'left',
          },
          ],
          x: {
            type: 'time',
            time: {
              displayFormats: {
                quarter: 'MMM YYYY'
              }
            }
          }
        }
      };
      this.chartData = {
        datasets: [
          {
            fill: false,
            label: '',
            yAxisID: 'Count',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            borderColor: 'rgba(255, 159, 64, 1)',
            spanGaps: false,
            pointRadius: 10,
          },
          {
            fill: false,
            label: '',
            yAxisID: 'Count',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointBoarderColor: 'rgba(24, 120, 240, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            pointHoverBackgroundColor: 'rgba(24, 120, 240, 1)',
            pointHoverBorderColor: 'rgba(24, 120, 240, 1)',
            spanGaps: false,
            pointRadius: 10,
          },
        ]
      };
  
      const dataChartContext = document.getElementById('chart').getContext('2d');
      this.chart = new Chart(
        dataChartContext,
        {
          type: 'bar',
          data: this.chartData,
          options: this.options,
        });
    }

    updateChart(chartData) {
      this.chartData.labels = chartData["labels"];
      this.chartData.datasets[0].data = chartData["data"][0]["counts"];
      this.chartData.datasets[1].data = chartData["data"][1]["counts"];
      this.chartData.datasets[0].label = chartData["data"][0]["title"];
      this.chartData.datasets[1].label = chartData["data"][1]["title"];
    }
  }
  
  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection. Each device is mapped to an operation in the spatial analysis container.
  class ListView {
    constructor(id, onChangeCallbackHandler) {
      this.listView = document.getElementById(id);
      this.listView.addEventListener('change', this.onItemChange.bind(this));
      this.onChangeCallbackHandler = onChangeCallbackHandler
    }
    addItem(item) {
      const node = document.createElement('option');
      const nodeText = document.createTextNode(item);
      node.appendChild(nodeText);
      this.listView.appendChild(node);
    }
    // clears and add new items
    addItems(items) {
      while (this.listView.firstChild) {
        this.listView.removeChild(this.listView.lastChild);
      }
      items.forEach(item => {
        this.addItem(item)
      });
    }
    onItemChange() {
      this.onChangeCallbackHandler(this.listView[this.listView.selectedIndex].text) // new item
    }
    getSelectedItem() {
      if (this.listView.selectedIndex != -1) {
          return this.listView[this.listView.selectedIndex].text
      }
    }
  }

  class CardView {
    constructor(index) {
      this.card = document.getElementById('card' + index);
      this.cardTitle = document.getElementById('cardTitle' + index);
      this.cardDescription = document.getElementById('cardDescription' + index);
    }
    updateCard(value, title) {
      this.cardTitle.innerText = value
      this.cardDescription.innerText = title;
      this.card.style.display = 'block'
    }
    hideCard() {
      this.card.style.display = 'none'
    }
  }