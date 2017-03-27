import _ from 'lodash';
import Joi from 'joi';
import * as Client from './client';
import * as Schema from './schema';

exports.register = (server, options, next) => {
  validate();

  const client = Client.getClient(options.url);

  function validate () {
    const schema = Schema.getSchema();

    Joi.validate(options, schema, (err) => {
      if (err) {
        slapInvalidError('invalid options');
      }
    });
  }

  function getMessage () {
    return `${this.route.method.toUpperCase()} ${this.route.path}`;
  }

  function getPlugin () {
    const plugin = _.isEmpty(this.route.settings.plugins) ? null : this.route.settings.plugins;
    return plugin || slapInvalidError(`plugin slap not configured for ${getMessage.bind(this)()}`);
  }

  function getSlap () {
    const slap = getPlugin.bind(this)()['slap'];
    return slap || slapInvalidError(`slap not configured for ${getMessage.bind(this)()}`);
  }

  function getRule () {
    const rule = getSlap.bind(this)().rule;
    return rule || slapInvalidError(`slap (rule) not informed for ${getMessage.bind(this)()}`);
  }

  function getExpireDefault () {
    return options.expireIn || 300;
  }

  function getExpire () {
    return getSlap.bind(this)().expire || getExpireDefault();
  }

  function getClear () {
    const clear = getSlap.bind(this)().clear;
    return clear || slapInvalidError(`slap (clear) not informed for ${getMessage.bind(this)()}`);
  }

  function slapInvalidError (message) {
    const error = new Error();
    error.name = 'slapInvalidError';
    error.message = message || 'slapInvalidError';
    throw error;
  }

  function getQuery () {
    const query = _.isEmpty(this.query) ? '' : this.query;

    let formatQuery = '';
    _.each(query, (value, key) => {
      formatQuery += formatQuery ? `&${key}=${value}` : `${key}=${value}`;
    });

    return formatQuery;
  }

  function getFields () {
    const fields = this.headers.fields ? this.headers.fields.split(',').map((value) => value.trim()) : [];
    return fields.length > 0 ? `fields= ${fields.join()}` : '';
  }

  function getKey () {
    const query = getQuery.bind(this)();
    const fields = getFields.bind(this)();

    if (query && fields) {
      return `${query}&${fields}`;
    }
    return query || fields;
  }

  function formatKey (spec) {
    const rule = getRule.bind(this)();
    const key = getKey.bind(this)();

    if (spec) {
      return key ? `${rule}&${spec}&${key}` : `${rule}&${spec}`;
    }
    return key ? `${rule}&${key}` : `${rule}&default`;
  }

  const addCache = function (data, spec) {
    const _this = this;

    return new Promise((resolve, reject) => {
      const key = formatKey.bind(_this, spec)();
      const expire = getExpire.bind(_this)();
      const rule = getRule.bind(_this)();

      client.SADD([rule, key], function (err) {
        if (err) {
          return reject(err);
        }
      });

      client.SETEX(key, expire, JSON.stringify(data), (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  };

  const getCache = function (spec) {
    const _this = this;

    return new Promise((resolve, reject) => {
      const key = formatKey.bind(_this, spec)();
      const expire = getExpire.bind(_this)();

      client.GET(key, (err, data) => {
        if (err) {
          return reject(err);
        }
        client.EXPIRE(key, expire, (err) => {
          if (err) {
            return reject(err);
          }
          return data ? resolve(JSON.parse(data)) : resolve();
        });
      });
    });
  };

  const clearCache = function () {
    const clear = getClear.bind(this)();

    return new Promise((resolve, reject) => {
      if (Array.isArray(clear)) {
        let reqs = [];
        clear.map((key) => reqs.push(client.smembersAsync(key)));
        Promise.all(reqs).then((datas) => {
          const clears = [];
          datas.map(x => x.map(y => clears.push(y)));
          client.DEL(clears.concat(clear), (err) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });
        });
      } else {
        client.smembers(clear, (err, data) => {
          if (err) {
            return reject(err);
          }
          client.DEL(data.concat(clear), (err) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });
        });
      }
    });
  };

  server.decorate('request', 'addCache', addCache);
  server.decorate('request', 'getCache', getCache);
  server.decorate('request', 'clearCache', clearCache);

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
