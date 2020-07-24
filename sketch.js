const gameWidth = 10;
const gameHeight = 10;
const drawGrid = false;
const speed = 1;

const width = gameWidth * 20;
const height = (gameHeight * 20) + 50;

let length = 3;
let orientation;
let orientationQueue;
let headPos;
let tailPos = [];
let fruitPos;

let frameTime = 0;
let dead = false;
let hamArray = [];
let pathStart;
let pathEnd;
let won = false;
let canCut = false;

const confettiDensity = 1;
const confettiSize = 1 - ((gameWidth + gameHeight) / 2);
const confettiSpeed = 3;
const confettiSpeedVar = 1.5;
const confettiDriftVar = 2;
let confettiArray = [];
let bounceSpeed = 8;
let bounceY = 0;
let time;

function setup() {

  print("Initiating Setup");
  createCanvas(width, height);
  frameRate(60);

  headPos = createVector(0, 0);
  fruitPos = createVector(0, 0);

  headPos.x = floor(gameWidth / 8) * 20;
  headPos.y = floor(gameHeight / 2) * 20;

  fruitPos.x = width - headPos.x - 20;
  fruitPos.y = headPos.y;

  tailPos.length = gameWidth * gameHeight;
  for (let i = 0; i < tailPos.length; i++) {

    tailPos[i] = createVector(headPos.x, headPos.y);
  }
  hamArray = generateHamiltonianArray(gameWidth, gameHeight);
  orientationQueue = hamArray[headPos.x / 20][headPos.y / 20];
  for (let i = 0; i < gameWidth; i++) {
    for (let j = 0; j < gameHeight; j++) {

      if (hamArray[i][j] == 4) {

        if (pathStart.y > pathEnd.y) {

          hamArray[i][j] = 2;
        } else if (pathStart.x < pathEnd.x) {

          hamArray[i][j] = 3;
        } else if (pathStart.y < pathEnd.y) {

          hamArray[i][j] = 0;
        } else if (pathStart.x > pathEnd.x) {

          hamArray[i][j] = 1;
        }
      }
    }
  }

  print("-=* Setup Complete *=-");
}

