const config = require('./src/javascripts/config.js');
const suds = require('./src/javascripts/suds.js');
const ccs = require('./src/javascripts/ccs.js');
const cache = require('./src/javascripts/cache.js');
const stream = require('./src/javascripts/stream.js');
const defaultConfig = require('./config.js');
const oCommentUtilities = require('o-comment-utilities');


config.set(defaultConfig);

/**
 * Export of the SUDS and CCS APIs.
 * @type {Object}
 */
exports.api = {
	getLivefyreInitConfig: suds.livefyre.getInitConfig,
	getCommentCount: suds.livefyre.getCommentCount,
	getCommentCounts: suds.livefyre.getCommentCounts,

	getAuth: suds.user.getAuth,
	updateUser: suds.user.updateUser,

	getComments: ccs.getComments,
	postComment: ccs.postComment,
	deleteComment: ccs.deleteComment,

	stream: {
		create: stream.create,
		destroy: stream.destroy
	}
};

/**
 * Allows access to the cached values.
 * @type {Object}
 */
exports.cache = {
	clear: cache.clear,
	clearAuth: cache.clearAuth,
	clearLivefyreInit: cache.clearLivefyreInit
};

/**
 * Enables logging.
 * @return {undefined}
 */
exports.enableLogging = function () {
	oCommentUtilities.logger.enable.apply(this, arguments);
};

/**
 * Disables logging.
 * @return {undefined}
 */
exports.disableLogging = function () {
	oCommentUtilities.logger.disable.apply(this, arguments);
};

/**
 * Sets logging level.
 * @return {undefined}
 */
exports.setLoggingLevel = function () {
	oCommentUtilities.logger.setLevel.apply(this, arguments);
};

/**
 * This method sets additional or overrides current configuration options.
 *
 * @param  {string|object} keyOrObject Key or actually an object with key-value pairs.
 * @param  {anything} value Optional. Should be specified only if keyOrObject is actually a key (string).
 * @return {undefined}
 */
exports.setConfig = function () {
	config.set.apply(this, arguments);
};


document.addEventListener('o.DOMContentLoaded', function () {
	try {
		const configInDomEl = document.querySelector('script[type="application/json"][data-o-comment-api-config]');
		if (configInDomEl) {
			const configInDom = JSON.parse(configInDomEl.innerHTML);

			exports.setConfig(configInDom);
		}
	} catch (e) {
		oCommentUtilities.logger.log('Invalid config in the DOM.', e);
	}
});
