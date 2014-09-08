'use strict';

var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    sass = require('gulp-sass'),
    watch = require('gulp-watch');

gulp.task('serve', function () {
  nodemon({ script: 'server.js', ext: 'html js', ignore: ['public/**/*'] });
});

gulp.task('sass', function () {
  gulp.src('./scss/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('public/css'));
});

gulp.task('develop', [ 'sass', 'serve' ], function () {
  watch('scss/*.scss', function (files, cb) {
    gulp.start('sass', cb);
  });
});
