// COLORS
var Colors = {
	pink: 0xed8a8b,
	pinkGround: 0xb95a84,
	pinkLight: 0xa74f80,
	blue: 0xc7e5fd,
	teal: 0x70b5cc,
	purple: 0x985AA6,
	green: 0x72D67D,
	red: 0xD67F72,
};

///////////////

// GAME VARIABLES
var game = {
	distance: 0,
	time: 0,
	round: 1,
	difficulty: 2,
	speed: .018,
	rate: .000001,
	width: 110,
	height: 90,
	gravity: .6,
	hoopDia: 16
}
var tilt = {
	// Orientaition of the phone
	x: 1, // Beta
	y: 1, // Gamma
	z: 1  // Alpha
}
var isMobile = false;
var cam = {
	x: 0,
	y: 60,
	z: 0
}
var player = {};
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var checkHolder;
var checkPool = [];
var playerVerts = [];
// UI elements
var helpText;	// For mobile debugging
var feedback;	// For mobile debugging
// SCENE VARIABLES
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container, aspect, d;
var hemisphereLight, shadowLight;

//
// CREATION FUNCTIONS
//

function createUI(){
	helpText = document.querySelector('.helpText');
	feedback = document.querySelector('.feedback');
}

function createScene() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	scene = new THREE.Scene();
	
	// Create the camera
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 80;
  nearPlane = 1;
  farPlane = 1000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
   );
  scene.fog = new THREE.Fog(Colors.blue, 0,900);

  // Set camera x based on screen width
  camera.position.x = -110
  camera.position.y = +60
  camera.lookAt(new THREE.Vector3(0,0,0))
	// Create the renderer
	renderer = new THREE.WebGLRenderer({ 
		alpha: true,
		antialias: true 
	});
	renderer.setSize(WIDTH, HEIGHT);
	
	// Enable shadow rendering
	renderer.shadowMap.enabled = true;
	// Add renderer to the DOM
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);

	// Reset the renderer on resize
	window.addEventListener('resize', handleWindowResize, false);
}

function createLights() {
	hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	hemisphereLight.color.setHSL( 0.6, 1, 0.6 );
	hemisphereLight.groundColor.setHSL( 0.095, 1, 0.75 );
	//shadowLight = new THREE.DirectionalLight(0xf3e8ff, .8);
	shadowLight = new THREE.DirectionalLight( 0xffffff, 1 );
	shadowLight.color.setHSL( 0.1, 1, 0.95 );
			
	//shadowLight = new THREE.DirectionalLight(0x6e5b8a, .7);
	//ambientLight = new THREE.AmbientLight(0x5b4e75, .4);
	ambientLight = new THREE.AmbientLight(0x655075, .5);
	
	// Set the direction of the light  
	shadowLight.position.set(200, 500, 250);
	
	// Allow shadow casting 
	shadowLight.castShadow = true

	// define the visible area of the projected shadow
	shadowLight.shadow.camera.left = -100;
	shadowLight.shadow.camera.right = 100;
	shadowLight.shadow.camera.top = 150;
	shadowLight.shadow.camera.bottom = -50;
	shadowLight.shadow.camera.near = 500;
	shadowLight.shadow.camera.far = 700;

	// Define the resolution of the shadow; 
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;
	
	scene.add(ambientLight);
	scene.add(hemisphereLight);
	scene.add(shadowLight);
}

function createGround(){
	ground = new Ground();
	scene.add( ground.mesh );
}

function createPlayer(){
	player.move = 2; // How fast the player can move the aim.
	player.yaw = 0;
	player.roll = 0;
	player.pitch = 0;
	player.showAim = false;
  player.model = new Van();
  player.model.mesh.position.y = +15;
  player.model.mesh.position.x = -40;
  player.aim = {x:player.model.mesh.position.z, y:player.model.mesh.position.y};
  if(player.showAim){createAim();} // Make the player's aim visible
  scene.add(player.model.mesh);
  //var help = new Help();
}

function createCheckHolder(){
	checkHolder = new CheckHolder();
	var numChecks = 10 + game.round * game.difficulty
	var angle = Math.PI*2 / numChecks
	for(var i = 0; i < numChecks; i++){
		var a = angle*i
		createCheck(a, i);
	}
}

