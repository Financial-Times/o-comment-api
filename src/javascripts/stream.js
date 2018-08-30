const events = require('./events.js');

const request = require('./request.js');
const envConfig = require('./config.js');
const logger = require('o-comment-utilities').logger;

function Stream (collectionId, config) {
	let callbacks = [];
	let lastEventId;

	const commentIds = [];

	let initialized = false;
	let destroyed = false;

	if (config.callbacks && config.callbacks instanceof Array) {
		callbacks = config.callbacks;
	}
	if (config.callback && typeof config.callback === 'function') {
		callbacks.push(config.callback);
	}

	if (typeof config.lastEventId !== 'undefined') {
		lastEventId = config.lastEventId;
	}


	const callAllCallbacks = function () {
		let i;
		const args = arguments;

		const callCallback = function (currentCallback) {
			setTimeout(function () {
				currentCallback.apply(this, args);
			});
		};

		for (i = 0; i < callbacks.length; i++) {
			callCallback(callbacks[i]);
		}
	};

	const handleNewComment = function (data, authorData) {
		if (commentIds.indexOf(data.content.id) === -1) {
			commentIds.push(data.content.id);
		}

		callAllCallbacks({
			comment: {
				parentId: data.content.parentId || null,
				author: authorData ? {
					displayName: authorData.displayName,
					tags: authorData.tags,
					type: authorData.type
				} : null,
				content: data.content.bodyHtml || null,
				timestamp: data.content.createdAt || null,
				commentId: data.content.id || null,
				visibility: data.vis
			}
		});
	};

	const handleUpdateComment = function (data, authorData) {
		callAllCallbacks({
			comment: {
				updated: true,
				parentId: data.content.parentId || null,
				author: authorData ? {
					displayName: authorData.displayName,
					tags: authorData.tags,
					type: authorData.type
				} : null,
				content: data.content.bodyHtml || null,
				timestamp: data.content.createdAt || null,
				commentId: data.content.id || null,
				visibility: data.vis,
				lastVisibility: data.lastVis
			}
		});
	};

	const handleDeleteComment = function (data) {
		callAllCallbacks({
			comment: {
				deleted: true,
				commentId: data.content.id
			}
		});
	};

	const handleCommentsEnabled = function (data) {
		callAllCallbacks({
			collection: {
				commentsEnabled: data.value
			}
		});
	};

	const handleResponseData = function (data) {
		if (data.states) {
			const eventCollection = data.states;

			for (const key in eventCollection) {
				if (eventCollection.hasOwnProperty(key)) {
					const item = eventCollection[key];

					// type: comment
					if (item.type === 0) {
						if (item.vis >= 1) {
							if (item.content.updatedBy || commentIds.indexOf(item.content.id) !== -1) {
								handleUpdateComment(item, ((data.authors && item.content.authorId) ? data.authors[item.content.authorId] : null));
							} else {
								handleNewComment(item, ((data.authors && item.content.authorId) ? data.authors[item.content.authorId] : null));
							}
						} else if (item.vis === 0) {
							handleDeleteComment(item);
						}
					}
				}
			}
		}

		if (data.settings && data.settings.length) {
			let i = 0;
			let setting;

			for (i = 0; i < data.settings.length; i++) {
				setting = data.settings[i];

				if (setting.name === 'commentsEnabled') {
					handleCommentsEnabled(setting);
				}
			}
		}
	};





	function connect () {
		if (destroyed) {
			return;
		}

		const lastTime = new Date();
		let timeToWait = 0;
		let aborted = false;

		const lfStreamUrl = "https://"+ envConfig.get().livefyre.networkName +".stream1.fyre.co/v3.0/collection/"+ collectionId +"/"+ lastEventId +"/";

		const backupRestart = setTimeout(function () {
			aborted = true;

			logger.debug('oCommentApi', 'stream', 'backup restart');
			restartConnection({
				force: true
			});
		}, 30000);

		const restartConnection = function (options) {
			options = options || {};

			logger.debug('oCommentApi', 'stream', 'restart');
			clearTimeout(backupRestart);

			if (!aborted || options.force === true) {
				aborted = true;

				timeToWait = 10000 - (new Date() - lastTime);

				setTimeout(function () {
					if (options.report === true) {
						events.emit('streamingEvent', {
							eventType: 'info',
							message: 'connection restored'
						});
					}

					connect();
				}, (timeToWait < 0 ? 0 : timeToWait));
			}
			return;
		};

		try {
			request.get(lfStreamUrl, {
				success: function (response) {
					try {
						if (response.timeout === true) {
							logger.debug('oCommentApi', 'stream', 'success, timeout');
							restartConnection();
							return;
						}

						if (response.data) {
							handleResponseData(response.data);
						}

						if (!aborted) {
							clearTimeout(backupRestart);

							lastEventId = response.data && response.data.maxEventId ? response.data.maxEventId : lastEventId;
							setTimeout(function () {
								logger.debug('oCommentApi', 'stream', 'success, new call');
								connect();
							}, 0);
						}
					} catch (e) {
						events.emit('streamingEvent', {
							eventType: 'error',
							message: 'connection dropped',
							error: e
						});
						logger.debug('oCommentApi', 'stream', 'exception', e);

						restartConnection({
							report: true
						});
					}
				},
				error: function (err) {
					events.emit('streamingEvent', {
						eventType: 'error',
						message: 'connection dropped',
						error: err
					});
					logger.debug('oCommentApi', 'stream', 'error', err);

					restartConnection({
						report: true
					});
				},
				timeout: function () {
					logger.debug('oCommentApi', 'stream', 'timeout');
					restartConnection();
				}
			});
		} catch (e) {
			events.emit('streamingEvent', {
				eventType: 'error',
				message: 'connection dropped',
				error: e
			});
			logger.debug('oCommentApi', 'stream', 'exception', e);

			restartConnection({
				report: true
			});
		}
	}


	this.addCallback = function (callback) {
		if (callback && typeof callback === 'function') {
			callbacks.push(callback);
		}
	};

	this.removeCallback = function (callback) {
		if (callback && typeof callback === 'function' && callbacks.indexOf(callback) !== -1) {
			callbacks.splice(callbacks.indexOf(callback), 1);
		}

		if (callbacks.length === 0) {
			this.destroy();
		}
	};

	this.setLastEventId = function (eventId) {
		lastEventId = eventId;
	};

	this.init = function () {
		if (!initialized && !destroyed && (typeof lastEventId !== 'undefined') && (typeof collectionId !== 'undefined') && callbacks.length) {
			initialized = true;
			connect();

			return true;
		} else {
			return false;
		}
	};

	this.destroy = function () {
		callbacks = null;
		lastEventId = null;

		if (typeof streamsForCollectionId[collectionId] !== 'undefined') {
			streamsForCollectionId[collectionId] = undefined;
		}

		destroyed = true;
	};
}


