/*
---

name: GoogleMap.js

description: An abstraction of the Google Maps API.

requires:
 - Core/Fx.Tween

provides: [GoogleMap, GoogleMap.Box, GoogleMap.Annotated]

...
*/

(function(){
  if (!window.google){
    try {
      console.log("not running google map class code as google maps is not included.");
    } catch(e){}
    return;
  }

  window.GoogleMap = new Class({

    Implements: [Options, Events],

    options: {
      getMapType: function(){
        return google.maps.MapTypeId.ROADMAP;
      },
      pinIcon: null,
      shadowImage: null,
      lat: 37.759465,
      lng: -122.427864,
      locationIcon: null,
      locationAnchorX: null,
      locationAnchorY: null,
      showUserPosition: true,
      pinTTL: 0, //zero lives forever
      size: null,
      useZ: true,
      maxBounds: 10,
      timeout: 4000,
      zoom: 20,
      zoomToFit: true,
      showZoomControl: true,
      // {
      //   width: '100%',
      //   height: 400
      // },
      showMapControls: true,
      animation: google.maps.Animation.DROP,
      mapStyles: {}
    },

    initialize: function(container, options){
      this.setOptions(options);
      this.container = document.id(container);
      if (this.options.size) this.container.setStyles(this.options.size);
      this.buildMap();
      if (this.options.showUserPosition) this.centerOnUser();
      else this.center();
    },

    makeBounds: function(){
      this.bounds = new google.maps.LatLngBounds();
    },

    checkBounds: function(){
      if (this.points.length > this.options.maxBounds && this.points.length%this.options.maxBounds){
        this.makeBounds();
        for (var i = this.points.length - this.options.maxBounds; i < this.points.length; i++){
          this.bounds.extend(this.points[i]);
        }
      }
    },

    buildMap: function(){
      this.makeBounds();
      if (this.options.showMapControls){
        this.map = new google.maps.Map(this.container, {
          zoom: this.options.zoom,
          mapTypeId: this.options.getMapType(),
          styles: this.options.mapStyles,
          panControl: this.options.panControl,
          showMapControls: this.options.showMapControls
        });
      }
      else {
        this.map = new google.maps.Map(this.container, {
          zoom: this.options.zoom,
          mapTypeId: this.options.getMapType(),
          mapTypeControl: false,
          draggable: true,
          scaleControl: false,
          scrollwheel: false,
          navigationControl: false,
          streetViewControl: false,
          showMapControls: this.options.showMapControls,
          panControl: this.options.panControl,
          zoomControl:this.options.showZoomControl,
          zoomControlOptions: {
            style:google.maps.ZoomControlStyle.SMALL
          },
          styles: this.options.mapStyles
        });
      };
      return this;
    },

    lastCenter: null,

    setZoom: function(zoom){
      this.map.setZoom(zoom);
      return this;
    },

    getZoom: function(){
      return this.map.getZoom();
    },

    center: function(lat, lng){
      var zoom = this.getZoom() || this.options.zoom;
      this.map.setCenter(new google.maps.LatLng(lat || this.options.lat, lng || this.options.lng));
      this.setZoom(zoom);
      this.lastCenter = this.center.bind(this, arguments);
      return this;
    },

    centerOnBounds: function(){
      this.map.panTo(this.bounds.getCenter());
    },

    zoomToBounds: function(){
      this.map.fitBounds(this.bounds);
      this.map.setCenter(this.bounds.getCenter());
    },

    resize: function(){
      google.maps.event.trigger(this.map, "resize");
      if (this.lastCenter) this.lastCenter();
    },

    markCenter: function(lat, lng){
      if (!this.userPosition){
        this.userPosition = this.dropPin({
          lat: lat || this.options.lat,
          lng: lng || this.options.lng,
          icon: this.options.locationIcon,
          anchorX: this.options.locationAnchorX,
          anchorY: this.options.locationAnchorY,
          saveMarker: false
        });
      } else {
        this.userPosition.setPosition(
          new google.maps.LatLng(lat || this.options.lat, lng || this.options.lng)
        );
      }
      return this;
    },

    centerOnUser: function(callback){
      callback = callback || function(){};
      var zoom = this.getZoom() || this.options.zoom;
      // Try HTML5 geolocation
      if (navigator.geolocation){
        this.fireEvent('getLocation');
        navigator.geolocation.getCurrentPosition(
          // success handler
          function(position){
            this.fireEvent('receiveLocation', position);
            this.markCenter(position.coords.latitude, position.coords.longitude);
            this.center(position.coords.latitude, position.coords.longitude);
            Cookie.write('location', JSON.encode(position.coords));
            this.setZoom(zoom);
            callback();
          }.bind(this),
          // error handler
          function(){
            this.fireEvent('receiveLocation');
            if (Cookie.read('location')){
              var cookie = JSON.decode(Cookie.read('location'));
              this.center(cookie.lat, cookie.latitude);
              this.markCenter(cookie.lat, cookie.longitude);
            } else {
              this.defaultCenter();
            }
            this.setZoom(zoom);
            callback();
          }.bind(this),
          {timeout:this.options.timeout}
        );
      }
      else {
        this.fireEvent('receiveLocation');
        this.center(this.options.lat, this.options.lng);
        this.markCenter(this.options.lat, this.options.lng);
        this.setZoom(zoom);
        callback();
      }
      return this;
    },
    defaultCenter: function(lat, lng){
      lat = lat || this.options.lat;
      lng = lng || this.options.lng;
      this.center(lat, lng);
      this.markCenter(lat, lng);
    },
    _pinZIndex: 1,
    points: [],
    markers: [],
    dropPin: function(options){
      options = options || {};
      if (!options.lat || !options.lng || options.lat == "0.0" || options.lng == "0.0") return {};
      /*
        options = {
          icon: urlToIcon, //defaults to the icon named in the options
          zindex: integer,
          lat: integer,
          lng: integer,
          zIndex: integer,
          title: string,
          TTL: integer // (zero lives for ever),
          saveMarker: boolean
        }
      */
      if (typeof(options.saveMarker)==='undefined') options.saveMarker = true;
      var point = new google.maps.LatLng(options.lat, options.lng);
      this.points.push(point);
      this.checkBounds();
      this.bounds.extend(point);
      this.zoomToBounds();
      var anchor = null;
      if (options.anchorX && options.anchorY) anchor = new google.maps.Point(options.anchorX, options.anchorY);

      var shadowIcon = null;
      var shadowImage = options.shadowImage || this.options.shadowImage
      if (shadowImage){

        var shadowAnchor = null;
        if (options.shadowAnchorX && options.shadowAnchorY){
          shadowAnchor = new google.maps.Point(options.shadowAnchorX, options.shadowAnchorY);
        };
        shadowIcon = new google.maps.MarkerImage(
          shadowImage,
          null,
          null,
          shadowAnchor
        );
      };

      var markerIcon = new google.maps.MarkerImage(
          options.icon || this.options.pinIcon,
          null,
          null,
          anchor
      );

      // icon overrides the markerImage because of the merge below.
      // leaving the name the same for backwards compatibility
      delete options['icon'];

      var localZ = this.options.useZ ? this._pinZIndex : null;
      var marker = new google.maps.Marker(
        Object.merge({
          position: point,
          map: this.map,
          icon: markerIcon,
          zIndex: localZ,
          shadow: shadowIcon,
          animation: this.options.animation
        }, options)
      );

      if (options.saveMarker) this.markers.push(marker);
      this._pinZIndex++;
      if (this.options.pinTTL || options.TTL) marker.setVisible.delay(this.options.pinTTL || options.TTL, marker, false);
      return marker;
    }

  });

  GoogleMap.Box = new Class({

    //see https://developers.google.com/maps/documentation/javascript/overlays
    Extends: google.maps.OverlayView,

    Implements: [Options, Events],

    options: {
      position: { lat: 0, lat: 0},
      size: {width: 100, height: 40},
      offset: {x: 0, y: 0},
      content: '',
      fxOptions: {
        transition: 'bounce:out',
        duration: 800
      },
      TTL: 0 //zero lives forever
    },

    initialize: function (map, options){
      this.setOptions(options);
      this.map = map;
      this.setMap(map);
      this.overlay = new google.maps.OverlayView(this.map).getProjection();
    },

    onAdd: function(){
      // Create the DIV and set some basic attributes.
      this.div = new Element('div', {
        class: 'mapBox',
        styles: {
          position: 'absolute',
          visibility: 'hidden'
        }
      }).set('tween', this.options.fxOptions);
      if (typeOf(this.options.content) == "string") this.div.set('html', this.options.content);
      else this.div.empty().adopt(this.options.content);
      var panes = this.getPanes();
      panes.overlayLayer.adopt(this.div);
      this.show();
      if (this.options.TTL) this.hide.delay(this.options.TTL, this);
    },

    draw: function(){
      // Size and position the overlay. We use a southwest and northeast
      // position of the overlay to peg it to the correct position and size.
      // We need to retrieve the projection from this overlay to do this.
      var overlayProjection = this.getProjection();

      // Retrieve the southwest and northeast coordinates of this overlay
      // in latlngs and convert them to pixels coordinates.
      // We'll use these coordinates to resize the DIV.
      var nw = overlayProjection.fromLatLngToDivPixel(new google.maps.LatLng(this.options.position.lat, this.options.position.lng));

      // Resize the image's DIV to fit the indicated dimensions.
      this.div.setStyles({
        left: nw.x + this.options.offset.x,
        top: nw.y + this.options.offset.y,
        width: this.options.size.width,
        height: this.options.size.height
      });
    },

    remove: function(){
      this.div.dispose();
    },

    hide: function(){
      this.div.setStyle('visibility', 'hidden');
    },

    show: function(){
      this.div.setStyle('marginTop', -800).setStyles({
        visibility: 'visible'
      }).tween('marginTop', -800, 0);
    },

    toggle: function(){
      this.div.setStyle('display', this.div.getStyle('display') == 'none' ? 'block' : 'none');
    }

  });

  GoogleMap.Annotated = new Class({

    Extends: GoogleMap,

    boxes: [],

    dropPin: function(options){
      var elements = {};
      if (!options.lat || !options.lng || options.lat == "0.0" || options.lng == "0.0") return elements;

      if (options.content){

        var point = new google.maps.LatLng(options.lat, options.lng);
        this.points.push(point);
        this.checkBounds();
        this.bounds.extend(point);
        if (this.options.zoomToFit){
          this.map.fitBounds(this.bounds);
          this.map.panTo(this.bounds.getCenter());
        }

        elements.box = new GoogleMap.Box(this.map, {
          position: {
            lat: options.lat,
            lng: options.lng
          },
          size: {
            width: options.width || 20,
            height: options.height || 20
          },
          offset: options.offset || {x: 0, y: 0},
          content: options.content,
          TTL: options.TTL || this.options.pinTTL
        });
        this.boxes.push(elements.box);
      }
      if (!options.noPin){
        elements.marker = this.parent(options);
      }
      return elements;
    }

  });

})();
