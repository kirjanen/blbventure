
/*********************** ItemClass *********************/

class ItemClass {

  constructor(name, img) {
    this.name = name;
    this.img = img;
    if (!img) {
      console.log("Item '" + name + "' have invalid image!");
    }
  }

  create() {
    return new Item(this);
  }
}

/*********************** Item  *********************/

class Item {
  constructor(type) {
    this.type = type;
    this.stackSize = 1;
  }

  draw(ctx, pos) {
    ctx.drawImage(this.type.img, pos.x, pos.y);
  }
}


/********************** Invetory  *******************/

class Inventory {

  constructor(size) {
    this.size = size;
    this.items = [];

    this.xs = 68 * 10 + 16;
    this.ys = 68 * 10 + 16;
    this.tmpPos = { x: 0, y: 0 };

    this.bacgroundColor = "#777";
    this.slotColor = "#000";
    this.countTextColor = "#EEE";
    this.countTextFont = "18px Courier";
  }

  getSize() {
    return this.size;
  }

  add(item) {
    // Increase size of stack if item type is already in this inventory.
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].type === item.type) {
        this.items[i].stackSize += item.stackSize;
        this.items[i].stackSizeText = '' + this.items[i].stackSize;
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

  getItemPos(index, pos, xp, yp) {
    pos.x = 68 * (index % 10) + xp + 8;
    pos.y = 68 * Math.floor(index / 10) + yp + 8;
  }

  draw(ctx, xp, yp) {
    var pos = this.tmpPos;
    ctx.fillStyle = this.bacgroundColor;
    ctx.fillRect(xp, yp, this.xs, this.ys);

    ctx.fillStyle = this.slotColor;
    for (var i = 0; i < 100; i++) {
      this.getItemPos(i, pos, xp, yp);
      ctx.fillRect(pos.x, pos.y, 64, 64);
    }

    ctx.fillStyle = this.countTextColor;
    ctx.font = this.countTextFont;
    for (var i = 0; i < this.items.length; i++) {
      this.getItemPos(i, pos, xp, yp);
      // Draw item
      this.items[i].draw(ctx, pos);

      // Draw stack size, if more than 1 items of that type.
      if (this.items[i].stackSize > 1) {
        ctx.fillText(this.items[i].stackSizeText, pos.x + 2, pos.y + 16);
      }
    }
  }
}

/*********************** ObjectBase *********************/

class ObjectBase {
  constructor(img, pos, invSize) {
    this.pos = { x: pos.x, y: pos.y };
    this.img = img;
    this.show = true;
    this.inventory = new Inventory(invSize);
  }

  draw(ctx, transform) {
    if (this.img.readyToUse && this.show) {
      ctx.drawImage(this.img, this.pos.x - this.img.width / 2 + transform.x,
        this.pos.y - this.img.height / 2 + transform.y);
    }
  }

  hide(val) {
    this.show = !val;
  }

  addToInventory(item) {
    this.inventory.add(item);
  }

  distanceTo(obj) {
    const dx = this.pos.x - obj.pos.x;
    const dy = this.pos.y - obj.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isCollision(obj) {
    const dx = this.pos.x - obj.pos.x;
    const dy = this.pos.y - obj.pos.y;
    const r2 = 60 * 60;
    return (r2 >= dx * dx + dy * dy);
  }


  isNear(obj) {
    const dx = this.pos.x - obj.pos.x;
    const dy = this.pos.y - obj.pos.y;
    return (dx > -4000) && (dx < 4000) && (dy > -4000) && (dy < 4000);
  }

  isClose(obj) {
    const dx = this.pos.x - obj.pos.x;
    const dy = this.pos.y - obj.pos.y;
    return (dx > -400) && (dx < 400) && (dy > -400) && (dy < 400);
  }

  loot(obj) {
    this.inventory.loot(obj.inventory);
  }
}

/*********************** Player *********************/

class Player extends ObjectBase {
  constructor(img) {
    super(img, { x: 0, y: 0 }, 50)
    this.target = { x: 0, y: 0 };
    this.move = false;
  }

