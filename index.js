//Il s'agit ici d'un "nombre magique" déclaré en constante car notre image dans le répertoire res possède 18 fruits différents
const PAIRES = 18;
//10 minutes en millisecondes, JS demande généralement des temps en millisecondes, pas en secondes
const DELAI = 60*10*1000;
//const DELAI = 5*1000;

//Création d'une variable globale contenant le tableau du jeu
let board = new Array(); //on peut aussi utiliser = [];

//Création d'une variable globale qui contient le dernier clic
let carteCliquee = null;

//Pour éviter qu'on ait une action pendant une action de flip de carte
let actionEnCours = false;

//Contient le score du joueur
let score = 0;

//Le temps restant au joueur pour gagner
let timerDelay = new Date(DELAI);

//L'objet contenant le timer qui se déclenche en thread secondaire
let timer;

function initialiser() {
	//Initialiser les variables
	board = new Array();
	carteCliquee = null;
	actionEnCours = false;
	score = 0;
	timerDelay = new Date(DELAI);
	
	//Initialisation du tableau
	for (let i=0; i<PAIRES; i++) {
		//On ajoute 2 fois chaque élément car ils vont par pair dans le jeu du Memory
		board.push(i);
		board.push(i);
	}
	
	//Melanger le tableau
	board = melangeTableau(board);
	
	//Initialiser le timer qui chaque seconde enlève une seconde au chronomètre
	timer = setInterval(function(){
		timerDelay.setSeconds(timerDelay.getSeconds()-1);
		
		//rendu
		$("#timer").html(timerDelay.getMinutes()+":"+timerDelay.getSeconds());
		
		//Test de la défaite
		defaite();
	}, 1000);
}

function defaite() {
	if ((timerDelay.getMinutes() === 0) && (timerDelay.getSeconds() === 0)) {
		//Il ne reste plus de temps
		if (score < PAIRES) {
			//le score est inférieur au nombre de paires, c'est perdu
			
			//Arrêt du timer
			clearTimeout(timer);
			
			alert("Perdu !");
			
			//Retour au menu principal
			$("#splash-menu").fadeIn();
		}
	}
}

function victoire() {
	if (score >= PAIRES) {
		//Arrêt du timer
		clearTimeout(timer);
		
		//envoi du temps à l'API serveur
		$.ajax({
			url: "api.php",
			data: {
				result: (timerDelay.getMinutes()*60+timerDelay.getSeconds())
			},
			method: "POST"
		}).done(function(){
			//Rafraichissement du leaderboard
			renderLeaderboard();
		});
		
		//On attend que l'animation de flip soit terminée en ajoutant un délai
		setTimeout(function(){
			alert("A winner is you");
			
			//Retour au menu principal
			$("#splash-menu").fadeIn();
		}, 400);
	}
}

function melangeTableau(tableau) {
	let tableauTrie = new Array();
	
	//On boucle sur chacun des éléments du tableau passé en paramètre
	for (let i=0; i<tableau.length; i++) {
		//Pour mélanger, on va recréer un autre tableau et ajouter aléatoirement chaque élément du tableau existant
		let positionAleatoire = Math.floor(Math.random()*tableauTrie.length);
		tableauTrie.splice(positionAleatoire, 0, tableau[i]);
	}
	
	return tableauTrie;
}

function renderLeaderboard() {
	//Récupération du score par l'API
	$.ajax({
		url: "api.php",
		data: {
			results: ""
		},
		method: "GET",
		dataType: "JSON"
	}).done(function(resultats){
		//construction du résultat HTML
		let html = "";
		
		for (i=0; i<resultats.length; i++) {
			html += "<li>"+resultats[i]+"</li>";
		}
		
		//Affichage dans le leaderboard
		$("#leaderboard").html(html);
	});
}

function renderGame() {
	//On nettoie le tableau
	$("#board").html("");
	
	//On utilise une boucle forEach qui appelle une fonction anonyme sur chacun des éléments du tableau
	board.forEach(function(item, index){
		//On ajoute des éléments dans le DOM
		let html = '<div id="'+index+'" data-numero="'+item+'">';
		html += '<div class="front carte-cachee"></div>';
		html += '<div class="back fruits fruit-'+item+'"></div>';
		html += '</div>';
		$("#board").append(html);
	});
	
	//Pour tous les enfants de l'élément #board, on initialise la librairie flip
	$("#board > *").flip({
		axis: 'x',
		speed: 300,
		trigger: 'click'
	});
	
	//Pour tous les enfants de l'élément #board (les cartes), on ajoute un événement de clic
	$("#board > *").click(function(){
		clicCarte($(this));
	});
}

function renderBarre() {
	//Calcul du %age de progression
	let progression = Math.round(score*100/PAIRES);
	//On se sert d'un CSS gradient pour faire le rendu de la barre
	$("#progress").css("background-image", "linear-gradient(to right, red "+progression+"%,white "+progression+"%, white)");
}

function clicCarte(objet) {
	//On évite le spam de clics
	if (actionEnCours) {
		$(objet).flip(false);
		return;
	}
	
	//on evite le clic sur la même carte
	if ($(objet).is(carteCliquee)) {
		$(objet).flip(true);
		return;
	}
	
	//on evite le clic sur une carte déjà trouvée
	if ($(objet).hasClass("trouve")) {
		$(objet).flip(true);
		return;
	}
	
	
	if (carteCliquee === null) {
		//On n'a pas encore cliqué sur une carte
		carteCliquee = objet;
	} else {
		//On a déjà cliqué sur une première carte
		if ($(carteCliquee).data("numero") !== $(objet).data("numero")) {
			//Les deux cartes sont différentes
			
			//Une action est en cours, on évite ainsi le spam de clics
			actionEnCours = true;
			
			//On attend 1s pour laisser le temps à l'animation de se jouer
			setTimeout(function(){
				//On flip les deux cartes à nouveau
				$(carteCliquee).flip(false);
				$(objet).flip(false);
				
				//On réinitialise la première carte cliquée
				//Ca doit être fait dans le callback du timeout pour éviter de perdre l'information avant l'appel du callback
				carteCliquee = null;
				
				//On autorise a nouveau les actions
				actionEnCours = false;
			}, 1000);
		} else {
			//Les deux cartes sont similaires, on augmente le score
			score++;
			renderBarre();
			
			//On ajoute une classe trouvé
			$(objet).addClass("trouve");
			$(carteCliquee).addClass("trouve");
			
			//On réinitialise la première carte cliquée
			carteCliquee = null;
			
			//On teste la condition de victoire
			victoire();
		}
	}
}

/* Lorsque le document est prêt,
c'est à dire lorsque tout le HTML est chargé
on lance la fonction anonyme JQuery
afin de ne pas attribuer des événements JQ sur des éléments HTML non existants */
$(function(){
	//Affichage du leaderboard
	renderLeaderboard();
	
	//On ajoute les clics
	$("#start").click(function(){
		//On initialise le plateau de jeu
		initialiser();
		//On fait le rendu
		renderGame();
		
		//Le fadeout est plus esthétique qu'un hide()
		$("#splash-menu").fadeOut();
	});
	
	$("#cheat").click(function(){
		//Easter egg
		alert("C'est pas beau de tricher !");
		window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
	});
	
});