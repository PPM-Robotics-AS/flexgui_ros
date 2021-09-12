// namespace MJPEG { ...
var MJPEG = (function(module) {
  "use strict";

  // class Stream { ...
  module.Stream = function(args) {
    var self = this;
    var autoStart = args.autoStart || false;

    self.url = args.url;
    self.refreshRate = args.refreshRate || 100;
    self.onStart = args.onStart || null;
    self.onFrame = args.onFrame || null;
    self.onStop = args.onStop || null;
    self.callbacks = {};
    self.running = false;
    self.frameTimer = 0;

    self.img = new Image();
    if (autoStart) {
      self.img.onload = self.start;
    }
    self.img.src = self.url;

    function setRunning(running, e) {
      self.running = running;
      if (self.running) {
        self.img.src = self.url;
        self.frameTimer = setInterval(function() {
          if (self.onFrame) {
            self.onFrame(self.img);
          }
        }, self.refreshRate);
        if (self.onStart) {
          self.onStart();
        }
      } else {
        self.img.src = "#";
        clearInterval(self.frameTimer);
        if (self.onStop) {
          self.onStop(e);
        }
      }
    }

    self.start = function() { setRunning(true); }
    self.stop = function(e) { setRunning(false, e); }
  };

  // class Player { ...
  module.Player = function(canvas, url, options) {

    var self = this;
    if (typeof canvas === "string" || canvas instanceof String) {
      canvas = document.getElementById(canvas);
    }
    var context = canvas.getContext("2d");
    var retry = null;
    if (! options) {
      options = {};
    }
    options.url = url;
    options.onFrame = updateFrame;
    options.onStart = function () { if (options.onStartCallback) options.onStartCallback(); }
    options.onStop = function (e) { if (options.onStopCallback) options.onStopCallback(e); }
    self.stream = new module.Stream(options);

    canvas.addEventListener("click", function() {
      if (self.stream.running) { self.stop(); }
      else { self.start(); }
    }, false);

    function scaleRect(srcSize, dstSize) {
      var ratio = Math.min(dstSize.width / srcSize.width,
                           dstSize.height / srcSize.height);
      var newRect = {
        x: 0, y: 0,
        width: srcSize.width * ratio,
        height: srcSize.height * ratio
      };
      newRect.x = (dstSize.width/2) - (newRect.width/2);
      newRect.y = (dstSize.height/2) - (newRect.height/2);
      return newRect;
    }

    function updateFrame(img) {
        var canvas = context.canvas;
        var drawReady = false;
        if (!self.scale || self.scale == 'stretch') {
            try{
                context.drawImage(img,
                  0,
                  0,
                  img.width,
                  img.height,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

                drawReady = true;
            } catch (e) {
                // if we can't draw, don't bother updating anymore
                self.stop(e);
                throw e;
            }
        } else {
            var hRatio = canvas.width / img.width;
            var vRatio = canvas.height / img.height;
            var ratio = self.scale == "aspectFit" ? Math.min(hRatio, vRatio) : Math.max(hRatio, vRatio);
            var centerShift_x = (canvas.width - img.width * ratio) / 2;
            var centerShift_y = (canvas.height - img.height * ratio) / 2;
            try {
                context.drawImage(img, 0, 0, img.width, img.height,
                               centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

                drawReady = true;
            } catch (e) {
                // if we can't draw, don't bother updating anymore
                self.stop(e);
                throw e;
            }
        }

        if (self.onUpdated && drawReady) self.onUpdated();
    }

    self.start = function () { if (retry) { clearTimeout(retry); retry = null } self.stream.start(); }
    self.stop = function (e) { self.stream.stop(e); }
    self.scale = '';
  };

  return module;

})(MJPEG || {});
