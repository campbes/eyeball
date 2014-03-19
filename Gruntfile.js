module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('src/main/package.json');

    grunt.initConfig({
        pkg : pkg,
        props : {
            out : 'target',
            src : 'src/main',
            name : '<%=pkg.name%>-<%=pkg.version%>',
            test : 'src/test'
        },
        clean : ['target'],
        jslint: { // configure the task
            app: {
                src: [
                    '<%= props.src%>/routes/**/*.js',
                    '<%= props.src%>/controllers/**/*.js',
                    '<%= props.src%>/conf/**/*.js',
                    '<%= props.src%>/app.js'
                ],
                directives: {
                    predef : ['eyeball'],
                    node: true,
                    white : true,
                    vars : true,
                    plusplus : true,
                    continue : true,
                    sloppy : true,
                    nomen: true,
                    unparam : true
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
                    '<%= props.src%>/webapp/js/app/conf/*.js',
                    '<%= props.src%>/webapp/js/app/services/*.js',
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
        jasmine: {
            src: [
                '<%= props.src%>/conf/**/*.js',
                '<%= props.src%>/controllers/*/*.js',
                '<%= props.src%>/routes/**/*.js',
                '<%= props.src%>/webapp/js/**/*.js'
            ],
            options: {
                specs: ['<%= props.test%>/**/*Spec.js'],
                helpers: ['<%= props.test%>/**/*Helper.js'],
                template: require('grunt-template-jasmine-istanbul'),
                templateOptions: {
                    coverage: '<%= props.out%>/coverage/coverage.json',
                    report: '<%= props.out%>/coverage',
                    thresholds: {
                        lines: 70,
                        statements: 70,
                        branches: 70,
                        functions: 70
                    }
                }
            }
        },
        plato: {
            your_task: {
                files: {
                    '<%= props.out%>/analysis': ['<%= props.src%>/*.js',
                        '<%= props.src%>/routes/**/*.js',
                        '<%= props.src%>/conf/**/*.js',
                        '<%= props.src%>/controllers/**/*.js',
                        '<%= props.src%>/webapp/js/**/*.js']
                }
            }
        },
        compress : {
            tgz: {
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
            },
            zip: {
                options: {
                    mode : 'zip',
                    archive: '<%= props.out%>/<%=props.name%>.zip'
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
    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('package', ['compress']);
    grunt.registerTask('analyse', ['plato']);
    grunt.registerTask('default', ['clean','compile','test','package']);

};