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
  
  getBooksBySeriesId(id) {
    return documentClient.query({
      TableName: 'Books',
      IndexName: 'series_index',
      KeyConditionExpression: 'seriesId = :seriesId',
      ExpressionAttributeValues: {
        ':seriesId': `${id}`
      },
    }).promise()
    .then(result => result ? result.Items : null);
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

  delBookPerson(bookId, personId) {
    return documentClient.delete({
      TableName: 'BookPeople',
      Key: {
        bookId,
        id: personId,
      },
    }).promise();
  },

  delBook(bookId) {
    this.getBookPeopleById(bookId)
      .then((people) => {
        return Promise.all(_.map(people, (bp) => this.delBookPerson(bp.bookId, bp.personId)));
      })
      .then(() => {
        return documentClient.delete({
          TableName: 'Books',
          Key: {
            id: bookId,
          },
        }).promise();
      });
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

  putSeries(series) {
    const data = _.cloneDeep(series);
    data.lastUpdate = new Date().getTime();
    return documentClient.put({
      TableName: 'Series',
      Item: data
    }).promise();
  },
  
  putBook(book) {
    return documentClient.put({
      TableName: 'Books',
      Item: book
    }).promise();
  },
  
  putPerson(person) {
    return documentClient.put({
      TableName: 'People',
      Item: person
    }).promise();
  },
  
  putRequest(request) {
    return documentClient.put({
      TableName: 'Requests',
      Item: request
    }).promise();
  },
  
  putBookPerson(bookId, personId, recordType) {
    const id = `${bookId}-${personId}-${recordType}`;
    return documentClient.put({
      TableName: 'BookPeople',
      Item: {
        id,
        bookId,
        personId,
        type: recordType,
      }
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

  cleanupName(name, seriesName) {
    const cleaned = name
    .replace('\n', '')
    .replace(new RegExp(`${seriesName} [(]Book \\d+[)][:]`), '')
    .replace(new RegExp(`${seriesName} [(]book \\d+[)][:]`), '')
    .replace(new RegExp(`[(]${seriesName} Book [#]\\d+[)]`), '')
    .replace(new RegExp(`[:] The ${seriesName} \\d+[:]`), '')
    .replace(new RegExp(`[(]${seriesName} Book \\d+[)]`), '')
    .replace(new RegExp(`${seriesName} [(]Book \\d+[)]`), '')
    .replace(new RegExp(`${seriesName} Book \\d+[:]`), '')
    .replace(new RegExp(`The ${seriesName} \\d+[:]`), '')
    .replace(new RegExp(`Book \\d+, `), '')
    .replace(new RegExp(`Book \\d+: `), '')
    .replace(new RegExp(`[(]Vol\.\\d+[)]`), '')
    .replace(new RegExp(`[(]Vol\. \\d+[)]`), '')
    .replace(new RegExp(`[-] Vol\. \\d+`), '')
    .replace(new RegExp(`[-] Vol\.\\d+`), '')
    .replace(new RegExp(`[:] Volume \\d+`), '')
    .replace(new RegExp(`[,:] Book \\d+ of a Xianxia Cultivation Epic`), '')
    .replace(new RegExp(`[,:] Book \\d+ Of A Xianxia Cultivation Epic`), '')
    .replace(new RegExp(`[,:] Book \\d+ Of A Xianxia Cultivation Series`), '')
    .replace(': A Xianxia Cultivation Fantasy Epic Series', '')
    .replace(': A Science fiction fantasy LitRPG Series', '')
    .replace(': A LitRPG Post-Apocalyptic Space Opera', '')
    .replace(': A LitRPG and GameLit Fantasy Series', '')
    .replace(': A Humorous LitRPG/GameLit Adventure', '')
    .replace(': An Apocalyptic Space Opera LitRPG', '')
    .replace(': A Paranormal LitRPG Dungeon Core', '')
    .replace(': An Urban Fantasy Harem Adventure', '')
    .replace(': An Epic LitRPG/GameLit Adventure', '')
    .replace(': A LitRPG Dungeon Core Adventure', '')
    .replace('(A LitRPG Dungeon Core Adventure)', '')
    .replace(': A LitRPG and GameLit Adventure', '')
    .replace(': An Apocalyptic LitRPG Series', '')
    .replace(': A LitRPG and GameLit Series', '')
    .replace(': A LitRPG Fantasy Adventure', '')
    .replace(': A LitRPG/GameLit Adventure', '')
    .replace(': A LitRPG/Gamelit Adventure', '')
    .replace(': A Fantasy LitRPG Adventure', '')
    .replace(' (A Post-Apocalyptic LitRPG)', '')
    .replace(': A Xianxia Cultivation Epic', '')
    .replace(': A Post-Apocalyptic LitRPG', '')
    .replace(': A LitRPG Sci-Fi Adventure', '')
    .replace(': A Dungeon Core Experience', '')
    .replace(': An Epic LitRPG Adventure', '')
    .replace(': A Monster Girl Adventure', '')
    .replace(': An Ether Collapse Series', '')
    .replace(': A Divine Dungeon Series', '')
    .replace(': A Dungeon Core Escapade', '')
    .replace(': LitRPG Progression Saga', '')
    .replace(': A Xianxia Fantasy Epic', '')
    .replace(': A LitRPG/GameLit Novel', '')
    .replace(': A LitRPG/Gamelit Novel', '')
    .replace(': A Sci-fi LitRPG Story', '')
    .replace(': An Epic LitRPG Series', '')
    .replace(': An Apocalyptic LitRPG', '')
    .replace(': A Dungeon Core Novel', '')
    .replace(' (A LitRPG Apocalypse)', '')
    .replace(' (A LitRPG Adventure)', '')
    .replace(': A LitRPG Apocalypse', '')
    .replace(': A Cultivation Novel', '')
    .replace(': A Dungeon Core Epic', '')
    .replace(', a LitRPG adventure', '')
    .replace(': A LitRPG Adventure', '')
    .replace(': A litRPG Adventure', '')
    .replace(': A litRPG Anthology', '')
    .replace(': A LitRPG Journey', '')
    .replace(': A LitRPG Series', '')
    .replace(': A LitRPG Novel', '')
    .replace(': RealRPG Series', '')
    .replace(': LitRPG Series', '')
    .replace(': A LitRPG Saga', '')
    .replace(': Book Three', '')
    .replace('Book Three :', '')
    .replace('Book Three:', '')
    .replace('Book One :', '')
    .replace('Book Two :', '')
    .replace(': Book One', '')
    .replace(': Book Two', '')
    .replace('Book One:', '')
    .replace('Book Two:', '')
    .replace('Book III:', '')
    .replace('Book II:', '')
    .replace('Book I:', '')
    .replace(`The ${seriesName}: `, '')
    .replace(`${seriesName}: `, '')
    .replace(`The ${seriesName}, `, '')
    .replace(`${seriesName}, `, '')
    .replace(`(${seriesName})`, '')
    .replace(`: ${seriesName}`, '')
    .replace(`: The ${seriesName}`, '')
    .trim();

    // Normilize names or just retuen the cleaned up version
    switch(cleaned.toLowerCase()) {
      case 'aaaron crash':
        return 'Aaron Crash';
      case 'james hunter':
        return 'James A. Hunter';
      case 'jason cheek':
        return 'Jason A. Cheek';
      case 'eric martin':
        return 'Eric Jason Martin';
      case 'jeffrey "falcon" logue':
        return 'Jeffrey Logue';
      case 'michael g. manning':
        return 'Michael Manning';
      default:
        return cleaned;
    }
  },

  cyrb53(inp, seed = 0) {
    const str = inp.toLowerCase().replace(/[ .,':]/g, '');
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return `${4294967296 * (2097151 & h2) + (h1>>>0)}`;
  },
};
