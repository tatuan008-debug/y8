const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize",()=>{
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
});

/* =====================
GAME STATE
===================== */

let gameStarted = false;
let gamePaused = false;

let score = 0;
let hp = 3;
let gameOver = false;

/* =====================
TIME SYSTEM (SMOOTH)
===================== */

let lastTime = 0;
let deltaTime = 0;

/* =====================
LOAD IMAGES
===================== */

const bgImg = new Image();
bgImg.src = "images/vutru2.jpg";

const playerImg = new Image();
playerImg.src = "images/maybaychiendau-removebg-preview.png";

const enemyImg = new Image();
enemyImg.src = "images/kedich1-removebg-preview.png";

const skillEImg = new Image();
skillEImg.src = "images/kynangE.webp";

const skillRImg = new Image();
skillRImg.src = "images/kynangR.webp";

/* =====================
PLAYER
===================== */

const player = {
x: canvas.width/2 - 50,
y: canvas.height - 120,
width:100,
height:100,
speed:500
};

/* =====================
BOT
===================== */

let bot = null;

/* =====================
COOLDOWN
===================== */

let cooldownE = 0;
let cooldownR = 0;

const cooldownMaxE = 10000;
const cooldownMaxR = 5000;

/* =====================
ARRAYS
===================== */

let bullets = [];
let enemyBullets = [];
let enemies = [];
let keys = {};

/* =====================
INPUT
===================== */

document.addEventListener("keydown",(e)=>{

if(!gameStarted){
if(e.key === "Enter"){
gameStarted = true;
}
return;
}

if(e.key === "Escape"){
gamePaused = !gamePaused;
}

if(gamePaused && e.key.toLowerCase()==="r"){
location.reload();
}

if(gamePaused) return;
if(gameOver) return;

keys[e.key.toLowerCase()] = true;

if(e.code === "Space") shoot();
if(e.key.toLowerCase()==="e") skillE();
if(e.key.toLowerCase()==="r") skillR();

});

document.addEventListener("keyup",(e)=>{
keys[e.key.toLowerCase()] = false;
});

document.addEventListener("mousedown",()=>{
if(!gameStarted){
gameStarted = true;
}
});

/* =====================
SHOOT
===================== */

function shoot(){

bullets.push({
x: player.x + player.width/2 -4,
y: player.y,
width:8,
height:20,
speed:800,
vx:0
});

}

/* =====================
SKILL E
===================== */

function skillE(){

if(Date.now() < cooldownE) return;

cooldownE = Date.now() + cooldownMaxE;

for(let i=-3;i<=3;i++){

bullets.push({
x: player.x + player.width/2,
y: player.y,
width:8,
height:20,
speed:800,
vx:i*150
});

}

}

/* =====================
SKILL R
===================== */

function skillR(){

if(Date.now() < cooldownR) return;

cooldownR = Date.now() + cooldownMaxR;

bot = {
x: player.x -120,
y: player.y,
width:80,
height:80,
speed:300,
time: Date.now() + 3200,
shootTimer:0
};

}

/* =====================
SPAWN ENEMY
===================== */

function spawnEnemy(){

if(!gameStarted) return;
if(gamePaused) return;

enemies.push({
x: Math.random()*(canvas.width-70),
y:-70,
width:70,
height:70,
speed:120 + Math.random()*120,
vx:(Math.random()-0.5)*200,
shootTimer:0
});

}

setInterval(spawnEnemy,1200);

/* =====================
BOT AI
===================== */

function updateBot(dt){

if(!bot) return;

if(Date.now() > bot.time){
bot = null;
return;
}

if(enemies.length === 0) return;

let target = enemies[0];
let minDist = 999999;

enemies.forEach(e=>{

let dx = e.x - bot.x;
let dy = e.y - bot.y;
let dist = Math.sqrt(dx*dx + dy*dy);

if(dist < minDist){
minDist = dist;
target = e;
}

});

let dx = target.x - bot.x;
let dy = target.y - bot.y;

let dist = Math.sqrt(dx*dx + dy*dy);

bot.x += (dx/dist)*bot.speed*dt;
bot.y += (dy/dist)*bot.speed*dt;

bot.shootTimer++;

if(bot.shootTimer % 15 === 0){

bullets.push({
x: bot.x + bot.width/2,
y: bot.y,
width:6,
height:18,
speed:700,
vx:0
});

}

}

/* =====================
UPDATE
===================== */

function update(dt){

if(!gameStarted) return;
if(gamePaused) return;
if(gameOver) return;

/* PLAYER MOVE */

if(keys["a"]) player.x -= player.speed*dt;
if(keys["d"]) player.x += player.speed*dt;
if(keys["w"]) player.y -= player.speed*dt;
if(keys["s"]) player.y += player.speed*dt;

player.x = Math.max(0,Math.min(canvas.width-player.width,player.x));
player.y = Math.max(0,Math.min(canvas.height-player.height,player.y));

/* BULLETS */

bullets.forEach((b,i)=>{

b.y -= b.speed*dt;
b.x += b.vx*dt;

if(b.y < -50) bullets.splice(i,1);

});

/* ENEMY BULLETS */

enemyBullets.forEach((b,i)=>{

b.x += b.vx*dt;
b.y += b.vy*dt;

if(b.y > canvas.height+50) enemyBullets.splice(i,1);

});

/* ENEMIES */

enemies.forEach((e,i)=>{

e.y += e.speed*dt;
e.x += e.vx*dt;

if(e.x < 0 || e.x + e.width > canvas.width){
e.vx *= -1;
}

e.shootTimer++;

if(e.shootTimer % 120 === 0){

let dx = player.x - e.x;
let dy = player.y - e.y;

let dist = Math.sqrt(dx*dx + dy*dy);

enemyBullets.push({

x:e.x+e.width/2,
y:e.y+e.height,
width:6,
height:18,
vx:(dx/dist)*250,
vy:(dy/dist)*250

});

}

if(e.y > canvas.height+100){
enemies.splice(i,1);
}

});

/* BOT */

updateBot(dt);

checkCollision();

}