  setTarget(x, y) {
    this.target.x = x;
    this.target.y = y;
  }

  step(timeDiff) {
    const dx = this.target.x - this.pos.x;
    const dy = this.target.y - this.pos.y;
    const vx = dx / 20.0;
    const vy = dy / 20.0;

    if (this.move) {
      this.pos.x += vx;
      this.pos.y += vy;
    }
  }
}


/*********************** StructureClass *********************/

class StructureClass {
  constructor(img, inventorySize, rarity, lootProp) {
    this.img = img;
    this.inventorySize = inventorySize;
    this.rarity = rarity;
    this.lootProp = lootProp;
  }

  create(pos) {
    return new Structure(pos, this);
  }
}

class Structure extends ObjectBase {

  constructor(pos, type) {
    super(type.img, pos, type.inventorySize);
    this.type = type;

    // Add loot to the inventory of this structure.
    for (var i = 0; i < type.lootProp.length; i++) {
      if (type.lootProp[i].prop > Math.random() * 1000) {
        if (!type.lootProp[i].type)
          console.log("Problem in index: " + type.img.src + " " + i);

        const item = type.lootProp[i].type.create();
        if (type.lootProp[i].prop > 1000)
          item.stackSize = 1 + Math.floor(type.lootProp[i].prop * Math.random() / 1000);
        this.addToInventory(item);
      }
    }
  }
}


/*********************** npcClass *********************/

class NpcClass extends StructureClass {
  constructor(img, inventorySize, rarity, lootProp) {
    super(img, inventorySize, rarity, lootProp);
  }

  create(pos) {
    return new Npc(pos, this);
  }
}

class Npc extends Structure {
  constructor(pos, type) {
    super(pos, type);
    this.vx = 0.0;
    this.vy = 0.0;
  }

  step(timeDiff, player) {
    this.vx = this.vx + Math.random() - 0.5;
    this.vy = this.vy + Math.random() - 0.5;

    // Follow the player if close.
    if (this.isClose(player)) {
      const forceDirection = this.isCollision(player) ? -2 : 1;
      const dx = player.pos.x - this.pos.x;
      const dy = player.pos.y - this.pos.y;
      const r = 1.0 + Math.abs(dx) + Math.abs(dy);
      this.vx += forceDirection * dx / r;
      this.vy += forceDirection * dy / r;
    }

    // reduce speed
    this.vx = 0.999 * this.vx;
    this.vy = 0.999 * this.vy;

    // Limit speed
    if (this.vx * this.vx + this.vy * this.vy > 10.0) {
      this.vx = 0.8 * this.vx;
      this.vy = 0.8 * this.vy;
    }

    this.pos.x += this.vx;
    this.pos.y += this.vy;
  }
}



/*********************** Game *********************/

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.paused = true;
    this.newGame = true;
    
    // Bind function to this object    
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    this.toggleInventory = this.toggleInventory.bind(this);
    this.step = this.step.bind(this);
    this.run = this.run.bind(this);


    this.canvas.addEventListener('mousemove', this.onMouseMove, false);
    this.canvas.addEventListener("mousedown", this.onMouseDown, false);
    this.canvas.addEventListener("mouseup", this.onMouseUp, false);
    
    this.canvas.addEventListener('touchstart', this.onTouchStart, false);
    this.canvas.addEventListener("touchend", this.onTouchEnd, false);
    this.canvas.addEventListener("touchmove", this.onTouchMove, false);    
    
    this.ctx = this.canvas.getContext("2d");
    this.ctx.font = "32px Courier";

    // Create images
    this.images = {};
    this.createImages();

    // Create other members
    this.itemClasses = this.createItemClasses();
    this.objectClasses = this.createObjectClasses();
    this.lastStepTime = 0;
    this.landRandom1 = (Math.random() * 100) + 250;
    this.landRandom2 = (Math.random() * 100) + 250;
    this.landRandom3 = (Math.random() * 200) + 500;
    this.landRandom4 = (Math.random() * 200) + 500;
    this.player = new Player(this.images.naama);
    this.objects = [];
    this.objectsInArea = [];
    this.mousePos = { x: 0, y: 0 };
    this.transform = { x: 0, y: 0 };
    this.tmpPoint = { x: 0, y: 0 };

