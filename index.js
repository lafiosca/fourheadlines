'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const Twit = require('twit');
const config = require('./config');

const TwoHeadlines = 'TwoHeadlines';

const T = new Twit(config);

const tweetHeadline = (headline) => {
	console.log(`Tweeting headline: ${headline}`);
	return false;
	return T.post(
		'statuses/update',
		{ status: headline }
	)
		.then(() => {
			console.log('Tweeted!');
			return true;
		})
		.catch((error) => {
			console.error(`Failed to tweet: ${error}`);
		});
};

const combineHeadlines = (headline, pivotIndex, otherHeadline, otherPivotIndex) => {
	console.log(`      - Combining headlines "${headline.headline}" (${pivotIndex}) and "${otherHeadline.headline}" (${otherPivotIndex})`);

	const firstPart = headline.headline.split(' ')
		.slice(0, pivotIndex + 1)
		.join(' ');

	const secondPart = otherHeadline.headline.split(' ')
		.slice(otherPivotIndex + 1)
		.join(' ');

	const combinedHeadline = `${firstPart} ${secondPart}`;

	console.log(`        - Result: ${combinedHeadline}`);

	return combinedHeadline;
};

const processPivotWith = (headline, pivotIndex, otherHeadline) => {
	// console.log(`    - Trying pivot with other headline "${otherHeadline.headline}"`);

	const pivot = headline.tokens[pivotIndex];
	const candidates = [];
	const end = otherHeadline.tokens.length - 1;

	for (let i = 1; i < end; i += 1) {
		if (otherHeadline.tokens[i] === pivot) {
			candidates.push(combineHeadlines(headline, pivotIndex, otherHeadline, i));
		}
	}

	return candidates;
};

const processPivot = (headline, pivotIndex, otherHeadlines) => {
	console.log(`  - Trying pivot index ${pivotIndex} on headline "${headline.headline}"`);
	return _.flatMap(otherHeadlines, otherHeadline =>
		processPivotWith(headline, pivotIndex, otherHeadline));
};

const processHeadline = (headline, index, headlines) => {
	console.log(`- Processing headline #${index} "${headline.headline}"`);

	const otherHeadlines = headlines.slice(0);
	otherHeadlines.splice(index, 1);

	let candidates = [];
	const end = headline.tokens.length - 1;

	for (let i = 1; i < end; i += 1) {
		candidates = candidates.concat(processPivot(headline, i, otherHeadlines));
	}

	return candidates;
};

const tokenizeHeadline = status => ({
	headline: status.text,
	tokens: status.text.toLowerCase()
		.replace(/[^a-z0-9\- ]/g, '')
		.split(' '),
});

const fetchStatuses = () => {
	console.log(`Fetching statuses from ${TwoHeadlines}`);
	const options = {
		screen_name: TwoHeadlines,
		count: 200,
	};
	return T.get('statuses/user_timeline', options)
		.then(resp => resp.data);
};

const execute = Promise.coroutine(function* executeCo() {
	const statuses = yield fetchStatuses();

	console.log(`Fetched ${statuses.length} statuses from ${TwoHeadlines}`);

	const headlines = statuses.map(tokenizeHeadline)
		.filter(headline => headline.tokens.length >= 3);

	console.log(`Tokenized ${headlines.length} headlines`);

	if (headlines.length < 2) {
		throw new Error('Need at least two headlines to process');
	}

	const candidates = _.flatMap(headlines, processHeadline);

	if (candidates.length === 0) {
		throw new Error('No candidates to choose from');
	}

	console.log(`Choosing from ${candidates.length} candidate(s)`);
	console.log(candidates);

	return tweetHeadline(_.sample(candidates));
});

execute()
	.catch((error) => {
		console.error(`Processing error ${error}`);
	});