function createCheck(a){
	check = new Check();
	var height = Math.random()*((game.height - 50) + 20) + 1024 // How high off the ground to appear
	var width = Math.random()*(game.width) - game.width/2 // How far left/right to appear
	var x = Math.cos(a) * height // Opposite
	var y = Math.sin(a) * height // Adjacent

	check.mesh.position.y += y;
	check.mesh.position.x += x;
	check.mesh.position.z += width;
	check.mesh.rotation.x = Math.PI/2;
	check.mesh.rotation.y += a;   // Rotates the hoop so it's axis is perpendicular to the cylinder

	check.status = false; // Set to true once the hoop has been passed.
	check.passState = 0; 			// State to use to check if the hoop is flown through successfully
	check.angle = a;

	checkPool.push(check)
	checkHolder.mesh.add(check.mesh)
}

function createAim(){
	aim = new Aim();
	aim.mesh.position.x = 10
	aim.mesh.position.z = player.aim.x
	aim.mesh.position.y = player.aim.y
	scene.add( aim.mesh );
}

function createTerrain(){
	ter = new Terrain();
	ter.mesh.position.y = -1000;
	scene.add(ter.mesh);
}

function removeEntity(object) {
   // Remove an object from the scene
   scene.remove( object.mesh );
}

//
// MODELS
//


var CheckHolder = function (){
  this.mesh = new THREE.Object3D();
  this.mesh.position.y -= 1000;
  this.mesh.rotation.z = -(Math.PI/8)
  scene.add(this.mesh)
}

var Check = function(){
  //var geom = new THREE.TetrahedronGeometry(6,1);
  var geom = new  THREE.TorusGeometry( game.hoopDia, 1, 8, 24 );
  var mat = new THREE.MeshPhongMaterial({color:Colors.purple, transparent:true, opacity:.8, shading:THREE.FlatShading,});
  this.mesh = new THREE.Mesh(geom,mat);
}

Check.prototype.passed = function(){
	this.status = false;
	switch(this.passState){
		case 0: 
			checkFeedback('miss', '#D67F72')
		break;
		case 1:
			checkFeedback('average', '#72D67D')
		break;
		case 2:
			checkFeedback('good', '#72D67D')
		break;
		case 3:
			checkFeedback('swish!', '#72D67D')
		break;
	}
}

Check.prototype.reset = function(){
	this.status = true;
	this.passState = 0;
}

var Help = function(){
  var geom = new THREE.BoxGeometry( 100,1,100,1,1,1 );
  var mat = new THREE.MeshPhongMaterial({color:Colors.purple, transparent:true, opacity:.2, shading:THREE.FlatShading,});
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.position.x = -25;
  //this.mesh.position.x = -45;
  this.mesh.position.y = 0;
  this.mesh.rotation.z = Math.PI/2;
  scene.add(this.mesh)
}

var Aim = function(){
	var geom = new THREE.BoxGeometry( 4,4,4,1,1,1 );
	var mat = new THREE.MeshPhongMaterial({color:Colors.purple, shading:THREE.FlatShading});
	this.mesh = new THREE.Mesh(geom,mat);
}

var Ground = function(){
	this.mesh = new THREE.Object3D();

	// Create the river bank terrain
	var geoBank = new THREE.CylinderGeometry( 1000, 1000, 800, 50, 5 );
  var matBank = new THREE.MeshPhongMaterial({color:Colors.pink, shininess: 10, shading:THREE.FlatShading});
	var bank = new THREE.Mesh( geoBank, matBank );
	bank.receiveShadow = true;

	//for(var i = 318; i < 382; i++){
	for(var i = 100; i < 150; i++){
		//geoBank.vertices[i].x -= 50;
		//console.log(geoBank.vertices[i]);
		var ang = ((Math.PI*2) / 50) * (i%50) // Angle that the vertices is at
		var dip = (Math.random()*-20 - 23) // How far inward to move the vertices
		var shift = moveInward(ang, dip)
		var narrow = (Math.random()*20 + 50) 

		//Drop the middle segments down and shift them in.
		geoBank.vertices[i].x += shift.x
		geoBank.vertices[i].z += shift.z
		geoBank.vertices[i].y -= narrow
		geoBank.vertices[i+50].x += shift.x
		geoBank.vertices[i+50].z += shift.z
		geoBank.vertices[i+50].y += narrow

		// Bring the next rows out ward in 
		geoBank.vertices[i-50].y -= 180
		geoBank.vertices[i+100].y += 180

		// Raise the outward area of the cylinder
		var raise = moveInward(ang, 20)
		geoBank.vertices[i-100].x += raise.x
		geoBank.vertices[i-100].z += raise.z
		geoBank.vertices[i-100].y -= 250
		geoBank.vertices[i+150].x += raise.x
		geoBank.vertices[i+150].z += raise.z
		geoBank.vertices[i+150].y += 250

	}

	this.mesh.add(bank)

	//Create the river
	var geoWater = new THREE.CylinderGeometry( 980, 980, 100, 100, 3 );
  var matWater = new THREE.MeshPhongMaterial({color:Colors.teal, transparent:true, opacity:.62, shininess: 60, shading:THREE.FlatShading});
	var water = new THREE.Mesh( geoWater, matWater );

	for(var i = 100; i < 300; i++){
		var ang = ((Math.PI*2) / 50) * (i%50) // Angle that the vertices is at
		var dip = (Math.random() * 6 - 3) // Randomise how much to shift the vertices
		var shift = moveInward(ang, dip)
		geoWater.vertices[i].x += shift.x
		geoWater.vertices[i].z += shift.z
	}

	this.mesh.add(water)
	
	this.mesh.position.y -= 1000;
	this.mesh.rotation.x += Math.PI/2

}

