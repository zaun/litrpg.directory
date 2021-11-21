/*
 * this function is called automatically by the QueueSeriesUpdate SQS
 * Queue. This function does no work, it simply calls the update
 * function once for each new SQS record. Each record is a Series
 * that needs updated.
 */

const AWS = require('aws-sdk');
var lambda = new AWS.Lambda();

exports.handler = (event, context, callback) => {
  event.Records.forEach(record => {
    const { body } = record;
    lambda.invoke({
      FunctionName: process.env.UpdateFunction,
      InvocationType: 'Event',
      Payload: body, 
    }).promise().catch((err) => {
      console.log(err);
    });
  });
  return {};
};
