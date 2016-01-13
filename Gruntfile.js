module.exports = function (grunt) {
    // Do grunt-related things in here
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        karma: {
            unit: {
                configFile: 'build/config/karma.conf.js',
                singleRun: true
            },
            punit: {
                configFile: 'build/config/karma.conf.js',
                singleRun: false
            },
            phantom: {
                configFile: 'build/config/karma-phantom.conf.js',
                singleRun: true
            }
        },
        clean: ["dist","nga11y.js"],
        uglify: {
            options: {
                preserveComments: 'no'                
            },
            dist: {
                files: {                    
                    'dist/nga11y.min.js': ['nga11y.js']
                }
            }
        },
        concat: {
            options: {
              separator: ';',
            },
            dist: {
              src: ['src/*.js'],
              dest: 'nga11y.js',
            },
          }
    });

    
    grunt.registerTask('test', ['karma:unit']);
    grunt.registerTask('travis', ['karma:phantom']);
    grunt.registerTask('default', ['dist', 'test']);
    grunt.registerTask('dist', [
        'clean',
        'concat',
        'uglify:dist'
        ]);
};