function moveInward(ang, dip){
	// Funtion to move a cylinder vertice relative to the center of the cylinder
	var xVal = Math.sin(ang)*dip
	var zVal = Math.cos(ang)*dip
	var out = {
		x: xVal,
		z: zVal
	}
	return out;
}

var Terrain = function(){
	this.mesh = new THREE.Object3D();
	var density = 4 // Density of terrain (increase number of hills)
	var rough = 150 // Set the scale of the hills
	var num = Math.floor(3142 / rough*density)

	for(var i=0; i<num; i++){
		var right = new Hill(rough);
		right.mesh.rotation.z += (Math.PI*2)/num * i;
		this.mesh.add(right.mesh);
	}

}

var Hill = function(val){
	// Bad duplicate code here, should be replaced by better hill models anyway
	var h1 = Math.random() * (val*1 - val/2) + val/2;
	var w1 = Math.random() * (val*1.2 - val*.8) + val*.8;
	var h2 = Math.random() * (val*1 - val/2) + val/2;
	var w2 = Math.random() * (val*1.2 - val*.8) + val*.8;

	var top = Math.random() * (w1*.2) + w1*.2
	var top2 = Math.random() * (w2*.2) + w2*.2

	this.mesh = new THREE.Object3D();
	var geom1 = new THREE.BoxGeometry( w1,h1,w1);

	// Make a pyramid
	geom1.vertices[4].z += top
	geom1.vertices[1].z += top
	
	geom1.vertices[0].z -= top
	geom1.vertices[5].z -= top

	geom1.vertices[4].x += top
	geom1.vertices[5].x += top

	geom1.vertices[0].x -= top
	geom1.vertices[1].x -= top

	var mat1 = new THREE.MeshPhongMaterial({color:Colors.pink, shininess: 10, shading:THREE.FlatShading});
	var m1 = new THREE.Mesh( geom1, mat1 );
	m1.receiveShadow = true; 
	m1.position.z += (game.width/2) + w1 + Math.random()*(game.width*.1)
	m1.position.y += (1000 + (h1/2)*.9)
	m1.rotation.y += Math.random()*(Math.PI*2)

	this.mesh.add(m1)

	var geom2 = new THREE.BoxGeometry( w2,h2,w2);
	// Make a pyramid
	geom2.vertices[4].z += top2
	geom2.vertices[1].z += top2
	
	geom2.vertices[0].z -= top2
	geom2.vertices[5].z -= top2

	geom2.vertices[4].x += top2
	geom2.vertices[5].x += top2

	geom2.vertices[0].x -= top2
	geom2.vertices[1].x -= top2
	var m2 = new THREE.Mesh( geom2, mat1 );
	m2.receiveShadow = true; 
	m2.position.z -= ((game.width/2) + w2 + Math.random()*(game.width*.1))
	m2.position.y += (1000 + (h2/2)*.9)
	m2.rotation.y += Math.random()*(Math.PI*2)	
	this.mesh.add(m2)
	
}

