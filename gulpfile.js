const gulp = require('gulp');
const del = require('del');
var concat = require('gulp-concat');
var pump = require('pump');
const uglify = require('gulp-uglify');

gulp.task('default', ['processCSS', 'clean']);

gulp.task('clean', () => {
  return del([
    'build/'
  ]);
});

gulp.task('processCSS', function(cb) {
    pump([
        gulp.src('css/*.css'),
        concat('all.css'),
        gulp.dest('build/css')
    ], cb);
});


gulp.task('watch', function() {
    gulp.watch(['css/*.css'], ['processCSS', 'clean']);
});