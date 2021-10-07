const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

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
      })
    }
  })

  test('Test POST /api/issues/{project} every field', function(done) {
    const randomIssue = randomArrayElem(testIssues);

    chai
      .request(server)
      .post('/api/issues/' + randomString())
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { return done(err) }
        const issue = res.body;

        for (const key in randomIssue) {
          assert.equal(randomIssue[key], issue[key])
        }
        assert.isOk(issue._id);
        assert.isTrue(isValidDate(issue.created_on));
        assert.isTrue(isValidDate(issue.updated_on));
        assert.isTrue(issue.open);
        done();
      })
  })

  test('Test POST /api/issues/{project} required fields', function(done) {
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
        const issue = res.body;

        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        for (const key in testIssue) {
          assert.equal(testIssue[key], issue[key])
        }
        assert.isOk(issue._id);
        assert.isTrue(isValidDate(issue.created_on));
        assert.isTrue(isValidDate(issue.updated_on));
        assert.isNotOk(issue.assigned_to);
        assert.isNotOk(issue.status_text);
        assert.isTrue(issue.open);
        done();
      })
  })

  test('Test POST /api/issues/{project} missing required fields',
    function(done) {
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
        assert.notEqual(res.status, 200);
        assert.isOk(res.body.error);
        assert.equal(res.body.error, 'required field(s) missing');
        done();
      })
  })

  test('Test GET /api/issues/{project}', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const randomProject = randomString();

    chai
      .request(server)
      .post('/api/issues/' + randomProject)
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        chai
          .request(server)
          .get('/api/issues/' + randomProject)
          .end(function(err, res) {
            const issues = res.body;

            assert.equal(res.status, 200);
            assert.isNotOk(res.body.error);
            assert.isTrue(Array.isArray(issues));
            assert.equal(issues.length, 1);
            assert.isOk(issues[0]._id);
            assert.isTrue(isValidDate(issues[0].created_on));
            assert.isTrue(isValidDate(issues[0].updated_on));
            assert.isTrue(issues[0].open);

            for (const key in randomIssue) {
              assert.equal(randomIssue[key], issues[0][key])
            }
            done();
          });
      })
  })

  test('Test GET /api/issues/{project} one filter', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const randomProject = randomString();

    chai
      .request(server)
      .post('/api/issues/' + randomProject)
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        const savedIssue = res.body;
        const randomProp = randomArrayElem(Object.keys(savedIssue));
        const filter = `${randomProp}=${savedIssue[randomProp]}`;

        chai
          .request(server)
          .get(`/api/issues/${randomProject}?${filter}`)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isNotOk(res.body.error);
            assert.isTrue(Array.isArray(res.body));
            assert.equal(res.body.length, 1);

            const issue = res.body[0];

            assert.isOk(issue._id);
            assert.isTrue(isValidDate(issue.created_on));
            assert.isTrue(isValidDate(issue.updated_on));
            assert.isTrue(issue.open);

            for (const key in savedIssue) {
              assert.equal(savedIssue[key], issue[key])
            }
            done();
          });
      })
  })

  test('Test GET /api/issues/{project} multiple filters', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const randomProject = randomString();

    chai
      .request(server)
      .post('/api/issues/' + randomProject)
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        const savedIssue = res.body;
        const props = Object.keys(savedIssue);
        const count = Math.floor(Math.max(2, Math.random() * props.length));
        const filters = props
          .slice(0, count)
          .map(prop => `${prop}=${savedIssue[prop]}`);

        chai
          .request(server)
          .get(`/api/issues/${randomProject}?${filters.join('&')}`)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isNotOk(res.body.error);
            assert.isTrue(Array.isArray(res.body));
            assert.equal(res.body.length, 1);

            const issue = res.body[0];

            assert.isOk(issue._id);
            assert.isTrue(isValidDate(issue.created_on));
            assert.isTrue(isValidDate(issue.updated_on));
            assert.isTrue(issue.open);

            for (const key in savedIssue) {
              assert.equal(savedIssue[key], issue[key])
            }
            done();
          });
      })
  })

  test('Test PUT /api/issues/{project} update one field', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const randomProject = randomString();
    const fields = [
      'issue_title',
      'issue_text',
      'created_by',
      'assigned_to',
      'status_text',
    ];

    chai
      .request(server)
      .post('/api/issues/' + randomProject)
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        const savedIssue = res.body;
        const randomProp = randomArrayElem(fields);

        chai
          .request(server)
          .put('/api/issues/' + randomProject)
          .send({
            [randomProp]: randomString(),
            _id: savedIssue._id,
            open: false
          })
          .end(function(err, res) {
            assert.isNotOk(res.body.error);
            assert.equal(res.status, 200);
            assert.equal(res.body.result, 'successfully updated');
            assert.equal(res.body._id, savedIssue._id.toString());
            done();
          });
      })
  })

  test('Test PUT /api/issues/{project} update multiple fields', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const randomProject = randomString();
    const fields = [
      'issue_title',
      'issue_text',
      'created_by',
      'assigned_to',
      'status_text',
    ];

    chai
      .request(server)
      .post('/api/issues/' + randomProject)
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        const savedIssue = res.body;
        const update = fields.reduce((object, field) => {
          object[field] = savedIssue[field];
          return object;
        }, {})

        chai
          .request(server)
          .put('/api/issues/' + randomProject)
          .send({
            ...update,
            _id: savedIssue._id,
            open: false
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isNotOk(res.body.error);
            assert.equal(res.body.result, 'successfully updated');
            assert.equal(res.body._id, savedIssue._id.toString());
            done();
          });
      })
  })

  test('Test PUT /api/issues/{project} missing _id', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const randomProject = randomString();

    chai
      .request(server)
      .put('/api/issues/' + randomProject)
      .send({
        issue_title: randomString(),
      })
      .end(function(err, res) {
        assert.notEqual(res.status, 200);
        assert.isOk(res.body.error);
        assert.equal(res.body.error, 'missing _id');
        done();
      });
  })

  test('Test PUT /api/issues/{project} no update fields', function(done) {
    const randomIssue = randomArrayElem(testIssues);
    const randomProject = randomString();

    chai
      .request(server)
      .post('/api/issues/' + randomProject)
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { done(err) }
        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        const savedIssue = res.body;

        chai
          .request(server)
          .put('/api/issues/' + randomProject)
          .send({
            _id: savedIssue._id,
          })
          .end(function(err, res) {
            assert.notEqual(res.status, 200);
            assert.isOk(res.body.error);
            assert.equal(res.body.error, 'no update field(s) sent');
            assert.equal(res.body._id, savedIssue._id);
            done();
          });
      })
  })

  test('Test PUT /api/issues/{project} invalid _id', function(done) {
    const randomProject = randomString();
    const randomId = randomString();

    chai
    .request(server)
    .put('/api/issues/' + randomProject)
    .send({
      _id: randomId,
    })
    .end(function(err, res) {
      assert.notEqual(res.status, 200);
      assert.isOk(res.body.error);
      assert.equal(res.body.error, 'could not update');
      assert.equal(res.body._id, randomId);
      done();
    });
  })

  test('Test DELETE /api/issues/{project}', function(done) {
    const randomProject = randomString();
    const randomIssue = randomArrayElem(testIssues);

    chai
      .request(server)
      .post('/api/issues/' + randomProject)
      .send(randomIssue)
      .end(function(err, res) {
        if (err) { return done(err) }
        assert.equal(res.status, 200);
        assert.isNotOk(res.body.error);

        const savedIssue = res.body;

        chai
        .request(server)
        .delete('/api/issues/' + randomProject)
        .send({
          _id: savedIssue._id,
        })
        .end(function(err, res) {
          if (err) { return done(err) }
          assert.equal(res.status, 200);
          assert.isNotOk(res.body.error);
          assert.equal(res.body.result, 'successfully deleted');
          assert.equal(res.body._id, savedIssue._id);
          done();
        });
      })
  })

  test('Test DELETE /api/issues/{project} invalid _id', function(done) {
    const randomProject = randomString();
    const randomId = randomString();

    chai
    .request(server)
    .delete('/api/issues/' + randomProject)
    .send({
      _id: randomId
    })
    .end(function(err, res) {
      if (err) { return done(err) }
      assert.notEqual(res.status, 200);
      assert.isOk(res.body.error);
      assert.equal(res.body.error, 'could not delete');
      assert.equal(res.body._id, randomId);
      done();
    });
  })

  test('Test DELETE /api/issues/{project} missing _id', function(done) {
    const randomProject = randomString();

    chai
    .request(server)
    .delete('/api/issues/' + randomProject)
    .send({})
    .end(function(err, res) {
      if (err) { return done(err) }
      assert.notEqual(res.status, 200);
      assert.isOk(res.body.error);
      assert.equal(res.body.error, 'missing _id');
      done();
    });
  })
});

// Helper functions
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

const isValidDate = (string) => {
  return new Date(string).toString() !== 'Invalid Date';
}