/* =====================
COLLISION
===================== */

function checkCollision(){

enemies.forEach((e,ei)=>{

if(
player.x < e.x + e.width &&
player.x + player.width > e.x &&
player.y < e.y + e.height &&
player.y + player.height > e.y
){

enemies.splice(ei,1);
hp--;

if(hp<=0){
gameOver=true;
}

}

bullets.forEach((b,bi)=>{

if(
b.x < e.x + e.width &&
b.x + b.width > e.x &&
b.y < e.y + e.height &&
b.y + b.height > e.y
){

enemies.splice(ei,1);
bullets.splice(bi,1);

score++;

document.getElementById("score").innerText="Điểm: "+score;

}

});

});

enemyBullets.forEach((b,bi)=>{

if(
b.x < player.x + player.width &&
b.x + b.width > player.x &&
b.y < player.y + player.height &&
b.y + b.height > player.y
){

enemyBullets.splice(bi,1);
hp--;

if(hp<=0){
gameOver=true;
}

}

});

}

/* =====================
DRAW
===================== */

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.drawImage(bgImg,0,0,canvas.width,canvas.height);

ctx.drawImage(playerImg,player.x,player.y,player.width,player.height);

if(bot){
ctx.drawImage(playerImg,bot.x,bot.y,bot.width,bot.height);
}

bullets.forEach(b=>{
ctx.fillStyle="red";
ctx.fillRect(b.x,b.y,b.width,b.height);
});

enemyBullets.forEach(b=>{
ctx.fillStyle="yellow";
ctx.fillRect(b.x,b.y,b.width,b.height);
});

enemies.forEach(e=>{
ctx.drawImage(enemyImg,e.x,e.y,e.width,e.height);
});

/* HP */

for(let i=0;i<hp;i++){

ctx.fillStyle="red";

ctx.beginPath();
ctx.arc(canvas.width-40-i*40,40,12,0,Math.PI*2);
ctx.fill();

}

drawSkillUI();

/* START SCREEN */

if(!gameStarted){

ctx.fillStyle="rgba(0,0,0,0.7)";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="white";
ctx.font="60px Arial";
ctx.textAlign="center";

ctx.fillText("CHIẾN CƠ HUYỀN THOẠI",canvas.width/2,canvas.height/2-40);

ctx.font="28px Arial";
ctx.fillText("Click chuột hoặc Enter để bắt đầu",canvas.width/2,canvas.height/2+40);

}

/* PAUSE */

if(gamePaused){

ctx.fillStyle="rgba(0,0,0,0.7)";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="white";
ctx.font="60px Arial";

ctx.fillText("TẠM DỪNG",canvas.width/2,canvas.height/2-50);

ctx.font="30px Arial";

ctx.fillText("ESC: Tiếp tục",canvas.width/2,canvas.height/2+20);
ctx.fillText("R: Chơi lại",canvas.width/2,canvas.height/2+60);

}

/* GAME OVER */

if(gameOver){

ctx.fillStyle="rgba(0,0,0,0.7)";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="white";
ctx.font="60px Arial";

ctx.fillText("BẠN ĐÃ THUA",canvas.width/2,canvas.height/2);

ctx.font="30px Arial";

ctx.fillText("F5 để chơi lại",canvas.width/2,canvas.height/2+60);

}

}

/* =====================
SKILL UI
===================== */

function drawSkillUI(){

let size = 60;

let x = 30;
let y = canvas.height - 100;

ctx.drawImage(skillEImg,x,y,size,size);

drawCooldown(x,y,cooldownE,10000);

let x2 = 110;

ctx.drawImage(skillRImg,x2,y,size,size);

drawCooldown(x2,y,cooldownR,5000);

}

function drawCooldown(x,y,end,max){

let remain = end - Date.now();

if(remain <= 0) return;

let percent = remain/max;

ctx.fillStyle="rgba(0,0,0,0.6)";

ctx.beginPath();
ctx.moveTo(x+30,y+30);

ctx.arc(
x+30,
y+30,
30,
-Math.PI/2,
-Math.PI/2 + Math.PI*2*percent,
true
);

ctx.closePath();
ctx.fill();

ctx.fillStyle="white";
ctx.font="14px Arial";
ctx.textAlign="center";

ctx.fillText((remain/1000).toFixed(1),x+30,y+35);

}

/* =====================
GAME LOOP
===================== */

function gameLoop(time){

deltaTime = (time-lastTime)/1000;
lastTime = time;

update(deltaTime);
draw();

requestAnimationFrame(gameLoop);

}

gameLoop();