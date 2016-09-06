var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    webserver = require('gulp-webserver');

gulp.task('webserver', function() {
  gulp.src('webapp')
    .pipe(webserver({
      	livereload: true,
      	port: 9000,
      	middleware: [ function (req, res, next) {
      		next();
      	} ],
      	proxies: [ {
      		source: "/webapi-1.3",
      		target:"http://localhost:5000/open"
      	} ],
      	fallback: 'index.html',
      directoryListing: true,
      open: false
    }));
});

gulp.task('default', ['webserver']);
