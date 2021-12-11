const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const jwt = require('jsonwebtoken');
const RouteMatch = require('path-match');
const util = require('./util');
const read = require('./read');
const _ = require('lodash');

const API_ROUTES = [
  '/AUTH',
  '/BOOKS',
  '/LOG',
  '/REQUESTS',
  '/REQUESTS/:ID',
  '/SCAN',
  '/SERIES',
  '/SERIES/:ID',
];

const routeMatch = RouteMatch({
  // path-to-regexp options
  sensitive: false,
  strict: true,
  end: true,
});

const verify = data => new Promise((resolve) => {
  if (data.auth.token) {
    jwt.verify(data.auth.token, util.JWT_KEY, (err, decoded) => {
      if (err) {
        console.log('Token Error', err);
        resolve();
        return;
      }
      resolve(decoded);
    });
  } else {
    resolve();
  }
});

console.log({
  UserPool: process.env.UserPool,
  PoolClient: process.env.PoolClient,
});

exports.handler = (event, context, callback) => {
  const startTime = new Date().getTime();

  const done = (statusCode, response) => {
    callback(null, {
      statusCode,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify(response),
      isBase64Encoded: false,
    });
  };

  let params = false;
  let resource = '';
  API_ROUTES.forEach((apiRoute) => {
    if (params === false) {
      const matcher = routeMatch(apiRoute);
      params = matcher(event.path.toUpperCase().split('?')[0].replace('/API', ''));
      if (params !== false) {
        resource = apiRoute;
      }
    }
  })

  const route = {
    resource,
    method: event.httpMethod.toUpperCase(),
    params,
    query: event.queryStringParameters,
    auth: { },
  };

  if (event.headers.authorization) {
    route.auth.token = event.headers.authorization.split(' ').pop();
  } else if (event.headers.Authorization) {
    route.auth.token = event.headers.Authorization.split(' ').pop();
  }

  try {
    route.bodyJson = JSON.parse(event.body);
  } catch (e) {
    route.bodyJson = {};
  }

  verify(route).then((data) => {
    if (data) {
      route.auth = data;
    } else {
      route.auth.groups = [];
    }

    switch (route.resource) {
      case '/AUTH': 
        if (route.method === 'POST') {
          const b = route.bodyJson;
          if (!b.username) {
            done(400, 'Invalid missing username');
            return;
          }
          if (!b.password) {
            done(400, 'Invalid missing password');
            return;
          }

          const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: b.username,
            Password: b.password,
          });
          const userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: process.env.UserPool,
            ClientId: process.env.PoolClient,
          });
          const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: b.username,
            Pool: userPool,
          });
          cognitoUser.authenticateUser(authDetails, {
            onSuccess: (result) => {
              const accessToken = result.getAccessToken().getJwtToken();
              const decodedJwt = jwt.decode(accessToken, { complete: true });
              const userID = decodedJwt.payload.sub;
              const groups = decodedJwt.payload['cognito:groups'] || [];

              done(200, {
                token: jwt.sign({ userID, groups }, util.JWT_KEY, { expiresIn: '1d' }),
                groups,
              });
            },
            onFailure: (err) => {
              done(401, err);
            },
            newPasswordRequired: (userAttributes) => {
              const attrs = userAttributes;
              if (!b.newPassword) {
                done(401, {
                  code: 'NewPasswordRequired',
                  name: 'NewPasswordRequired',
                });
                return;
              }
              delete attrs.email_verified
              cognitoUser.completeNewPasswordChallenge(b.newPassword, attrs, this);
            },
          });
        } else {
          done(405, `Method Not Allowed: ${route.method}`);
        }
        break;

      case '/BOOKS':
        if (route.method === 'GET') {
          read.bookList().then((items) => {
            done(200, items);
          }).catch(err => {
            done(500, err);
          });
        } else {
          done(405, `Method Not Allowed: ${route.method}`);
        }
        break;

      case '/LOG':
        if (route.method === 'GET') {
          if (!route.auth || !_.includes(route.auth.groups, 'ADMIN')) {
            done(401, `Not Authorized [${route.auth.groups}]`);
            return;
          }

          util.getLogPage(route.query ? route.query.next : '').then((items) => {
            done(200, items);
          }).catch(err => {
            done(500, err);
          });
        } else {
          done(405, `Method Not Allowed: ${route.method}`);
        }
        break;

      case '/REQUESTS':
        if (route.method === 'POST') {
          const b = route.bodyJson;
          if (b.seriesId) {
            util.putRequest({
              seriesId: b.seriesId,
              timestamp: new Date().getTime(),
              field: b.field,
              oldValue: b.oldValue,
              newValue: b.newValue,
            }).then(() => {
              done(201, 'OK');
            }).catch(err => {
              done(500, err);
            });
          } else if (b.seriesName) {
            util.putRequestSeries({
              timestamp: new Date().getTime(),
              seriesName: b.seriesName,
              urls: b.urls,
            }).then(() => {
              done(201, 'OK');
            }).catch(err => {
              done(500, err);
            });
          } else {
            done(400, 'Invalid missing seriesId or series');
          }
        } else if (route.method === 'GET') {
          if (!route.auth || !_.includes(route.auth.groups, 'ADMIN')) {
            done(401, `Not Authorized [${route.auth.groups}]`);
            return;
          }
          util.getAll('Requests')
          .then((items) => {
            if (items.length === 0) {
              return [];
            }
            const seriesIds = _.uniq(_.map(items, (i) => `${i.seriesId}`));
            return util.getBatchSeriesById(seriesIds).then((series) => {
              _.forEach(items, (i) => {
                i.series = _.find(series, { id: i.seriesId })
                delete i.seriesId;
                if (i.series && i.series.urls) {
                  delete i.series.urls;
                }
              });
              return items;
            });
          })
          .then((updateRequests) => {
            return util.getAll('NewSeries').then((newSeries) => {
              done(200, { updateRequests, newSeries })
            });
          }).catch(err => {
            done(500, err);
          });
        } else {
          done(405, `Method Not Allowed: ${route.method}`);
        }
        break;

      case '/REQUESTS/:ID':
        if (!route.auth || !_.includes(route.auth.groups, 'ADMIN')) {
          done(401, `Not Authorized [${route.auth.groups}]`);
          return;
        }
        if (route.method === 'DELETE') {
          const id = route.params.ID.split(':');
          if (id.length !== 2) {
            done(400, 'Invalid ID');
          }

          util.delRequest(id[0], id[1]).then(() => {
            done(200, 'OK');
          });
        } else {
          done(405, `Method Not Allowed: ${route.method}`);
        }
        break;

      case '/SCAN':
        if (!route.auth || !_.includes(route.auth.groups, 'ADMIN') || !_.includes(route.auth.groups, 'SCAN')) {
          done(401, `Not Authorized [${route.auth.groups}]`);
          return;
        }
        if (route.method === 'POST') {
          util.getAll('Series').then((series) => {
            const waitFor = [];
            series.forEach((s) => util.addToQueue(s));
            return Promise.all(waitFor).then(() => series.length);
          })
          .then((count) => {
            done(201, `OK - ${count}`);
          })
          .catch(err => {
            const endTime = new Date().getTime();
            const ms = (endTime - startTime) / 1000;
            done(500, { ms, err });
          });
        } else {
          done(405, `Method Not Allowed: ${route.method}`);
        }
        break;

      case '/SERIES':
        if (!route.auth || !_.includes(route.auth.groups, 'ADMIN')) {
          done(401, `Not Authorized [${route.auth.groups}]`);
          return;
        }
        if (route.method === 'POST') {
          const b = route.bodyJson;
          if (!b.name) {
            done(400, 'Invalid missing series');
            return;
          }

          util.log('scan', `Adding series ${b.name}`)
          .then(() => util.addToQueue(b))
          .then(() => {
            done(201, 'OK');
          })
          .catch(err => {
            const endTime = new Date().getTime();
            const ms = (endTime - startTime) / 1000;
            done(500, { ms, err });
          });
        } else {
          done(405, `Method Not Allowed: ${route.method}`);
        }
        break;

        case '/SERIES/:ID':
          if (!route.auth || !_.includes(route.auth.groups, 'ADMIN')) {
            done(401, `Not Authorized [${route.auth.groups}]`);
            return;
          }
          if (route.method === 'PUT') {
            const b = route.bodyJson;
            if (!b.field) {
              done(400, 'Invalid missing field');
              return;
            } else if (_.isUndefined(b.oldValue)) {
              done(400, 'Invalid missing oldValue');
              return;
            } else if (_.isUndefined(b.newValue)) {
              done(400, 'Invalid missing newValue');
              return;
            } else if (_.isUndefined(b.timestamp)) {
              done(400, 'Invalid missing timestamp');
              return;
            }

            util.updateSeries(route.params.ID, b.field, b.oldValue, b.newValue)
            .then(() => {
              return util.delRequest(route.params.ID, b.timestamp);
            })
            .then(() => {
              done(200, 'OK');
            })
            .catch(err => {
              const endTime = new Date().getTime();
              const ms = (endTime - startTime) / 1000;
              done(500, { ms, err });
            });
          } else {
            done(405, `Method Not Allowed: ${route.method}`);
          }
          break;
      
      default:
        console.log(route);
        done(400, `Bad Request: ${route.resource}`);
    };
  });
};
