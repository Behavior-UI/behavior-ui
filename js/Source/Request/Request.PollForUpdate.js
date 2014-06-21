/*
---

name: Request.PollForUpdate

description: Hits a JSON endpoint and if the status entry of the response JSON
             is 'update' it fires the countUpdated event. if there is an updated_at
             entry in the response, the updatedAt attribute is updated as well.

requires:
 - Core/Request.JSON

provides: [Request.PollForUpdate]

...
*/

/*
  example response: {
    'status':     'update',     // this can be anything, but 'update' is the only one this responds to
    'date':       1380133559,   // this is the date to check against on the server
    'updated_at': 1380135000    // optional. if present, the instance's updatedAt attribute
                                // will be set to this if an 'update' status is returned
  }
*/

Request.PollForUpdate = new Class({
  Implements: [Options, Events],
  options: {
    pollInterval: 1000
    // url: some url returning json,
    // date: some_time_in_seconds
  },
  initialize: function(options){
    this.setOptions(options);
    this.updatedAt = this.options.date;
    // format the data payload for the server
    this.data = {
      'date': this.options.date,
      'status': 'initial'
    };
    this.url = this.options.url;
  },
  poll: function(){
    this.poller = this._fetch.periodical(this.options.pollInterval, this);
    return this;
  },
  stop: function(){
    clearInterval(this.poller);
    return this;
  },
  _fetch: function(){
    if (!this.request){
      this.request = new Request.JSON({
        url: this.url,
        onComplete: this._handleData.bind(this),
        method: 'get'
      });
    }
    this.request.send({data: this.data});
  },
  _handleData: function(){
    var data = this.request.response.json;
    // if the server provides an 'updated_at' timestamp,
    // store as an attribute
    if (data.status == 'update'){
      if (data.updated_at) this.updatedAt = data.updated_at.toInt();
      this.data = data;
      this.fireEvent('update', data);
    }
  }
});