var Van = function(){
	this.mesh = new THREE.Object3D();
  this.mesh.name = "plane";

  // Body
	var gBody = new THREE.BoxGeometry( 20,4,8,1,1,1 );
	var mBody = new THREE.MeshPhongMaterial({color:Colors.purple, shading:THREE.FlatShading});
	var body = new THREE.Mesh( gBody, mBody );
	body.position.x += 5;
	body.castShadow = true;
	
	gBody.vertices[2].z -= 3;
	gBody.vertices[3].z += 3;
	gBody.vertices[0].x -= 12;
	gBody.vertices[0].z -= 2;
	gBody.vertices[5].z -= 2;
	gBody.vertices[1].x -= 12;
	gBody.vertices[1].z += 2;
	gBody.vertices[4].z += 2;

	this.mesh.add(body);

	// Left Wing
	var gLWing = new THREE.BoxGeometry( 16,3,8,1,1,1 );
	var mLWing = new THREE.MeshPhongMaterial({color:Colors.purple, shading:THREE.FlatShading});
	var lwing = new THREE.Mesh( gLWing, mLWing );
	lwing.position.x += 3;
	lwing.position.z -= 4.6;
	lwing.position.y -= .5;
	lwing.castShadow = true;
	
	gLWing.vertices[0].y -= 2
	gLWing.vertices[1].z += 7
	gLWing.vertices[1].y -= 2.5
	gLWing.vertices[3].z += 7
	gLWing.vertices[4].y -= 2

	this.mesh.add(lwing);

	// Right Wing
	var gRWing = new THREE.BoxGeometry( 16,3,8,1,1,1 );
	var mRWing = new THREE.MeshPhongMaterial({color:Colors.purple, shading:THREE.FlatShading});
	var rwing = new THREE.Mesh( gRWing, mRWing );
	rwing.position.x += 3;
	rwing.position.z += 4.6;
	rwing.position.y -= .5;
	rwing.castShadow = true;
	
	gRWing.vertices[1].y -= 2
	gRWing.vertices[0].z -= 7
	gRWing.vertices[0].y -= 2.5
	gRWing.vertices[2].z -= 7
	gRWing.vertices[5].y -= 2

	this.mesh.add(rwing);

	// Hit box
	var hitGeo = new THREE.BoxGeometry( 20,4,14,1,1,1 );
  var hitMat = new THREE.MeshPhongMaterial({color:Colors.green, transparent:true, opacity:.4, shading:THREE.FlatShading,});
	var hitbox = new THREE.Mesh( hitGeo, hitMat );
	hitbox.position.x += 5
	//this.mesh.add(hitbox);
}

// UI functions

function checkFeedback(text, color){
	feedback.innerHTML = text;
	feedback.style.color = color;

	feedback.style.animation = 'fade .8s';

	time = window.setTimeout(reset, 800);
	function reset() {
		feedback.style.animation = '';
	}
}

//
// UPDATE FUNCTIONS
//

function updateDistance(){
  game.distance += game.speed
  game.speed += game.rate
}

function updateObstacles(){
	checkHolder.mesh.rotation.z += game.speed/10;
	for(i=0; i < checkPool.length; i++){
		var p = checkPool[i].mesh.getWorldPosition();
		if(p.x > 0){
			//checkPool[i].status = true
			checkPool[i].reset();
		}
		if(p.y > 0 && p.x < -25 && p.x > -45){
			if(checkPool[i].status){checkCollision(checkPool[i])}
			//checkPool[i].mesh.material.color.setHex( Colors.red );
		}else if(p.x < -45){
			if(checkPool[i].status){ 
				checkPool[i].passed()
			}
		}
	}
}

function checkCollision(obj){
	//console.log(player.model.mesh.position - obj.mesh.getWorldPosition());
	var diffPos = player.model.mesh.position.clone().sub(obj.mesh.getWorldPosition().clone());
  var d = diffPos.length();	//console.log(checkPool[i].mesh.getWorldPosition());
  if(d <= game.hoopDia/4){
  	//console.log('swish!')
  	obj.passState = 3
  }else if(d > game.hoopDia/4 && d <= game.hoopDia/1.5){
  	//console.log('good')
  	if(obj.passState < 2) obj.passState = 2
  }else if(d > game.hoopDia/1.5 && d < game.hoopDia){
  	//console.log('pass')
  	if(obj.passState < 1) obj.passState = 1
  }else{
  	//console.log('miss')
  }

		//var p = ob.mesh.getWorldPosition();
	//if(checkPool[i].mesh.getWorldPosition().x < -30 ){
	//}
}

