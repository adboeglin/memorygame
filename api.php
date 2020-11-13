<?php

require_once "inc\class-scoreboard.php";

if (!empty($_POST)) {
	//On traite les données post
	if (isset($_POST['result'])) {
		$scoreboard = new Scoreboard();
		$scoreboard->addScore($_POST['result']);
	}
}

if (!empty($_GET)) {
	if (isset($_GET['results'])) {
		$scoreboard = new Scoreboard();
		echo $scoreboard->getBestScores();
	}
}
