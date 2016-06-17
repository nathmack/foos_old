<?

$path = ltrim($_SERVER['REQUEST_URI'], '/');    // Trim leading slash(es)
$elements = explode('/', $path);                // Split path on slashes

$home = array_search('stats', $elements);
$key = intval($home) + 1;

$search = $elements[$key] ? $elements[$key] : '';

include '../database.php';

// get all active players
$players = [];
$db = mysql_query("SELECT `id`, `name` FROM `players` WHERE `active` = 1");
while($playerArr = mysql_fetch_array($db)) {
  $players[$playerArr['id']] = $playerArr['name'];
}

// check if player is in database
// check if key or value is in array so we can get stats with player ID
// echo array_key_exists(5, $test), '<br>';
$player = array_search(strtolower($search), array_map('strtolower', $players));

if($player) {

  // render the stat page with the using $player as the ID
  include 'stats.php';

} else {
  echo "Here is a list of all active players:<br><br>";
  foreach ($players as $key => $value) {
    echo "
      <a href='http://legacyfridays.com.au/foos/stats/$value'>$value</a> <br>
    ";
  }
}


