const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const randomString = () => {
  const length = Math.round(Math.random() * 15 + 5);
  let array = [];

  for (let idx = 0; idx < length; idx++) {
    array.push(String
      .fromCharCode(32 + Math.floor(Math.random() * 94))
      .concat(String.fromCharCode(97 + Math.floor(Math.random() * 25)))
      .match(/[0-9a-zA-Z]/g)
      .join('')
    )
  }
  return array.join('');
}

const randomArrayElem = (array) => {
  return array[Math.floor(Math.random() * (array.length - 1))];
}

suite('Functional Tests', function() {

  let testIssues = [];

  suiteSetup(function() {
    for (let idx = 0; idx < 100; idx++) {
      testIssues.push({
        issue_title: randomString(),
        issue_text: randomString(),
        created_by: randomString(),
        assigned_to: randomString(),
        status_text: randomString(),
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        open: Math.random() > 0.5 ? true: false
      })
    }
  })

  test('Test POST /api/issues/{project} with every field', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const testIssue = {
      issue_title: randomIssue.issue_title,
      issue_text: randomIssue.issue_text,
      created_by: randomIssue.created_by,
      assigned_to: randomIssue.assigned_to,
      status_text: randomIssue.status_text
    };

    chai
      .request(server)
      .post('/api/issues/' + randomString())
      .send(testIssue)
      .end(function(err, res) {
        if (err) { return done(err) }
        const data = res.body;

        Object.keys(testIssue).forEach((key, idx) => {
          assert.equal(testIssue[key], data[key])
        });
        assert.isOk(data._id);
        assert.isTrue(new Date(data.created_on).toString() !== 'Invalid Date');
        assert.isTrue(new Date(data.updated_on).toString() !== 'Invalid Date');
        assert.isTrue(data.open);
        done();
      })
  })

  test('Test POST /api/issues/{project} with required fields', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const testIssue = {
      issue_title: randomIssue.issue_title,
      issue_text: randomIssue.issue_text,
      created_by: randomIssue.created_by,
    };

    chai
      .request(server)
      .post('/api/issues/' + randomString())
      .send(testIssue)
      .end(function(err, res) {
        if (err) { return done(err) }
        const data = res.body;

        assert.isNotTrue(res.error);

        Object.keys(testIssue).forEach((key, idx) => {
          assert.equal(testIssue[key], data[key])
        });

        assert.isOk(data._id);
        assert.isOk(new Date(data.created_on));
        assert.isOk(new Date(data.updated_on));
        assert.isNotOk(data.assigned_to);
        assert.isNotOk(data.status_text);
        assert.isTrue(data.open);
        done();
      })
  })

  test('Test POST /api/issues/{project} with missing required fields', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const testIssue = {
      issue_title: randomIssue.issue_title,
      created_by: randomIssue.created_by,
    };

    chai
      .request(server)
      .post('/api/issues/' + randomString())
      .send(testIssue)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.isOk(res.error);
        assert.notEqual(res.status, 200);
        done();
      })
  })

  test('Test GET /api/issues/{project}', function(done) {
    chai
      .request(server)
      .get('/api/issues/random')
      .end(function(err, res) {
        if (err) { done(err) }
        assert.isNotTrue(res.error);
        assert.equal(res.status, 200);
        assert.isTrue(Array.isArray(res.body));
        done();
      })
  })

  test('Test GET /api/issues/{project} with one filter', function(done) {
    const issue = randomArrayElem(testIssues);
    const randomProp = randomArrayElem(Object.keys(issue));

    chai
      .request(server)
      .get('/api/issues/' + randomString() + `?${randomProp}=` + randomString())
      .end(function(err, res) {
        if (err) { done(err) }
        assert.isNotTrue(res.error);
        assert.equal(res.status, 200);
        assert.isTrue(Array.isArray(res.body));
        done();
      })
  })

  test('Test GET /api/issues/{project} with multiple filters', function(done) {
    const issue = randomArrayElem(testIssues);
    const props = Object.keys(issue);
    const count = Math.floor(Math.max(2, Math.random() * props.length));
    const filters = props
      .slice(0, count)
      .map(prop => `${prop}=${issue[prop]}`);

    chai
      .request(server)
      .get(`/api/issues/${randomString()}?${filters.join('&')}`)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.isNotTrue(res.error);
        assert.equal(res.status, 200);
        assert.isTrue(Array.isArray(res.body));
        done();
      })
  })
});
