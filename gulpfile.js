/**

Samuel's Master Build-script V 2.3

**/

/* Import Gulp and its modules */
gulp = require('gulp')
gulp_babel = require('gulp-babel')
gulp_coffee = require('gulp-coffee')
gulp_concat = require('gulp-concat')
gulp_cson = require('gulp-cson')
gulp_cssnano = require('gulp-cssnano')
gulp_flatten = require('gulp-flatten')
gulp_image = require('gulp-image')
gulp_less = require('gulp-less')
gulp_ng_annotate = require('gulp-ng-annotate')
gulp_plumber = require('gulp-plumber')
gulp_pug = require('gulp-pug')
gulp_sass = require('gulp-sass')
gulp_sort = require('gulp-sort')
gulp_sourcemaps = require('gulp-sourcemaps')
gulp_uglify = require('gulp-uglify')
gulp_util = require('gulp-util')
gulp_watch = require('gulp-watch')

/* Import other modules */
browserSync = require('browser-sync')
chalk = require('chalk')
crypto = require('crypto')
// electron_connect = require('electron-connect')
fs = require('fs')
yargs = require('yargs')


/* Constants */
const args = yargs.argv
const directories = {
    'bower': 'bower_components',
    'source': 'private',
    'output': 'public'
}
const statics = [
    'audio',
    'fonts',
    'html',
    'json'
]


/* Globals for BrowserSync and electron-connect */
var browserSyncSession = null
var electronFile = null
var electronFileHash = null
var electronSession = null
var conditionalUpdateMode = null


const babel_config = {
    'presets': ['es2015']
}


/* Source globs for gulp tasks */
const globs = {
    'bower_js': {
        'watcher': 'bower_js',
            'src': [
                `${directories.bower}/*/*.min.js`,
                `${directories.bower}/*/*/*.min.js`,
                `${directories.bower}/*/dist/**/*.min.js`
            ],
            'dest': `${directories.output}/js`
    },

    'bower_css': {
        'watcher': 'bower_css',
        'src': [
            `${directories.bower}/*/*.min.css`,
            `${directories.bower}/*/*/*.min.css`,
            `${directories.bower}/*/dist/**/*.min.css`
        ],
        'dest': `${directories.output}/css`
    },

    'bower_fonts': {
        'watcher': 'bower_fonts',
        'src': [
            `${directories.bower}/**/fonts/*.*`
        ],
        'dest': `${directories.output}/fonts`
    },

    'task_js': {
        'watcher': null,
        'src': (name) => [
            `${directories.source}/${name}/*.*`,
            `${directories.source}/${name}/_*/**/*.*`
        ],
        'dest': `${directories.output}/js`,
        'dir': (name) => `${directories.source}/${name}`,
        'watch': (name) => `${directories.source}/${name}/**/*.*`
    },

    'task_css': {
        'watcher': null,
        'src': (name) => [
            `${directories.source}/${name}/*.*`,
            `${directories.source}/${name}/_*/**/*.*`
        ],
        'dest': `${directories.output}/css`,
        'dir': (name) => `${directories.source}/${name}`,
        'watch': (name) => `${directories.source}/${name}/**/*.*`
    },

    'cson': {
        'watcher': 'cson',
        'src': [
            `${directories.source}/cson/**/*.cson`
        ],
        'dest': `${directories.output}/json`
    },

    'image': {
        'watcher': null,
        'src': [
            `${directories.source}/image/**/*.{gif,png,svg,jpg,jpeg,webp}`
        ],
        'dest': `${directories.output}/image`
    },

    'pug': {
        'watcher': 'pug',
        'src': [
            `${directories.source}/pug/**/*.pug`,
            `!${directories.source}/pug/**/_**/**/*.*`
        ],
        'dest': `${directories.output}/html`
    }
}


/* Conditional stream for front end refreshing */
var conditionalUpdate = function() {
    if (conditionalUpdateMode == 'browsersync') {
        return browserSyncSession.stream()
    }
    else if (conditionalUpdateMode == 'electron') {
        gulp_util.log('Reloading electron...')
        electronSession.reload()
        return gulp_util.noop()
    }
    else {
        return gulp_util.noop()
    }
}


/* A plumber that does not overstay his welcome */
var politePlumber = function() {
    return gulp_plumber({
        'errorHandler': function (err) {
            gulp_util.log(err)
            this.emit('end')
        }
    })
}


