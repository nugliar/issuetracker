'use strict';

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const issueSchema = new mongoose.Schema({
  project: String,
  issue_title: String,
  issue_text: String,
  created_by: String,
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

      IssueModel.find({project: project}, function(err, issues) {
        if (err) { return next(err) }

        const filteredIssues = issues.filter(issue => {
          for (const key in query) {
            if (issue[key] !== undefined
              && query[key] !== undefined
                && issue[key].toString() !== query[key]) {
                  return false;
                }
          }
          return true;
        })
        res.send(filteredIssues.map(issue => formatDoc(issue)));
      })
    })

    .post(function (req, res, next){
      const requiredFields = [ 'issue_title', 'issue_text', 'created_by'];
      const project = req.params.project;

      for (const field of requiredFields) {
        if (!req.body[field]) {
          // res.status(400);
          return res.send({ error: 'required field(s) missing' });
        }
      }

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
      const project = req.params.project;

      if (!req.body._id) {
        res.status(400);
        return res.send({ error: 'missing _id' });
      }

      IssueModel.findOne({
        _id: req.body._id,
        project: project
      }, function(err, issue) {
        if (err || !issue) {
          res.status(500);
          return res.send({
            _id: req.body._id,
            error: 'could not update'
          });
        }

        const update = Object.keys(req.body)
          .filter(key => req.body[key] && key !== '_id')
          .reduce((object, key) => {
            object[key] = req.body[key];
            return object;
          }, {});

        if (!Object.keys(update).length) {
          res.status(400);
          return res.send({
            _id: req.body._id,
            error: 'no update field(s) sent'
          });
        }

        issue = Object.assign(issue, update, {
          updated_on: new Date().toISOString(),
          open: req.body.open ? false : req.body.open
        });

        issue.save(function(err, issue) {
          if (err) { return next(err) }
          res.send({
            _id: issue._id,
            result: 'successfully updated',
          });
        })
      })
    })

    .delete(function (req, res, next) {
      const project = req.params.project;

      if (!req.body._id) {
        res.status(400);
        return res.send({ error: 'missing _id' });
      }

      IssueModel.deleteOne({
        _id: req.body._id,
        project: project
      }, function(err, result) {
        if (!err && result.deletedCount) {
          res.send({
            _id: req.body._id,
            result: 'successfully deleted',
          })
        } else {
          res.status(500);
          res.send({
            _id: req.body._id,
            error: 'could not delete'
          })
        }
      });
    });
};
