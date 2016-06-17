<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" type="text/css" href="pegMap.css">
  <link href='https://fonts.googleapis.com/css?family=Inconsolata:400,700' rel='stylesheet' type='text/css'>
</head>
<body>
  <div class="container">
    <div class="field blue">
      <div class="group">
        <div class="peg" data-value="0" id="1">
        </div>
      </div>
      <div class="group">
        <div class="peg" data-value="0" id="2">
        </div>
        <div class="peg" data-value="0" id="3">
        </div>
      </div>
      <div class="group">
        <div class="peg" data-value="0" id="4">
        </div>
        <div class="peg" data-value="0" id="5">
        </div>
        <div class="peg" data-value="0" id="6">
        </div>
        <div class="peg" data-value="0" id="7">
        </div>
        <div class="peg" data-value="0" id="8">
        </div>
      </div>
      <div class="group">
        <div class="peg" data-value="0" id="9">
        </div>
        <div class="peg" data-value="0" id="10">
        </div>
        <div class="peg" data-value="0" id="11">
        </div>
      </div>
    </div>
  </div>
  <script type='application/javascript'>
    (function () {
      var pegMap = {
        // dfdfdf
        player: window.location.search.replace(/\?.*=/, "") || '',

        init: function() {
          this.API('GET', 'init=true')
        },

        API: function(method, data) {
          var httpRequest = new XMLHttpRequest()

          if (!httpRequest) {
            return false;
          }

          httpRequest.onreadystatechange = this.handleResponse.bind(this, httpRequest)
          httpRequest.open(method, '../stats/'+this.player, true)
          httpRequest.send()
        },

        handleResponse: function(httpRequest) {
          if (httpRequest.readyState === XMLHttpRequest.DONE) {
            var response = JSON.parse(httpRequest.responseText)

            var keys = Object.keys( response.pegs )
            var values = keys.map(function ( key ) { return response.pegs[key]; })
            var max = Math.max.apply( null, values )

            this.renderPegMap(max, values, keys)
          }
        },

        renderPegMap: function(max, values, keys) {
          for (var i = 0; i < keys.length; i++) {
            var peg = document.getElementById(keys[i])
            var percent = parseInt(values[i])/max*40

            peg.setAttribute('data-value', values[i])
            peg.style.padding = percent+"px"
            peg.style.background = "#6BB6E8"
          }
        }
      }

      window.addEventListener("load", function() {
        pegMap.init()
      }, false)

    })()
  </script>
</body>
</html>
