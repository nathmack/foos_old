(function () {
  var game = {
    httpRequest: new XMLHttpRequest(),
    homeScore: 0,
    awayScore: 0,
    player1: 1,
    player2: 2,
    teamId: null,
    gameId: null,
    colour: 'blue',
    startTime: 100,
    gameStatus: true,

    showOptions: false,
    showModal: false,
    clockId: undefined,
    time: 0,

    init: function() {
      this.cacheDom()
      this.bindEvents()
      // this.API('GET', 'init=true')
      this.startClock()
      this.render()
    },

    cacheDom: function() {
      this.goal = document.getElementById("goal")
      this.options = document.getElementById("options")
      this.field = document.getElementById("container")
      this.selectColour = document.getElementById("select-color")
      this.start = document.getElementById("start")

      this.score1 = document.getElementById("team-1-score")
      this.score2 = document.getElementById("team-2-score")
      this.toggle = document.getElementById("toggle-options")
      this.clock = document.getElementById("clock")
      this.modal = document.getElementById("modal")
      this.popupText = document.getElementById("popup-text")

      this.playerSelect = document.getElementsByClassName("player-select")
    },

    setColour: function() {
      this.field.className = "container " + this.colour
    },

    bindEvents: function() {
      this.goal.addEventListener("click", this.addScore.bind(this), false)
      this.options.addEventListener("click", this.toggleOptions.bind(this), false)
      this.field.addEventListener("click", this.select.bind(this), false)
      this.selectColour.addEventListener("click", this.selectTeam.bind(this), false)
      this.start.addEventListener("click", this.startGame.bind(this), false)
    },

    // API: function(method, data) {
    //   if (!this.httpRequest) {
    //     alert('Giving up :( Cannot create an XMLHTTP instance');
    //     return false;
    //   }

    //   this.httpRequest.onreadystatechange = this.handleResponse.bind(this)
    //   if (method === 'GET') {
    //     this.httpRequest.open(method, '/foos/API.php?'+data, false)
    //     this.httpRequest.send()
    //   }
    //   if (method === 'POST') {
    //     this.httpRequest.open(method, '/foos/API.php', false)
    //     this.httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    //     this.httpRequest.send(data)
    //   }
    // },

    // handleResponse: function() {
    //   if (this.httpRequest.readyState === XMLHttpRequest.DONE) {
    //     // console.log(this.httpRequest)

    //     var response = JSON.parse(this.httpRequest.responseText)

    //     // GET response
    //     if (this.httpRequest.status === 200) {
    //       // live game info
    //       if (response.score) {
    //         this.homeScore = response.homeScore
    //         // if away score, trigger goal message
    //         if (this.awayScore < response.awayScore) {
    //           this.awayScore = response.awayScore
    //           this.showPopupText(
    //             'GOAL!',
    //             '',
    //             3000
    //           )
    //         }
    //         // if start time is set
    //         if (response.startTime) {
    //           this.gameStatus = true;
    //           this.startTime = parseInt(response.startTime, 10)
    //           console.log(this.startTime, new Date().getTime())
    //           this.hidePopupText()
    //         }
    //         // if game is over
    //         if (response.gamoOver) {
    //           this.gameStatus = false;
    //           this.showPopupText(
    //             'Game over!',
    //             'background',
    //             null
    //           )
    //         }
    //       // game info
    //       } else {
    //         // set the players, if they are not already
    //         if (response.players) {
    //           this.populatePlayers(response.players)
    //         }
    //         // if there is a game. set the team color
    //         // and skip to player selection
    //         if (response.team) {
    //           this.selectTeam(null, response.team)
    //         }
    //       }
    //     }

    //     // POST response
    //     if (this.httpRequest.status === 201) {
    //       if (response.teamId) {
    //         this.teamId = response.teamId
    //         this.gameId = response.gameId
    //         this.showPopupText(
    //           'Waiting for challenger...',
    //           'background',
    //           null
    //         )
    //         this.startClock()
    //       }
    //     }

    //     // error
    //     if (this.httpRequest.status > 201) {
    //       alert('There was a problem with the request.' + this.httpRequest.status)
    //     }
    //   }
    // },

    selectTeam: function(e, colour) {
      if (e.target !== e.currentTarget) {
        this.colour = colour || e.target.id
        this.setColour()
        this.hideElement(this.selectColour, 'teams')
      }
    },

    populatePlayers: function(players) {
      var keys = Object.keys(players)

      // loop through players provided by the API then add them
      // to the select boxes
      for (var i = 0; i < keys.length; i++) {
        var opt = document.createElement("option")
        opt.value = keys[i]
        opt.text = players[keys[i]]
        var opt2 = opt.cloneNode(true)

        this.playerSelect[0].appendChild(opt)
        this.playerSelect[1].appendChild(opt2)
      }
    },

    addScore: function(e) {
      var score = {
        teamId: this.teamId,
        gameId: this.gameId,
        peg: "NULL",
        option: "NULL",
        player: "NULL",
      }

      // get peg information
      var peg = document.getElementsByClassName("active")
      if (peg.length) {
        score.peg = parseInt(peg[0].getAttribute('data-id'), 10)
        score.player = score.peg <= 3 ? this.player2 : this.player1
      } else {
        // get goal type
        var option = document.getElementsByClassName("selected")
        if (option.length) {
          score.option = parseInt(option[0].getAttribute('data-id'), 10)
          if (score.option === 0) {
            score.player = this.player2
          }
          if (score.option === 1) {
            score.player = this.player1
          }
        }
      }

      console.log(e)
      // this.API('POST', "score="+JSON.stringify(score))
      this.resetAll()
    },

    hideElement: function(element, defaultClasses) {
      element.className = defaultClasses + ' hide'
    },

    resetAll: function() {
      this.deselect('peg', 'active')
      this.deselect('goal-option', 'selected')
      this.toggle.className = "goal-type collapse"
      this.showOptions = false
    },

    select: function(e) {
      if (e.target !== e.currentTarget) {
        var classString = e.target.getAttribute('class')
        var object = 'goalOption'
        var efaultClass = 'goal-option'
        var activeClass = 'selected'

        if (classString && classString.indexOf('peg') > -1) {
          object = 'peg'
          efaultClass = 'peg'
          activeClass = 'active'
        }

        // close options if you click a peg
        if (this.showOptions && object === 'peg') {
          this.resetAll()
        }
        // deselect any selected element and return ID
        var oldId = this.deselect(efaultClass, activeClass)
        // get the ID of the current element
        var id = e.target.getAttribute('data-id')

        // only select element if it was not just deselected
        if (oldId != id) {
          e.target.className = efaultClass+' '+activeClass
        }
        e.stopPropagation()
      }
    },

    deselect: function(defaultClass, activeClass) {
      var id = null
      var removeActive = document.getElementsByClassName(activeClass)

      if (removeActive.length) {
        var id = removeActive[0].getAttribute('data-id')
        removeActive[0].className = defaultClass
      }
      return id
    },

    toggleOptions: function() {
      this.deselect('peg', 'active')
      this.deselect('goal-option', 'selected')
      if(this.showOptions) {
        this.toggle.className = "goal-type collapse"
        this.showOptions = false
      } else {
        this.toggle.className = "goal-type"
        this.showOptions = true
      }
    },

    hidePopupText: function() {
      this.popupText.className = 'hide'
      this.popupText.innerHTML = ''
    },

    showPopupText: function(text, background, duration) {
      this.popupText.className = 'popup-text ' + background || ''
      this.popupText.innerHTML = text

      if (duration) {
        setTimeout(this.hidePopupText.bind(this), duration);
      }
    },

    startClock: function() {
      this.clockId = setInterval(this.updateClock.bind(this), 1000);
    },

    updateClock: function() {
      // don't start rendering until game status is active.
      // base clock off the start time somehow
      // this.API('GET',
      //   'score=true'+
      //   '&teamId='+this.teamId+
      //   '&gameId='+this.gameId+
      //   '&startTime='+this.startTime)

      // if game is over
      if (this.gameStatus === false && this.startTime !== false) {
        this.render();
        clearInterval(this.clockId);
      }

      var startTime = new Date().getTime() / 1000
      // console.log(Math.round(this.startTime - startTime))
      // if game is live
      if (this.startTime && this.startTime < startTime) {
        this.time++
        this.render()
      } else if (Math.floor(this.startTime - startTime) <= 3 &&
        Math.floor(this.startTime - startTime) >= 0) {
        this.showPopupText(
          Math.floor(this.startTime - startTime).toString() ,
          '',
          500
        )
      }
    },

    render: function() {
      var mins = ('0'+Math.floor(this.time / 60)).slice(-2)
      var sec = ('0'+this.time % 60).slice(-2)

      this.clock.innerHTML = mins+':'+sec
      this.score1.innerHTML = this.homeScore || 0
      this.score2.innerHTML = this.awayScore || 0
    }
  }

  window.addEventListener("load", function() {
    FastClick.attach(document.body);
    game.init()
  }, false)
})()
