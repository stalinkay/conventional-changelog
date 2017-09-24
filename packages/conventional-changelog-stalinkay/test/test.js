'use strict';
var execSync = require('child_process').execSync;
var conventionalChangelogCore = require('conventional-changelog-core');
var preset = require('../');
var expect = require('chai').expect;
var gitDummyCommit = require('git-dummy-commit');
var shell = require('shelljs');
var through = require('through2');
var betterThanBefore = require('better-than-before')();
var preparing = betterThanBefore.preparing;

betterThanBefore.setups([
  function() {
    shell.config.silent = true;
    shell.rm('-rf', 'tmp');
    shell.mkdir('tmp');
    shell.cd('tmp');
    shell.mkdir('git-templates');
    shell.exec('git init --template=./git-templates');

    gitDummyCommit('chore: first commit');
    gitDummyCommit(['feat: amazing new module', 'BREAKING CHANGE: Not backward compatible.']);
    gitDummyCommit(['fix(compile): avoid a bug', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['perf(ngOptions): make it faster', ' closes #1, #2']);
    gitDummyCommit('revert(ngOptions): bad commit');
    gitDummyCommit('fix(*): oops');
    gitDummyCommit('deprecate(*): create new module');
    gitDummyCommit('enhance(*): change feature');
    gitDummyCommit('secure(*): login feature');
  },
  function() {
    gitDummyCommit(['feat(awesome): addresses the issue brought up in #133']);
  },
  function() {
    gitDummyCommit(['feat(awesome): fix #88']);
  },
  function() {
    gitDummyCommit(['feat(awesome): issue brought up by @stalinkay! on Friday']);
  },
  function() {
    gitDummyCommit(['docs(readme): make it clear', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['style(whitespace): make it easier to read', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['refactor(code): change a lot of code', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['test(*): more tests', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['chore(deps): bump', 'BREAKING CHANGE: The Change is huge.']);
  },
  function() {
    gitDummyCommit(['feat(deps): bump', 'BREAKING CHANGES: Also works :)']);
  },
  function() {
    shell.exec('git tag v1.0.0');
    gitDummyCommit('feat: some more features');
  },
  function() {
    gitDummyCommit(['feat(*): implementing #5 by @stalinkay', ' closes #10']);
  },
  function() {
    gitDummyCommit(['fix: use npm@5 (@username)']);
  }
]);

describe('angular preset', function() {
  it('should work if there is no semver tag', function(done) {
    preparing(1);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');
        expect(chunk).to.include('make it faster');
        expect(chunk).to.include(', closes [#1](https://github.com/stalinkay/conventional-changelog-angular/issues/1) [#2](https://github.com/stalinkay/conventional-changelog-angular/issues/2)');
        expect(chunk).to.include('Not backward compatible.');
        expect(chunk).to.include('**compile:** The Change is huge.');
        expect(chunk).to.include('Added');
        expect(chunk).to.include('Fixed');
        expect(chunk).to.include('Security');
        expect(chunk).to.include('Deprecated');
        expect(chunk).to.include('Performance Improved');
        expect(chunk).to.include('Removed');
        expect(chunk).to.include('bad commit');
        expect(chunk).to.include('BREAKING CHANGES');

        expect(chunk).to.not.include('first commit');
        expect(chunk).to.not.include('feat');
        expect(chunk).to.not.include('fix');
        expect(chunk).to.not.include('perf');
        expect(chunk).to.not.include('revert');
        expect(chunk).to.not.include('***:**');
        expect(chunk).to.not.include(': Not backward compatible.');

        done();
      }));
  });

  it('should replace #[0-9]+ with GitHub issue URL', function(done) {
    preparing(2);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[#133](https://github.com/stalinkay/conventional-changelog-angular/issues/133)');
        done();
      }));
  });

  it('should remove the issues that already appear in the subject', function(done) {
    preparing(3);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[#88](https://github.com/stalinkay/conventional-changelog-angular/issues/88)');
        expect(chunk).to.not.include('closes [#88](https://github.com/stalinkay/conventional-changelog-angular/issues/88)');
        done();
      }));
  });

  it('should replace @username with GitHub user URL', function(done) {
    preparing(4);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[@stalinkay](https://github.com/stalinkay)');
        done();
      }));
  });

  it('should not discard commit if there is BREAKING CHANGE', function(done) {
    preparing(5);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('Documented');
        expect(chunk).to.include('Styled');
        expect(chunk).to.include('Code Refactored');
        expect(chunk).to.include('Tested');
        expect(chunk).to.include('Chored');

        done();
      }));
  });

  it('should BREAKING CHANGES the same as BREAKING CHANGE', function(done) {
    preparing(6);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('Also works :)');

        done();
      }));
  });

  it('should work if there is a semver tag', function(done) {
    preparing(7);
    var i = 0;

    conventionalChangelogCore({
      config: preset,
      outputUnreleased: true
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('some more features');
        expect(chunk).to.not.include('BREAKING');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });

  it('should work with unknown host', function(done) {
    preparing(7);
    var i = 0;

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: __dirname + '/fixtures/_unknown-host.json'
      }
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('(http://unknown/compare');
        expect(chunk).to.include('](http://unknown/commits/');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });

  it('should work specifying where to find a package.json using conventional-changelog-core', function(done) {
    preparing(8);
    var i = 0;

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: __dirname + '/fixtures/_known-host.json'
      }
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('(https://github.com/stalinkay/example/compare');
        expect(chunk).to.include('](https://github.com/stalinkay/example/commit/');
        expect(chunk).to.include('](https://github.com/stalinkay/example/issues/');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });

  it('should fallback to the closest package.json when not providing a location for a package.json', function(done) {
    preparing(8);
    var i = 0;

    conventionalChangelogCore({
      config: preset,
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('(https://github.com/stalinkay/conventional-changelog-angular/compare');
        expect(chunk).to.include('](https://github.com/stalinkay/conventional-changelog-angular/commit/');
        expect(chunk).to.include('](https://github.com/stalinkay/conventional-changelog-angular/issues/');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });

  it('should support non public GitHub repository locations', function(done) {
    preparing(8);

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: __dirname + '/fixtures/_ghe-host.json'
      }
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('(https://github.internal.example.com/stalinkay');
        expect(chunk).to.include('(https://github.internal.example.com/conventional-changelog/internal/compare');
        expect(chunk).to.include('](https://github.internal.example.com/conventional-changelog/internal/commit/');
        expect(chunk).to.include('5](https://github.internal.example.com/conventional-changelog/internal/issues/5');
        expect(chunk).to.include(' closes [#10](https://github.internal.example.com/conventional-changelog/internal/issues/10)')

        done();
      }));
  });

  it('should only replace with link to user if it is an username', function (done) {
    preparing(9);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.not.include('(https://github.com/5');
        expect(chunk).to.include('(https://github.com/username');

        done();
      }));
  });
});
