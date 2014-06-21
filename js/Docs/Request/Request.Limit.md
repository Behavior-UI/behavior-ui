/*
---

name: Request.Limit

description: Adds ability to rate limit all requests on a page.

requires:
 - Core/Request.JSON
 - Core/Request.HTML
 - More/Class.Refactor

provides: [Request.Limit]

...
*/

/*

	This class implements functionality to rate limit the number of running requests on a page.
	The change is global, so all instances of Request should obey the limit.

	To use, simply implement into Request the option value you desire:

	Request.implement({
		options: {
			limit: 2
		}
	});

	This will set the default maximum number of requests to 2 for all instances. Note that
	individual instances can overwrite this limit by specifying a different option. This
	means that you can rate limit different requests as you like. For instance, you could
	set your default, as above, to 2, but then for a request that allows the user to
	edit a form (the response to which you want to prioritize) you could set that instance's
	limit to zero and it'll ignore the queue.

*/

(function(){
	// this function moves on in the queue if the request is finished, used when the request
	// is canceled and when the xhr changes state
	var nextRequest = function(){
		// run the parent's cancel or onStateChange method
		this.previous.apply(this, arguments);
		// if the result of that call sets this.running to false
		// and there's a limit set at all...
		if (Request.active.contains(this) && !this.running){
			// remove this instance from the list of active requests; not harmful if called more than once
			Request.active.splice(Request.active.indexOf(this), 1);
			// if there's anying left in the queue
			// and the number of active requests is < the limit
			if (Request.queue.length && Request.active.length < this.options.limit){
				// pop off the oldest request call and execute it. this syntax with the double parens is a little
				// weird but that's what it does.
				var bound = Request.queue.shift();
				Request.active.push(bound.instance);
				bound();
				this.fireEvent('onContinue');
			}
		}
		return this;
	};

	Class.refactor(Request, {
		options: {
			// when the limit is zero, there is no rate limit applied
			limit: 0
		},
		send: function(options){
			if (!this.check()) return;
			if (this._uid === undefined) this._uid = 1 + Request.uids++;
			// if there's a limit and the active requests is less than that limit
			if (!this.options.limit || Request.active.length < this.options.limit){
				// then run the request and push this instance into the active list
				this.previous.apply(this, arguments);
				Request.active.push(this);
			} else {
				// else queue the send request
				var bound = this.previous.bind(this, arguments);
				bound.instance = this;
				Request.queue.push(bound);
				this.fireEvent('onQueue');
			}
			return this;
		},
		onStateChange: nextRequest,
		cancel: nextRequest
	});

	// array of queued calls to .send()
	Request.queue = [];
	// array of running requests
	Request.active = [];

	Request.uids = 0;

})();