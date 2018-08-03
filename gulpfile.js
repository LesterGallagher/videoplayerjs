var closureCompiler = require('google-closure-compiler').gulp();
var sourcemaps = require('gulp-sourcemaps');
var gulp = require('gulp');
var gutil = require('gulp-util');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var concat = require('gulp-concat');
var postcssUrl = require('postcss-url');

var prod = process.env.NODE_ENV === 'production';

gulp.task('css', function () {
    var plugins = [
        autoprefixer(),
        postcssUrl({ url: 'inline', encodeType: 'base64', optimizeSvgEncode: true }),
        cssnano(),
    ];
    return gulp.src('video.css')
        .pipe(postcss(plugins))
        .pipe(concat('video.min2.css'))
        .pipe(gulp.dest('./'));
});

gulp.task('js', () => {
    return gulp.src('video.js', { base: './' })
        .pipe(closureCompiler({
            compilation_level: 'SIMPLE',
            language_in: 'ECMASCRIPT6_STRICT',
            language_out: 'ECMASCRIPT3',
            output_wrapper: '(function(){\n%output%\n}).call(this)',
            js_output_file: 'video.min.js',
            warning_level: 'VERBOSE',
        }))
        .on('error', gutil.log)
        .pipe(gulp.dest('./'));
});




gulp.task('default', ['js', 'css']);
