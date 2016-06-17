<?

$dbhost = 'localhost';
$dbuser = 'legacyfr_foos';
$dbpass = 'foos123ABC';
$dbname = 'legacyfr_foos';


$conn = mysql_connect($dbhost, $dbuser, $dbpass) or die ('Error connecting to mysql');
mysql_select_db($dbname);


$db = mysql_query("
  SELECT g.`id`, t.`offence_player_id` as off, t.`defence_player_id` as def, g.`player_id` as play
  FROM `teams` t
    LEFT JOIN `goals` g
    ON g.`team_id` = t.`id`
  WHERE t.`game_id` < 140
  AND t.defence_player_id != t.offence_player_id
  AND g.player_id != ''
  AND g.player_id <100");

echo mysql_num_rows($db),"<br>";

while ($teams = mysql_fetch_array($db)) {

  $off = $teams['off'];
  $def = $teams['def'];
  $play = $teams['play'];
  $id = $teams['id'];

  if ($play != NULL) {
    $newPlayerId = array_diff([$off, $def], [$play]);

    // echo "$off $def $play $newPlayerId $id<br>";
    if (count($newPlayerId) == 1) {
      $test = implode('-', $newPlayerId);
      // mysql_query("UPDATE `goals` SET `player_id` = $test WHERE `id` = $id");
      // echo "$off $def $play UPDATE `goals` SET `player_id` = $test WHERE `id` = $id<br>";
    } else {
      echo "$off $def $play $id <br>";
    }
  }
}

// swap teams UPDATE `teams` SET `offence_player_id`=(@temp:=`offence_player_id`), `offence_player_id` = `defence_player_id`, `defence_player_id` = @temp WHERE `id`

