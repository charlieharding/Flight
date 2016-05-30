// COLORS
var Colors = {
	purple:0x985AA6,
	blue:0x6B839E,
	green:0x72D67D,
	red:0xD67F72,
	pink:0xA6B5C5,
};

///////////////

// GAME VARIABLES
var game = {
	distance: 0,
	round: 1,
	difficulty: 2,
	speed: .008,
	rate: .000001,
	width: 110,
	height: 90,
	gravity: .6
}
var cam = {
	x: 0,
	y: 60,
	z: 0
}
var player = {};
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var checkPool = [];

// SCENE VARIABLES
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container, aspect, d;
var hemisphereLight, shadowLight;

//
// CREATION FUNCTIONS
//

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
  scene.fog = new THREE.Fog(0xDFE9F2, 0,900);

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
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);

	// Reset the renderer on resize
	window.addEventListener('resize', handleWindowResize, false);
}

function createLights() {
	hemisphereLight = new THREE.HemisphereLight(0xcad5e3,0x070a0d, .8)
	//shadowLight = new THREE.DirectionalLight(0xf3e8ff, .8);
	shadowLight = new THREE.DirectionalLight(0xDD3B1E3, .7);
	ambientLight = new THREE.AmbientLight(0xB8BBBF, .5);
	
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
}

function createCheckHolder(){
	checkHolder = new checkHolder();
	var numChecks = 10 + game.round * game.difficulty
	var angle = Math.PI*2 / numChecks
	for(var i = 0; i < numChecks; i++){
		var a = angle*i
		createCheck(a, i);
	}
}

function createCheck(a, i){
	var z = (Math.random() * (game.width - 20)) - (game.width/2 - 20)
	check = new Check();
	//check.mesh.rotation.z = a
	//console.log(a)
	var height = Math.random()*((game.height - 40) + 20) // How high off the ground to appear
	var width = Math.random()*(game.width) - game.width/2 // How far left/right to appear
	check.mesh.position.y += height + 1010
	check.mesh.position.z += width

	check.mesh.rotation.y = Math.random() * Math.PI*2
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


var checkHolder = function (){
  this.mesh = new THREE.Object3D();
  this.mesh.position.y -= 1000;
  this.mesh.rotation.z = -(Math.PI/5)
  scene.add(this.mesh)
}

var Check = function(){
	var geom = new THREE.TetrahedronGeometry(6,1);
  var mat = new THREE.MeshPhongMaterial({color:Colors.green, transparent:true, opacity:.4, shading:THREE.FlatShading,});
  this.mesh = new THREE.Mesh(geom,mat);
}

var Aim = function(){
	var geom = new THREE.BoxGeometry( 4,4,4,1,1,1 );
	var mat = new THREE.MeshPhongMaterial({color:Colors.purple, shading:THREE.FlatShading});
  this.mesh = new THREE.Mesh(geom,mat);
}

var Ground = function(){
	var geo = new THREE.CylinderGeometry( 1000, 1000, 600, 64 );
  var mat = new THREE.MeshPhongMaterial({color:Colors.blue, shading:THREE.FlatShading});
	this.mesh = new THREE.Mesh( geo, mat );
	this.mesh.receiveShadow = true;
	this.mesh.position.y -= 1000;
	this.mesh.rotation.x += Math.PI/2
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
	var w1 = Math.random() * (val*1 - val/2) + val/2;
	var h2 = Math.random() * (val*1 - val/2) + val/2;
	var w2 = Math.random() * (val*1 - val/2) + val/2;
	var v1 = Math.random() * (val*.2) - val*.1
	var v2 = Math.random() * (val*.1) + val*.1

	this.mesh = new THREE.Object3D();
	var geom1 = new THREE.BoxGeometry( w1,h1,w1);
	geom1.vertices[0].y -= v1;
	geom1.vertices[4].y += v1;
	geom1.vertices[4].x += v2;
	geom1.vertices[4].z += v2;
	var mat1 = new THREE.MeshPhongMaterial({color:Colors.blue});
	var m1 = new THREE.Mesh( geom1, mat1 );
	m1.receiveShadow = true; 
	m1.position.z += (game.width/2) + w1 + Math.random()*(game.width*.1)
	m1.position.y += (1000 + (h1/2)*.9)
	m1.rotation.y += Math.random()*(Math.PI*2)

	this.mesh.add(m1)

	var geom2 = new THREE.BoxGeometry( w2,h2,w2);
	geom2.vertices[0].y -= v1;
	geom2.vertices[4].y += v1;
	geom2.vertices[4].x += v2;
	geom2.vertices[4].z += v2;
	var mat2 = new THREE.MeshPhongMaterial({color:Colors.blue});
	var m2 = new THREE.Mesh( geom2, mat2 );
	m2.receiveShadow = true; 
	m2.position.z -= ((game.width/2) + w2 + Math.random()*(game.width*.1))
	m2.position.y += (1000 + (h2/2)*.9)
	m2.rotation.y += Math.random()*(Math.PI*2)	
	this.mesh.add(m2)
	
}

var Van = function(){
	this.mesh = new THREE.Object3D();
  this.mesh.name = "wing";

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
		//console.log(checkPool[i].mesh.getWorldPosition());
		if(checkPool[i].mesh.getWorldPosition().x < -30 ){
			checkPool[i].mesh.material.color.setHex( Colors.red );
		}
	}
}

function updatePlayer(){
	var yR = player.model.mesh.rotation.y;
	var zP = player.model.mesh.position.z;
	var yP = player.model.mesh.position.y;

	// Update player aim
	if(player.up && player.aim.y < game.height){
		player.aim.y += player.move*0.5
	}
	if(player.down && player.aim.y > 10){
		player.aim.y -= player.move*1.2
	}
	if(player.left && player.aim.x > -(game.width/2 +20)){
		player.aim.x -= player.move
	}
	if(player.right && player.aim.x < game.width/2 +20){
		player.aim.x += player.move
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
    	createCheck();
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

//
// GAME LOOP & INITIALISATION
//

function loop(){
	// Update things
	newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

	updateDistance();
	rotateWorld();
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
	createTerrain();
	createPlayer();
	createCheckHolder();
	document.addEventListener('keydown', handlekeydown, false);
	document.addEventListener('keyup', handlekeyup, false);
	loop();

}

window.addEventListener('load', init, false);
