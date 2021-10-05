'use strict';

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const issueSchema = new mongoose.Schema({
  project: String,
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  created_on: String,
  updated_on: String,
  assigned_to: String,
  open: Boolean,
  status_text: String
});

const IssueModel = mongoose.model('IssueModel', issueSchema);

const formatDoc = (doc) => {
  return {
    _id: doc._id,
    issue_title: doc.issue_title,
    issue_text: doc.issue_text,
    created_on: doc.created_on,
    updated_on: doc.updated_on,
    created_by: doc.created_by,
    assigned_to: doc.assigned_to,
    open: doc.open,
    status_text: doc.status_text
  }
}

module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(function (req, res, next){
      const project = req.params.project;
      const query = req.query;

      const toISODate = (string) => {
        return string ? new Date(string).toISOString() : undefined
      };

      const toBool = (string) => {
        if (string === 'true') { return true }
        if (string === 'false') { return false }
        return undefined;
      }

      const filter = {
        _id: query._id,
        issue_title: query.issue_title,
        issue_text: query.issue_text,
        created_on: toISODate(query.created_on),
        updated_on: toISODate(query.updated_on),
        created_by: query.created_by,
        assigned_to: query.assigned_to,
        open: toBool(query.open),
        status_text: query.status_text
      };

      IssueModel.find({project: project}, function(err, issues) {
        if (err) { return next(err) }
        const filteredIssues = issues.filter(issue => {
          for (const key in query) {
            if (issue[key] !== undefined
            && filter[key] !== undefined
            && issue[key] !== filter[key]) {
              if (key === 'created_on') {
                console.log(issue[key] + ' !== ' + filter[key]);
              }
              return false;
            }
          }
          return true;
        })
        res.send(filteredIssues.map(issue => formatDoc(issue)));
      })
    })

    .post(function (req, res, next){
      let project = req.params.project;

      IssueModel.create({
        project: project,
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to,
        open: true,
        status_text: req.body.status_text
      },
      function(err, issue) {
        if (err) { return next(err) }
        res.send(formatDoc(issue));
      })
    })

    .put(function (req, res, next) {
      let project = req.params.project;
      const update = Object.keys(req.body)
        .filter(key => req.body[key])
        .reduce((object, key) => {
          object[key] = req.body[key];
          return object;
        }, {});

      IssueModel.findByIdAndUpdate(
        req.body._id,
        Object.assign({}, update, {
          updated_on: new Date().toISOString(),
          open: req.body.open ? false : req.body.open
        }),
        { new: true },
        function(err, issue) {
          if (err) { return next(err) }
          if (!issue) { return next(new Error('issue not found')) }
          res.send({
            _id: issue._id,
            result: 'successfully updated',
          });
        }
      )
    })

    .delete(function (req, res, next) {
      let project = req.params.project;

      IssueModel.deleteOne({
        _id: req.body._id
      }, function(err, result) {
        if (err) { return next(err) }
        if (result.deletedCount) {
          res.send({
            result: 'successfully deleted',
            _id: req.body._id
          })
        } else {
          return next(new Error('issue not found'))
        }
      });
    });

  app.route('/_api/issues/addRandomHundred')

    .get(function (req, res, next) {

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

      let issues = [];

      for (let idx = 0; idx < 100; idx++) {
        issues.push({
          project: 'random',
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

      IssueModel.insertMany(issues, function(err, result) {
        if (err) { return next(err) }
        res.send(result)
      })
    });

  app.route('/_api/issues/deleteRandom')

    .get(function (req, res, next) {
      IssueModel.deleteMany(
        { project: 'random' },
        function(err, result) {
          if (err) { return next(err) }
          res.send(result)
        }
      )
    });
};