function draw() {

  background(20);

  if (length >= gameWidth * gameHeight - 2) {

    displayText = "You won!";
    won = true;
    print("I won!");
  }

  noStroke();
  fill(210, 255, 52);
  rect(0, height - 50, width, 50);
  if (frameTime >= speed) {//update---------------------------------------------

    orientation = orientationQueue;
    if (orientation == 0) {//moving and detecting wall hit

      if (headPos.y - 20 < 0) {

        die();
      } else {

        headPos.y = headPos.y - 20;
      }

    } else if (orientation == 1) {

      if (headPos.x + 20 >= width - 1) {

        die();
      } else {

        headPos.x = headPos.x + 20;
      }
    } else if (orientation == 2) {

      if (headPos.y + 20 >= height - 51) {

        die();
      } else {

        headPos.y = headPos.y + 20;
      }
    } else if (orientation == 3) {

      if (headPos.x - 20 < 0) {

        die();
      } else {

        headPos.x = headPos.x - 20;
      }
    } else {

      orientation = 0;
      print("MANUAL ERROR: invalid orientation");
    }

    for (let i = 1; i < tailPos.length; i++) {//updating tail

      tailPos[tailPos.length - i].x = tailPos[(tailPos.length - i) - 1].x;
      tailPos[tailPos.length - i].y = tailPos[(tailPos.length - i) - 1].y;
    }
    tailPos[0].x = headPos.x;
    tailPos[0].y = headPos.y;

    for (let i = 1; i < length + 1; i++) {//checking tail collisions

      if (headPos.x == tailPos[i].x && headPos.y == tailPos[i].y && !dead) {

        die();
      }
    }

    if (length + 1 == gameWidth * gameHeight) {// checking for win

      paused = true;
    }

    //cutting if can
    let pathToFruit = [];
    let current = createVector(headPos.x / 20, headPos.y / 20);
    for (let i = 0; i < gameWidth * gameHeight; i++) {//creating the path array

      pathToFruit.push(current);
      if(current.x == fruitPos.x / 20 && current.y == fruitPos.y / 20) {
        break;
      }
      if (hamArray[current.x][current.y] == 0) {

        current = createVector(current.x, current.y - 1);
      } else if (hamArray[current.x][current.y] == 1) {

        current = createVector(current.x + 1, current.y);
      } else if (hamArray[current.x][current.y] == 2) {

        current = createVector(current.x, current.y + 1);
      } else if (hamArray[current.x][current.y] == 3) {

        current = createVector(current.x - 1, current.y);
      }
    }
    let neighbors = [createVector(-1, -1), createVector(-1, -1), createVector(-1, -1), createVector(-1, -1)];//getting neighbors
    if ((headPos.y / 20) - 1 >= 0) {

      neighbors[0] = createVector(headPos.x / 20, headPos.y / 20 - 1);
    }
    if ((headPos.x / 20) + 1 < gameWidth) {

      neighbors[1] = createVector(headPos.x / 20 + 1, headPos.y / 20);
    }
    if ((headPos.y / 20) + 1 < gameHeight) {

      neighbors[2] = createVector(headPos.x / 20, headPos.y / 20 + 1);
    }
    if ((headPos.x / 20) - 1 >= 0) {

      neighbors[3] = createVector(headPos.x / 20 - 1, headPos.y / 20);
    }
    let neighborIndex = [0, 0, 0, 0];
    for (let i = 0; i < pathToFruit.length; i++) {

      for (let j = 0; j < neighbors.length; j++) {

        //print(pathToFruit[i] + " : " + neighbors[j]);
        if (neighbors[j].equals(pathToFruit[i])) {

          neighborIndex[j] = i;
          //print("Found one at index = " + i);
        }
      }
    }

    let potentialNeighbors = [];
    let potentialNeighborIndex = [];
    for (let i = 0; i < 4; i++) {

      if (neighborIndex[i] > 1) {

        potentialNeighbors.push(neighbors[i]);
        potentialNeighborIndex.push(neighborIndex[i]);
      }
    }

    let cutTo;
    let potentialCut;
    let safe;
    if (potentialNeighbors.length > 0) {

      canCut = true;
      let max = 0;
      for (let i = 0; i < potentialNeighborIndex.length; i++) {

        if (potentialNeighborIndex[i] > max) {

          potentialCut = potentialNeighbors[i];
          potentialCutIndex = potentialNeighborIndex[i];
        }
      }

    } else { canCut = false; }

    if (canCut) {

      safe = true;
      for (let i = 0; i < length + 2; i++) {

        for (let j = 1; j < potentialCutIndex; j++) {

          if (pathToFruit[j].x == tailPos[i].x / 20 && pathToFruit[j].y == tailPos[i].y / 20) {

            safe = false;
          }
        }
      }
    }

    print("Can cut: " + canCut + " | Safe: " + safe);
    if (canCut && safe) {

      cutTo = potentialCut;
      if (cutTo.y < headPos.y / 20) {

        orientationQueue = 0;
      } else if (cutTo.x > headPos.x / 20) {

        orientationQueue = 1;
      } else if (cutTo.y > headPos.y / 20) {

        orientationQueue = 2;
      } else if (cutTo.x < headPos.x / 20) {

        orientationQueue = 3;
      }

    } else {

      orientationQueue = hamArray[headPos.x / 20][headPos.y / 20];//following the path
    }

    frameTime = 0;
  } else {

    if(!dead && !won) {

      frameTime++;
    } else { print("fasdfasdf"); }
  }

  if (headPos.x == fruitPos.x && headPos.y == fruitPos.y) {// detecting fruit collisions

    length++;
    generateNewFruit();
  }

  noStroke();// drawing and stuff
  fill(50, 150, 255);
  if (!dead && length + 1 <= tailPos.length) {

    for (let i = 1; i < length + 1; i++) {
      rect(tailPos[i].x + 2, tailPos[i].y + 2, 16, 16, 4);
      rect((tailPos[i].x + tailPos[i - 1].x) / 2 + 2, (tailPos[i].y + tailPos[i - 1].y) / 2 + 2, 16, 16, 4);
    }
  } else if (dead && length + 1 <= tailPos.length) {

    for (let i = 1; i < length + 2; i++) {

      rect(tailPos[i].x + 2, tailPos[i].y + 2, 16, 16, 4);
      rect((tailPos[i].x + tailPos[i - 1].x) / 2 + 2, (tailPos[i].y + tailPos[i - 1].y) / 2 + 2, 16, 16, 4);
    }
  } else {

    for (let i = 1; i < tailPos.length; i++) {

      rect(tailPos[i].x + 2, tailPos[i].y + 2, 16, 16, 4);
      rect((tailPos[i].x + tailPos[i - 1].x) / 2 + 2, (tailPos[i].y + tailPos[i - 1].y) / 2 + 2, 16, 16, 4);
    }
  }
  rect(headPos.x + 2, headPos.y + 2, 16, 16, 4);

  if (won) {

    if (hamArray[headPos.x / 20][headPos.y / 20] == 0) {

      rect(headPos.x + 2, headPos.y - 18, 16, 16, 4);
      rect(headPos.x + 2, headPos.y - 8, 16, 16, 4);
    } else if (hamArray[headPos.x / 20][headPos.y / 20] == 1) {

      rect(headPos.x + 22, headPos.y + 2, 16, 16, 4);
      rect(headPos.x + 12, headPos.y + 2, 16, 16, 4);
    } else if (hamArray[headPos.x / 20][headPos.y / 20] == 2) {

      rect(headPos.x + 2, headPos.y + 22, 16, 16, 4);
      rect(headPos.x + 2, headPos.y + 12, 16, 16, 4);
    } else if (hamArray[headPos.x / 20][headPos.y / 20] == 3) {

      rect(headPos.x - 18, headPos.y + 2, 16, 16, 4);
      rect(headPos.x - 8, headPos.y + 2, 16, 16, 4);
    }

    stroke(10);
    strokeWeight(4);
    fill(255);
    textSize(30);
    textAlign(CENTER, TOP);
    rect((width / 2) - ((textWidth(gameWidth * gameHeight) + 12) / 2), height - 44, textWidth(gameWidth * gameHeight) + 12, 38, 10);
    fill(10);
    noStroke();
    text(gameWidth * gameHeight, width / 2, height - 38);

    for (let i = 0; i < confettiDensity; i++) {

      let newConf = new confetti();
      confettiArray.push(newConf);
      newConf.index = confettiArray.length;
    }

    for (let i = 0; i < confettiArray.length; i++) {

      confettiArray[i].update();
    }

  } else {

    fill(255, 0, 150);
    rect(fruitPos.x + 2, fruitPos.y + 2, 16, 16, 5);


    stroke(10);
    strokeWeight(4);
    fill(255);
    textSize(30);
    textAlign(CENTER, TOP);
    rect((width / 2) - ((textWidth(str(length)) + 12) / 2), height - 44, textWidth(str(length)) + 12, 38, 10);
    fill(10);
    noStroke();
    text(str(length), width / 2, height - 38);
  }

  /*for (let i = 0; i < gameWidth; i++) {
    for (let j = 0; j < gameHeight; j++) {

      fill(240, 90);
      rect((i * 20) + 5, (j * 20) + 5, 10, 10);

      if (hamArray[i][j] == 0) {

        rect((i * 20) + 5, (j * 20) - 5, 10, 10);
      } else if (hamArray[i][j] == 1) {

        rect((i * 20) + 15, (j * 20) + 5, 10, 10);
      } else if (hamArray[i][j] == 2) {

        rect((i * 20) + 5, (j * 20) + 15, 10, 10);
      } else if (hamArray[i][j] == 3) {

        rect((i * 20) - 5, (j * 20) + 5, 10, 10);
      }

      fill(250);
      textSize(10);
      textAlign(CENTER, CENTER);
      //text(hamArray[i][j], (i * 20) + 10, (j * 20) + 10);
    }
  }*/
}

