const https = require('https');
const URL = require('url');
const Stream = require('stream').Transform;
const { resolve } = require('path');
const _ = require('lodash');
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

module.exports = exports = {
  JWT_KEY: 'MYKEY',

  getBookPeopleById(id) {
    return documentClient.query({
      TableName: 'BookPeople',
      IndexName: 'book_index',
      KeyConditionExpression: 'bookId = :bookId',
      ExpressionAttributeValues: {
        ':bookId': `${id}`
      },
    }).promise()
    .then(result => result ? result.Items : null);
  },
  
  getSeriesById(id) {
    return documentClient.get({
      TableName: 'Series',
      Key: {
        id: `${id}`
      },
    }).promise()
    .then(result => result ? result.Item : null);
  },
  
  getBatchSeriesById(ids) {
    return documentClient.scan({
      TableName: 'Series',
      ScanFilter: {
        id: {
          ComparisonOperator: 'IN',
          AttributeValueList: ids,
        },
      },
    }).promise()
    .then(result => result ? result.Items : []);
  },
  
  getBookById(id) {
    return documentClient.get({
      TableName: 'Books',
      Key: {
        id: `${id}`
      },
    }).promise()
    .then(result => result ? result.Item : null);
  },
  
  getPersonById(id) {
    return documentClient.get({
      TableName: 'People',
      Key: {
        id: `${id}`
      },
    }).promise()
    .then(result => result ? result.Item : null);
  },
  
  async getAll(tableName) {
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
  },

  delRequest(seriesId, timestamp) {
    return documentClient.delete({
      TableName: 'Requests',
      Key: {
        seriesId,
        timestamp: parseInt(timestamp),
      },
    }).promise();
  },
  
  putRequest(request) {
    return documentClient.put({
      TableName: 'Requests',
      Item: request
    }).promise();
  },
  
  putRequestSeries(request) {
    return documentClient.put({
      TableName: 'NewSeries',
      Item: request
    }).promise();
  },

  updateSeries(seriesId, field, oldValue, newValue) {
    console.log(seriesId, field, oldValue, newValue);

    let ConditionExpression = '#field = :oldValue';
    if (oldValue === '') {
      ConditionExpression = '#field = :oldValue OR attribute_not_exists(#field)';
    }

    return documentClient.update({
      TableName: 'Series',
      Key: {
        id: seriesId,
      },
      UpdateExpression: 'set #field = :newValue',
      ConditionExpression,
      ExpressionAttributeNames: {
        '#field': field,
      },
      ExpressionAttributeValues: {
        ':oldValue': oldValue,
        ':newValue': newValue,
      },
    }).promise();
  },

  fetch(url, cookies, referer) {
    const cookieData = cookies ? cookies.join('; ') : '';
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'Accept': 'text/html',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'max-age=0',
          'Cookie': cookieData,
          Referer: referer || 'https://litrpg.directory/',
        },
      }, (resp) => {
        let data = new Stream();
        if (resp.statusCode === 301 || resp.statusCode === 302) {
          return resolve(exports.fetch(URL.resolve(url, resp.headers.location)));
        }
    
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
          data.push(chunk);
        });
    
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          resolve({ html: data.read().toString('utf8'), cookies: resp.headers["set-cookie"].map((c) => c.split(';').shift()) });
        });
    
      }).on("error", (err) => {
        console.log(url);
        reject(err);
      });
    });
  },

  addToQueue(data) {
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
  },
};
