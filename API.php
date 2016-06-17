<?php

$http = $_SERVER['REQUEST_METHOD'];

include '/database.php';

if ($http === 'GET') {

  if ($_GET['init']) {

    // close any inactive games
    mysql_query("UPDATE `games`
      SET `cancelled` = 1
      WHERE `start` = 0
      AND `created_at` < NOW() - INTERVAL 2 MINUTE");

    // get all active players
    $players = [];
    $db = mysql_query("SELECT `id`, `name` FROM `players` WHERE `active` = 1");
    while($playerArr = mysql_fetch_array($db)) {
      $players[$playerArr['id']] = $playerArr['name'];
    }

    // check if there is an active game
    $db = mysql_query("
      SELECT
        `games`.`id`,
        COUNT(`teams`.`id`) as teams,
        `goals`.`team_id`,
        `teams`.`team`
      FROM `games`
        LEFT JOIN `teams`
        ON `teams`.`game_id` = `games`.`id`
        LEFT JOIN `goals`
        ON `goals`.`game_id` = `games`.`id`
      WHERE `end` = 0
      AND `cancelled` = 0
    ");
    $game = mysql_fetch_array($db);

    // if there a game
    // if a team is in the game, set the joining team's colour
    if ($game['teams'] === '1') {
      $team = ($game['team'] === 'red' ? 'blue' : 'red');
    } else {
      $team = false;
    }

    $response = [
      "team" => $team,
      "players" => $players,
      'init' => true,
    ];

    echo json_encode($response);
  }

  if ($_GET['gameId']) {
    $response = ['game' => true];

    # if the user does not have a start time, check if
    # the current game has a set start time
    if ($_GET['startTime'] == 'false') {
      # check database for start time if it's not set on the front end
      $db = mysql_query(
        "SELECT `start` FROM `games` WHERE `start` != 0 AND `id` = " . intval($_GET['gameId'])
      );
      $game = mysql_fetch_array($db);
      # pass back time in timestamp
      $response['startTime'] = strtotime($game['start']);
    } else {
      # if the start time is set

      # select all goals from the game, by team
      $db = mysql_query("SELECT COUNT(`id`) as goals, `team_id` FROM `goals` WHERE `game_id` = ".$_GET['gameId']." GROUP BY `team_id`");

      # generate scores and check for winner
      while ($result = mysql_fetch_array($db)) {
        if ($result['team_id'] == $_GET['teamId']) {
          $response['homeScore'] = $result['goals'];
        } else {
          $response['awayScore'] = $result['goals'];
        }
        if (intval($result['goals']) >= 10) {
          mysql_query(
            "UPDATE `games` SET `end` = NOW() WHERE `id` = ".intval($_GET['gameId'])
          );
          $response['gamoOver'] = true;
        }
      }
    }

    echo json_encode($response);
  }
}

if ($http === 'POST') {
  header("HTTP/1.1 201 Created");

  # if game information
  if ($_POST['team']) {
    $json = json_decode($_POST['team']);
    $response = [];

    // check database for game, if true, set team to opposite colour
    $db = mysql_query("
      SELECT
        `games`.`id` as gameId,
        COUNT(`teams`.`id`) as teams,
        `teams`.`team`
      FROM `games`
        LEFT JOIN `teams`
        ON `teams`.`game_id` = `games`.`id`
      WHERE `end` = 0
      AND `cancelled` = 0
    ");
    $game = mysql_fetch_array($db);

    if ($game['gameId']) {
      if ($game['teams'] !== '2') {
        # create team and add them to game
        mysql_query("INSERT INTO `teams`(`game_id`, `offence_player_id`,  `defence_player_id`,   `team`) VALUES
                              (".$game['gameId'].",  $json->offencePlayer, $json->defencePlayer, '$json->colour')");
        $teamId = mysql_insert_id();

        # if we are creating the 2nd team. Start the game
        if ($game['teams'] === '1') {
          $time = date('Y-m-d H:i:s', strtotime("+10 seconds"));

          mysql_query("UPDATE `games` SET `start` = '$time' WHERE `id` = ".$game['gameId']);
          $response['status'] = true;
        }

        $response['teamId'] = $teamId;
        $response['gameId'] = $game['gameId'];
      } else {
        # if the game is full return false
        $response['game'] = false;
      }
    } else {
      # if there is no game
      # create game
      mysql_query("INSERT INTO `games`() VALUES ()");
      $gameId = mysql_insert_id();

      # create team and add them to game
      mysql_query("INSERT INTO `teams`(`game_id`, `offence_player_id`, `defence_player_id`, `team`) VALUES
                                      ($gameId,   $json->offencePlayer, $json->defencePlayer, '$json->colour')");
      $teamId = mysql_insert_id();

      $response['teamId'] = $teamId;
      $response['gameId'] = $gameId;
      $response['status'] = false;
    }

    echo json_encode($response);
  }

  # if goal information
  if ($_POST['score']) {
    $json = json_decode($_POST['score']);

    // get the totals goals scored by this team
    $db = mysql_query("SELECT COUNT(`id`) as goals
      FROM `goals`
      WHERE `game_id` = $json->gameId
      AND `team_id` = $json->teamId");
    $goals = mysql_fetch_array($db);

    // prevent team from scoring over 10 goals
    if (intval($goals['goals']) >= 10) {
      echo json_encode(['goal' => false]);
      break;
    }

    # set goal type
    $option = 'unknown';
    if ($json->option !== "NULL") {
      $types = ['back_half', 'forward_half', 'own_goal', 'spin_in'];
      $option = $types[$json->option];
    } elseif ($json->peg !== "NULL") {
      $option = 'player';
    }

    # add goal
    mysql_query("INSERT INTO `goals`(`game_id`, `team_id`, `peg_id`, `player_id`, `type`)
                VALUES ($json->gameId, $json->teamId, $json->peg, $json->player, '$option')");

    echo json_encode([
      'goal' => true,
      'homeScore' => intval($goals['goals']) + 1,
    ]);
  }
}

?>
