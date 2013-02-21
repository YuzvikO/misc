var Event = (function() {

	// every callback function will be assigned a unique id
	var id = 0;
	// callback map for user callback tracking (id => callback)
	var callbacks = {};
	/** Object for event tracking
	 * Holds all events binded using the bind method
	 * Has the following format:
	 * {
	 * 		element1: {
	 *			"event1": {
	 *	 		 	"selector1": [<callback1id>, <callback2id> ...],
	 *			 	"selector2": [...],
	 *			 	...
	 *			},
	 *		 	"event2": {...},
	 *			...
	 * 		},
	 *		element2: {...},
	 *		...
	 * }
	 */
	var events = {};

	/**
	 * function isEmptyObject
	 * utility function that checks the object for emptyness
	 */
	var isEmptyObject = function(obj) {
		for (var property in obj) {
			if (obj.hasOwnProperty(property)) {
				return false;
			}
		}

		return true;
	};

	/**
	 * function getHandler
	 * returns generic handler function
	 */
	var getHandler = function(element, eventType) {
		// get the selector to callbacks array map for the current element and event
		var members = events[element][eventType];
		// temporary variable for holding elements matched by selector
		var elements;

		// is intended for use in an argument list of the addEventListener method, so returns handler function
		return function(e) {

			// the following loop implements delegation mechanism
			// Iterate through all the selectors that want to use delegated events
			for (var selector in members) {

				// check if the selector is a string presentation of the parent element
				if (selector === element.toString()) {
					// if so, no need to use qerySelectorAll, call the attached callbacks directly
					members[selector].forEach(function(value, index, array) {
						// check if the callback was not deleted (unbind method sets id to 0 when unbinds function)
						if (value !== 0) {
							// call the callback preserving the event object and using the context of the object we delegated event to
							callbacks[value].call(e.target, e);
						}
					});

					return;
				}

				// get the array of the matched elements
				elements = element.querySelectorAll(selector);

				// check if the event target is on of the found elements
				for (var i = 0; i < elements.length; i++) {

					if (e.target === elements[i]) {
						// call the attached callbacks
						members[selector].forEach(function(value, index, array) {
							// check if callback was not deleted and call it if wasn't
							if (value !== 0) {
								callbacks[value].call(e.target, e);
							}
						});

						return;
					}
				}
			}
		};
	};

	return {
		/**
		 * method bind
		 * binds event to the element, or group of elements
		 */
		bind: function(eventType, element, selector, callback) {

			callback = callback || selector;
			selector = typeof selector === "string" ? selector : element;
			
			var members;

			if (!events[element]) {
				events[element] = {};
			}

			if (!events[element][eventType]) {
				events[element][eventType] = {};
			}

			// add to the callbacks map, using the unique id
			callbacks[++id] = callback;
			members = events[element][eventType];

			// if we bind this type of event for the first time
			if (isEmptyObject(members)) {
				members[selector] = [id];

				// then we need to bind event listener using popular DOM method
				element.addEventListener(eventType, getHandler(element, eventType), false);
			} else {
				// check if there already are some callbacks attached to the elements that match the selector, if not - create new array
				if (!members[selector]) {
					members[selector] = [];
				}

				// add callback id into array, for the later use by generic handler
				members[selector].push(id);
			}
		},

		/**
		 * method unbind
		 * unbinds events from an element or group of elements
		 */
		unbind: function(eventType, element, selector, callback) {
			callback = callback || selector;
			// if selector is not provided assume that this is an element itself
			selector = typeof selector === "string" ? selector : element;
			var members = events[element][eventType];
			var handlers = members[selector];
			var index;

			// if the callback is specified, delete only the specified callback
			if (typeof callback === "function") {
				for (index = 0; index < handlers.length; index++) {

					if (callbacks[handlers[index]] === callback) {
						callbacks[handlers[index]] = null;
						handlers[index] = 0;
					}
				}
			} else {
				// delete all callbacks attached to the given selector
				for (index = 0; index < handlers.length; index++) {
					callbacks[handlers[index]] = null;
					handlers[index] = 0;
				}
			}
		}
	}
})();
