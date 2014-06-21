var EyeballControllersTestGrader = function() {

    var testCfg = require('../../conf/test');

    function getGradeFromData(gradeSet,data) {
        var gr = null;

        for(gr in gradeSet) {
            if(gradeSet.hasOwnProperty(gr)) {
                if(data >= gradeSet[gr]) {
                    return gr;
                }
            }
        }
        return null;
    }

    function getCompositeGradeFromData(gradeSet,data) {

        if(!data) {
            return "";
        }

        var points = 0;
        var count = 0;
        var mt = null;
        var grade = null;
        var influence = 1;

        for (mt in gradeSet) {
            if(gradeSet.hasOwnProperty(mt)) {
                grade = getGradeFromData(gradeSet[mt],data[mt]);
                influence = gradeSet[mt].influence || 1;
                if(grade) {
                    points += testCfg.grades.points[grade]*influence;
                    count += 1;
                }
            }
        }
        if (count === 0) {
            return "";
        }
        var score = points/count;
        var grades = testCfg.grades.points;
        var gr = null;

        for(gr in grades) {
            if(grades.hasOwnProperty(gr)) {
                if(score >= grades[gr]) {
                    return gr;
                }
            }
        }
        return "";
    }

    function buildGradeSet(data,gradeSet) {
        var grades = {};
        var i;
        for(i in gradeSet) {
            if(gradeSet.hasOwnProperty(i)) {
                if(i.substr(0,10) === "COMPOSITE_") {
                    grades[i] = getCompositeGradeFromData(gradeSet[i.substr(10)],data[i.substr(10)]);
                } else if(typeof data[i] === "object") {
                    grades[i] = buildGradeSet(data[i],gradeSet[i]);
                } else {
                    grades[i] = getGradeFromData(gradeSet[i],data[i]);
                }
            }
        }

        return grades;
    }

    function getGradeSet(rec) {
        return buildGradeSet(rec.data,testCfg.grades[rec.tool]);
    }

    function getGrade(data,type) {
        type = type || 'percentage';
        return getGradeFromData(testCfg.grades[type],data);
    }

    function getValue(grade,type) {
        if(!grade || !type || !testCfg.grades[type]) {
            return null;
        }
        return testCfg.grades[type][grade];
    }

    return {
        getGradeSet : getGradeSet,
        getGrades : getGrade,
        getValue : getValue
    };

};

module.exports = EyeballControllersTestGrader();