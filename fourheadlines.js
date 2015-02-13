var Twit = require('twit');
var T = new Twit(require('./config.js'));
var moment = require('moment');

function fourHeadlines() {
    console.log('running fourHeadlines at ' + moment().format());
    T.get('statuses/user_timeline', {screen_name: "TwoHeadlines", count: 200}, function (error, data) {
        var i, headlines;
        if (error) {
            console.log('error: ' + error);
            return;
        }
        headlines = [];
        for (i = 0; i < data.length; ++i) {
            headlines.push({headline: data[i].text, tokens: data[i].text.toLowerCase().replace(/[^a-z0-9\- ]/g, '').split(' ')});
        }
        processHeadlines(headlines);
    });
}

function processHeadlines(headlines) {

    var len, i, diff, sign, source;

    if (!headlines) {
        console.log('no headlines received');
        return;
    }

    source = headlines.shift();

    len = source.tokens.length;

    if (len < 3) {
        console.log('source headline is too short');
        return;
    }

    for (i = Math.floor(len / 2), diff = 1, sign = -1; i > 0 && i < len - 1; i = i + sign * diff, diff++, sign = sign * -1) {
        if (tryPivot(source, i, headlines)) {
            return true;
        }
    }
}

function tryPivot(source, pivotIndex, headlines) {
    var i, len;
    len = headlines.length;
    for (i = 0; i < len; ++i) {
        if (tryPivotWith(source, pivotIndex, headlines[i])) {
            return true;
        }
    }
}

function tryPivotWith(source, pivotIndex, target) {

    var i, diff, sign;
    var pivot = source.tokens[pivotIndex];
    var len = target.tokens.length;

    if (len < 3) {
        return false;
    }

    for (i = Math.floor(len / 2), diff = 1, sign = -1; i > 0 && i < len - 1; i = i + sign * diff, diff++, sign = sign * -1) {
        if (target.tokens[i] === pivot) {
            return usePivot(source, pivotIndex, target, i);
        }
    }

    return false;
}

function usePivot(source, sourcePivotIndex, target, targetPivotIndex) {
    var xSource = source.headline.split(' ');
    var xTarget = target.headline.split(' ');
    var headline1 = xSource.slice(0, sourcePivotIndex + 1).join(' ') + ' ' + xTarget.slice(targetPivotIndex + 1).join(' ');
    var headline2 = xTarget.slice(0, targetPivotIndex + 1).join(' ') + ' ' + xSource.slice(sourcePivotIndex + 1).join(' ');
    if (Math.random() < 0.5) {
        tweetHeadline(headline1);
    } else {
        tweetHeadline(headline2);
    }
    return true;
}

function tweetHeadline(headline) {
    T.post(
        'statuses/update',
        {status: headline},
        function(err, data, response) {
            if (err) {
                console.log('tweet error: ' + err);
                return;
            }
            console.log('tweeted: ' + headline);
        }
    );
}

fourHeadlines();
setInterval(fourHeadlines, 1000 * 3600);

