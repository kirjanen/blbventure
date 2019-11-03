const XSIZE = window.innerWidth;
const YSIZE = window.innerHeight;

var c = document.getElementById("theGame");
c.width = XSIZE - 4;
c.height = YSIZE - 4; 

var ctx = c.getContext("2d");
ctx.font = "32px Courier";


/*********************** initialize images *********************/

var imageNames = [
        "naama", "nurmi", "kivi", "arkku1", "arkku2", "arkku3", "vesi", "raha", 
        "puumiekka", "ametystmiekka", "bronssimiekka", "kivimiekka", 
        "sateenkaarimiekka", "smaragdimiekka" ];

var images = {};


for (i = 0; i < imageNames.length; i++) {
  const name = imageNames[i];
  var img = images[name] = new Image();
  img.onload = function () { this.readyToUse = true; }
  img.src = "./images/" + name + ".png";
}

/*********************** Item class *********************/

class ItemClass {

  constructor(name,img) {
    this.name = name;
    this.img = img;
  }

  create() {
    return new Item(this);
  }
}

const itemClasses = {
  raha: new ItemClass("raha", images.raha),
  puumiekka: new ItemClass("puumiekka", images.puumiekka),
  kivimiekka: new ItemClass("kivimiekka", images.kivimiekka),
  smaragdimiekka: new ItemClass("smaragdimiekka", images.smaragdimiekka),
  ametystmiekka: new ItemClass("ametystmiekka", images.ametystmiekka),
  bronssimiekka: new ItemClass("pronssimiekka", images.bronssimiekka),
  sateenkaarimiekka: new ItemClass("sateenkaarimiekka", images.sateenkaarimiekka),
}

class Item {
  constructor(type) {
    this.type = type;
    this.stackSize = 1;
  }

  draw(ctx, pos) {
    ctx.drawImage(this.type.img, pos.x, pos.y);     
  }
}



/********************** Invetory view *******************/

class Inventory {

  constructor(size) {
    this.size = size;
    this.items = [];

    this.xs = 68 * 10 + 16;
    this.ys = 68 * 10 + 16;
    this.xp = XSIZE - 20 - this.xs;
    this.yp = 20;
  }

  add(item) {
    // Increase size of stack if item type is already in this inventory.
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].type === item.type) {
         this.items[i].stackSize += item.stackSize;
         return;
      }
    }
    // New item type in this inventory
    this.items.push(item);
  }

  // Loot all from source inventory to this inventory.
  loot(src) {    
    for (var i = 0; i < src.items.length; i++) {
      this.add(src.items[i]);      
    }
    src.items.length = 0;
  }

  getItemPos(index, pos) {
    pos.x = 68 * (index % 10) + this.xp + 8;
    pos.y = 68 * Math.floor(index / 10) + this.yp + 8;	
  }

  draw(ctx) {
    var pos = {x:0, y:0};
    ctx.fillStyle = "#777";
    ctx.fillRect(this.xp, this.yp, this.xs, this.ys);

    for (var i = 0; i < 100; i++) {
      this.getItemPos(i, pos);
      ctx.fillStyle = "#000";
      ctx.fillRect(pos.x, pos.y, 64, 64);         
      if (i < this.items.length) {
        // Draw item
	this.items[i].draw(ctx, pos);

        // Draw stack size, if more than 1 items of that type.
        if (this.items[i].stackSize > 1) {
          ctx.fillStyle = "#EEE";
          ctx.font = "18px Courier";
          ctx.fillText("" + this.items[i].stackSize, pos.x + 2, pos.y + 16);
        }
      }
    }
  }
}

/*********************** Initialize player *********************/

var mousePos = {
  x: 400,
  y: 400
}

var player = {
  img:    images.naama,
  pos:    {x:0, y:0},
  target: {x:0, y:0},
  move:   false
}


player.inventory = new Inventory();
player.inventory.add( itemClasses.raha.create() );
player.inventory.add( itemClasses.puumiekka.create() );


/*********************** structure class *********************/

class StructureClass {
  constructor(img,inventorySize,rarity,lootProp) {
    this.img = img;
    this.inventorySize = inventorySize;
    this.rarity = rarity;
    this.lootProp = lootProp;
  }
}

const structureClasses = {

  kivi:   new StructureClass(images.kivi, 0, 10, []),

  arkku1: new StructureClass(images.arkku1, 4, 100, [
                 {type: itemClasses.raha,             prop: 10000}, 
                 {type: itemClasses.puumiekka,        prop: 500}, 
                 {type: itemClasses.kivimiekka,       prop: 200}]),

  arkku2: new StructureClass(images.arkku2, 8, 300, [
                 {type: itemClasses.raha,             prop: 50000}, 
                 {type: itemClasses.kivimiekka,       prop: 400},
                 {type: itemClasses.smaragdimiekka,   prop: 100},
                 {type: itemClasses.bronssimiekka,    prop: 150}]),


  arkku3: new StructureClass(images.arkku3, 16, 1000, [
                 {type: itemClasses.raha,             prop: 250000}, 
                 {type: itemClasses.smaragdimiekka,   prop: 100},
                 {type: itemClasses.sateenkaarimiekka,prop: 50},
                 {type: itemClasses.smaragdimiekka,   prop: 100},
                 {type: itemClasses.bronssimiekka,    prop: 200}]),
};


