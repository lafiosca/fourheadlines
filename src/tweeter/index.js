'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const Twit = require('twit');
const { lambda } = require('nice-lambda');
const config = require('./config');

const TwoHeadlines = 'TwoHeadlines';
const recentCount = 100;

const recentBonusFactor = 4;
const pivotLengthBonusFactor = 2;
const balanceBonusFactor = 3;

const T = new Twit(config);

const tweetHeadline = (headline) => {
	console.log(`Tweeting headline: ${headline}`);
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

const getRecentBonus = index =>
	recentBonusFactor * ((recentCount - index) / recentCount);

const getPivotLengthBonus = (length) => {
	const adjLen = (length - 1) / 3;
	return pivotLengthBonusFactor
		* Math.max(0, adjLen / Math.sqrt((adjLen * adjLen) + 1));
};

const getBalanceBonus = (count, otherCount) => {
	const total = count + otherCount + 1;
	const diff = Math.abs(count - otherCount);
	const ratio = diff / total;
	const balance = Math.max(0.5 - ratio, 0) * 2;
	return balance * balanceBonusFactor;
};

const combineHeadlines = (
	headline,
	pivotIndex,
	otherHeadline,
	otherPivotIndex,
	pivot,
	recentBonus,
	pivotLengthBonus
) => {
	const firstPart = headline.headline.split(' ')
		.slice(0, pivotIndex + 1)
		.join(' ');

	const secondPart = otherHeadline.headline.split(' ')
		.slice(otherPivotIndex + 1)
		.join(' ');

	const combinedHeadline = `${firstPart} ${secondPart}`;

	const balanceBonus = getBalanceBonus(
		pivotIndex,
		otherHeadline.tokens.length - otherPivotIndex - 1
	);

	const score = recentBonus + pivotLengthBonus + balanceBonus;

	return {
		combinedHeadline,
		score,
		recentBonus,
		pivotLengthBonus,
		balanceBonus,
		pivot,
		pivotIndex,
		otherPivotIndex,
		headline: headline.headline,
		otherHeadline: otherHeadline.headline,
	};
};

const processPivotWith = (headline, pivotIndex, otherHeadline, recentBonus) => {
	const pivot = headline.tokens[pivotIndex];
	const candidates = [];
	const end = otherHeadline.tokens.length - 1;

	for (let i = 1; i < end; i += 1) {
		if (otherHeadline.tokens[i] === pivot) {
			candidates.push(combineHeadlines(
				headline,
				pivotIndex,
				otherHeadline,
				i,
				pivot,
				recentBonus,
				getPivotLengthBonus(pivot.length)
			));
		}
	}

	return candidates;
};

const processPivot = (headline, pivotIndex, otherHeadlines, recentBonus) =>
	_.flatMap(otherHeadlines, otherHeadline =>
		processPivotWith(headline, pivotIndex, otherHeadline, recentBonus));

const processHeadline = (headline, index, headlines) => {
	const recentBonus = getRecentBonus(index);

	const otherHeadlines = headlines.slice(0);
	otherHeadlines.splice(index, 1);

	let candidates = [];
	const end = headline.tokens.length - 1;

	for (let i = 1; i < end; i += 1) {
		candidates = candidates.concat(processPivot(headline, i, otherHeadlines, recentBonus));
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
		count: recentCount,
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

	console.log(`Found ${candidates.length} candidate(s)`);

	const scored = _.orderBy(candidates, 'score', 'desc');

	const topN = Math.min(scored.length, 5);

	console.log(`Picking candidate from top ${topN}`);

	const pick = _.random(0, topN - 1);

	return tweetHeadline(scored[pick].combinedHeadline);
});

exports.handler = lambda(execute);