function die () {

  dead = true;
  noLoop();
}

function generateNewFruit () {

  if (length < gameWidth * gameHeight) {

    fruitPos.x = floor(random(0, gameWidth)) * 20;
    fruitPos.y = floor(random(0, gameHeight)) * 20;

    for (let i = 1; i < length + 1; i++) {

      if (fruitPos.x == tailPos[i].x && fruitPos.y == tailPos[i].y) {

        generateNewFruit();
        break;
      }
    }
  } else {

    print("You won!!");
  }

}


function generateHamiltonianArray (w, h) {

  //initializing the Hamiltonian path
  let path = [];
  let out;
  path.length = w * h;
  for (let i = 0; i < path.length; i++) {

    if (indexToGrid(i).y % 2 == 0) {

      path[i] = createVector(indexToGrid(i).x, indexToGrid(i).y);
    } else {

      path[i] = createVector((w - indexToGrid(i).x) - 1, indexToGrid(i).y);
    }
  }

  //converting location array into a vector array
  let vectorArray = []
  vectorArray.length = w;
  for (let i = 0; i < vectorArray.length; i++) {

    vectorArray[i] = []
    vectorArray[i].length = w;
    for (let j = 0; j < vectorArray[i].length; j++) {

      vectorArray[i][j] = -216;
    }
  }
  for (let i = 0; i < path.length - 1; i++) {

    if (path[i].y > path[i + 1].y) {

      vectorArray[path[i].x][path[i].y] = 0;
    } else if (path[i].x < path[i + 1].x) {

      vectorArray[path[i].x][path[i].y] = 1;
    } else if (path[i].y < path[i + 1].y) {

      vectorArray[path[i].x][path[i].y] = 2;
    } else if (path[i].x > path[i + 1].x) {

      vectorArray[path[i].x][path[i].y] = 3;
    } else {

      print("MANUAL ERROR: invalid vector value");
    }
  }
  vectorArray[path[path.length - 1].x][path[path.length - 1].y] = 4;
  let start = createVector(0, 0);
  let end = createVector(path[path.length - 1].x, path[path.length - 1].y);

  //THE MAGIC!!!!!--------------------------------------------------------------
  while (true) {

    if(checkAdj(start, end)) {

      break;
    }
    //gathering possible backbiting moves
    let neighbors = [];
    if (start.y - 1 >= 0) {

      neighbors.push(createVector(start.x, start.y - 1));

      if (vectorArray[start.x][start.y] == 0) {

        neighbors.pop();
      }
    }
    if (start.x + 1 < w) {

      neighbors.push(createVector(start.x + 1, start.y));

      if (vectorArray[start.x][start.y] == 1) {

        neighbors.pop();
      }
    }
    if (start.y + 1 < h) {

      neighbors.push(createVector(start.x, start.y + 1));

      if (vectorArray[start.x][start.y] == 2) {

        neighbors.pop();
      }
    }
    if (start.x - 1 >= 0) {

      neighbors.push(createVector(start.x - 1, start.y));

      if (vectorArray[start.x][start.y] == 3) {

        neighbors.pop();
      }
    }
    let toSwitch = neighbors[floor(random(0, neighbors.length))];

    //backbiting
    let current;
    let previous = start;
    if (vectorArray[start.x][start.y] == 0) {//initializing current

      current = createVector(start.x, start.y - 1);
    } else if (vectorArray[start.x][start.y] == 1) {

      current = createVector(start.x + 1, start.y);
    } else if (vectorArray[start.x][start.y] == 2) {

      current = createVector(start.x, start.y + 1);
    } else if (vectorArray[start.x][start.y] == 3) {

      current = createVector(start.x - 1, start.y);
    }

    if (toSwitch.y < start.y) {//realigning current

      vectorArray[start.x][start.y] = 0;
    } else if (toSwitch.x > start.x) {

      vectorArray[start.x][start.y] = 1;
    } else if (toSwitch.y > start.y) {

      vectorArray[start.x][start.y] = 2;
    } else if (toSwitch.x < start.x) {

      vectorArray[start.x][start.y] = 3;
    }
    while (true) {

      let next;
      if (vectorArray[current.x][current.y] == 0) {//setting the next current

        next = createVector(current.x, current.y - 1);
      } else if (vectorArray[current.x][current.y] == 1) {

        next = createVector(current.x + 1, current.y);
      } else if (vectorArray[current.x][current.y] == 2) {

        next = createVector(current.x, current.y + 1);
      } else if (vectorArray[current.x][current.y] == 3) {

        next = createVector(current.x - 1, current.y);
      }

      if (previous.y < current.y) {//realigning current

        vectorArray[current.x][current.y] = 0;
        //print(">Successfully flipped " + current.x + " : " + current.y + " to face 0");

      } else if (previous.x > current.x) {

        vectorArray[current.x][current.y] = 1;
        //print(">Successfully flipped " + current.x + " : " + current.y + " to face 1");

      } else if (previous.y > current.y) {

        vectorArray[current.x][current.y] = 2;
        //print(">Successfully flipped " + current.x + " : " + current.y + " to face 2");

      } else if (previous.x < current.x) {

        vectorArray[current.x][current.y] = 3;
        //print(">Successfully flipped " + current.x + " : " + current.y + " to face 3");

      }

      previous = current;//moving on
      current = next;


      let c = end;// locating the start
      for (let i = 0; i < w * h; i++) {

        if (c.y > 0 && vectorArray[c.x][c.y - 1] == 2) {

          c = createVector(c.x, c.y - 1);
        } else if (c.x < w - 1 && vectorArray[c.x + 1][c.y] == 3) {

          c = createVector(c.x + 1, c.y);
        } else if (c.y < h - 1 && vectorArray[c.x][c.y + 1] == 0) {

          c = createVector(c.x, c.y + 1);
        } else if (c.x > 0 && vectorArray[c.x - 1][c.y] == 1) {

          c = createVector(c.x - 1, c.y);
        } else {

          start = c;
        }
      }

      if (current.equals(toSwitch)) {
        print("Finished keia backbite");

        let path = [];
        let current = start;
        for (let i = 0; i < w * h; i++) {

          path.push(current);

          let next;
          if (vectorArray[current.x][current.y] == 0) {

            current = createVector(current.x, current.y - 1);
          } else if (vectorArray[current.x][current.y] == 1) {

            current = createVector(current.x + 1, current.y);
          } else if (vectorArray[current.x][current.y] == 2) {

            current = createVector(current.x, current.y + 1);
          } else if (vectorArray[current.x][current.y] == 3) {

            current = createVector(current.x - 1, current.y);
          }
        }
        reverse(path);
        //path = path.reversed();

        for (let i = 0; i < vectorArray.length; i++) {

          vectorArray[i] = []
          vectorArray[i].length = w;
          for (let j = 0; j < vectorArray[i].length; j++) {

            vectorArray[i][j] = -216;
          }
        }
        for (let i = 0; i < path.length - 1; i++) {

          if (path[i].y > path[i + 1].y) {

            vectorArray[path[i].x][path[i].y] = 0;
          } else if (path[i].x < path[i + 1].x) {

            vectorArray[path[i].x][path[i].y] = 1;
          } else if (path[i].y < path[i + 1].y) {

            vectorArray[path[i].x][path[i].y] = 2;
          } else if (path[i].x > path[i + 1].x) {

            vectorArray[path[i].x][path[i].y] = 3;
          } else {

            print("MANUAL ERROR: invalid vector value");
          }
        }
        vectorArray[path[path.length - 1].x][path[path.length - 1].y] = 4;
        start = createVector(path[0].x, path[0].y);
        end = createVector(path[path.length - 1].x, path[path.length - 1].y);


        break;
      }
    }
    pathStart = start;
    pathEnd = end;
  }

  //print ("Hamiltonian Cycle generated");
  out = vectorArray;
  return out;
}

