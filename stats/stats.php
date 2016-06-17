<?
// $player = player id

$db = mysql_query("SELECT
  t.offence_player_id as off,
  t.defence_player_id as def,
  t.team,
  COUNT(g.id) as goals
  FROM teams t
    JOIN goals g
    ON g.team_id = t.id
  WHERE
  (t.offence_player_id = $player OR t.defence_player_id = $player)
  AND t.offence_player_id != t.defence_player_id
  GROUP BY t.game_id
");

$db2 = mysql_query("SELECT
  COUNT(id) as goals, peg_id
  FROM `goals`
  WHERE player_id = $player
  GROUP BY peg_id"
);

$stats = [
  'totalGames' => 0,
  'wins' => 0,
  'losses' => 0,
  'totalTeamScore' => 0,
  'offence' => 0,
  'defence' => 0,
  'offenceWins' => 0,
  'defenceWins' => 0,
  'red' => 0,
  'blue' => 0,
  'redWins' => 0,
  'blueWins' => 0,
  'yourGoals' => 0,
  'pegs' => [],
];

while($stat = mysql_fetch_array($db)) {
  $pos = '';
  if ($stat['off'] == $player) {
    $stats['offence'] ++;
    $pos = 'offence';
  } else {
    $stats['defence'] ++;
    $pos = 'defence';
  }

  if ($stat['goals'] >= 10) {
    $stats['wins'] ++;
    $stats[$stat['team'].'Wins']++;
    $stats[$pos.'Wins']++;
  } else {
    $stats['losses'] ++;
  }

  $stats['totalGames']++;
  $stats[$stat['team']]++;
  $stats['totalTeamScore']+= $stat['goals'];
}

while($stat = mysql_fetch_array($db2)) {
  $stats['pegs'][$stat['peg_id']]+= $stat['goals'];
  $stats['yourGoals']+= $stat['goals'];
}

header('content-type: application/json');
echo json_encode($stats);