/* Bower tasks for both JS and CSS and fonts */
gulp.task('bower_js', function() {
    gulp.src(globs.bower_js.src)
        .pipe(politePlumber())
        .pipe(gulp_sort({asc: false}))
        .pipe(gulp_concat('bower.js'))
        .pipe(gulp.dest(globs.bower_js.dest))
        .pipe(conditionalUpdate())
})
gulp.task('bower_css', function() {
    gulp.src(globs.bower_css.src)
        .pipe(politePlumber())
        .pipe(gulp_concat('bower.css'))
        .pipe(gulp.dest(globs.bower_css.dest))
        .pipe(conditionalUpdate())
})
gulp.task('bower_fonts', function() {
    gulp.src(globs.bower_fonts.src)
        .pipe(politePlumber())
        .pipe(gulp_flatten())
        .pipe(gulp.dest(globs.bower_fonts.dest))
        .pipe(conditionalUpdate())
})


/* Define JavaScript tasks and where their streams should go */
const tasks_js = {
    'js': function() {
        return gulp_util.noop()
    },
    'babel': function() {
        return gulp_babel({'presets': ['es2015']})
    },
    'coffee': function() {
        return gulp_coffee()
    }
}


/* Programmatically register JavaScript tasks */
for (let task_name in tasks_js) {
    gulp.task(task_name, function() {
        // Collect the loose files in the root directory and exempt directories
        gulp.src(globs.task_js.src(task_name))
            .pipe(politePlumber())
            .pipe(gulp_sourcemaps.init())
            .pipe(tasks_js[task_name]())
            .pipe(gulp_babel(babel_config))
            .pipe(gulp_ng_annotate())
            // .pipe(gulp_uglify())
            .pipe(gulp_sourcemaps.write(`../map`))
            .pipe(gulp.dest(globs.task_js.dest))
            .pipe(conditionalUpdate())

        // Collect files inside folders and bundle them all up into one
        fs.readdir(globs.task_js.dir(task_name), (error, list) => {
            if (error) { return }
            for (let obj_name of list) {
                if (obj_name.startsWith('_')) { continue }
                let path = globs.task_js.dir(task_name) + '/' + obj_name
                fs.stat(path, (error, stat) => {
                    if (stat.isDirectory()) {

                        gulp.src(`${path}/**/*.*`)
                            .pipe(politePlumber())
                            .pipe(gulp_sourcemaps.init())
                            .pipe(tasks_js[task_name]())
                            .pipe(gulp_babel(babel_config))
                            .pipe(gulp_ng_annotate())
                            .pipe(gulp_concat(obj_name + '.js'))
                            .pipe(gulp_uglify())
                            .pipe(gulp_sourcemaps.write(`../map`))
                            .pipe(gulp.dest(globs.task_js.dest))
                            .pipe(conditionalUpdate())

                    }
                })
            }
        })
    })
}


/* Define CSS tasks and where their streams should go */
const tasks_css = {
    'css': function() {
        return gulp_util.noop()
    },
    'less': function() {
        return gulp_less()
    },
    'sass': function() {
        return gulp_sass()
    }
}


/* Programmatically register CSS tasks */
for (let task_name in tasks_css) {
    gulp.task(task_name, function() {
        // Collect the loose files in the root directory and exempt directories
        gulp.src(globs.task_css.src(task_name))
            .pipe(politePlumber())
            .pipe(gulp_sourcemaps.init())
            .pipe(tasks_css[task_name]())
            .pipe(gulp_cssnano())
            .pipe(gulp_sourcemaps.write(`../map`))
            .pipe(gulp.dest(globs.task_css.dest))
            .pipe(conditionalUpdate())

        // Collect files inside folders and bundle them all up into one
        fs.readdir(globs.task_css.dir(task_name), (error, list) => {
            if (error) { return }
            for (let obj_name of list) {
                if (obj_name.startsWith('_')) { continue }
                let path = globs.task_css.dir(task_name) + '/' + obj_name
                fs.stat(path, (error, stat) => {
                    if (stat.isDirectory()) {

                        gulp.src(`${path}/**/*.*`)
                            .pipe(politePlumber())
                            .pipe(gulp_sourcemaps.init())
                            .pipe(tasks_css[task_name]())
                            .pipe(gulp_concat(obj_name + '.css'))
                            .pipe(gulp_cssnano())
                            .pipe(gulp_sourcemaps.write(`../map`))
                            .pipe(gulp.dest(globs.task_css.dest))
                            .pipe(conditionalUpdate())

                    }
                })
            }
        })
    })
}


/* CSON task */
gulp.task('cson', function() {
    gulp.src(globs.cson.src)
        .pipe(politePlumber())
        .pipe(gulp_cson())
        .pipe(gulp.dest(globs.cson.dest))
        .pipe(conditionalUpdate())
})


