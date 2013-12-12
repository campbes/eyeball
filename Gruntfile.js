module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('src/main/package.json');

    grunt.initConfig({
        pkg : pkg,
        props : {
            out : 'target',
            src : 'src/main',
            name : '<%=pkg.name%>-<%=pkg.version%>'
        },
        clean : ['target'],
        jslint: { // configure the task
            app: {
                src: [
                    '<%= props.src%>/routes/**/*.js',
                    '<%= props.src%>/app.js'
                ],
                directives: {
                    node: true,
                    white : true
                },
                options: {
                    junit: '<%= props.out%>/jslint/jslint-src-app.xml'
                }
            },
            webapp: {
                src: [
                    '<%= props.src%>/webapp/js/**/*.js'
                ],
                directives: {
                    browser: true,
                    white : true,
                    vars : true,
                    plusplus : true,
                    continue : true,
                    sloppy : true,
                    nomen: true,
                    unparam : true
                },
                options: {
                    junit: '<%= props.out%>/jslint/jslint-src-webapp.xml'
                }
            }
        },
        copy : { // copy everything - so can run in dev mode
            app: {
                files: [
                    {
                        src: ['**/*.*'],
                        filter : 'isFile',
                        dest: '<%= props.out%>/<%=props.name%>/',
                        expand : true,
                        cwd : '<%= props.src%>/'
                    }
                ]
            },
            info: {
                files: [
                    {
                        src: ['LICENSE','README.md'],
                        filter : 'isFile',
                        dest: '<%= props.out%>/<%=props.name%>/'
                    }
                ]
            }
        },
        concat: { // build the webapp
            js: {
                src: [
                    '<%= props.src%>/webapp/js/app/app.js',
                    '<%= props.src%>/webapp/js/app/services.js',
                    '<%= props.src%>/webapp/js/app/controllers/*.js'
                ],
                dest: '<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.js'
            },
            css: {
                src: [
                    '<%= props.src%>/webapp/css/**/*.css'
                ],
                dest: '<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.css'
            }
        },
        gcc: {
            js: {
                src: ['<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.js'],
                dest: '<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.min.js'
            }
        },
        cssmin: {
            minify: {
                src: ['<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.css'],
                dest: '<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.min.css'
            }
        },
        compress : {
            main: {
                options: {
                    mode : 'tgz',
                    archive: '<%= props.out%>/<%=props.name%>.tgz'
                },
                files: [
                    {
                        src: ['<%= props.out%>/<%=props.name%>/**'],
                        flatten : true,
                        expand : true
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-install-dependencies');

    for(var i in pkg.devDependencies) {
        if(pkg.devDependencies.hasOwnProperty(i)) {
            grunt.loadNpmTasks(i);
        }
    }

    grunt.registerTask('compile', ['jslint','copy:app','copy','concat','gcc','cssmin']);
    grunt.registerTask('package', ['compress']);
    grunt.registerTask('default', ['clean','compile','package']);

};