class confetti {

  constructor () {

    this.x = random(0, width);
    this.y = -10;
    this.varX = random(-confettiDriftVar, confettiDriftVar);
    this.speed = random(confettiSpeed - confettiSpeedVar, confettiSpeed + confettiSpeedVar);
    this.index;

    this.x1 = random(0, confettiSize);
    this.y1 = random(0, confettiSize);
    this.x2 = random(-confettiSize, 0);
    this.y2 = random(0, confettiSize);
    this.x3 = random(-confettiSize, 0);
    this.y3 = random(-confettiSize, 0);
    this.x4 = random(0, confettiSize);
    this.y4 = random(-confettiSize, 0);

    this.r = random(150, 250);
    this.g = random(150, 250);
    this.b = random(150, 250);
  }

  update () {

    noStroke();
    fill(this.r, this.g, this.b);
    quad(this.x + this.x1, this.y + this.y1, this.x + this.x2, this.y + this.y2, this.x + this.x3, this.y + this.y3, this.x + this.x4, this.y + this.y4);

    this.y += this.speed;
    this.x += this.varX;
  }
}

function keyPressed () {

  if (key == ' ') {

    loop();
  } else if (key == 'q') {

    noLoop();
  }
}

function gridToIndex (x, y) {

  let out = (y * gameWidth) + x;
  return out;
}

function indexToGrid (i) {

  let out = createVector(i % gameWidth, (i - (i % gameWidth)) / gameWidth);
  return out;
}

function checkAdj (a, b) {

  if (a.y > 0 && a.x == b.x && a.y - 1 == b.y) {

    return true;
  } else if (a.x < gameWidth - 1 && a.x + 1 == b.x && a.y == b.y) {

    return true;
  } else if (a.y < gameHeight - 1 && a.x == b.x && a.y + 1 == b.y) {

    return true;
  } else if (a.x < 0 && a.x - 1 == b.x && a.y == b.y) {

    return true;
  } else {

    return false;
  }
}
