Hapi-Slap cache in Redis
===
[![Build Status][travis-badge]][travis-url]

Configuration Hapijs K7 and Slap

```javascript
const Hapi = require('hapi');
const path = require('path');

let server = new Hapi.Server();

const dir = path.join(__dirname, '/models/**.js');

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
  register: require('slap')
  /* or 
  register: require('slap')
  options: {
    url: 'redis://127.0.0.1:6379/0',
    expireIn: 300
  }
  */
}];

server.register(register, (err) => {
  if (err) throw err;
});

server.connection();
```

Create routes
```javascript

server.route([
    {
      method: 'GET',
      path: '/colors',
      config: {
        plugins: {
          slap: {
            rule: 'colors'
          }
        },
        handler: Controller.list,
        validate: Validator.list()
      }
    },
    {
      method: 'GET',
      path: '/color/{id}',
      config: {
        plugins: {
          slap: {
            rule: 'color-id',
            expireIn: 60
          }
        },
        handler: Controller.read,
        validate: Validator.read()
      }
    },
    {
      method: 'POST',
      path: '/color',
      config: {
        plugins: {
          slap: {
            clear: ['colors', 'color-id']
          }
        },
        handler: Controller.create,
        validate: Validator.create()
      }
    },
    {
      method: 'PUT',
      path: '/color/{id}',
      config: {
        plugins: {
          slap: {
            clear: ['colors', 'color-id']
          }
        },
        handler: Controller.update,
        validate: Validator.update()
      }
    },
    {
      method: 'DELETE',
      path: '/color/{id}',
      config: {
        plugins: {
          slap: {
            clear: ['colors', 'color-id']
          }
        },
        handler: Controller.destroy,
        validate: Validator.destroy()
      }
    }
  ]);

```
Create controller
```javascript
export const list = async (request, reply) => {
  try {
    const model = request.database.Color;

    const options = {
      attributes: FIELDS.COLOR,
      offset: request.offset(),
      limit: request.limit()
    };

    const cache = await request.getCache();

    if (cache) {
      return reply(cache);
    }

    const values = await model.findAndCountAll(options);

    request.addCache(values);

    return reply(values);
  } catch (err) {
    return reply.badImplementation(err);
  }
};

export const create = async (request, reply) => {
  try {
    const model = request.database.Color;

    request.clearCache();

    const value = await model.create(payload);

    return reply({id: value.id});
  } catch (err) {
    return reply.badImplementation(err);
  }
};

export const read = async (request, reply) => {
  try {
    const model = request.database.Color;
    const id = request.params.id;

    const options = {
      attributes: FIELDS.COLOR,
      where: {id: id}
    };

    const cache = await request.getCache(id);

    if (cache) {
      return reply(cache);
    }

    const value = await model.findOne(options);
    if (!value) {
        return reply.notFound();
    }

    request.addCache(value, id);

    return reply(value);
  } catch (err) {
    return reply.badImplementation(err);
  }
};

export const update = async (request, reply) => {
  try {
    const model = request.database.Color;
    const id = request.params.id;
    const payload = request.payload;

    const value = await model.findOne(options);
    if (!value) {
      return reply.notFound();
    }

    const valueUpdate = await value.update(payload, {where: {id: id}});

    request.clearCache();

    return reply({id: valueUpdate.id});
  } catch (err) {
    return reply.badImplementation(err);
  }
};

export const destroy = async (request, reply) => {
  try {
    const model = request.database.Color;

    const options = {
      attributes: FIELDS.COLOR,
      where: {id: id}
    };

    const value = await model.findOne(options);
    if (!value) {
      return reply.notFound();
    }

    await value.destroy();

    request.clearCache();

    return reply({
      id: value.id
    });
  } catch (err) {
    return reply.badImplementation(err);
  }
};

```

[travis-badge]:https://travis-ci.org/FernandoCagale/hapi-slap.svg?branch=master
[travis-url]: https://travis-ci.org/FernandoCagale/hapi-slap

