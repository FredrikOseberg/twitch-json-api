"use strict";

import './css/app.css';

(function() {
const tempData = [];
const streams = [];
let navState = 'all';
const channelResults = document.querySelector('.channels');
const filterInput = document.querySelector('#filterResults');
const allButton = document.querySelector('.all');
const liveButton = document.querySelector('.live');
const offlineButton = document.querySelector('.offline');
const suggestions = document.querySelector('.suggestions-list');
const allChannels = [];
const liveChannels = [];
const offlineChannels = [];
const twitchChannels = ["ESL_SC2", "OgamingSC2", "cretetion", 
						"freecodecamp", "storbeck", "habathcx", 
						"RobotCaleb", "noobs2ninjas", "beyondthesummit", 'pgl', 'fredrikoseberg']


let myHeaders = new Headers({
	'Client-ID': 'o8r86e4b9ndu0ikrdxreghamblvti6'
});

const myInit = { method: 'GET',
               headers: myHeaders,
               mode: 'cors',
               cache: 'default' };


function getTwitchChannelInformationData() {
	return new Promise(resolve => {
		twitchChannels.forEach(channel => {
		const twitchData = `https://api.twitch.tv/kraken/channels/${channel}`;
		fetch(twitchData, myInit)
			.then(response => {
				if (!response.ok) { 
					if (response.status === 404) {
						return response.json();
					}
					throw Error('Something went wrong');
				}
				return response.json()
			})
			.then(results => tempData.push(results))
			.then(() => {
				if (tempData.length === twitchChannels.length) resolve(twitchChannels);
			})
			.catch(error => {
				renderErrorMessage();
			})	
		});
	});
}

function getTwitchStreamingChannelsFromChannelName(channels) {
	return new Promise(resolve => {
		channels.forEach(channel => {
				const twitchData = `https://api.twitch.tv/kraken/streams/${channel}`;
				fetch(twitchData, myInit)
					.then(response => {
						if (!response.ok) {
							throw Error('Something went wrong');
						}
						return response.json()
					})
					.then(results => streams.push(results))
					.then(() => {
						if (streams.length === twitchChannels.length) resolve(streams);
					})
					.catch(error => {
						renderErrorMessage();
					})
			});
	});
}

function createDataObject() {
	tempData.forEach(data => {
		const dataObject = {};
		let errorChannelName;

		if (data.error) {
			errorChannelName = data.message.split(' ')[6].replace(/\"/g, "");
			dataObject.error = true;
		}

		dataObject.name = data.display_name || errorChannelName;
		dataObject.logo = data.logo || null;
		dataObject.stream = null;
		dataObject.url = data.url || 'http://www.twitch.tv';
		dataObject.error = dataObject.error || false;

		streams.forEach(channel => {
			if (channel.stream && channel.stream.channel.display_name === dataObject.name) {
				dataObject.stream = {
					game: channel.stream.game
				}
			}
		});

		allChannels.push(dataObject);
	});
}

function filterLiveChannels() {
	allChannels.forEach(channel => {
		if (channel.stream) {
			liveChannels.push(channel);
		}
	});
}

function filterOfflineChannels() {
	allChannels.forEach(channel => {
		if (!channel.stream) {
			offlineChannels.push(channel);
		}
	});
}

function addEventListenerToFilterInput() {
	filterResults.addEventListener('keyup', handleFilterResults);
	filterResults.addEventListener('change', handleFilterResults);
}

function renderErrorMessage() {
	const errorMessage = `<h1 class="error-message">Oh no! An error occurred when getting your data</h1>
						<button class="error-button">Try Again</>
						`;

	channelResults.innerHTML = errorMessage;

	document.querySelector('.error-button').addEventListener('click', handleFetchErrorButtonClick);
}

function renderNoResultsFound() {
	const errorMessage = `<li class="suggestions-error-message">We could not find any channels matching your search.</h1>`;

	suggestions.innerHTML = errorMessage;
}


function renderChannels(channelsArray, rendered = false) {
	let streaming;
	let streamingInfo;
	const channelsToRender = channelsArray.map(channel => {

	if (channel.stream) {
		streaming = 'streaming';
		streamingInfo = `${channel.name} is streaming ${channel.stream.game}`;
	} else {
		streaming = 'not-streaming';
		streamingInfo = 'Offline';
	}

	if (channel.error) {
		streamingInfo = 'This channel does not exist';
	}


	if (channel.logo === null) channel.logo = 'img/person.png';
	return `
		<a href="${channel.url}" target="_blank" class="channelLinks" data-name="${channel.name}">
			<li class="channel">
				<img src="${channel.logo}">
				<div class="info-panel">
					<h3 class="channel-name">${channel.name}</h3>
					<p class="channel-streaming-info">${streamingInfo}</p>
				</div>
				<span class="status ${streaming}"></span>
			</li>
		</a>
	`;
	}).join("");

	if (channelsToRender.length === 0) return renderNoResultsFound(); 
	channelResults.innerHTML = channelsToRender;
}

function handleFilterResults() {
	const pattern = new RegExp(filterInput.value, 'ig');
	let filteredChannels;

	if (navState === 'all') {
		filteredChannels = allChannels.filter(item => {
			return item.name.match(pattern);
		});

		renderSuggestions(filteredChannels);
	} else if (navState === 'live') {
		filteredChannels = liveChannels.filter(item => {
			return item.name.match(pattern);
		});

		renderSuggestions(filteredChannels);
	} else if (navState === 'offline') {
		filteredChannels = offlineChannels.filter(item => {
			return item.name.match(pattern);
		});

		renderSuggestions(filteredChannels);
	}

	filterInput.value === '' ? suggestions.classList.remove('active-suggestions') : '';
	renderChannels(filteredChannels, true);
}

function renderSuggestions(channels) {
	const suggestionsToRender = channels.map(channel => {
		const streaming = channel.stream ? 'streaming' : 'not-streaming';
		return `
			<li class="suggestion-item"><img src="${channel.logo}" class="suggestion-logo">${channel.name}<div class="suggestion-status ${streaming}"></div></li>
		`;
	}).join("");

	suggestions.classList.add('active-suggestions');
	suggestions.innerHTML = suggestionsToRender;
}

function removeNavActiveState() {
	const allButtons = document.querySelectorAll('.navigation');

	allButtons.forEach(button => {
		button.children[0].classList.remove('active');
	});
}

function clearFilterInput() {
	filterInput.blur();
	filterInput.value = '';
}

function removeActiveNavAndClearFilterInput() {
	removeNavActiveState();
	clearFilterInput();
}

function handleAllButtonClick() {
	removeActiveNavAndClearFilterInput();
	const span = this.querySelector('span[data-name="border"]');
	span.classList.add('active');
	navState = 'all';
	renderChannels(allChannels);
}

function handleLiveButtonClick() {
	removeActiveNavAndClearFilterInput();
	const span = this.querySelector('span[data-name="border"]');
	navState = 'live';
	renderChannels(liveChannels);
	span.classList.add('active');
}

function handleOfflineButtonClick() {
	removeActiveNavAndClearFilterInput();
	const span = this.querySelector('span[data-name="border"]');
	navState = 'offline';
	renderChannels(offlineChannels);
	span.classList.add('active');
}

function handleSuggestionsClick(e) {
	if (!e.target.classList.contains('suggestions-error-message')) {
		const text = e.target.textContent;
		filterInput.value = text;
		handleFilterResults();
		this.classList.remove('active-suggestions');
	}
}

function handleFetchErrorButtonClick() {
	init();
}

// Event listeners
allButton.addEventListener('click', handleAllButtonClick);
liveButton.addEventListener('click', handleLiveButtonClick);
offlineButton.addEventListener('click', handleOfflineButtonClick);
suggestions.addEventListener('mouseenter', () => document.activeElement.blur())
suggestions.addEventListener('click', handleSuggestionsClick);

function init() {
	getTwitchChannelInformationData()
		.then(channels => getTwitchStreamingChannelsFromChannelName(channels))
		.then(() => createDataObject())
		.then(() => filterLiveChannels())
		.then(() => filterOfflineChannels())
		.then(() => renderChannels(allChannels))
		.then(() => addEventListenerToFilterInput());
}

init();

setInterval(init, 10000);

})()