/* Image optimization and minification */
gulp.task('image', function() {
    gulp.src(globs.image.src)
        .pipe(politePlumber())
        .pipe(gulp_image({
            'svgo': false,
            'zopflipng': false
        }))
        .pipe(gulp.dest(globs.image.dest))
})


/* Pug template task */
gulp.task('pug', function() {
    gulp.src(globs.pug.src)
        .pipe(politePlumber())
        .pipe(gulp_pug())
        .pipe(gulp.dest(globs.pug.dest))
        .pipe(conditionalUpdate())
})


/* Task for copying over static files */
gulp.task('static', function() {
    for (let name of statics) {
        gulp.src(`${directories.source}/${name}/**/*.*`)
            .pipe(gulp.dest(`${directories.output}/${name}`))
            .pipe(conditionalUpdate())
    }
})


/* Helper method to quickly hash a file */
var hashFile = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex')


/* Task for watching and re-compiling/building/whatever the files */
gulp.task('watch', function() {
    // BrowserSync mode
    if (args.browsersync) {
        gulp_util.log('Initializing BrowserSync...')

        // Get the vars ready
        conditionalUpdateMode = 'browsersync'
        browserSyncSession = browserSync.create()

        // Init it based on if a proxy is needed or not
        if (args.proxy) {
            browserSyncSession.init({
                'open': false,
                'proxy': args.proxy
            })
        }
        else {
            browserSyncSession.init({
                'open': false,
                'server': {
                    'baseDir': directories.output
                }
            })
        }
    }

    // Electron mode
    else if (args.electron) {
        gulp_util.log('Initializing electron-connect server...')

        // Get the vars, and such
        conditionalUpdateMode = 'electron'
        electronSession = electron_connect.server.create()
        electronSession.start()

        // Get the electron main file, either from the arg or the package file
        if (typeof(args.electron) == 'string') {
            electronFile = args.electron
        }
        else {
            electronFile = JSON.parse(fs.readFileSync('package.json')).main
        }

        // Hash the file
        electronFileHash = hashFile(electronFile)

        // Watch the main file for a restart
        gulp_util.log(`Watching "${electronFile}" to trigger electron restart`)
        gulp_watch(electronFile, function(ev) {
            let newhash = hashFile(electronFile)
            if (newhash != electronFileHash) {
                electronFileHash = newhash
                gulp_util.log('Restarting electron...')
                electronSession.restart()
            }
        })
    }

    gulp_util.log(`Starting task watchers...`)
    // Watch the files for the JS and CSS tasks
    for (let name in tasks_js) {
        gulp_util.log(`- "${name}" task is watching "${globs.task_js.watch(name)}"`)
        gulp_watch(globs.task_js.watch(name), function(ev) {
            gulp_util.log(`"${name}" triggered by "${ev}"`)
            gulp.start(name)
        })
    }
    for (let name in tasks_css) {
        gulp_util.log(`- "${name}" task is watching "${globs.task_css.watch(name)}"`)
        gulp_watch(globs.task_css.watch(name), function(ev) {
            gulp_util.log(`"${name}" triggered by "${ev}"`)
            gulp.start(name)
        })
    }


    // Watch the source files and start re-compiling and re-bundling
    for (let name in globs) {
        if (globs[name].watcher) {
            gulp_util.log(`- "${globs[name].watcher}" task is watching "${globs[name].src}"`)
            gulp_watch(globs[name].src, function(ev) {
                gulp_util.log(`"${globs[name].watcher}" triggered by "${ev}""`)
                gulp.start(globs[name].watcher)
            })
        }
    }

    // Watch the static files for changes, too
    for (let name of statics) {
        gulp_util.log(`- "static" task is watching "${directories.source}/${name}/**/*.*"`)
        gulp_watch(`${directories.source}/${name}/**/*.*`, function(ev) {
            gulp_util.log(`"static" triggered by "${ev}"`)
            gulp.start('static')
        })
    }
})


/* The default task! */
const default_tasks = [
    'bower_js',
    'bower_css',
    'bower_fonts',

    ...Object.keys(tasks_js),
    ...Object.keys(tasks_css),

    'cson',
    'pug',
    'static'
]

gulp.task('default', default_tasks, function() {
    gulp_util.log(`${chalk.yellow('WARNING!')} "image" task must be invoked manually, or by the "all" task`)
})

/* Task to run ALL of the tasks */
gulp.task('all', [...default_tasks, 'image'], () => null)
