/**
 * Closure wrapper for the Data function
 * Takes default values for the function that will be returned
 */
var Data = (function(urlDefault, postDataDefault, requestTypeDefault, noCacheDefault) {

	// requests cache
	var cache = {};

	/**
	 * triggers ajax request
	 * @param  {object} 	settings configuration for the ajax call
	 * @return {Deffered}   deffered object
	 */
	var triggerRequest = function(settings) {
		var deferred = $.Deferred();

		console.log("Sending request...");

		$.ajax(settings).done(function(response) {
			deferred.resolve(response);
		});

		return deferred;
	};

	/**
	 * removes cached item or clears the whole cache if called with no arguments
	 * @param  {string} 		 url      url of the request we want to delete from cache
	 * @param  {object | string} postData postData of the needed request
	 */
	var clearCache = function(url, postData) {
		if (!arguments.length) {
			cache = {};
			return;
		}

		var key = makeKey(url, postData);
		cache[key] = null;
	};

	/**
	 * gets cached response
	 * @param  {string} url      request url
	 * @param  {object | string} postData postData of the request
	 * @return {string}          cached response
	 */
	var getFromCache = function(url, postData) {
		var key = makeKey(url, postData);
		
		return cache[key] && cache[key].response;
	};

	/**
	 * checks if a specified string is a JSON string
	 * @param  {string}  str string to check
	 * @return {Boolean}     true if string is json, otherwise false
	 */
	var isJSON = function(str) {
		try {
			JSON.parse(str);
		} catch (error) {
			return false;
		}

		return true;
	};

	/**
	 * converts key&value string to {"json":"object"}
	 * @param  {string} str string to be converted
	 * @return {string}     json string
	 */
	var keyValueToJSON = function(str) {
		var json = {};
		var pairs = str.split("&");
		var tuple;

		for (var i = 0, l = pairs.length; i < l; i++) {
			tuple = pairs[i].split("=");
			json[tuple[0]] = tuple[1];
		}

		return json;
	};

	/**
	 * prepares a key to be used with cache object
	 * @param  {string} url      request url
	 * @param  {string | object} postData request postData
	 * @return {string}          key string
	 */
	var makeKey = function(url, postData) {
		if (!postData) {
			return url;
		}

		postData = typeof postData === "string" && isJSON(postData) ? postData : 
					typeof postData === "object" ? JSON.stringify(postData) : keyValueToJSON(postData);
		return postData + "-->" + url;
	};

	/**
	 * adds request data into the cache
	 * @param {string} url      request url
	 * @param {string | object} postData request data
	 * @param {string} response response to the request
	 */
	var addToCache = function(url, postData, response) {
		var cacheItem = {
				url: url,
				response: response,
				postData: postData
			};

		var key = makeKey(url, postData);	
		cache[key] = cacheItem;
	};

	/**
	 * actual Data function that is returned to the user
	 * @param  {string} url         request 	url
	 * @param  {string | object} 	postData    data to send in a POST request
	 * @param  {string} 			requestType POST or GET
	 * @param  {boolean} 			noCache     cache flag
	 * @return {deffered | object}  if called with no arguments returns object with "clear" method for clearing the cache
	 */
	return function(url, postData, requestType, noCache) {

		if (!arguments.length) {
			return {
				clear: clearCache
			};
		}

		url = url || urlDefault;
		postData = postData || postDataDefault;
		requestType = requestType || requestTypeDefault;
		noCache = noCache || noCacheDefault;

		var cachedResponse = getFromCache(url, postData);

		// if request was cached - retrieve it from the cache
		if (!noCache && cachedResponse) {
			console.log("Retrieving from cache...");
			return $.Deferred().resolve(cachedResponse);
		}

		// make ajax request
		return triggerRequest({
			url: url,
			data: postData,
			type: requestType,
			dataType: "text"
		}).done(function(response) {
			// add request data to the cache
			addToCache(url, postData, response);
		});

	};

})(null, null, "GET", false);