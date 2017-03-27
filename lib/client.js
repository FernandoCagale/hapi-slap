import redis from 'redis';
import Promise from 'bluebird';

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

export function getClient (url) {
  const client = redis.createClient({
    url: url
  });

  client.on('error', (err) => {
    throw new Error(err);
  });

  return client;
}