class Structure {

  constructor(pos,type) {
    this.type = type;
    this.pos = pos;

    // Create inventory for object if needed.
    if (type.inventorySize > 0) {
      this.inventory = new Inventory(type.inventorySize);
      
      // Add loot to the inventory of this structure.
      for (var i = 0; i < type.lootProp.length; i++) {
        if (type.lootProp[i].prop > Math.random() * 1000) {  
          const item = type.lootProp[i].type.create();          
          if (type.lootProp[i].prop > 1000)
            item.stackSize = 1 + Math.floor(type.lootProp[i].prop * Math.random() / 1000);          
          this.inventory.add(item);
        } 
      }
    }
  }

  addToInventory(item) {
    this.inventory.add(item);
  }
}

/*********************** Generate sructures *********************/

function getRandomPos() {
  const areaSize = 10000;
  return {
    x: areaSize * Math.random() - areaSize / 2,
    y: areaSize * Math.random() - areaSize / 2
  };    
}

var stuctures = [];

for (var name in structureClasses) {
  const type = structureClasses[name];
  const count = 5000 / type.rarity;
  for (i = 0; i < count; i++) {
    stuctures.push(new Structure(getRandomPos(), type));     
  }
}


/*********************** Generate landscape *********************/

const landRandom1 = (Math.random() * 100) + 250;
const landRandom2 = (Math.random() * 100) + 250;
const landRandom3 = (Math.random() * 200) + 500;
const landRandom4 = (Math.random() * 200) + 500;

function isLakeInPos(pos)
{
   var a = Math.sin(pos.x / landRandom1) + 
           Math.sin(pos.y / landRandom2) + 
           Math.sin(pos.x / landRandom3) + 
           Math.sin(pos.y / landRandom4);
   if (a < 0)
     return true;
   else
     return false;
}


function countDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;  
  return Math.sqrt(dx*dx + dy*dy);
}


/*********************** Animate *********************/

var lastStepTime = 0;

function step(timestamp) {

  const timeDiff = timestamp - lastStepTime;
  lastStepTime = timestamp;

  player.target = { x: player.pos.x + mousePos.x - XSIZE/2, y: player.pos.y + mousePos.y - YSIZE/2 };

  var dx = player.target.x - player.pos.x;
  var dy = player.target.y - player.pos.y;
  var vx = dx / 20.0;
  var vy = dy / 20.0;

  if (player.move) {
    player.pos.x += vx;
    player.pos.y += vy;
  }

  // Collision detection
  for (i = 0; i < stuctures.length; i++) {
    var item = stuctures[i];
    if (item.inventory) {
      const r = countDistance(player.pos, item.pos);
      if (r < 60) {
        item.hide = true;
        player.inventory.loot(item.inventory);
        item.inventory = null;
      }
    }
  }
  
  var transform = {
    x : XSIZE / 2 - player.pos.x, 
    y : YSIZE / 2 - player.pos.y
  }

  // Draw scene
  if ((images.nurmi.readyToUse == true) && (images.vesi.readyToUse == true))
  {
    for (x = -1*(XSIZE / 2 / 80); x <= 1 + (XSIZE / 2 / 80); x++) {
      for (y = -1*(YSIZE / 2 / 80); y <= 1 + (YSIZE / 2 / 80); y++) {
        var point = { 
          x: Math.floor(player.pos.x / 80) * 80 + x * 80, 
          y: Math.floor(player.pos.y / 80) * 80 + y * 80, 
        }

	const image = isLakeInPos(point) ? images.vesi : images.nurmi;
        ctx.drawImage(image, point.x + transform.x, point.y + transform.y);
      }
    }
  }

  // Draw the player
  if (player.img.readyToUse == true)
    ctx.drawImage(player.img, player.pos.x - 40 + transform.x, player.pos.y - 40 + transform.y);

  // Draw objects
  for (i = 0; i < stuctures.length; i++) {
    var item = stuctures[i];
    if ((item.type.img.readyToUse == true) && (item.hide != true)) {
      ctx.drawImage(item.type.img, item.pos.x - 40 + transform.x, item.pos.y - 40 + transform.y);
    }
  }

  // Draw some info text
  ctx.fillText("X=" + Math.round(player.pos.x) + " Y=" + Math.round(player.pos.y), 40, 40);
  ctx.fillText(Math.round(10000.0 / timeDiff) / 10 + "FPS", 40, 70);

  // Draw inventory
  player.inventory.draw(ctx); 

  window.requestAnimationFrame(step); 
}


function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

c.addEventListener('mousemove', 
  function(evt) {
    mousePos = getMousePos(c, evt);    
  }, false);

c.addEventListener("mousedown", function(evt) {    
    player.move = true;
  }, false);

c.addEventListener("mouseup", function(evt) {    
    player.move = false;
  }, false);


window.requestAnimationFrame(step);

