
/*********************** ItemClass *********************/

class ItemClass {

  constructor(name,img) {
    this.name = name;
    this.img = img;
    if (!img) {
      console.log("Item '" + name + "' have invalid image!" );
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
    this.tmpPos = {x:0, y:0};
    
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
    this.pos = {x: pos.x, y: pos.y};
    this.img = img;
    this.show = true;
    this.inventory = new Inventory(invSize);
  }
  
  draw(ctx, transform) {
    if (this.img.readyToUse && this.show) {
      ctx.drawImage(this.img, this.pos.x - this.img.width  / 2 + transform.x, 
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
    return Math.sqrt(dx*dx + dy*dy);
  }  
  
  loot(obj) {
    this.inventory.loot(obj.inventory);  
  }  
}

/*********************** Player *********************/

class Player extends ObjectBase {
  constructor(img) {
    super(img, {x:0,y:0}, 50)
    this.target = {x:0, y:0};
    this.move = false;
  }
  
  setTarget(x ,y) {
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
  constructor(img,inventorySize,rarity,lootProp) {
    this.img = img;
    this.inventorySize = inventorySize;
    this.rarity = rarity;
    this.lootProp = lootProp;
  }
}

class Structure extends ObjectBase {

  constructor(pos,type) {
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


/*********************** Game *********************/

class Game {
  constructor() {    
    // Bind function to this object
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.step = this.step.bind(this);
    
    // Init canvas
    this.xsize = window.innerWidth;
    this.ysize = window.innerHeight;

    this.canvas = document.getElementById("theGame");
    this.canvas.width = this.xsize - 4;
    this.canvas.height = this.ysize - 4;
    this.canvas.addEventListener('mousemove', this.onMouseMove, false);
    this.canvas.addEventListener("mousedown", this.onMouseDown, false);
    this.canvas.addEventListener("mouseup", this.onMouseUp, false);            
    this.ctx = this.canvas.getContext("2d");
    this.ctx.font = "32px Courier";       
    
    // Create images
    this.images = {};
    this.createImages();
    
    // Create other members
    this.itemClasses = this.createItemClasses();
    this.structureClasses = this.createStructureClasses();
    this.lastStepTime = 0;    
    this.landRandom1 = (Math.random() * 100) + 250;
    this.landRandom2 = (Math.random() * 100) + 250;
    this.landRandom3 = (Math.random() * 200) + 500;
    this.landRandom4 = (Math.random() * 200) + 500;    
    this.player = new Player(this.images.naama); 
    this.stuctures = [];
    this.mousePos = {x:0, y:0};
    this.transform = {x:0, y:0};
    this.tmpPoint = {x:0, y:0};
    
        
    this.player.addToInventory( this.itemClasses.raha.create() );
    this.player.addToInventory( this.itemClasses.puumiekka.create() );        
    
    
    // Fill stuctures list
    for (var name in this.structureClasses) {
      const type = this.structureClasses[name];
      const count = 5000 / type.rarity;
      for (var i = 0; i < count; i++) {
        this.stuctures.push(new Structure(this.getRandomPos(), type));     
      }
    }    
  }
  
  onMouseMove(evt) {    
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = evt.clientX - rect.left;    
    this.mousePos.y = evt.clientY - rect.top;    
  }
  
  onMouseDown(evt) {
    this.player.move = true;        
  }
  
  onMouseUp(evt) {
    this.player.move = false; 
  }       
  
  start() {
    window.requestAnimationFrame(this.step); 
  }
  
  getRandomPos() {
    const areaSize = 10000;
    return {
      x: areaSize * Math.random() - areaSize / 2,
      y: areaSize * Math.random() - areaSize / 2
    };    
  }  
  
  step(timestamp) {
    const timeDiff = timestamp - this.lastStepTime;
    this.lastStepTime = timestamp;

    this.player.setTarget(this.player.pos.x + this.mousePos.x - this.xsize/2, this.player.pos.y + this.mousePos.y - this.ysize/2);
    this.player.step(timeDiff);
    

    // Collision detection
    for (var i = 0; i < this.stuctures.length; i++) {
      var item = this.stuctures[i];
      if (item.inventory && item.inventory.getSize()) {
        const r = this.player.distanceTo(item);  
        if (r < 60) {
          item.hide(true);
          this.player.loot(item);          
        }
      }
    }
    
    const transform = this.transform; 
    transform.x = this.xsize / 2 - this.player.pos.x, 
    transform.y = this.ysize / 2 - this.player.pos.y

    // Draw scene
    for (var x = -1*(this.xsize / 2 / 80); x <= 1 + (this.xsize / 2 / 80); x++) {
      for (var y = -1*(this.ysize / 2 / 80); y <= 1 + (this.ysize / 2 / 80); y++) {
        
        const point = this.tmpPoint;
        point.x = Math.floor(this.player.pos.x / 80) * 80 + x * 80;        
        point.y = Math.floor(this.player.pos.y / 80) * 80 + y * 80;         
        const image = this.isLakeInPos(point) ? this.images.vesi : this.images.nurmi;
        if(image.readyToUse)
          this.ctx.drawImage(image, point.x + transform.x, point.y + transform.y);
      }
    }

    // Draw objects
    this.player.draw(this.ctx, transform);
    for (i = 0; i < this.stuctures.length; i++) 
      this.stuctures[i].draw(this.ctx, transform);
    
    // Draw some info text
    // this.ctx.fillText("X=" + Math.round(this.player.pos.x) + " Y=" + Math.round(this.player.pos.y), 40, 40);
    // this.ctx.fillText(Math.round(10000.0 / timeDiff) / 10 + "FPS", 40, 70);

    // Draw inventory
    this.player.inventory.draw(this.ctx, this.xsize - 20 - this.player.inventory.xs, 20 );
    
    window.requestAnimationFrame(this.step); 
  }  
    

  isLakeInPos(pos) {
     const a = Math.sin(pos.x / this.landRandom1) + 
               Math.sin(pos.y / this.landRandom2) + 
               Math.sin(120 + pos.x / this.landRandom3) + 
               Math.sin(80 + pos.y / this.landRandom4) +
               Math.sin(270 + (2 * pos.x + pos.y) / this.landRandom1) ;
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
            "hopeakilpi", "rubiinikilpi", "luontokilpi", "tulivuorikilpi", "obsidiaanikilpi" ];

    for (var i = 0; i < imageNames.length; i++) {
      const name = imageNames[i];
      var img = this.images[name] = new Image();
      img.onload = function () { this.readyToUse = true; }
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
    return {type: type, prop: propability}
  }
  
  createStructureClasses() {
    return {
      kivi:   new StructureClass(this.images.kivi, 0, 10, []),

      arkku1: new StructureClass(this.images.arkku1, 4, 100, [
                       this.createLoot("raha",        11000),
                       this.createLoot("puumiekka",     470),
                       this.createLoot("kivimiekka",    200),
                       this.createLoot("puukirves",     470),
                       this.createLoot("kivikirves",    180),
                       this.createLoot("puukilpi",      430),
                       this.createLoot("kivikilpi",     150),
                    ]),
                    
      arkku2: new StructureClass(this.images.arkku2, 8, 300, [
                       this.createLoot("raha",        53000),
                       this.createLoot("kivimiekka",    400),
                       this.createLoot("smaragdimiekka", 85),
                       this.createLoot("bronssimiekka", 150),
                       this.createLoot("jaamiekka",     140),
                       this.createLoot("pronssikirves", 100),
                       this.createLoot("terasmiekka",   120),
                       this.createLoot("kivikirves",    390),
                       this.createLoot("teraskirves",   120),
                       this.createLoot("smaragdikirves", 82),
                       this.createLoot("kivikilpi",      82),
                       this.createLoot("teraskilpi",    115),
                       this.createLoot("hopeakilpi",     95),
                       this.createLoot("rubiinikilpi",   80),
                   ]),
                   
      arkku3: new StructureClass(this.images.arkku3, 16, 6, [
                       this.createLoot("raha",             300000),
                       this.createLoot("smaragdimiekka",      100),
                       this.createLoot("ametystmiekka",        80),
                       this.createLoot("ametystkirves",        75),
                       this.createLoot("sateenkaarimiekka",    40),
                       this.createLoot("terasmiekka",         200),
                       this.createLoot("hopeakilpi",          190),
                       this.createLoot("rubiinikilpi",        140),
                       this.createLoot("sateenkaarikirves",    45),
                       this.createLoot("luontokilpi",         100),
                       this.createLoot("tulivuorikilpi",       72),
                       this.createLoot("obsidiaanikilpi",      35),
                       this.createLoot("smaragdikirves",      100),
                       this.createLoot("jaamiekka",           145),
                       this.createLoot("jaakirves",           145),
                       this.createLoot("teraskirves",         200),
                   ]),
    };
  }
}

const theGame = new Game();
theGame.start();
