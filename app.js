const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1a1a
  });
  document.body.appendChild(app.view);
  
  // Загружаем спрайт-лист
  app.loader
    .add("fireplace", "assets/fireplace_spritesheet.json")
    .load(setup);
  
  function setup() {
    const textures = [];
  
    // Создаём массив кадров из JSON
    for (let i = 0; i < 60; i++) {
      const frameName = `fire_${String(i).padStart(3, '0')}.png`;
      const texture = PIXI.Texture.from(frameName);
      textures.push(texture);
    }
  
    // Создаём анимацию
    const fireAnim = new PIXI.AnimatedSprite(textures);
    fireAnim.animationSpeed = 0.4; // Можно поиграть со скоростью
    fireAnim.loop = true;
    fireAnim.play();
  
    // Позиционируем анимацию на сцене
    fireAnim.anchor.set(0.5);
    fireAnim.x = app.screen.width / 2;
    fireAnim.y = app.screen.height / 2;
  
    app.stage.addChild(fireAnim);
  }