'use strict';

// Node
const path = require('path');

// Styles
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

// Javascript deps
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const pump = require('pump');

// BrowserSync
const browserSync = require('browser-sync').create();

// Gulp
const gulp = require('gulp');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const jsdoc = require('gulp-jsdoc3');

// Generic utility
const del = require('del');
const exec = require('child_process').exec;

// JSDoc
const jsdocConfig = require('gulp-jsdoc3/dist/jsdocConfig.json');

// Test environment
const Server = require('karma').Server;
const cloptions = require('minimist')(process.argv.slice(2), {
  alias: {
    k: 'keepalive',
  },
  boolean: ['keepalive'],
});

// Axe A11y Test
const axe = require('gulp-axe-webdriver');
const axeArgs = require('minimist')(process.argv.slice(2));

/**
 * BrowserSync
 */

gulp.task('browser-sync', ['build:dev'], () => {
  browserSync.init({
    logPrefix: 'Carbon Components',
    open: false,
    proxy: 'localhost:8080',
    timestamps: false,
  });
});

/**
 * Clean
 */

// Use: npm run prebuild
gulp.task('clean', () =>
  del([
    'scss',
    'css',
    'es',
    'umd',
    'scripts',
    'html',
    'dist',
    'demo/**/*.{js,map}',
    '!demo/js/demo-switcher.js',
    '!demo/js/theme-switcher.js',
    '!demo/index.js',
    '!demo/polyfills/*.js',
  ])
);

/**
 * JavaScript Tasks
 */

gulp.task('scripts:dev', cb => {
  exec('./node_modules/.bin/rollup -c tools/rollup.config.dev.js', err => {
    browserSync.reload();
    cb(err);
  });
});

gulp.task('scripts:umd', () => {
  const srcFiles = ['./src/**/*.js'];
  const babelOpts = {
    presets: [
      [
        'env',
        {
          targets: {
            browsers: ['last 1 version', 'ie >= 11'],
          },
        },
      ],
    ],
    plugins: ['transform-es2015-modules-umd', 'transform-class-properties'],
  };

  return gulp
    .src(srcFiles)
    .pipe(babel(babelOpts))
    .pipe(gulp.dest('umd/'));
});

gulp.task('scripts:es', () => {
  const srcFiles = ['./src/**/*.js'];
  const babelOpts = {
    presets: [
      [
        'env',
        {
          modules: false,
          targets: {
            browsers: ['last 1 version', 'ie >= 11'],
          },
        },
      ],
    ],
    plugins: ['transform-class-properties'],
  };

  return gulp
    .src(srcFiles)
    .pipe(babel(babelOpts))
    .pipe(gulp.dest('es/'));
});

gulp.task('scripts:rollup', cb => {
  exec('./node_modules/.bin/rollup -c tools/rollup.config.js', err => {
    cb(err);
  });
});

gulp.task('scripts:compiled', ['scripts:rollup'], cb => {
  const srcFile = './scripts/carbon-components.js';

  pump(
    [
      gulp.src(srcFile),
      uglify(),
      rename('carbon-components.min.js'),
      gulp.dest('scripts'),
    ],
    cb
  );
});

/**
 * Sass Tasks
 */

gulp.task('sass:dev', () =>
  gulp
    .src('demo/scss/demo.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'expanded',
        includePaths: ['./node_modules'],
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        browsers: ['> 1%', 'last 2 versions'],
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('demo'))
    .pipe(browserSync.stream())
);

gulp.task('html:source', () => {
  const srcFiles = './src/components/**/*.html';

  return gulp.src(srcFiles).pipe(gulp.dest('html'));
});

/**
 * JSDoc
 */

gulp.task('jsdoc', cb => {
  gulp
    .src('./src/**/*.js')
    .pipe(
      babel({
        plugins: ['transform-class-properties'],
        babelrc: false,
      })
    )
    .pipe(gulp.dest('./docs/js/tmp'))
    .on('end', () => {
      gulp.src(['README.md', 'docs/js/tmp/**/*.js'], { read: false }).pipe(
        jsdoc(
          Object.assign(jsdocConfig, {
            // eslint-disable-line global-require
            opts: {
              destination: './docs/js',
            },
          }),
          err => {
            if (err) {
              cb(err);
            } else {
              del('./docs/js/tmp', cb);
            }
          }
        )
      );
    })
    .on('error', cb);
});

/**
 * Test
 */

gulp.task('test', ['test:unit', 'test:a11y']);

gulp.task('test:unit', done => {
  new Server(
    {
      configFile: path.resolve(__dirname, 'tests/karma.conf.js'),
      singleRun: !cloptions.keepalive,
    },
    done
  ).start();
});

gulp.task('test:a11y', done => {
  const componentName = axeArgs.name === undefined ? undefined : axeArgs.name;
  const options = {
    a11yCheckOptions: {
      rules: {
        'html-has-lang': { enabled: false },
        bypass: { enabled: false },
        'image-alt': { enabled: false },
      },
    },
    verbose: true,
    showOnlyViolations: true,
    exclude: '.offleft, #flex-col, #flex-row',
    tags: ['wcag2aa', 'wcag2a'],
    folderOutputReport:
      componentName === undefined ? 'tests/axe/allHtml' : 'tests/axe',
    saveOutputIn:
      componentName === undefined
        ? 'a11y-html.json'
        : `a11y-${componentName}.json`,
    urls:
      componentName === undefined
        ? ['http://localhost:3000']
        : [`http://localhost:3000/components/${componentName}/`],
  };

  return axe(options, done);
});

// Watch Tasks
gulp.task('watch', () => {
  gulp.watch('src/**/**/*.html').on('change', browserSync.reload);
  gulp.watch(['src/**/**/*.js'], ['scripts:dev', 'scripts:compiled']);
  gulp.watch(['demo/**/**/*.js', '!demo/demo.js'], ['scripts:dev']);
  gulp.watch(['src/**/**/*.scss', 'demo/**/*.scss'], ['sass:dev']);
});

gulp.task('serve', ['browser-sync', 'watch']);

// Build task collection
gulp.task('build:scripts', ['scripts:umd', 'scripts:es', 'scripts:compiled']);

// Mapped to npm run build
gulp.task('build', ['build:scripts', 'html:source']);

// For demo environment
gulp.task('build:dev', ['sass:dev', 'scripts:dev']);

gulp.task('default', () => {
  // eslint-disable-next-line no-console
  console.log(
    '\n\n Please use `$ npm run dev` and navigate to \n http://localhost:3000 to view project locally \n\n'
  );
});
