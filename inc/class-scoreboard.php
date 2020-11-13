<?php

class Scoreboard {
	private $db;
	private $scores;
	
	function __construct()
	{
		//Dans le constructeur de l'objet, on se connecte à la base de données
		$host = "localhost";
		$login = "root";
		$pwd = "";
		$db = "memory";
		$this->db = new mysqli($host, $login, $pwd, $db);
		
		//On crée la table de la base de données si elle n'existe pas - attention, on ne crée pas la base de données elle même !
		$requete = "CREATE TABLE IF NOT EXISTS score (id INT (11) UNSIGNED NOT NULL AUTO_INCREMENT, score TIME NOT NULL, PRIMARY KEY (id))";
		if (!$this->db->query($requete)) {
			//En cas d'erreur de la requête, on arrête l'exécution du code
			var_dump($this->db->error);
			die;
		}
	}
	
	/** Ajoute un score en BDD
	* @param mixed
	* @return bool Résultat de la requête
	*/
	public function addScore($score)
	{
		//Assainissement du paramètre score
		$dateheure = new DateTime();
		$dateheure->setTimestamp(intval($score));
		
		//Préparation de la requête
		$requete = "INSERT INTO score (score) VALUES (?)";
		$stmt = $this->db->prepare($requete);
		$stmt->bind_param("s", $p_score);
		$p_score = $dateheure->format("00:i:s");
		
		//Exécution de la requête
		$result = $stmt->execute();
		
		//Fermeture du statement
		$stmt->close();
		
		return $result;
	}
	
	/** Retourne les 5 meilleurs scores
	*	@return string JSON des meilleurs scores
	*/
	public function getBestScores() : string
	{
		//Préparation de la requête
		$requete = "SELECT score FROM score ORDER BY score DESC LIMIT 0,5";
		$stmt = $this->db->prepare($requete);
		
		//Exécution de la requête
		$stmt->execute();
		
		//Parcours des résultats
		$stmt->bind_result($row_score);
		while ($stmt->fetch()) {
			$this->scores[] = substr($row_score,-5);
		}
		
		//Fermeture du statement
		$stmt->close();
		
		return json_encode($this->scores);
	}
}