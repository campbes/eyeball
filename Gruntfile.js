module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg : pkg,
        props : {
            out : 'target',
            src : 'src/main',
            name : '<%=pkg.name%>-<%=pkg.version%>'
        },
        clean : ['target'],
        jslint: { // configure the task
            webapp: {
                src: [
                    '<%= props.src%>/webapp/js/**/*.js'
                ],
                directives: {
                    browser: true,
                    predef : ['window'],
                    white : true,
                    vars : true,
                    plusplus : true,
                    continue : true
                },
                options: {
                    junit: '<%= props.out%>/jslint/jslint-src-webapp.xml'
                }
            }
        },
        copy : { // copy the node app
            app: {
                files: [
                    {
                        src: [
                            'routes/**',
                            'views/**',
                            '*.js'
                        ],
                        filter : 'isFile',
                        dest: '<%= props.out%>/<%=props.name%>/',
                        expand : true,
                        cwd : '<%= props.src%>/'
                    }
                ]
            },
            lib: {
                files: [
                    {
                        src: [
                            'lib/**'
                        ],
                        filter : 'isFile',
                        dest: '<%= props.out%>/<%=props.name%>/',
                        expand : true,
                        cwd : 'src/'
                    }
                ]
            },
            webapp: {
                files: [
                    {
                        src: [
                            'webapp/images/**',
                            'webapp/lib/**'
                        ],
                        filter : 'isFile',
                        dest: '<%= props.out%>/<%=props.name%>/',
                        expand : true,
                        cwd : '<%= props.src%>/'
                    }
                ]
            }
        },
        concat: { // build the webapp
            js: {
                src: [
                    '<%= props.src%>/webapp/**/*.js'
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
            },
            css: {
                src: ['<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.css'],
                dest: '<%= props.out%>/<%=props.name%>/webapp/<%=props.name%>.min.css'
            }
        },
        compress : {
            main: {
                options: {
                    archive: '<%= props.out%>/<%=props.name%>.zip'
                },
                files: [
                    {
                        src: ['<%= props.out%>/<%=props.name%>/**','package.json','LICENSE-MIT'],
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

    grunt.registerTask('compile', ['jslint','copy:app','copy','concat','gcc']);
    grunt.registerTask('package', ['compress']);
    grunt.registerTask('default', ['clean','compile','package']);

};