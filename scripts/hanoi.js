/**
 * Hanoi -- Program solves the Tower of Hanoi puzzle
 * permits users to guess next moves if they desire.
 *
 * MIT License:
 * Copyright (C) 2014 Michael Keller.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/*global Util:false*/
var Hanoi = (function () {      // The Revealing Module Pattern
  "use strict";
  var VERSION = "2.4.1",        // program version
      DISK_HEIGHT = 20,         // Disk height including border
      TOP_VERTICAL = 80,        // Disks move up to this height vertically
      BOTTOM_VERTICAL = 340,    // Disks move down to this height vertically
      AUDIO_VOLUME = 0.5,
      HELP_MARGIN = 65,         // Help window margin from game container
      activeDisk = {            // dynamic disk animation properties
        stepSize: 0,            // Number of pixels to move each disk on each call from timer
        diskTop : 0,            // moving disk css top value
        diskLeft: 0,            // moving disk css left value
        up      : 0,            // number of pixels to animate up
        left    : 0,            // number of pixels to animate left may be 0
        right   : 0,            // number of pixels to animate right may be 0
        down    : 0             // number of pixels to animate down
      },
      moveStack = [],           // contains all moves required for a given number of disks
      pegAList = [],            // LIFO stacks contain disks numbers placed on them during a run
      pegBList = [],
      pegCList = [],
      pegToPeg = 0,             // distance in pixels between any adjacent pegs
      fromPeg = 0,
      toPeg = 0,
      requestId,
      numberOfDisks = 0,        // Number of disks selected by user
      speed = 5,                // Speed selected by user
      paused = false,
      movesMade = 0,
      goodGuess = 0,
      badGuess = 0,
      numObj;

  /**
   * Game over function
   */
  function gameOver() {
    $("#check").css({display: "block"});
    Util.setButtonState("disabled", ["btnPause", "btnStep"]);
    Util.elapsedTimer("stop");
    Util.playSound($("#gameOverSound"));
  }

  /**
   * Computes and displays moves required and moves made currently
   */
  function showMoves() {
    var movesRequired = Math.pow(2, numberOfDisks) - 1;
    $("#theMoves").html(movesMade + "/" + movesRequired);
  }

  /**
   * Move selected disks to pegA
   */
  function moveDisksToPegA() {
    var pos = BOTTOM_VERTICAL,
        diskNum,
        disk;

    for (diskNum = numberOfDisks; diskNum > 0; diskNum--) {
      disk = ($("#disk" + diskNum));
      disk.css({top: pos + "px"});
      pos -= DISK_HEIGHT;
    }
  }

  /**
   * Setups up the number of disks selected on Peg A to begin game.
   */
  function setupDisks() {
    var diskNum,
        disk;

    // clear arrays
    moveStack.length = 0;
    pegAList.length = 0;
    pegBList.length = 0;
    pegCList.length = 0;

    // Show disks selected and hide all others
    for (diskNum = 1; diskNum <= 10; diskNum++) {
      disk = ($("#disk" + diskNum));
      if (diskNum <= numberOfDisks) {
        disk.addClass("disk" + diskNum + "Color");
        pegAList.push(diskNum);
        disk.show();
      } else {
        disk.hide();
      }
    }

    moveDisksToPegA();
  }

  /**
   * Starts game and will run to completion if Pause is never pressed.
   */
  function run() {
    Util.setButtonState("disabled", ["btnSolve"]);
    Util.setButtonState("enabled", ["btnPause"]);
    $("#selectDisks").attr("disabled", "disabled");

    // get center of each peg
    pegToPeg = $("#divPegB")[0].clientWidth;
    activeDisk.stepSize = speed;
    new hanoiAlgorithm(numberOfDisks, 0, 2, 1);
    getDiskToMove();
    moveDisk();
  }

  /**
   * Contains recursive algorithm to fill moveStack with all moves needed to run puzzle
   * @param n
   * @param from
   * @param to
   * @param via
   * @constructor
   */
  function hanoiAlgorithm(n, from, to, via) {
    // Make a stack of all moves
    if (n === 0) {
      return;
    }

    new hanoiAlgorithm(n - 1, from, via, to);

    // save parameters to moveStack array
    moveStack.push([from, to]);
    new hanoiAlgorithm(n - 1, via, to, from);
  }

  /**
   * Sets the disk style just before it moves.
   * Restores the disks appearance just after the move.
   * @param arg
   */
  function setDiskStyle(arg) {
    var diskNum = activeDisk.disk[0].innerHTML;

    if (arg === "moving") {
      activeDisk.disk.removeClass("diskNotMoving").
          removeClass("disk" + diskNum + "Color").
          addClass("diskMoving");
    } else {
      activeDisk.disk.removeClass("diskMoving").
          addClass("diskNotMoving").
          addClass("disk" + diskNum + "Color");
    }
  }

  /**
   * Gets disk to move from moveStack
   * returns false if no disk to move
   */
  function getDiskToMove() {
    var currentMove,
        pegStack,
        diskNum;

    // Have all moves have been made?
    if (moveStack.length === 0) {
      gameOver();
      return false;
    }

    // Get move
    currentMove = moveStack.shift();
    fromPeg = currentMove[0];
    toPeg = currentMove[1];
    // Select peg containing disk to move
    pegStack = fromPeg === 0 ? pegAList : fromPeg === 1 ? pegBList : pegCList;

    // Select disk to move
    diskNum = pegStack.shift();
    activeDisk.disk = $("#disk" + diskNum);
    return true;
  }

  /**
   * Prepares for a disk to be moved
   */
  function moveSetup() {
    var toPegNumDisks;

    if (paused) {
      $("#selectNext").attr("disabled", true);
    }
    setDiskStyle("moving");
    activeDisk.diskTop = activeDisk.disk[0].offsetTop;
    activeDisk.diskLeft = activeDisk.disk[0].offsetLeft;
    activeDisk.up = activeDisk.diskTop - TOP_VERTICAL;
    if (fromPeg < toPeg) {
      activeDisk.left = 0;
      activeDisk.right = (toPeg - fromPeg) * pegToPeg;
    } else {
      activeDisk.right = 0;
      activeDisk.left = (fromPeg - toPeg) * pegToPeg;
    }
    toPegNumDisks = toPeg === 0 ? pegAList.length : toPeg === 1 ? pegBList.length : pegCList.length;
    activeDisk.down = BOTTOM_VERTICAL - TOP_VERTICAL - toPegNumDisks * DISK_HEIGHT;
  }

  function moveVert(dir) {
    if (dir === "up") {
      activeDisk.diskTop -= activeDisk.stepSize;
      activeDisk.up -= activeDisk.stepSize;
    } else if (dir === "down") {
      activeDisk.diskTop += activeDisk.stepSize;
      activeDisk.down -= activeDisk.stepSize;
    }
    activeDisk.disk.css({top: activeDisk.diskTop + "px"});
  }

  var moveHorz = function (dir) {
    if (dir === "left") {
      activeDisk.diskLeft -= activeDisk.stepSize;
      activeDisk.left -= activeDisk.stepSize;
    } else if (dir === "right") {
      activeDisk.diskLeft += activeDisk.stepSize;
      activeDisk.right -= activeDisk.stepSize;
    }
    activeDisk.disk.css({left: activeDisk.diskLeft + "px"});
  };

  /**
   * Just after going down align disk on peg
   */
  function alignHorz(pegCenter) {
    activeDisk.diskLeft += pegCenter - (activeDisk.disk[0].offsetLeft + activeDisk.disk[0].offsetWidth / 2);
    activeDisk.disk.css({left: activeDisk.diskLeft + "px"});
  }

  /**
   * Finish with current disk move and get next disk to be moved.
   */
  function moveEnd() {
    window.cancelAnimationFrame(requestId);

    // Store the disk number just moved in the peg it was just placed on.
    var theNum = parseInt(activeDisk.disk.html(), 10);
    if (toPeg === 0) {
      pegAList.unshift(theNum);
      alignHorz(pegToPeg * 0.5);
    }
    if (toPeg === 1) {
      pegBList.unshift(theNum);
      alignHorz(pegToPeg * 1.5);
    }
    if (toPeg === 2) {
      pegCList.unshift(theNum);
      alignHorz(pegToPeg * 2.5);
    }

    activeDisk.stepSize = speed;
    movesMade++;
    setDiskStyle("notMoving");
    showMoves();
    if (paused) {
      Util.setButtonState("enabled", ["btnStep", "btnResume"]);
      $("#selectNext").removeAttr("disabled");
    } else {
      if (getDiskToMove()) {
        moveDisk();
      }
    }
  }

  /**
   * Manages order of disk movement
   */
  function moveDisk() {
    moveSetup();
    var animationLoop = function () {
      requestId = requestAnimationFrame(animationLoop, activeDisk.disk);
      if (activeDisk.up > 0) {
        moveVert("up");
      } else if (activeDisk.left > 0) {
        moveHorz("left");
      } else if (activeDisk.right > 0) {
        moveHorz("right");
      } else if (activeDisk.down > 0) {
        moveVert("down");
      } else {
        moveEnd();
      }
    };
    setTimeout(animationLoop, 1);
  }

  /**
   * Make move specified by user if possible else reject
   */
  function userSpecifiedMove() {
    var ary = moveStack[0],
        next = $("#selectNext").val().toString(),
        color;

    if (next === "select") {
      // ignore
      return;
    }
    if (next === ary[0].toString() + ary[1].toString()) {
      goodGuess++;
      color = "green";
    } else {
      badGuess++;
      color = "red";
    }
    $("#guessCounter").
        html(goodGuess.toString() + "/" + badGuess.toString()).
        css({"color": color}).
        animate({
          fontSize  : "1em",
          fontWeight: "bold",
          fontStyle : "italic"
        }, "slow", function () {
          $("#guessCounter").html(goodGuess.toString() + "/" + badGuess.toString());
        }).
        animate({fontSize: "1em", fontWeight: "normal"}, "slow", function () {
          $("#guessCounter").css({"color": "black"});

        });
    if (color === "green") {
      Util.setButtonState("disabled", ["btnStep", "btnResume"]);
      paused = true;
      if (getDiskToMove()) {
        moveDisk();
      }
    } else {
      Util.playSound($("#badGuessSound"));
    }
  }

  /**
   * Housekeeping at startup
   */
  function init() {
    console.log(Object.keys(window));
    // show version
    $("#version").html("Ver " + VERSION);

    // set initial button states
    Util.setButtonState("disabled", ["btnPause", "btnStep", "btnResume"]);
    Util.setButtonState("enabled", ["btnSolve", "btnReset", "btnHelp"]);

    // hide winning graphic
    $("#check").css({display: "none"});

    // get number of disks
    numberOfDisks = $("#selectDisks").val();

    // Show minimum moves required to solve
    movesMade = 0;
    showMoves();

    // set animation speed
    activeDisk.stepSize = +$("#selectSpeed").val();

    // clear guesses from past runs; don't permit guesses
    goodGuess = 0;
    badGuess = 0;
    $("#selectNext").attr("disabled", "disabled");

    // ensure move timer isn't running
    window.cancelAnimationFrame(requestId);

    // place disks in initial position on first peg
    setupDisks();
  }

  /**
   * Run automatically until end or paused
   */
  function solve() {
    Util.elapsedTimer("start");
    run();
  }

  /**
   * Resume from a pause
   */
  function resume() {
    Util.setButtonState("disabled", ["btnResume", "btnStep"]);
    Util.setButtonState("enabled", ["btnPause"]);
    $("#selectNext").attr("disabled", true);
    paused = false;
    if (getDiskToMove()) {
      moveDisk();
    }
  }

  /**
   * Move the next disk then pause
   */
  function step() {
    Util.setButtonState("disabled", ["btnStep", "btnResume"]);
    paused = true;
    if (getDiskToMove()) {
      moveDisk();
    }
  }

  /**
   * When the current disk move completes pause
   */
  function pause() {
    Util.setButtonState("disabled", ["btnPause"]);
    paused = true;
  }

  /**
   * Setup disks to be moved on pegA
   */
  function selectDisks() {
    numberOfDisks = +$("#selectDisks").val();
    showMoves();
    setupDisks();
  }

  /**
   * Ensure number of disks is between 1 and 10 inclusive
   */
  function validateDisks() {
    if (numObj[0].value > 10) {
      numObj[0].value = 10;
    } else if (numObj[0].value < 1) {
      numObj[0].value = 1;
    }
  }

// Event handlers *************************************************************

  numObj = $("#selectDisks")
      .on("keypress", function (event) {
        // Checks for the enter key
        if (event.keyCode === 13) {
          // Stops IE from triggering the Solve button click
          event.preventDefault();
          validateDisks();
          selectDisks();
        }
      })
      .on("change", function () {
        validateDisks();
        selectDisks();
      });

  $("#selectSpeed").on("change", function () {
    speed = +$("#selectSpeed").val();
  });

  $("#selectNext").on("change", function () {
    userSpecifiedMove();
  });

  $("#btnSolve").on("click", function () {
    solve();
  });

  $("#btnPause").on("click", function () {
    pause();
  });

  $("#btnStep").on("click", function () {
    step();
  });

  $("#btnResume").on("click", function () {
    resume();
  });

  $("#btnReset").on("click", function () {
    window.location.reload(true);
  });

  $("#btnHelp").on("click", function () {
    Util.showHelp();
  });

  return { // exports
    AUDIO_VOLUME: AUDIO_VOLUME,
    HELP_MARGIN : HELP_MARGIN,
    init        : init
  };

}());
