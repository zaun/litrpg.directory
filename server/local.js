/* eslint-disable no-console */
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const DynamoDbLocal = require('dynamodb-local');
const express = require('express');
const fs = require('fs-extra');
const lambda = require('./lambdaAPI');
const path = require('path');
const S3rver = require('s3rver');
const _ = require('lodash');

const config = {};
config.dynamoLocalPort = 8000;
config.apiLocalPort = 7000;
config.s3Port = 4569;
config.accessKeyId = 'key';
config.secretAccessKey = 'SECRET';
config.region = 'US-EAST-1';
config.s3Endpoint = `http://localhost:${config.s3Port}`;
config.dbEndpoint = `http://localhost:${config.dynamoLocalPort}`;

const app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// https://kennbrodhagen.net/2015/12/02/how-to-access-http-headers-using-aws-api-gateway-and-lambda/
app.all('*', (req, res) => {
  // process.stdout.write(`??? ${req.method} ${req.originalUrl}`);
  lambda.handler({
    local: true,
    path: req.originalUrl,
    headers: req.headers,
    httpMethod: req.method,
    queryStringParameters: req.params,
    query: req.query,
    body: JSON.stringify(req.body),
  }, {}, (err, data) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    if (data.statusCode === 400) {
      console.log(`${data.statusCode} ${req.method} ${req.originalUrl} ${data.body}`);
    } else {
      console.log(`${data.statusCode} ${req.method} ${req.originalUrl}`);
    }
    res.status(data.statusCode).send(data.body);
  });
});


// Setup S3
let s3Config = null;
if (config.s3Endpoint) {
  s3Config = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    endpoint: config.s3Endpoint,
  };
}
const s3 = new AWS.S3(s3Config);

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
var dynamodb = new AWS.DynamoDB(dbConfig);

console.log('Launching database');
DynamoDbLocal.launch(config.dynamoLocalPort, path.join(__dirname, 'temp'), [], false, false).then(() => {
  console.log(`DynamoDB on port ${config.dynamoLocalPort}`);

  return dynamodb.createTable({
    TableName: 'Books',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'seriesId', AttributeType: 'S' },
      { AttributeName: 'title', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'series_index',
      Projection: { ProjectionType: 'ALL' },
      KeySchema: [
        { AttributeName: 'seriesId', KeyType: 'HASH' },
        { AttributeName: 'title', KeyType: 'RANGE' },
      ]
    }]
  }).promise().catch((te) => {
    if (te && te.code !== 'ResourceInUseException') {
      console.log(te);
    }
  });
}).then(() => {
  return dynamodb.createTable({
    TableName: 'Series',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ]
  }).promise().catch((te) => {
    if (te && te.code !== 'ResourceInUseException') {
      console.log(te);
    }
  });
}).then(() => {
  return dynamodb.createTable({
    TableName: 'People',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ]
  }).promise().catch((te) => {
    if (te && te.code !== 'ResourceInUseException') {
      console.log(te);
    }
  });
}).then(() => {
  return dynamodb.createTable({
    TableName: 'BookPeople',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'bookId', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'bookId', AttributeType: 'S' },
      { AttributeName: 'personId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'person_index',
      Projection: { ProjectionType: 'ALL' },
      KeySchema: [
        { AttributeName: 'personId', KeyType: 'HASH' },
        { AttributeName: 'bookId', KeyType: 'RANGE' },
      ]
    }, {
      IndexName: 'book_index',
      Projection: { ProjectionType: 'ALL' },
      KeySchema: [
        { AttributeName: 'bookId', KeyType: 'HASH' },
        { AttributeName: 'personId', KeyType: 'RANGE' },
      ]
    }]
  }).promise().catch((te) => {
    if (te && te.code !== 'ResourceInUseException') {
      console.log(te);
    }
  });
}).then(() => {
  return dynamodb.createTable({
    TableName: 'Requests',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'seriesId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'seriesId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' },
    ],
  }).promise().catch((te) => {
    if (te && te.code !== 'ResourceInUseException') {
      console.log(te);
    }
  });
}).then(() => {
  return dynamodb.createTable({
    TableName: 'NewSeries',
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'timestamp', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'timestamp', AttributeType: 'N' },
    ],
  }).promise().catch((te) => {
    if (te && te.code !== 'ResourceInUseException') {
      console.log(te);
    }
  });
}).then(() => {
  return new Promise((resolve, reject) => {
    fs.ensureDirSync(path.join(__dirname, 'temp', 's3'));
    new S3rver({
      port: config.s3Port,
      hostname: 'localhost',
      silent: false,
      cors: '<CORSConfiguration><CORSRule><AllowedOrigin>*</AllowedOrigin><AllowedMethod>POST</AllowedMethod><MaxAgeSeconds>3000</MaxAgeSeconds><AllowedHeader>*</AllowedHeader></CORSRule></CORSConfiguration>',
      directory: path.join(__dirname, 'temp', 's3'),
      removeBucketsOnClose: true
    }).run((err, host, port) => {
      if(err) {
        return reject(err);
      }
      resolve();
    });
  });
}).then(() => {
  console.log(`S3 on port ${config.s3Port}`);

  return s3.createBucket({
    Bucket: 'media.litrpg.com'
  }).promise().catch(() => {});
}).then(() => {
  const server = app.listen(config.apiLocalPort, () => {
    console.log(`API on port ${server.address().port}`);
  });
}).catch((err) => {
  console.log(err);
});