function updatePlayer(){
	var yR = player.model.mesh.rotation.y;
	var zP = player.model.mesh.position.z;
	var yP = player.model.mesh.position.y;
	
	// Update player aim
	if(player.up && player.aim.y < game.height){
		player.aim.y += (player.move*0.5) * tilt.y
	}
	if(player.down && player.aim.y > 10){
		player.aim.y -= (player.move*1.2) * tilt.y
	}
	if(player.left && player.aim.x > -(game.width/2 +20)){
		player.aim.x -= player.move*tilt.x
	}
	if(player.right && player.aim.x < game.width/2 +20){
		player.aim.x += player.move*tilt.x
	}
	if(player.showAim){
		aim.mesh.position.z = player.aim.x
		aim.mesh.position.y = player.aim.y
	}

	// Update player model position
	player.model.mesh.position.y += (player.aim.y - yP)*0.08;
	player.model.mesh.position.z += (player.aim.x - zP)*0.08;

	// Rotate player model 
	player.model.mesh.rotation.z = (player.aim.y - yP)*0.04;  // Pitch
	player.model.mesh.rotation.x = (player.aim.x - zP)*0.05;	// Roll
}

function updateCam(){
	// Set the camera to follow players
  cam.y += (player.model.mesh.position.y+10 - cam.y)*0.04;
  cam.z += (player.model.mesh.position.z/2 - cam.z)*0.04;
	camera.lookAt(new THREE.Vector3(cam.x,cam.y,cam.z))
	camera.updateProjectionMatrix();
}

function rotateWorld(){
	ground.mesh.rotation.y += game.speed/10;
	ter.mesh.rotation.z += game.speed/10;
}

function moveWater(){
	for(var i = 100; i < 300; i++){
		var ang = ((Math.PI*2) / 50) * (i%50) // Angle that the vertices is at
		var dip = (Math.random() * 6 - 3) // Randomise how much to shift the vertices
		var shift = moveInward(ang, dip)
		geoWater.vertices[i].x += shift.x
		geoWater.vertices[i].z += shift.z
	}
}

//
// EVENT HANDLERS
//

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handlekeydown(event){
	var keyCode = event.keyCode;
  switch(keyCode){
  	case 87:  // w
  		if(player.up){
    		player.down = false;
     	}
    		player.up = true
    break;
    case 65:  // a
    	if(player.right){
    		player.right = false;
     	}
    		player.left = true
    break;
    case 83:  // s
    	if(player.down){
    		player.up = false;
     	}
    		player.down = true
    break;
    case 68:  // d
   		if(player.left){
    		player.left = false;
     	}
    		player.right = true
    break;
    case 32:  // Space
    	//createCheck(0);
    break;
  }
}

function handlekeyup(event){
	var keyCode = event.keyCode;
  switch(keyCode){
  	case 87:  //w
			player.up = false;
  	break;
    case 65:  //a
    	player.left = false;
    break;
    case 83:  //s
   		player.down = false;
    break;
    case 68:  //d
    	player.right = false;
    break;
  }
}

function handleOrientation(event) {
	var z = event.alpha;  
	var x = event.beta;  
  var y = event.gamma; 

  //helpText.innerHTML = "alpha: " + Math.round(z*100)/100 + "\n";
  //helpText.innerHTML += "beta : " + Math.round(x*100)/100 + "\n";
  //helpText.innerHTML += "gamma: " + Math.round(y*100)/100 + "\n";
  //helpText.innerHTML = "Mobile: " + isMobile + "\n";
    
  if(x > 10 && x < 50){
  	player.right = true;
  	player.left = false;
  	tilt.x = .5 + (x * 0.02) //
  }else if(x < -10 && x > -50){
  	player.right = false;
  	player.left = true;
  	tilt.x = .5 + (-x * 0.02)
  }else{
  	player.right = false;
  	player.left = false;
  	tilt.x = 1
  }

  if(y > -65 && y < -45){
  	player.up = true;
  	player.down = false;
  	tilt.y = (y * -0.05) - 1.5
  }else if(y > -30 && y < -10){
  	player.up = false;
  	player.down = true;
  	tilt.y = (y * 0.05) + 2.0
  }else{
  	player.up = false;
  	player.down = false;
  	tilt.y = 1
  }
}

//
// GAME LOOP & INITIALISATION
//

function loop(){
	// Update things
	newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;
  game.time++;

	updateDistance();
	rotateWorld();
	//moveWater();
	updatePlayer();
  updateCam();
	updateObstacles();
	// Render the scene
	renderer.render(scene, camera);
	requestAnimationFrame(loop);
}

function init() {
	createScene();
	createLights();
	createGround();
	createCheckHolder();
	createTerrain();
	createPlayer();
	createUI();
	document.addEventListener('keydown', handlekeydown, false);
	document.addEventListener('keyup', handlekeyup, false);
	window.addEventListener('deviceorientation', handleOrientation);
	loop();
}

// device detection
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;
window.addEventListener('load', init, false);
