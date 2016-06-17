(function () {
  var game = {
    //  httpRequest: new XMLHttpRequest(),
    homeScore: 0,
    awayScore: 0,
    defencePlayer: null,
    offencePlayer: null,
    teamId: null,
    gameId: null,
    colour: '',
    startTime: false,
    playerArray: {},

    showOptions: false,
    clockId: undefined,
    time: 0,

    test: window.location.search.replace(/\?.*=/, "") || false,

    init: function() {
      this.cacheDom()
      this.bindEvents()
      this.API('GET', 'init=true')
    },

    cacheDom: function() {
      this.goal = document.getElementById("goal")
      this.options = document.getElementById("options")
      this.container = document.getElementById("container")
      this.start = document.getElementById("start")
      this.restart = document.getElementById("restart")
      this.players = document.getElementById("players")

      this.score1 = document.getElementById("team-1-score")
      this.score2 = document.getElementById("team-2-score")
      this.toggle = document.getElementById("toggle-options")
      this.clock = document.getElementById("clock")
      this.modal = document.getElementById("modal")
      this.header = document.getElementById("header")
      this.field = document.getElementById("field")
      this.selectColour = document.getElementById("select-color")
      this.selectTeamEl = document.getElementById("select-team")
      this.popupText = document.getElementById("popup-text")

      this.playerInput = document.getElementsByClassName("player-input")
    },

    bindEvents: function() {
      this.goal.addEventListener("click", this.postScore.bind(this), false)
      this.options.addEventListener("click", this.toggleOptions.bind(this), false)
      this.field.addEventListener("click", this.select.bind(this), false)
      this.players.addEventListener("click", this.select.bind(this), false)
      this.selectColour.addEventListener("click", this.selectTeam.bind(this), false)
      this.start.addEventListener("click", this.postTeams.bind(this), false)
      this.restart.addEventListener("click", this.restartGame.bind(this), false)
    },

    /* API methods */
      API: function(method, data) {
        var httpRequest = new XMLHttpRequest()

        if (!httpRequest) {
          alert('Giving up :( Cannot create an XMLHTTP instance');
          return false;
        }
        this.console('API '+method+': ' + data)

        if (this.test) {
          data = data + "&test=true"
        }

        httpRequest.onreadystatechange = this.handleResponse.bind(this, httpRequest)
        if (method === 'GET') {
          httpRequest.open(method, '/foos/API.php?'+data, true)
          httpRequest.send()
        }
        if (method === 'POST') {
          httpRequest.open(method, '/foos/API.php', true)
          httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
          httpRequest.send(data)
        }
      },

      handleResponse: function(httpRequest) {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {

          var response = JSON.parse(httpRequest.responseText)

          this.console('API response: '+ httpRequest.responseText)
          // GET response
          if (httpRequest.status === 200) {
             // game info
            if (response.init) {
              // set the players, if they are not already
              if (response.players) {
                this.populatePlayers(response.players)
              }
              // if there is a game. set the team color
              // and skip to player selection
              if (response.team) {
                this.selectTeam(null, response.team)
              }
            }

            // live game info
            if (response.game) {
              // if away team scored a goal
              if (response.awayScore !== undefined && this.awayScore !== response.awayScore) {
                this.awayScore = response.awayScore

                this.renderScore()
                this.showPopupText(
                  'GOAL!',
                  '',
                  1500
                )
              }

              // if start time is set
              if (response.startTime) {
                this.startTime = parseInt(response.startTime, 10)
                this.console(this.startTime, new Date().getTime())
                this.hidePopupText()
              }

              // if game is over
              if (response.gamoOver) {
                this.endGame()
              }
            }
          }

          // POST response
          if (httpRequest.status === 201) {
            // initial post response
            // this starts the game
            if (response.teamId) {
              this.teamId = response.teamId
              this.gameId = response.gameId

              this.showPopupText(
                'Waiting for challenger...',
                'background',
                null
              )
              // hide modal and team selection
              this.hideElement(this.modal, 'modal')
              this.hideElement(this.selectTeamEl, 'teams')

              // show field
              this.header.className = "header"
              this.field.className = "field"

              // start server polling
              this.startGame()
            }

            // if you just scored a goal
            if (response.goal) {
              this.homeScore = response.homeScore

              this.renderScore()
              // we don't need to show the goal message if
              // the game is over
              if (response.homeScore !== 10) {
                this.showPopupText(
                  'GOAL!',
                  '',
                  1500
                )
              } else {
                this.endGame()
              }
            }

            // if game is live
            if (response.game == false) {
              this.showPopupText(
                'Game already in progress!',
                'background',
                3000
              )
            }
          }

          // error
          if (httpRequest.status > 201) {
            alert('There was a problem with the request.' + this.httpRequest.status)
          }
        }
      },
    /* API methods */

    /* game setup */
      populatePlayers: function(players) {
        this.playerArray = players
        var keys = Object.keys(players)
        var playerDiv = document.getElementById('players')

        console.log(keys, players)
        // loop through players provided by the API then add them
        // to the select boxes
        for (var i = 0; i < keys.length; i++) {
          var child = document.createElement('div');
          child.innerHTML = players[keys[i]]
          child.className = "player"
          child.dataset.id = keys[i];

          playerDiv.appendChild(child)
        }
      },

      selectTeam: function(e, colour) {
        // this method can be called by an event or after API response
        if (e && e.target.classList[0] !== 'colour') {
          return false
        }
        // set team colour
        this.colour = colour || e.target.id
        this.container.className = "container " + this.colour

        // hide colour selection menu
        this.hideElement(this.selectColour, 'teams')
      },
    /* game setup */

    startGame: function() {
      this.clockId = setInterval(this.updateClock.bind(this), 1000);
      this.pollId = setInterval(this.pollAPI.bind(this), 1000);
    },

    endGame: function() {

      // end intervals
      clearInterval(this.clockId)
      clearInterval(this.pollId)

      // hide field and header
      this.hideElement(this.field, '')
      this.hideElement(this.header, '')

      // add final scores to end game screen
      document.getElementById("end-score1").innerHTML = this.homeScore
      document.getElementById("end-score2").innerHTML = this.awayScore

      // show modal and end game screen
      var endGameEl = document.getElementById("end-game")
      this.modal.className = "modal"
      endGameEl.className = "end-game"
    },

    restartGame: function() {
      document.location.reload()
    },

    /* POST data */
      postScore: function() {
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
          score.player = score.peg <= 3 ? this.defencePlayer : this.offencePlayer
        } else {
          // get goal type
          var option = document.getElementsByClassName("selected")
          if (option.length) {
            score.option = parseInt(option[0].getAttribute('data-id'), 10)
            if (score.option === 0) {
              score.player = this.defencePlayer
            }
            if (score.option === 1) {
              score.player = this.offencePlayer
            }
          }
        }

        this.API('POST', "score="+JSON.stringify(score))
        this.resetAll()
      },

      postTeams: function() {
        this.defencePlayer = this.playerInput[0].dataset.id
        this.offencePlayer = this.playerInput[1].dataset.id

        var team = {
          defencePlayer: this.defencePlayer,
          offencePlayer: this.offencePlayer,
          colour: this.colour,
        }

        // post team information to API
        this.API('POST', "team="+JSON.stringify(team))
      },
    /* POST data */

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
      console.log(e)

      // if action is triggered when choosing player
      if (e.toElement.className === 'player') {
        var setInput = null
        var clearInput = null
        var setNumber = null
        var clearNumber = null
        var freeInputs = 0
        var colours = {
          red : ['#B91717', '#670000'],
          blue: ['#266FA0', '#003392'],
        }

        for (var i = 0; i < this.playerInput.length; i++) {
          // check if playing is set in an input
          if (this.playerInput[i].value === e.toElement.innerText) {
            clearInput = this.playerInput[i]
            clearNumber = i
          }

          // get first empty input to populate
          if (this.playerInput[i].value === '' && setInput === null) {
            setNumber = i
            setInput = this.playerInput[i]
          }

          // count number of free inputs
          if (this.playerInput[i].value === '') {
            freeInputs++
          }
        }

        // clear the input that the player was last in, if one exists
        if (clearInput) {
          clearInput.value = ''
          clearInput.dataset.id = ''
          e.target.style.background = 'transparent'
        }

        // set the player unless the player is already in the last free input
        if (clearNumber + 1 < this.playerInput.length && setInput) {
          setInput.value = e.toElement.innerText
          setInput.dataset.id = e.toElement.dataset.id
          e.target.style.background = colours[this.colour][setNumber]
        }
      }

      // if action is triggered when choosing peg or goal option
      if (e.toElement.classList[0] === 'peg' ||
        e.toElement.classList[0] === 'goal-option') {
        console.log('yep!!!')
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
      }

      e.stopPropagation
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

    pollAPI: function() {
      this.API('GET',
        '&teamId='+this.teamId+
        '&gameId='+this.gameId+
        '&startTime='+this.startTime)
    },

    updateClock: function() {
      var startTime = new Date().getTime() / 1000
      // if game is live
      if (this.startTime && this.startTime < startTime) {
        this.time++
      } else if (Math.floor(this.startTime - startTime) <= 3 &&
        Math.floor(this.startTime - startTime) >= 0) {
        this.showPopupText(
          Math.floor(this.startTime - startTime).toString() ,
          '',
          500
        )
      }

      var mins = ('0'+Math.floor(this.time / 60)).slice(-2)
      var sec = ('0'+this.time % 60).slice(-2)

      this.clock.innerHTML = mins+':'+sec
    },

    renderScore: function() {
      this.score1.innerHTML = this.homeScore || 0
      this.score2.innerHTML = this.awayScore || 0
    },

    console: function(log) {
      if (typeof log === "object") {
        var output = JSON.stringify(log)
      } else {
        var output = log
      }
      // console.log(log)
      // var element = document.getElementById('console')
      // element.innerHTML = element.innerHTML + '<br> > ' + output
      // var atBottom = element.scrollHeight - element.clientHeight <= element.scrollTop + 130
      // if(atBottom) {
      //   element.scrollTop = element.scrollHeight
      // }
    }
  }

  window.addEventListener("load", function() {
    FastClick.attach(document.body);
    game.init()
  }, false)
})()
