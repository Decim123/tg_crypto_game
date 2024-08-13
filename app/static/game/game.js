// Определение глобальных переменных
let dinosaur;
let cacti = [];
let coins = [];
let isJumping = false;
let gravity = 0.6;
let score = 0;
let isGameOver = false;
let bg1, bg2;
let cactusSpeed = 7; // Постоянная скорость кактусов
let bgSpeed = 6; // Постоянная скорость фона
let bgImg;
let cactusSpawnInterval = 120;
let coinSpawnInterval = 150;
let bgOverlap = 1;
let homeButton, restartButton;
let dinosaurImages = [];
let jumpImages = [];
let frameDelay = 1;
let currentFrame = 0;
let jumpFrame = 0;
let scoreDiv; // Переменная для хранения div с финальным счетом
let cactusImg1, cactusImg2; // Переменные для хранения изображений кактусов
let coinImg; // Переменная для хранения изображения монеты
let coinSound; // Переменная для хранения звука монеты
let idleImg;
let minCactusSpawnInterval = 250; // Минимальный интервал появления кактусов
let maxCactusSpawnInterval = 450; // Максимальный интервал появления кактусов
let cactusSpawnCounter = 0;

function preload() {
  // Загрузка изображений в зависимости от skin
  let skinPath = `/static/game_assets/${userSkin}`;

  bgImg = loadImage('/static/game_assets/background.png');

  for (let i = 1; i <= 33; i++) {
      let img = loadImage(`${skinPath}/ride/${i}.png`);
      dinosaurImages.push(img);
  }

  for (let i = 1; i <= 9; i++) {
      let img = loadImage(`${skinPath}/jump/${i}.png`);
      jumpImages.push(img);
  }

  idleImg = loadImage(`${skinPath}/idle/idle.png`); // Загрузка idle картинки

  cactusImg1 = loadImage('/static/game_assets/obstacle_1.png');
  cactusImg2 = loadImage('/static/game_assets/obstacle_2.png');
  coinImg = loadImage('/static/game_assets/coin.png');
  coinSound = loadSound('/static/game_assets/coin_sound.mp3');
}

window.addEventListener('load', function() {
  const loadingScreen = document.getElementById('loading-screen');
  const gameContainer = document.getElementById('game-container');
  if (loadingScreen) {
      loadingScreen.style.display = 'none'; // Скрываем загрузочный экран
  }
  if (gameContainer) {
      gameContainer.style.display = 'block'; // Показываем канвас с игрой
  }
});


function setup() {
  // Создание canvas и элементов управления
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('game-container');

  dinosaur = new Dinosaur();
  cacti.push(new Cactus());
  bg1 = new Background(0);
  bg2 = new Background(2000 - bgOverlap);

  // Кнопка "Home"
  homeButton = createButton('Home');
  homeButton.mousePressed(goHome);
  homeButton.style('font-size', '20px');
  homeButton.style('padding', '10px');
  homeButton.style('left', '20%');
  homeButton.touchStarted(goHome);
  homeButton.hide();

  // Кнопка "Restart"
  restartButton = createButton('Again');
  restartButton.mousePressed(resetGame);
  restartButton.style('font-size', '20px');
  restartButton.style('padding', '10px');
  restartButton.style('left', '60%');
  restartButton.touchStarted(resetGame);
  restartButton.hide();

  // Текст "JUMP"
  let jumpText = createDiv('JUMP');
  jumpText.class('jump-text');
  jumpText.parent('game-container');

  jumpText.mousePressed(handleJump); // Обработка нажатия мыши
  jumpText.touchStarted((event) => {
    handleJump(); 
    jumpText.addClass('active'); // Добавляем класс при нажатии на сенсорном экране
    event.stopPropagation(); // Предотвращаем распространение события на другие элементы
  });

  jumpText.touchEnded(() => {
    jumpText.removeClass('active'); // Убираем класс при отпускании пальца
  });

  // Обработчик касаний для прыжков
  canvas.touchStarted((event) => {
    if (!isTouchOnJumpButton(event.touches[0].clientX, event.touches[0].clientY, jumpText)) {
      handleJump();
    }
  });

  // Предотвращаем стандартное поведение на сенсорных устройствах iOS
  document.addEventListener('touchstart', function(e) {
    if (e.target.classList.contains('jump-text')) {
        e.preventDefault(); // Предотвращаем поведение по умолчанию
    }
  }, { passive: false });
}

