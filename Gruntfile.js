module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> by <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            },
            beautify: {
                options: {
                    banner: '/*! <%= pkg.name %> by <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    beautify: true,
                    report: 'none',
                    mangle: false,
                },
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.js'
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['uglify']);

};