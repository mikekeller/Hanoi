/**
 * Created by Mike on 6/6/2014.
 */

/*global Hanoi:false*/

var Util = (function () {               // The Revealing Module Pattern
  "use strict";
  var elapsedTimerId;

  /**
   * requestAnimationFrame polyfill
   * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
   * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
   * requestAnimationFrame polyfill by Erik Möller
   * fixes from Paul Irish and Tino Zijdel
   */
  (function () {
    var lastTime = 0;
    var vendors = ["ms", "moz", "webkit", "o"],
        x;
    for (x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
      window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] ||
          window[vendors[x] + "CancelRequestAnimationFrame"];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
    }
  }());

  /**
   * Enables or disables n buttons passed in via an array.
   * The function is recursive calling itself once for each button passed in after the first.
   * @param state true enables and false disables a button
   * @param ary an array of buttons to process
   */
  function setButtonState(state, ary) {
    var btnName;
    if (ary.length === 0) {
      return;
    }
    btnName = ary.shift();
    if (state === "disabled") {
      $("#" + btnName).
          removeClass("buttonOn").
          addClass("buttonOff").
          attr("disabled", true);
    } else if (state === "enabled") {
      $("#" + btnName).
          removeClass("buttonOff").
          addClass("buttonOn").
          removeAttr("disabled");
    }
    // recursive call get next button
    setButtonState(state, ary);
  }

  /**
   * Plays a sound passed in
   * @param sound
   * sound is id audio tag in html page containing:
   * .mp3, and ogg versions of a given sound
   * @returns {boolean}
   */
  function playSound(sound) {
    // Stop any sound in progress
    sound[0].pause();
    sound[0].currentTime = 0;
    // Set volume
    sound[0].volume = Hanoi.AUDIO_VOLUME;
    // Needed cause may not play after first time
    sound.load();
    sound[0].play();
    return false;
  }

  /**
   * Sends time in <minutes:seconds> to html tag.  Updates every second.
   * @param fun
   */
  function elapsedTimer(fun) {
    var ticks, seconds, minutes, result;

    switch (fun) {
    case "start":
      ticks = 0;
      elapsedTimerId = setInterval(function () {
        ticks++;
        seconds = ticks % 60;
        minutes = Math.floor((ticks / 60)) % 60;
        seconds = (seconds > 9) ? seconds : "0" + seconds;
        minutes = (minutes > 9) ? minutes : "0" + minutes;
        result = minutes + ":" + seconds;
        $("#elapsedTime").html(result);
      }, 1000);
      break;
    case "stop":
      clearInterval(elapsedTimerId);
      break;
    default:
      break;
    }
  }

  /**
   * Show the Help dialog box within the puzzle container
   */
  function showHelp() {
    var container = $("#container"),
        width = container[0].offsetWidth - 2 * Hanoi.HELP_MARGIN,
        height = container[0].offsetHeight - 2 * Hanoi.HELP_MARGIN;

    $("#help-dialog").dialog({
      dialogClass: "info",
      title      : "Help",
      width      : width,
      height     : height,
      position   : ["middle", Hanoi.HELP_MARGIN],
      modal      : true
    });
  }

  return { // exports
    setButtonState: setButtonState,
    playSound     : playSound,
    showHelp      : showHelp,
    elapsedTimer  : elapsedTimer
  };
}());