    this.player.addToInventory(this.itemClasses.raha.create());
    this.player.addToInventory(this.itemClasses.puumiekka.create());

    this.lastAreaUpdateTime = -10000;
    this.showInventory = false;

    // Create random objects of the world
    for (var name in this.objectClasses) {
      const type = this.objectClasses[name];
      const count = 50000 / type.rarity;
      for (var i = 0; i < count; i++) {

        // Get non-lake random location.
        var pos;
        do {
          pos = this.getRandomPos();
        } while (this.isLakeInPos(pos));

        this.objects.push(type.create(pos));
      }
    }
  }

  // ************************ game controls **************************
  
  start() {
    window.requestAnimationFrame(this.run);
  }

  pause() {
    this.paused = true;
  }

  continue() {
    this.newGame = false;
    this.paused = false;
  }


  isButtonPress(x,y) {
    if (this.buttons) {
      for (var i = 0; i < this.buttons.length; i++) {
        const button = this.buttons[i];
        if ((x >= button.xp) && (x <= button.xp + button.xs) && (y >= button.yp) && (y <= button.yp + button.ys)) {
          button.action();
          return true;
        }
      }
    }
    return false;
  }


  // ************************ mouse handlers **************************
  
  onMouseMove(evt) {
    this.mousePos.x = evt.clientX;
    this.mousePos.y = evt.clientY;
  }

  onMouseDown(evt) {    
    this.mousePos.x = evt.clientX;
    this.mousePos.y = evt.clientY;        
    if (this.isButtonPress(this.mousePos.x, this.mousePos.y) != true) {
      this.player.move = true;      
    }    
  }

  onMouseUp(evt) {        
    this.player.move = false;        
    if (this.paused === true) {
      document.getElementById("theGame").requestFullscreen();            
    }
  }

  // ************************ touch screen handlers **************************
    
  setTargetPosByTouch(touches) {
    const touchCount = touches.length;
    if (touchCount > 0) {
      const touch = touches[touchCount - 1];            
      this.mousePos.x = touch.clientX;
      this.mousePos.y = touch.clientY;
    }
  }  
    
  onTouchStart(evt) {
    this.setTargetPosByTouch(evt.touches);
    if (this.isButtonPress(this.mousePos.x, this.mousePos.y) != true) {
      this.player.move = true;      
    }    
  }

  onTouchEnd(evt) {
    this.setTargetPosByTouch(evt.touches);
    this.player.move = false;
    
    if (this.paused === true) {
      document.getElementById("theGame").requestFullscreen();            
    }        
  }

  onTouchMove(evt) {
    this.setTargetPosByTouch(evt.touches);    
  }



  getRandomPos() {
    const areaSize = 100000;
    return {
      x: areaSize * Math.random() - areaSize / 2,
      y: areaSize * Math.random() - areaSize / 2
    };
  }

  // Take periodically nearby objects to this.objectsInArea.
  // This will reduce CPU load.
  getItemsInArea(timestamp) {
    if (timestamp > this.lastAreaUpdateTime + 5000) {
      this.lastAreaUpdateTime = timestamp;
      this.objectsInArea.length = 0;
      const player = this.player;

      for (var i = 0; i < this.objects.length; i++) {
        const item = this.objects[i];
        if (player.isNear(item)) {
          this.objectsInArea.push(item);
        }
      }
    }
  }


  run(timestamp) {   
    this.xsize = this.canvas.width;
    this.ysize = this.canvas.height;    
    
    if(this.paused === true) {
      this.waitingScreen();
    } else {
      this.step(timestamp);
    }
    window.requestAnimationFrame(this.run);
  }

  waitingScreen() {      
    const text1 = "Blob Venture";
    const text2 = (this.newGame === true) ? "Click here to start" : "Click here to continue";
    const text3 = "The Game";
    
    this.ctx.fillStyle = "#000";                
    this.ctx.fillRect(0, 0, this.xsize, this.ysize);        

    this.ctx.font = "48px Arial Bold";        
    this.ctx.fillStyle = "#FFFF33";            
    this.ctx.fillText(text1, this.xsize / 2 - this.ctx.measureText(text1).width / 2 , 50);    

    this.ctx.font = "16px Courier";        
    this.ctx.fillStyle = "#AAAAFF";            
    this.ctx.fillText(text3, this.xsize / 2 - this.ctx.measureText(text3).width / 2 , 70);    


    this.ctx.font = "24px Arial";        
    this.ctx.fillStyle = "#DDD";            
    this.ctx.fillText(text2, this.xsize / 2 - this.ctx.measureText(text2).width / 2 ,120);            
  }

  step(timestamp) {        
    const player = this.player;
    const timeDiff = timestamp - this.lastStepTime;
    this.lastStepTime = timestamp;
    this.getItemsInArea(timestamp);

    player.setTarget(player.pos.x + this.mousePos.x - this.xsize / 2, player.pos.y + this.mousePos.y - this.ysize / 2);
    player.step(timeDiff);

    // Collision detection
    for (var i = 0; i < this.objectsInArea.length; i++) {
      var object = this.objectsInArea[i];
      if (object.step)
        object.step(timeDiff, player);
      if (object.inventory && object.inventory.getSize()) {
        if (player.isCollision(object)) {
          object.hide(true);
          player.loot(object);
        }
      }
    }

    const transform = this.transform;
    transform.x = this.xsize / 2 - player.pos.x,
      transform.y = this.ysize / 2 - player.pos.y

    // Draw scene
    for (var x = -1 * (this.xsize / 2 / 80); x <= 1 + (this.xsize / 2 / 80); x++) {
      for (var y = -1 * (this.ysize / 2 / 80); y <= 1 + (this.ysize / 2 / 80); y++) {

        const point = this.tmpPoint;
        point.x = Math.floor(player.pos.x / 80) * 80 + x * 80;
        point.y = Math.floor(player.pos.y / 80) * 80 + y * 80;
        const image = this.isLakeInPos(point) ? this.images.vesi : this.images.nurmi;
        if (image.readyToUse)
          this.ctx.drawImage(image, point.x + transform.x, point.y + transform.y);
      }
    }

    // Draw objects
    player.draw(this.ctx, transform);
    for (var i = 0; i < this.objectsInArea.length; i++) {
      this.objectsInArea[i].draw(this.ctx, transform);
    }

    // Draw some info text
    //this.ctx.fillText("X=" + Math.round(this.player.pos.x) + " Y=" + Math.round(this.player.pos.y), 40, 40);
    this.ctx.fillText(Math.floor(1000.0 / timeDiff) + "FPS   " + this.objectsInArea.length + "/" + this.objects.length, 40, 70);

    // Draw inventory
    if (this.showInventory === true)
      player.inventory.draw(this.ctx, this.xsize - 20 - player.inventory.xs, 20);
    this.drawCommandBar();
  }
  
  
  toggleInventory() {
    if (this.showInventory === true)
      this.showInventory = false;
    else
      this.showInventory = true;
  }
  
  drawCommandBar() {
    const count = 6;
    const margin = 4;
    const iconSize = 64;
    const h = 2 * margin + iconSize;
    const w = (iconSize + margin) * count + margin;
    const x = (this.xsize / 2) - (w / 2);
    const y = this.ysize - h;

    this.buttons = [];

    this.ctx.fillStyle = "#333";                
    this.ctx.fillRect(x, y, w, h);        

    this.ctx.fillStyle = "#000";
    for (var i = 0; i < count; i++) {
      const xp = x + i * (iconSize + margin) + margin;      
      const yp = y + margin;      
      this.ctx.fillRect(xp, yp, iconSize, iconSize);
      
      this.buttons.push( {
        xp: xp,
        yp: yp,
        xs: iconSize,
        ys: iconSize,
        action: this.toggleInventory
      });      
    }               
  }

  isLakeInPos(pos) {
    const a = Math.sin(pos.x / this.landRandom1) +
      Math.sin(pos.y / this.landRandom2) +
      Math.sin(120 + pos.x / this.landRandom3) +
      Math.sin(80 + pos.y / this.landRandom4) +
      Math.sin(270 + (2 * pos.x + pos.y) / this.landRandom1);
    if (a < 0)
      return true;
    else
      return false;
  }


  createImages() {
    const imageNames = [
      "naama", "nurmi", "kivi", "arkku1", "arkku2", "arkku3", "vesi", "raha",
      "puumiekka", "terasmiekka", "ametystmiekka", "bronssimiekka", "kivimiekka",
      "sateenkaarimiekka", "jaamiekka", "smaragdimiekka", "puukirves", "puukilpi",
      "kivikirves", "pronssikirves", "teraskirves", "teraskilpi", "jaakirves",
      "kivikilpi", "smaragdikirves", "ametystkirves", "sateenkaarikirves",
      "hopeakilpi", "rubiinikilpi", "luontokilpi", "tulivuorikilpi", "obsidiaanikilpi",
      "sphere_monster01", "sphere_monster02", "sphere_monster03", "sphere_monster04",
      "sphere_monster05", "sphere_monster06", "sphere_monster07", "sphere_monster08",
      "sphere_monster09", "sphere_monster10", "sphere_monster11", "sphere_monster12",
    ];

    for (var i = 0; i < imageNames.length; i++) {
      const name = imageNames[i];
      var img = this.images[name] = new Image();
      img.onload = function() { this.readyToUse = true; }
      img.src = "./images/" + name + ".png";
    }
  }

  createItemClasses() {
    const classes = {
      raha: new ItemClass("raha", this.images.raha),
      puumiekka: new ItemClass("puumiekka", this.images.puumiekka),
      kivimiekka: new ItemClass("kivimiekka", this.images.kivimiekka),
      smaragdimiekka: new ItemClass("smaragdimiekka", this.images.smaragdimiekka),
      ametystmiekka: new ItemClass("ametystmiekka", this.images.ametystmiekka),
      bronssimiekka: new ItemClass("pronssimiekka", this.images.bronssimiekka),
      sateenkaarimiekka: new ItemClass("sateenkaarimiekka", this.images.sateenkaarimiekka),
      puukirves: new ItemClass(" puukirves", this.images.puukirves),
      kivikirves: new ItemClass(" kivikirves", this.images.kivikirves),
      teraskirves: new ItemClass(" teraskirves", this.images.teraskirves),
      pronssikirves: new ItemClass("  pronssikirves", this.images.pronssikirves),
      smaragdikirves: new ItemClass(" smaragdikirves", this.images.smaragdikirves),
      jaamiekka: new ItemClass(" jaamiekka", this.images.jaamiekka),
      jaakirves: new ItemClass(" jaakirves", this.images.jaakirves),
      ametystkirves: new ItemClass(" ametystkirves", this.images.ametystkirves),
      sateenkaarikirves: new ItemClass(" sateenkaarikirves", this.images.sateenkaarikirves),
      puukilpi: new ItemClass(" puukilpi", this.images.puukilpi),
      kivikilpi: new ItemClass(" kivikilpi", this.images.kivikilpi),
      teraskilpi: new ItemClass(" teraskilpi", this.images.teraskilpi),
      terasmiekka: new ItemClass(" terasmiekka", this.images.terasmiekka),
      hopeakilpi: new ItemClass(" hopeakilpi", this.images.hopeakilpi),
      rubiinikilpi: new ItemClass(" rubiinikilpi", this.images.rubiinikilpi),
      luontokilpi: new ItemClass(" luontokilpi", this.images.luontokilpi),
      tulivuorikilpi: new ItemClass(" tulivuorikilpi", this.images.tulivuorikilpi),
      obsidiaanikilpi: new ItemClass(" obsidiaanikilpi", this.images.obsidiaanikilpi),
    }
    return classes;
  }

  createLoot(name, propability) {
    const type = this.itemClasses[name];
    if (!type)
      console.log("Unknown name of loot type: '" + name + "'");
    return { type: type, prop: propability }
  }

  createObjectClasses() {
    return {
      kivi: new StructureClass(this.images.kivi, 0, 10, []),

      arkku1: new StructureClass(this.images.arkku1, 4, 100, [
        this.createLoot("raha", 11000),
        this.createLoot("puumiekka", 470),
        this.createLoot("kivimiekka", 200),
        this.createLoot("puukirves", 470),
        this.createLoot("kivikirves", 180),
        this.createLoot("puukilpi", 430),
        this.createLoot("kivikilpi", 150),
      ]),

      arkku2: new StructureClass(this.images.arkku2, 8, 300, [
        this.createLoot("raha", 53000),
        this.createLoot("kivimiekka", 400),
        this.createLoot("smaragdimiekka", 85),
        this.createLoot("bronssimiekka", 150),
        this.createLoot("jaamiekka", 140),
        this.createLoot("pronssikirves", 100),
        this.createLoot("terasmiekka", 120),
        this.createLoot("kivikirves", 390),
        this.createLoot("teraskirves", 120),
        this.createLoot("smaragdikirves", 82),
        this.createLoot("kivikilpi", 82),
        this.createLoot("teraskilpi", 115),
        this.createLoot("hopeakilpi", 95),
        this.createLoot("rubiinikilpi", 80),
      ]),

      arkku3: new StructureClass(this.images.arkku3, 16, 6, [
        this.createLoot("raha", 300000),
        this.createLoot("smaragdimiekka", 100),
        this.createLoot("ametystmiekka", 80),
        this.createLoot("ametystkirves", 75),
        this.createLoot("sateenkaarimiekka", 40),
        this.createLoot("terasmiekka", 200),
        this.createLoot("hopeakilpi", 190),
        this.createLoot("rubiinikilpi", 140),
        this.createLoot("sateenkaarikirves", 45),
        this.createLoot("luontokilpi", 100),
        this.createLoot("tulivuorikilpi", 72),
        this.createLoot("obsidiaanikilpi", 35),
        this.createLoot("smaragdikirves", 100),
        this.createLoot("jaamiekka", 145),
        this.createLoot("jaakirves", 145),
        this.createLoot("teraskirves", 200),
      ]),

      easyFireBall: new NpcClass(this.images.sphere_monster01, 0, 100, []),
      normalFireBall: new NpcClass(this.images.sphere_monster02, 0, 100, []),
      hardFireBall: new NpcClass(this.images.sphere_monster03, 0, 100, []),
      easyEarthBall: new NpcClass(this.images.sphere_monster04, 0, 100, []),
      normalEarthBall: new NpcClass(this.images.sphere_monster05, 0, 100, []),
      hardEarthBall: new NpcClass(this.images.sphere_monster06, 0, 100, []),
      easyIceBall: new NpcClass(this.images.sphere_monster07, 0, 100, []),
      normalIceBall: new NpcClass(this.images.sphere_monster08, 0, 100, []),
      hardIceBall: new NpcClass(this.images.sphere_monster09, 0, 100, []),
      easyWaterBall: new NpcClass(this.images.sphere_monster10, 0, 100, []),
      normalWaterBall: new NpcClass(this.images.sphere_monster11, 0, 100, []),
      hardWaterBall: new NpcClass(this.images.sphere_monster12, 0, 100, []),
    };
  }
}


function handleFullScreenChange(event) {
  const canvas = document.theGame.canvas;
  if (canvas == document.fullscreenElement) {    
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    if (document.theGame.paused) {
      document.theGame.continue(); 
    } else {
      document.theGame.start();
    }    
  } else {    
    canvas.width = 400;
    canvas.height = 200;    
    if (document.theGame != null) {
      document.theGame.pause(); 
    }
  }
}

function startTheGame() {
  document.getElementById("theGame").requestFullscreen();    
}

document.onfullscreenchange = handleFullScreenChange;
document.theGame = new Game(document.getElementById("theGame"));        
document.theGame.start();  
 