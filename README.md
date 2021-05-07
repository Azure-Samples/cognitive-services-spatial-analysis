# Project Name

Computer Vision for Spatial Analysis

## Features

This project framework provides the following features:

* Sample web application for People Counting Accelerator with spatial analysis


## Getting Started

### Prerequisites

- Create an [Azure subscription](https://azure.microsoft.com/free/cognitive-services).
- Create a Computer Vision resource in the [Azure portal](https://portal.azure.com). 
- Deploy an Azure IoT Hub resource in the [Azure portal](https://portal.azure.com). 
- Install the spatial analysis container on Azure IoT Hub and Azure IoT Edge. 
- Configure the spatialanalysis operations as documented in this [article](https://docs.microsoft.com/azure/cognitive-services/computer-vision/spatial-analysis-operations).  
- Get familiar with the JSON output schema for the spatial analysis events at this [article](https://docs.microsoft.com/azure/cognitive-services/computer-vision/spatial-analysis-operations). 

For a tutorial on how to use this application see this [article](https://docs.microsoft.com/azure/cognitive-services/computer-vision/spatial-analysis-web-app).


### Installation

- Download and install [Visual Studio Code](https://code.visualstudio.com/). 

## Demo

### Spatial Analysis Accelerator App

Use the web application in this project to integrate the output of the spatial analysis container and understand the count of people occupying a physical space. The application parses the AI Insight JSON output by the spatial analysis container and determine different counts based on configured operations and “latency”, then it updates a chart UI. To determine the latency, the app inspects the AI Insight timestamp which indicates when the AI Insight event has been generated on the edge device and calculates the latency.

To run the demo, follow these steps:

1. Setup the spatial analysis module using [guide](https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/spatial-analysis-container?tabs=azure-stack-edge)
2. Use [deployment manifest](./deployment.json) to run all scenarios with pre-configured videos and zones
2. Clone the repository
3. Open the SpatialAnalysisAcceleratorApp forlder from the cloned repository folder in VScode
4. Press ctrl+shift+b and select the "npm install" task to install dependencies
5. Retrieve the EventHubConsumerGroup and IotHubConnectionString from your Azure IoT Hub resource on [Azure portal](https://portal.azure.com).
6. Enter the values in the "EventHubConsumerGroup" and "IotHubConnectionString" fields at .vscode/launch.json
7. Press [F5] to launch the app
8. Navigate to localhost:3000 in your browser to see the app in action

## Docker Image
1. Navigate to SpatialAnalysisAcceleratorApp folder (e.g. cd SpatialAnalysisAcceleratorApp) 
2. docker build -t <your ACR name>/spatialanalysisacceleratorapp .
3. docker push <your ACR name>/spatialanalysisacceleratorapp

## Resources

- Computer Vision for spatial Analysis [documentation](https://docs.microsoft.com/azure/cognitive-services/computer-vision/spatial-analysis-container?tabs=azure-stack-edge)
- Computer Vision for spatial Analysis [tech blog](https://techcommunity.microsoft.com/t5/azure-ai/computer-vision-for-spatial-analysis-at-the-edge/ba-p/1666313)