const streamsForCollectionId = {};

function create (collectionId, configOrCallback) {
	let callback;
	let lastEventId = 0;

	if (!collectionId) {
		return;
	}

	if (typeof configOrCallback === 'function') {
		callback = configOrCallback;
	} else {
		if (typeof configOrCallback !== 'object') {
			return false;
		}

		if (typeof configOrCallback.callback !== 'function') {
			return false;
		} else {
			callback = configOrCallback.callback;
		}

		if (configOrCallback.lastEventId) {
			lastEventId = configOrCallback.lastEventId;
		}
	}

	if (streamsForCollectionId[collectionId]) {
		streamsForCollectionId[collectionId].addCallback(callback);

		return true;
	} else {
		streamsForCollectionId[collectionId] = new Stream(collectionId, {
			lastEventId: lastEventId,
			callback: callback
		});
		streamsForCollectionId[collectionId].init();

		return true;
	}
}

function destroy (collectionId, configOrCallback) {
	let callback;

	if (!collectionId) {
		return;
	}

	if (typeof configOrCallback === 'function') {
		callback = configOrCallback;
	} else {
		if (typeof configOrCallback.callback === 'function') {
			callback = configOrCallback.callback;
		}
	}

	if (streamsForCollectionId[collectionId]) {
		if (callback) {
			streamsForCollectionId[collectionId].removeCallback(callback);
		} else {
			streamsForCollectionId[collectionId].destroy();
		}
	}
}

module.exports = {
	create: create,
	destroy: destroy
};
