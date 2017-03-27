import Lab from 'lab';
import Code from 'code';
import server from './fixtures';
import client from './fixtures/client';

const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;
const describe = lab.describe;
const before = lab.before;

describe('Slap', () => {
  describe('create tables', () => {
    before((done) => {
      server.database.User
      .sync()
      .then(() => {
        const user = {
          username: 'username_1',
          firstName: 'firstName_1',
          lastName: 'lastName_1',
          email: 'email_1@email.com',
          password: '123abc'
        };

        return server.database.User.create(user);
      })
      .then(() => {
        const user = {
          username: 'username_2',
          firstName: 'firstName_2',
          lastName: 'lastName_2',
          email: 'email_2@email.com',
          password: '123abc'
        };

        return server.database.User.create(user);
      })
      .then(() => {
        done();
      });
    });

    it('Clear cache', (done) => {
      client.DEL('user-cache', 'users-cache&default', 'users-cache-id', 'users-cache-id&1', 'users-cache&search=username_1', (err) => {
        expect(err).to.not.exist();
        done();
      });
    });

    it('GET /users', (done) => {
      const options = {
        method: 'GET',
        url: '/users'
      };

      server.inject(options, (response) => {
        expect(response.result).to.be.an.array();
        expect(response.result).to.have.length(2);
        expect(response.result[0].id).to.exist();
        expect(response.result[0].username).to.exist();
        expect(response.result[0].firstName).to.exist();
        expect(response.result[0].lastName).to.exist();
        expect(response.result[0].email).to.exist();
        done();
      });
    });

    it('Exist cache GET /users', (done) => {
      client.GET('users-cache&default', (err, data) => {
        expect(err).to.not.exist();
        expect(JSON.parse(data)).to.equal([{'id': 1, 'username': 'username_1', 'firstName': 'firstName_1', 'lastName': 'lastName_1', 'email': 'email_1@email.com'}, {'id': 2, 'username': 'username_2', 'firstName': 'firstName_2', 'lastName': 'lastName_2', 'email': 'email_2@email.com'}]);
        done();
      });
    });

    it('GET /users query', (done) => {
      const options = {
        method: 'GET',
        url: '/users?search=username_1'
      };

      server.inject(options, (response) => {
        expect(response.result).to.be.an.array();
        expect(response.result[0].id).to.equal(1);
        expect(response.result[0].username).to.equal('username_1');
        expect(response.result[0].firstName).to.equal('firstName_1');
        expect(response.result[0].lastName).to.equal('lastName_1');
        expect(response.result[0].email).to.equal('email_1@email.com');
        done();
      });
    });

    it('Exist cache GET /users?search=username_1', (done) => {
      client.GET('users-cache&search=username_1', (err, data) => {
        expect(err).to.not.exist();
        expect(data).to.be.a.string();
        done();
      });
    });

    it('GET /user/{id}', (done) => {
      const options = {
        method: 'GET',
        url: '/user/1'
      };

      server.inject(options, (response) => {
        expect(response.result.id).to.equal(1);
        expect(response.result.username).to.equal('username_1');
        expect(response.result.firstName).to.equal('firstName_1');
        expect(response.result.lastName).to.equal('lastName_1');
        expect(response.result.email).to.equal('email_1@email.com');
        done();
      });
    });

    it('Exist cache for parameter GET /users', (done) => {
      client.GET('users-cache-id&1', (err, data) => {
        expect(err).to.not.exist();
        expect(JSON.parse(data)).to.equal({'id': 1, 'username': 'username_1', 'firstName': 'firstName_1', 'lastName': 'lastName_1', 'email': 'email_1@email.com'});
        done();
      });
    });

    it('Clear all cache', (done) => {
      const options = {
        method: 'POST',
        url: '/user-clear'
      };

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('Cache not exist parameter', (done) => {
      client.GET('users-cache-id&1', (err, data) => {
        expect(err).to.be.null();
        expect(data).to.be.null();
        done();
      });
    });

    it('Cache not exist default', (done) => {
      client.GET('users-cache&default', (err, data) => {
        expect(err).to.be.null();
        expect(data).to.be.null();
        done();
      });
    });

    it('Error slap not informed POST /users-error-slap', (done) => {
      const options = {
        method: 'POST',
        url: '/user-error-slap'
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.equal(500);
        expect(response.result.error).to.exist();
        expect(response.result.message).to.exist();
        done();
      });
    });

    it('Error clear not informed POST /users-error-clear', (done) => {
      const options = {
        method: 'POST',
        url: '/user-error-clear'
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.equal(500);
        expect(response.result.error).to.exist();
        expect(response.result.message).to.exist();
        done();
      });
    });

    it('Error slap not informed GET /users-error-rule', (done) => {
      const options = {
        method: 'GET',
        url: '/users-error-rule'
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.equal(500);
        expect(response.result.error).to.exist();
        expect(response.result.message).to.exist();
        done();
      });
    });

    it('Error rule not informed GET /users-error-slap', (done) => {
      const options = {
        method: 'GET',
        url: '/users-error-slap'
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.equal(500);
        expect(response.result.error).to.exist();
        expect(response.result.message).to.exist();
        done();
      });
    });

    it('Error plugin not informed GET /users-error-plugins', (done) => {
      const options = {
        method: 'GET',
        url: '/users-error-plugins'
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.equal(500);
        expect(response.result.error).to.exist();
        expect(response.result.message).to.exist();
        done();
      });
    });
  });
});
