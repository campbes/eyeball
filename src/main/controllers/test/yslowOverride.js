var testControllerYslowOverride = function() {

    var grader = require('./grader');
    var YSLOW = require('yslow').YSLOW;

    function yslowOverrideGetResults(yscontext, info) {
        var i, l, results, url, type, comps, comp, encoded_url, obj, cr,
            cs, etag, len, include_grade, include_comps, include_stats,
            result, len2, spaceid,
            reButton = / <button [\s\S]+<\/button>/,
            isArray = YSLOW.util.isArray,
            stats = {},
            stats_c = {},
            comp_objs = [],
            params = {},
            g = {};

        // default
        info = (info || 'basic').split(',');

        for (i = 0, len = info.length; i < len; i += 1) {
            if (info[i] === 'all') {
                include_grade = include_stats = include_comps = true;
                break;
            }
            switch (info[i]) {
                case 'grade':
                    include_grade = true;
                    break;
                case 'stats':
                    include_stats = true;
                    break;
                case 'comps':
                    include_comps = true;
                    break;
            }
        }

        params.w = parseInt(yscontext.PAGE.totalSize, 10);
        params.o = parseInt(yscontext.PAGE.overallScore, 10);
        params.u = encodeURIComponent(yscontext.result_set.url);
        params.r = parseInt(yscontext.PAGE.totalRequests, 10);
        spaceid = YSLOW.util.getPageSpaceid(yscontext.component_set);
        if (spaceid) {
            params.s = encodeURI(spaceid);
        }
        params.i = yscontext.result_set.getRulesetApplied().id;

        if (yscontext.PAGE.t_done) {
            params.lt = parseInt(yscontext.PAGE.t_done, 10);
        }
        if (include_grade) {
            results = yscontext.result_set.getResults();

            for (i = 0, len = results.length; i < len; i += 1) {
                obj = {};
                result = results[i];
                if (result.hasOwnProperty('score')) {
                    if (result.score >= 0) {
                        obj.score = parseInt(result.score, 10);
                    } else if (result.score === -1) {
                        obj.score = 'n/a';
                    }

                    // JAMTROUSERS - set grades on individual items
                    obj.grade = grader.getGrades(obj.score);
                }
                comps = result.components;
                if (isArray(comps)) {
                    obj.components = [];
                    for (l = 0, len2 = comps.length; l < len2; l += 1) {
                        comp = comps[l];
                        if (typeof comp === 'string') {
                            url = comp;
                        } else if (typeof comp.url === 'string') {
                            url = comp.url;
                        }
                        if (url) {
                            url = encodeURIComponent(url.replace(reButton, ''));
                            obj.components.push(url);
                        }
                    }
                }

                // JAMTROUSERS : add messages
                if (result.hasOwnProperty('message')) {
                    obj.message = result.message;
                }

                g[result.rule_id] = obj;
            }
            params.g = g;
        }

        if (include_stats) {
            params.w_c = parseInt(yscontext.PAGE.totalSizePrimed, 10);
            params.r_c = parseInt(yscontext.PAGE.totalRequestsPrimed, 10);

            for (type in yscontext.PAGE.totalObjCount) {
                if (yscontext.PAGE.totalObjCount.hasOwnProperty(type)) {
                    stats[type] = {
                        'r': yscontext.PAGE.totalObjCount[type],
                        'w': yscontext.PAGE.totalObjSize[type]
                    };
                }
            }
            params.stats = stats;

            for (type in yscontext.PAGE.totalObjCountPrimed) {
                if (yscontext.PAGE.totalObjCountPrimed.hasOwnProperty(type)) {
                    stats_c[type] = {
                        'r': yscontext.PAGE.totalObjCountPrimed[type],
                        'w': yscontext.PAGE.totalObjSizePrimed[type]
                    };
                }
            }
            params.stats_c = stats_c;
        }

        if (include_comps) {
            comps = yscontext.component_set.components;
            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                encoded_url = encodeURIComponent(comp.url);
                obj = {
                    'type': comp.type,
                    'url': encoded_url,
                    'size': comp.size,
                    'resp': comp.respTime
                };
                if (comp.size_compressed) {
                    obj.gzip = comp.size_compressed;
                }
                if (comp.expires && comp.expires instanceof Date) {
                    obj.expires = YSLOW.util.prettyExpiresDate(comp.expires);
                }
                cr = comp.getReceivedCookieSize();
                if (cr > 0) {
                    obj.cr = cr;
                }
                cs = comp.getSetCookieSize();
                if (cs > 0) {
                    obj.cs = cs;
                }
                etag = comp.getEtag();
                if (typeof etag === 'string' && etag.length > 0) {
                    obj.etag = etag;
                }
                comp_objs.push(obj);
            }
            params.comps = comp_objs;
        }

        return params;
    }

    return {
        yslowOverrideGetResults : yslowOverrideGetResults
    };

};

module.exports = testControllerYslowOverride();