function handleJump() {
  if (!isGameOver) {
      dinosaur.jump();
  }
}

function windowResized() {
  // Обновление размера canvas при изменении размера окна
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(23, 33, 43);

  if (!isGameOver) {
      // Основная логика игры
      bg1.update();
      bg1.show();
      bg2.update();
      bg2.show();
      dinosaur.update();
      dinosaur.show();

      // Обновление кактусов
      cactusSpawnCounter++;
      if (cactusSpawnCounter >= cactusSpawnInterval) {
          cacti.push(new Cactus());
          cactusSpawnCounter = 0;
          cactusSpawnInterval = random(minCactusSpawnInterval, maxCactusSpawnInterval);
      }

      for (let i = cacti.length - 1; i >= 0; i--) {
          cacti[i].update();
          cacti[i].show();

          if (cacti[i].hits(dinosaur)) {
              console.log('GAME OVER');
              isGameOver = true;
              endGame();
          }

          if (cacti[i].offScreen()) {
              cacti.splice(i, 1);
          }
      }

      // Обновление монет
      if (frameCount % coinSpawnInterval === 0) {
          let newCoin = new Coin();
          let overlapping = false;
          for (let coin of coins) {
              if (dist(newCoin.x, newCoin.y, coin.x, coin.y) < newCoin.r * 2) {
                  overlapping = true;
                  break;
              }
          }
          if (!overlapping) {
              coins.push(newCoin);
          }
      }

      for (let i = coins.length - 1; i >= 0; i--) {
          coins[i].update();
          coins[i].show();

          if (coins[i].hits(dinosaur) && !coins[i].collected) {
              coins[i].collected = true;
              score++; // Увеличиваем счет за каждую собранную монету
              coinSound.play(); // Воспроизводим звук монеты
          }

          if (coins[i].offScreen()) {
              coins.splice(i, 1);
          }
      }

      // Отображение счета
      textSize(32);
      fill(176, 255, 222);
      textAlign(CENTER);
      text(`${score}`, width / 2, height / 10);
  } else {
      // Отображение финального счета и кнопок, если игра завершена
      if (!scoreDiv) { // Создаем div только если он еще не создан
          scoreDiv = createDiv(`Score: ${score}`);
          scoreDiv.class('final-score');
      }
      homeButton.show();
      restartButton.show();

      // Отображение idle картинки справа на экране
      let targetHeight = (height / 2) * 0.7;
      let aspectRatio = idleImg.width / idleImg.height;
      let targetWidth = targetHeight * aspectRatio;

      let posX = width - targetWidth - 20;
      let posY = (height / 2 - targetHeight) / 2;

      image(idleImg, posX, posY, targetWidth, targetHeight);
  }
}

function mousePressed() {
  handleJump();
  return false;
}

function touchStarted() {
  handleJump();
  return false;
}

function keyPressed() {
  if (key == 'r' || key == 'R') {
    resetGame();
  }
}

function resetGame() {
  // Сброс игры
  isGameOver = false;
  score = 0;
  cactusSpeed = 7;
  bgSpeed = 6;
  cacti = [];
  coins = [];
  cacti.push(new Cactus());
  cactusSpawnInterval = 120;
  dinosaur = new Dinosaur();
  bg1 = new Background(0);
  bg2 = new Background(2000 - bgOverlap);
  frameDelay = 1;

  // Удаляем блок финального счета
  if (scoreDiv) {
    scoreDiv.remove();
    scoreDiv = null; // Сбрасываем переменную после удаления
  }

  homeButton.hide();
  restartButton.hide();
}

function endGame() {
  // Показать кнопки управления, когда игра завершена
  homeButton.show();
  restartButton.show();

  // Отправить результат игры на сервер
  updateScoreOnServer(score);
}

