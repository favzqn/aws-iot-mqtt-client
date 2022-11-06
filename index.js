const awsIot = require('aws-iot-device-sdk');
const sensor = require("node-dht-sensor");

const isUsingDummyData = true;
const topic = "plant/temperature";
const MQTTBroker = "afctnhsne9725-ats.iot.ap-southeast-1.amazonaws.com"

const today = new Date();
const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
const dateTime = date + " " + time;

const device = awsIot.device({
    clientId: 'RaspberryPlant',
    host: MQTTBroker,
    port: 8883,
    keyPath: './secrets/private.pem.key',
    certPath: './secrets/certificate.pem.crt',
    caPath: './secrets/AmazonRootCA1.pem',
});

const IoTDevice = {
    serialNumber: "SN-XXXXXXXXXXXX",
    dateTime,
    activated: true,
    device: "RaspberryPlant-000",
    type: "Plant",
    payload: {}
};

const getSensorData = (cb) =>
    isUsingDummyData ? getDummySensorData(cb) : sensor.read(11, 2, function (err, temperature, humidity) {
        if (!err) {
            const temperatureData = { temp: `${temperature}°C`, humidity: `${humidity}%` };
            console.log(`STEP - Sending data to AWS IoT Core'`, temperatureData);
            console.log(`---------------------------------------------------------------------------------`);
            return cb(temperatureData);
        }
        console.log(err);
    });

const getDummySensorData = (cb) => {
    const temperatureData = { temp: '100°C', humidity: '52%' };
    return cb(temperatureData);
}

const sendData = (data) => {
    const telemetryData = {
        ...IoTDevice,
        payload: data
    };
    console.log(`STEP - Sending data to AWS IoT Core'`, telemetryData);
    console.log(`---------------------------------------------------------------------------------`);
    return device.publish(topic, JSON.stringify(telemetryData));
}

device
    .on('connect', function () {
        console.log('STEP - Connecting to AWS IoT Core');
        console.log(`---------------------------------------------------------------------------------`);
        setInterval(() => getSensorData(sendData), 3000);
    });

device
    .on('message', function (topic, payload) {
        console.log('message', topic, payload.toString());
    });

device
    .on('error', function (topic, payload) {
        console.log('Error:', topic, payload.toString());
    });