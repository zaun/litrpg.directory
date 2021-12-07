/*
 * this function is setup to be called via an AWS scheduled
 * event. This should be called once a day. It will queue up
 * everything to be re-scanned.
 */

const AWS = require('aws-sdk');

const config = {};
if (process.env.NODE_ENV === 'development') {
  config.dynamoLocalPort = 8000;
  config.accessKeyId = 'key';
  config.secretAccessKey = 'SECRET';
  config.region = 'US-EAST-1';
  config.s3Endpoint = `http://localhost:${config.s3Port}`;
  config.dbEndpoint = `http://localhost:${config.dynamoLocalPort}`;
}

// Setup DynamoDB
let dbConfig = null;
if (config.s3Endpoint) {
  dbConfig = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    endpoint: config.dbEndpoint,
  };
}
const documentClient = new AWS.DynamoDB.DocumentClient(dbConfig);

const sqs = new AWS.SQS();

const getAll = async (tableName) => {
  const params = {
    TableName: tableName,
  };

  const scanResults = [];
  let items = null;
  do {
    items = await documentClient.scan(params).promise();
    items.Items.forEach((item) => scanResults.push(item));
    params.ExclusiveStartKey  = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");

  return scanResults;
};

const addToQueue = (data) => {
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const updater = require('../lambdaUpdater');
      updater.handler(data);
    }, 250);
    return Promise.resolve();
  }

  return sqs.sendMessage({
    QueueUrl: process.env.UpdateQueue,
    MessageBody: JSON.stringify(data),
    DelaySeconds: 0,
  }).promise();
};

exports.handler = async () => getAll('Series').then((series) => {
  const waitFor = [];
  series.forEach((s) => waitFor.push(addToQueue(s)));
  return Promise.all(waitFor).then(() => series.length);
}).then((count) => {
  return documentClient.put({
    TableName: 'Log',
    Item: {
      timestamp: new Date().getTime(),
      message: `Scheduled series update started, scheduled ${count}.`,
    },
  }).promise();
});

// If running this from a dev environmet just call the function
if (process.env.NODE_ENV === 'development') {
  exports.handler();
}
