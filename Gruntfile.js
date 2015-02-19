module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json');
    require('time-grunt')(grunt);
    require('jit-grunt')(grunt);

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
                    '<%= props.src%>/*.js'
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
                    unparam : true,
                    newcap : true,
                    regexp : true
                },
                options: {
                    junit: '<%= props.out%>/jslint/jslint-src-app.xml'
                }
            },
            webapp: {
                src: [
                    '<%= props.src%>/webapp/js/**/*.js',
                    '<%= props.src%>/webapp/bookmarklet/**/*.js'
                ],
                directives: {
                    browser: true,
                    white : true,
                    vars : true,
                    plusplus : true,
                    continue : true,
                    sloppy : true,
                    nomen: true,
                    unparam : true,
                    regexp : true
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
                        src: ['LICENSE','README.md','package.json'],
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
                    '<%= props.src%>/webapp/js/app/util.js',
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
        handlebars : {
            compile : {
                options : {
                    namespace : 'Eyeball.Templates',
                    partialsUseNamespace : true,
                    partialRegex : /.*/,
                    partialsPathRegex: /\/partials\//,
                    processName : function(path) {
                        path = path.replace(".tmpl","");
                        return path.substr(path.lastIndexOf("/")+1);
                    },
                    processPartialName : function(path) {
                        path = path.replace(".tmpl","");
                        return path.substr(path.lastIndexOf("/")+1);
                    }
                },
                files : {
                    '<%= props.out%>/handlebars/bookmarklet.js' : ['<%= props.src%>/webapp/bookmarklet/handlebars/**/*.tmpl'],
                    '<%= props.test%>/resources/bookmarklet-templates.js' : ['<%= props.src%>/webapp/bookmarklet/handlebars/**/*.tmpl']
                }
            }
        },
        bookmarklet : {
            Eyeball : {
                '<%= props.out%>/<%=props.name%>/webapp/<%=pkg.name%>-bookmarklet.js' : [
                    '<%= props.src%>/webapp/bookmarklet/bookmarklet.css',
                    '<%= props.src%>/webapp/lib/handlebars.runtime-v1.3.0.js',
                    '<%= props.src%>/webapp/lib/harpy-0.0.2.min.js',
                    '<%= props.out%>/handlebars/bookmarklet.js',
                    '<%= props.src%>/webapp/bookmarklet/bookmarklet.js'
                ]
            }
        },
        closurecompiler: {
            js: {
                files : {
                    '<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.min.js' : ['<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.js']
                },
                options : {
                    "compilation_level" : "SIMPLE_OPTIMIZATIONS"
                }
            },
            bookmarklet: {
                files : {
                    '<%= props.out%>/<%=props.name%>/webapp/<%=pkg.name%>-bookmarklet.min.js' : ['<%= props.out%>/<%=props.name%>/webapp/<%=pkg.name%>-bookmarklet.js']
                },
                options : {
                    "compilation_level" : "SIMPLE_OPTIMIZATIONS"
                }
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
                '<%= props.src%>/util.js',
                '<%= props.src%>/conf/**/*.js',
                '<%= props.src%>/controllers/*/*.js',
                '<%= props.src%>/routes/**/*.js',
                '<%= props.src%>/webapp/js/**/*.js'
            ],
            options: {
                specs: ['<%= props.test%>/**/*Spec.js'],
                helpers: ['<%= props.test%>/**/*Helper.js'
                ],
                vendor : ['<%= props.test%>/lib/angular.min.js',
                    '<%= props.test%>/lib/angular-mocks.js'
                ],
                junit : {
                    path : '<%=props.out%>/test-results'
                },
                template: require('grunt-template-jasmine-istanbul'),
                templateOptions: {
                    coverage: '<%=props.out%>/coverage/coverage.json',
                    report: {
                        type : 'cobertura',
                        options : {
                            dir : '<%=props.out%>/coverage'
                        }
                    },
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: '<%=props.out%>/coverage/coverage.json',
                        report :'<%=props.out%>/coverage',
                        replace : false
                    },
                    thresholds: {
                        lines: 0,
                        statements: 0,
                        branches: 0,
                        functions: 0
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
                        '<%= props.src%>/webapp/js/**/*.js',
                        '<%= props.src%>/webapp/bookmarklet/**/*.js']
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
                        src: ['**/*'],
                        cwd : '<%= props.out%>/<%=props.name%>/',
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
                        src: ['**/*'],
                        cwd : '<%= props.out%>/<%=props.name%>/',
                        expand : true
                    }
                ]
            }
        }
    });

    grunt.registerMultiTask('bookmarklet', 'Combine the bookmarklet files', function() {
        var str2js = function(str) {
            return str.replace(/'/g, "\\'").replace(/\s{2,}/g," ").replace(/\t/g," ").replace(/\r\n|\r|\n/g, "");
        };

        var namespace = this.target;

        var str = 'var ' + namespace + ' = ' + namespace + ' || { css : []};\n';

        var css= 0;
        // Loop over destination files
        for (var fname in this.data) {
            // Loop over source files
            this.data[fname].forEach(function(f,i) {
                if (!grunt.file.exists(f)) {
                    grunt.log.warn('Source file "' + f + '" not found.');
                    return false;
                }
                if(f.substr(f.length-2,2) === "js") {
                    str += grunt.file.read(f);
                } else if (f.substr(f.length-3,3) === "css") {
                    str += namespace + '.css[' + css + '] = ';
                    str += "'" + str2js(grunt.file.read(f), '') + "';";
                    css += 1;
                }
            });
            grunt.file.write(grunt.config.process(fname), str);
        }

    });


    grunt.registerTask('compile', ['jslint','copy','concat','handlebars','bookmarklet','closurecompiler','cssmin']);
    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('package', ['compress']);
    grunt.registerTask('analyse', ['plato']);
    grunt.registerTask('default', ['clean','compile','test','package']);

};