function updateScoreOnServer(finalScore) {
  const tg_id = tg.initDataUnsafe.user.id;

  fetch('/update_score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `tg_id=${tg_id}&score=${finalScore}`
  })
  .then(response => {
    if (response.ok) {
      console.log('Score updated successfully');
    } else {
      console.error('Failed to update score');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function goHome() {
  // Переход на главную страницу
  window.location.href = '/';
}

class Dinosaur {
  constructor() {
    this.w = 50;
    this.h = 100;
    this.x = 50;
    this.y = windowHeight / 2 - this.h;
    this.vy = 0;
  }

  jump() {
    if (!isJumping) {
      this.vy = -12;
      isJumping = true;
      jumpFrame = 0;
    }
  }

  update() {
    this.y += this.vy;
    this.vy += gravity;

    if (this.y > windowHeight / 2 - this.h) {
      this.y = windowHeight / 2 - this.h;
      this.vy = 0;
      isJumping = false;
    }

    if (isJumping) {
      if (frameCount % 5 === 0) {
        jumpFrame = min(jumpImages.length - 1, jumpFrame + 1);
      }
    } else {
      if (frameCount % frameDelay === 0) {
        currentFrame = (currentFrame + 1) % dinosaurImages.length;
      }
    }
  }

  show() {
    if (isJumping) {
      image(jumpImages[jumpFrame], this.x, this.y, this.w, this.h);
    } else {
      image(dinosaurImages[currentFrame], this.x, this.y, this.w, this.h);
    }
  }
}

class Cactus {
  constructor() {
    this.r = 50;
    this.x = windowWidth + random(0, windowWidth / 2);
    this.y = windowHeight / 2 - this.r;
    this.speed = cactusSpeed; // Постоянная скорость
    this.angle = 0;
    this.rotationSpeed = 0.05;
    this.img = random([cactusImg1, cactusImg2]); // Случайный выбор изображения кактуса
  }

  update() {
    this.x -= this.speed;
    this.angle -= this.rotationSpeed;
    this.rotationSpeed += 0.0001;
  }

  hits(dinosaur) {
    return collideRectRect(
      this.x,
      this.y,
      this.r,
      this.r,
      dinosaur.x,
      dinosaur.y,
      dinosaur.w,
      dinosaur.h
    );
  }

  offScreen() {
    return this.x < -this.r;
  }

  show() {
    push();
    translate(this.x + this.r / 2, this.y + this.r / 2);
    rotate(this.angle);
    imageMode(CENTER);
    image(this.img, 0, 0, this.r, this.r); // Отображение случайного изображения кактуса
    pop();
  }
}

class Coin {
  constructor() {
    this.r = 30; // Увеличенный размер монеты
    this.x = windowWidth + random(0, windowWidth / 2);
    this.y = windowHeight / 2 - this.r - 180; // Повышенная высота прыжка динозавра
    this.collected = false; // Флаг для отслеживания, была ли собрана монета
  }

  update() {
    this.x -= cactusSpeed; // Монеты движутся с той же скоростью, что и кактусы
  }

  hits(dinosaur) {
    return collideRectRect(
      this.x,
      this.y,
      this.r,
      this.r,
      dinosaur.x,
      dinosaur.y,
      dinosaur.w,
      dinosaur.h
    );
  }

  offScreen() {
    return this.x < -this.r;
  }

  show() {
    if (!this.collected) {
      image(coinImg, this.x, this.y, this.r, this.r); // Отображение монеты
    }
  }
}

class Background {
  constructor(x) {
    this.x = x;
    this.y = 0;
    this.img = bgImg;
  }

  update() {
    this.x -= bgSpeed; // Постоянная скорость фона
    if (this.x <= -2000) {
      this.x += 4000 - bgOverlap;
    }
  }

  show() {
    image(this.img, this.x, this.y, 2000, windowHeight / 2);
  }
}

function isTouchOnJumpButton(touchX, touchY, jumpText) {
  let jumpRect = jumpText.elt.getBoundingClientRect();
  return (
    touchX >= jumpRect.left &&
    touchX <= jumpRect.right &&
    touchY >= jumpRect.top &&
    touchY <= jumpRect.bottom
  );
}
