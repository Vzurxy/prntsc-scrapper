/* eslint-disable id-length, no-await-in-loop */

const { prompt } = require('enquirer');
const axios = require('axios').default;
const cheerio = require('cheerio');
const randomString = '0123456789abcdefghijklmnopqrstuvwxyz';
const fs = require('fs');

function generateRandomURL() {
	let url = 'http://prnt.sc/';
	for (let i = 0; i < Math.floor(Math.random() * (7 - 5 + 1)) + 5; i++) {
		url += randomString.charAt(Math.floor(Math.random() * randomString.length));
	}
	return url;
}

async function isValidURL(url) {
	const filter = '8tdUI8N.png';
	const imageShackFilter = 'http://img';

	if ((url.substring(19, 30) === filter) ||
		url.substring(0, 10) === imageShackFilter ||
		url.substring(0, 4) === '//st' ||
		url === '') {
		return false;
	} else {
		if (url.search('imgur') !== -1) {
			const res = await axios.get(url).catch(err => console.log(err));
			if (res.request.path.search('removed') !== -1) return false;
		}

		if (url.substring(0, 4) !== 'http') return false;

		return true;
	}
}

let savedStuff = '';

function mainPrompt() {
	(async () => {
		const response = await prompt({
			type: 'input',
			name: 'amount',
			message: 'How much links to scrape?',
			initial: '5'
		});

		const amount = parseInt(response.amount);
		console.assert(!isNaN(amount), 'Must be a valid number.');
		let success = 0;
		while (success !== amount) {
			const start = Date.now();
			const url = generateRandomURL();
			const res = await axios.get(url).catch(err => console.log(err));
			const $ = await cheerio.load(res.data);
			let src = $('#screenshot-image')[0];
			if (src) {
				src = src.attribs.src || src;
			}

			if (!src) {
				continue;
			}

			if (await isValidURL(src)) {
				savedStuff = `${savedStuff} ${url} '\n'`;
				console.log(`${url} ${((Date.now() - start) / 1000)} secs`);
				success++;
			} else {
				continue;
			}
		}

		const responseOption = await prompt({
			type: 'input',
			name: 'option',
			message: 'Save or exit or continue?'
		});

		if (responseOption.option.substr(0, 1) === 'e') {
			process.exit(0);
		} else if (responseOption.option.substr(0, 1) === 's') {
			fs.writeFile('./dump.txt', savedStuff, err => {
				if (err) {
					console.error(err);
					return;
				}
				console.log('Success!');
				process.exit(0);
			});
		} else if (responseOption.option.substr(0, 1) === 'c') {
			mainPrompt();
		} else {
			mainPrompt();
		}
	})();
}

mainPrompt()
;
