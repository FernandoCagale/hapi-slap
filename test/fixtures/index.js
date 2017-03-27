import Hapi from 'hapi';
import path from 'path';

let server = new Hapi.Server();

const dir = path.join(__dirname, '/../models/**.js');

const register = [{
  register: require('k7'),
  options: {
    models: dir,
    adapter: require('k7-sequelize'),
    connectionOptions: {
      options: {
        dialect: 'sqlite'
      }
    }
  }
}, {
  register: require('hapi-async-handler')
}, {
  register: require('../../build'),
  options: {
    url: 'redis://127.0.0.1:6379/0',
    expireIn: 500
  }
}];

server.register(register, (err) => {
  if (err) throw err;
});

server.connection();

server.route({
  method: 'GET',
  path: '/users',
  config: {
    plugins: {
      slap: {
        rule: 'users-cache'
      }
    },
    handler: {
      async async (request, reply) {
        try {
          const search = request.query.search;

          const options = {
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          };

          if (search) {
            options.where = {
              username: {
                $eq: search
              }
            };
          }

          const cache = await request.getCache();
          if (cache) {
            return reply(cache);
          }

          const values = await server.database.User.findAll(options);

          request.addCache(values);
          return reply(values);
        } catch (err) {
          return reply(err);
        }
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/user/{id}',
  config: {
    plugins: {
      slap: {
        rule: 'users-cache-id'
      }
    },
    handler: {
      async async (request, reply) {
        try {
          const id = request.params.id;

          const options = {
            attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
            where: {
              id: id
            }
          };

          const cache = await request.getCache(id);
          if (cache) {
            return reply(cache);
          }

          const values = await server.database.User.findOne(options);

          request.addCache(values, id);

          return reply(values);
        } catch (err) {
          return reply(err);
        }
      }
    }
  }
});

server.route({
  method: 'POST',
  path: '/user-clear',
  config: {
    plugins: {
      slap: {
        clear: ['users-cache', 'users-cache-id']
      }
    },
    handler: {
      async async (request, reply) {
        try {
          await request.clearCache();

          return reply();
        } catch (err) {
          return reply(err);
        }
      }
    }
  }
});

server.route({
  method: 'POST',
  path: '/user-error-clear',
  config: {
    plugins: {
      slap: {
      }
    },
    handler: {
      async async (request, reply) {
        try {
          await request.clearCache();
          return reply();
        } catch (err) {
          return reply(err);
        }
      }
    }
  }
});

server.route({
  method: 'POST',
  path: '/user-error-slap',
  config: {
    plugins: { },
    handler: {
      async async (request, reply) {
        try {
          await request.clearCache();
          return reply();
        } catch (err) {
          return reply(err);
        }
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/users-error-rule',
  config: {
    plugins: {
      slap: {
      }
    },
    handler: {
      async async (request, reply) {
        try {
          const options = {
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          };

          const cache = await request.getCache();
          if (cache) {
            return reply(cache);
          }

          const values = await server.database.User.findAll(options);
          request.addCache(values);
          return reply(values);
        } catch (err) {
          return reply(err);
        }
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/users-error-slap',
  config: {
    plugins: {
    },
    handler: {
      async async (request, reply) {
        try {
          const options = {
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
          };

          const cache = await request.getCache();
          if (cache) {
            return reply(cache);
          }

          const values = await server.database.User.findAll(options);
          request.addCache(values);
          return reply(values);
        } catch (err) {
          return reply(err);
        }
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/users-error-plugins',
  handler: {
    async async (request, reply) {
      try {
        const options = {
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        };

        const cache = await request.getCache();
        if (cache) {
          return reply(cache);
        }

        const values = await server.database.User.findAll(options);
        request.addCache(values);
        return reply(values);
      } catch (err) {
        return reply(err);
      }
    }
  }
});

export default server;
