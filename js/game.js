/**
 * CRAZY CADDIE: FORE-HEAD TRAUMA (1994)
 * Main Game Controller, HUD, Dumpster Couch Shop, and MTV Episode Title / Game Over Screens.
 */

class CrazyCaddieGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new window.CartoonRenderer(this.canvas);
    this.ctx = this.renderer.ctx;

    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

    // Multi-touch & Mobile responsive state
    this.isTouchDevice = Boolean('ontouchstart' in window || navigator.maxTouchPoints > 0);
    this.isMobile = this.isTouchDevice || window.innerWidth <= 820;
    this.worldScale = 1.0;
    this.touchControls = {
      stickTouchId: null,
      stickBaseX: 96,
      stickBaseY: window.innerHeight - 104,
      stickKnobX: 96,
      stickKnobY: window.innerHeight - 104,
      stickX: 0,
      stickY: 0,
      stickMag: 0,
      stickActive: false,
      duck: false,
      turbo: false,
      duckTouchId: null,
      turboTouchId: null
    };

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Game States: 'title', 'playing', 'shop', 'gameover'
    this.state = 'title';
    this.episode = 1;
    this.score = 0;
    this.highScore = 0;
    this.disruption = 0; // 0 to 100% — at 70%+, Ranger Buzz McVicker spawns!
    this.quota = 15;     // Balls needed to clear the current episode/shift

    this.world = new window.GolfCourseWorld(this.episode);
    this.player = new window.PlayerCart(680, 1520);
    this.golfers = [];
    this.balls = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.ranger = null;

    this.camera = { x: 0, y: 0, shake: 0 };
    this.vhsGlitchTimer = 0;
    this.deathReason = '';

    this.shopItems = [
      {
        id: 'helmet',
        name: 'TRASH-CAN LID HELMET',
        cost: 4,
        desc: 'Blocks 1 headshot'
      },
      {
        id: 'roof',
        name: 'FIBERGLASS CART ROOF',
        cost: 5,
        desc: 'Blocks 1 overhead ball'
      },
      {
        id: 'soda',
        name: 'WARM NACHO CAFFEINE SODA',
        cost: 3,
        desc: 'Heals 1 lump & fills Turbo'
      },
      {
        id: 'governor',
        name: 'CUT RED GOVERNOR WIRE',
        cost: 6,
        desc: '+Top Speed & Drift power'
      },
      {
        id: 'airhorn',
        name: '"BOWEL SHAKER" AIRHORN',
        cost: 6,
        desc: '2X Heckle range'
      },
      {
        id: 'cannon',
        name: 'PVC BALL CANNON [F / CLICK]',
        cost: 7,
        desc: 'Shoot stolen balls at snobs'
      },
      {
        id: 'armor',
        name: 'DUMPSTER METAL BUMPERS',
        cost: 6,
        desc: 'Blocks Ranger Mower hit'
      }
    ];

    this.bindInput();
    this.setupEpisode(1, true);

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.isMobile = Boolean(
      this.isTouchDevice ||
      this.width <= 820 ||
      this.height <= 520
    );
    // Zoom camera out slightly on small phone screens so you can see incoming golf balls clearly!
    const minDim = Math.min(this.width, this.height);
    this.worldScale = minDim < 620 ? Math.max(0.68, minDim / 640) : 1.0;

    if (this.touchControls && !this.touchControls.stickActive) {
      this.touchControls.stickBaseX = 88;
      this.touchControls.stickBaseY = this.height - 96;
      this.touchControls.stickKnobX = 88;
      this.touchControls.stickKnobY = this.height - 96;
    }
  }

  getMobileButtons() {
    const w = this.width;
    const h = this.height;
    const compact = w < 440;
    const rMain = compact ? 34 : 38;
    const rSub = compact ? 27 : 31;

    // Top-right SHOP button rect
    const shopBtn = {
      id: 'shop',
      x: w - (compact ? 96 : 108),
      y: 10,
      w: compact ? 86 : 96,
      h: compact ? 38 : 42
    };

    // Bottom-right arcade action cluster
    const hornBtn = { id: 'horn', cx: w - (compact ? 58 : 68), cy: h - (compact ? 66 : 74), r: rMain, label: 'HORN', color: '#f7d53b', fg: '#161311' };
    const duckBtn = { id: 'duck', cx: w - (compact ? 136 : 154), cy: h - (compact ? 52 : 58), r: rSub, label: 'DUCK', color: '#73b3c9', fg: '#161311' };
    const turboBtn = { id: 'turbo', cx: w - (compact ? 52 : 60), cy: h - (compact ? 144 : 158), r: rSub, label: 'TURBO', color: '#a4ff3b', fg: '#161311' };
    const fireBtn = { id: 'fire', cx: w - (compact ? 124 : 138), cy: h - (compact ? 124 : 136), r: rSub - 2, label: 'FIRE', color: '#ff4d3b', fg: '#ffffff' };

    return { shopBtn, hornBtn, duckBtn, turboBtn, fireBtn };
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (this.state === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startNewGame();
        return;
      }

      if (this.state === 'gameover' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
        this.startNewGame();
        return;
      }

      if (this.state === 'playing') {
        if (e.code === 'Space' || e.code === 'KeyE') {
          e.preventDefault();
          this.triggerAirhornHeckle();
        } else if (e.code === 'KeyF') {
          this.fireBallCannon();
        } else if (e.code === 'KeyB' || e.code === 'Tab') {
          e.preventDefault();
          this.openShop();
        }
      } else if (this.state === 'shop') {
        if (e.code === 'Escape' || e.code === 'KeyB' || e.code === 'Tab' || e.code === 'Enter') {
          e.preventDefault();
          this.closeShop();
        }
        // Number keys 1-7 to buy shop upgrades quickly
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= this.shopItems.length) {
          this.buyShopItem(this.shopItems[num - 1]);
        }
      }

      if (e.code === 'KeyM') {
        window.sound.toggleMute();
      }
      if (e.code === 'KeyV') {
        const crt = document.getElementById('crt-overlay');
        if (crt) crt.classList.toggle('crt-active');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      if (this.mouse.down && this.touchControls.stickTouchId === 'mouse') {
        this.updateVirtualStick(this.mouse.x, this.mouse.y);
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      window.sound.init();

      if (this.state === 'title') {
        this.startNewGame();
        return;
      }
      if (this.state === 'gameover') {
        this.startNewGame();
        return;
      }
      if (this.state === 'shop') {
        this.handleShopClick(this.mouse.x, this.mouse.y);
        return;
      }
      if (this.state === 'playing' && e.button === 0) {
        if (this.isMobile && this.handleMobileOverlayTap(this.mouse.x, this.mouse.y, 'mouse')) {
          return;
        }
        this.fireBallCannon();
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
      if (this.touchControls.stickTouchId === 'mouse') {
        this.resetVirtualStick();
      }
      if (this.touchControls.duckTouchId === 'mouse') {
        this.touchControls.duck = false;
        this.touchControls.duckTouchId = null;
      }
      if (this.touchControls.turboTouchId === 'mouse') {
        this.touchControls.turbo = false;
        this.touchControls.turboTouchId = null;
      }
    });

    // Multi-Touch Mobile Event Listeners
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        this.isTouchDevice = true;
        this.isMobile = true;
        window.sound.init();

        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const tx = t.clientX - rect.left;
          const ty = t.clientY - rect.top;

          if (this.state === 'title' || this.state === 'gameover') {
            this.startNewGame();
            return;
          }
          if (this.state === 'shop') {
            this.handleShopClick(tx, ty);
            return;
          }
          if (this.state === 'playing') {
            this.handleMobileOverlayTap(tx, ty, t.identifier);
          }
        }
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.touchControls.stickTouchId) {
            const tx = t.clientX - rect.left;
            const ty = t.clientY - rect.top;
            this.updateVirtualStick(tx, ty);
          }
        }
      },
      { passive: false }
    );

    const endTouch = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.touchControls.stickTouchId) {
          this.resetVirtualStick();
        }
        if (t.identifier === this.touchControls.duckTouchId) {
          this.touchControls.duck = false;
          this.touchControls.duckTouchId = null;
        }
        if (t.identifier === this.touchControls.turboTouchId) {
          this.touchControls.turbo = false;
          this.touchControls.turboTouchId = null;
        }
      }
    };

    this.canvas.addEventListener('touchend', endTouch, { passive: false });
    this.canvas.addEventListener('touchcancel', endTouch, { passive: false });
  }

  handleMobileOverlayTap(tx, ty, touchId) {
    const btns = this.getMobileButtons();
    const sb = btns.shopBtn;

    // 1. Check Top-Right SHOP Button
    if (tx >= sb.x && tx <= sb.x + sb.w && ty >= sb.y && ty <= sb.y + sb.h) {
      this.openShop();
      return true;
    }

    // 2. Check Action Buttons (Bottom-Right)
    if (Math.hypot(tx - btns.hornBtn.cx, ty - btns.hornBtn.cy) <= btns.hornBtn.r + 8) {
      this.triggerAirhornHeckle();
      return true;
    }
    if (Math.hypot(tx - btns.duckBtn.cx, ty - btns.duckBtn.cy) <= btns.duckBtn.r + 8) {
      this.touchControls.duck = true;
      this.touchControls.duckTouchId = touchId;
      return true;
    }
    if (Math.hypot(tx - btns.turboBtn.cx, ty - btns.turboBtn.cy) <= btns.turboBtn.r + 8) {
      this.touchControls.turbo = true;
      this.touchControls.turboTouchId = touchId;
      return true;
    }
    if (
      this.player.upgrades.cannon > 0 &&
      Math.hypot(tx - btns.fireBtn.cx, ty - btns.fireBtn.cy) <= btns.fireBtn.r + 8
    ) {
      this.fireBallCannon(true);
      return true;
    }

    // 3. Left half of screen engages the Virtual Thumbstick!
    if (tx < this.width * 0.52 && ty > 100 && this.touchControls.stickTouchId === null) {
      this.touchControls.stickTouchId = touchId;
      this.touchControls.stickActive = true;
      // Anchor joystick where thumb lands (or near default base)
      const distToDefault = Math.hypot(tx - 88, ty - (this.height - 96));
      if (distToDefault < 85) {
        this.touchControls.stickBaseX = 88;
        this.touchControls.stickBaseY = this.height - 96;
      } else {
        this.touchControls.stickBaseX = tx;
        this.touchControls.stickBaseY = ty;
      }
      this.updateVirtualStick(tx, ty);
      return true;
    }

    return false;
  }

  updateVirtualStick(tx, ty) {
    const tc = this.touchControls;
    const dx = tx - tc.stickBaseX;
    const dy = ty - tc.stickBaseY;
    const maxR = 48;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(maxR, dist);
    const angle = Math.atan2(dy, dx);

    tc.stickKnobX = tc.stickBaseX + Math.cos(angle) * clamped;
    tc.stickKnobY = tc.stickBaseY + Math.sin(angle) * clamped;
    tc.stickMag = clamped / maxR;
    tc.stickX = dist > 0 ? dx / dist : 0;
    tc.stickY = dist > 0 ? dy / dist : 0;
  }

  resetVirtualStick() {
    const tc = this.touchControls;
    tc.stickTouchId = null;
    tc.stickActive = false;
    tc.stickMag = 0;
    tc.stickX = 0;
    tc.stickY = 0;
    tc.stickBaseX = 88;
    tc.stickBaseY = this.height - 96;
    tc.stickKnobX = 88;
    tc.stickKnobY = this.height - 96;
  }

  startNewGame() {
    window.sound.init();
    window.sound.startMusic();
    window.sound.playChuckle('butthead');

    this.episode = 1;
    this.score = 0;
    this.disruption = 0;
    this.quota = 14;
    this.player = new window.PlayerCart(680, 1520);
    this.player.hasHelmet = true; // Start with 1 rusty helmet so first mistake is hilarious, not instant death!
    this.setupEpisode(1, true);
    this.state = 'playing';
    this.player.say('UH-HUH-HUH, LET\'S STEAL SOME BALLS!');
  }

  setupEpisode(ep, fullReset = false) {
    this.episode = ep;
    this.world = new window.GolfCourseWorld(ep);
    this.player.x = 680;
    this.player.y = 1540;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.ballsCarried = 0;
    const viewW = this.width / this.worldScale;
    const viewH = this.height / this.worldScale;
    this.camera.x = Math.max(0, Math.min(this.world.width - viewW, this.player.x - viewW / 2));
    this.camera.y = Math.max(0, Math.min(this.world.height - viewH, this.player.y - viewH / 2));
    this.disruption = Math.min(35, (ep - 1) * 12);
    this.ranger = null;

    this.golfers = [];
    this.balls = [];
    this.shockwaves = [];

    // Spawn Snob Golfers across the 3 holes
    const gSpots = [
      { x: 460, y: 1380, green: this.world.greens[0], role: 'snob' },
      { x: 520, y: 980, green: this.world.greens[0], role: 'ceo' },
      { x: 640, y: 740, green: this.world.greens[0], role: 'snob' },
      { x: 1180, y: 540, green: this.world.greens[1], role: 'snob' },
      { x: 1680, y: 630, green: this.world.greens[1], role: 'ceo' },
      { x: 1940, y: 880, green: this.world.greens[1], role: 'snob' },
      { x: 1860, y: 1380, green: this.world.greens[2], role: 'ceo' },
      { x: 1520, y: 1320, green: this.world.greens[2], role: 'snob' },
      { x: 1120, y: 1440, green: this.world.greens[2], role: 'snob' }
    ];

    const count = Math.min(gSpots.length, 6 + ep);
    for (let i = 0; i < count; i++) {
      const s = gSpots[i];
      this.golfers.push(new window.SnobGolfer(i + 1, s.x, s.y, s.green, s.role));
    }

    // Scatter initial golf balls on fairways, greens, and near the toxic pond
    for (let i = 0; i < 18; i++) {
      const f = this.world.fairways[i % this.world.fairways.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 140;
      this.balls.push(
        new window.GolfBall({
          x: f.x + Math.cos(angle) * dist,
          y: f.y + Math.sin(angle) * dist,
          kind: i % 6 === 0 ? 'gold' : 'standard'
        })
      );
    }

    // Add 3 glowing radioactive balls near the EPA Superfund Hazard Pond
    const tp = this.world.ponds[1];
    for (let i = 0; i < 3; i++) {
      this.balls.push(
        new window.GolfBall({
          x: tp.x - 120 + i * 75,
          y: tp.y - 115,
          kind: 'toxic'
        })
      );
    }
  }

  addFloatingText(x, y, text, color = '#f7d53b') {
    if (this.floatingTexts.length >= 4) {
      this.floatingTexts.shift();
    }
    // Offset upward if near the player while a speech bubble is visible
    let drawY = y;
    if (this.player && this.player.speechTimer > 0 && Math.hypot(x - this.player.x, y - this.player.y) < 70) {
      drawY = this.player.y - 68;
    }
    this.floatingTexts.push({ x, y: drawY, text, color, life: 1.1, maxLife: 1.1 });
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        color,
        size: 3 + Math.random() * 4,
        life: 0.45 + Math.random() * 0.35
      });
    }
  }

  /**
   * Obnoxious Airhorn / Heckle Blast (SPACE or E)
   * Ruins golfers' backswings so they shank 140mph balls into their own friends or clubhouse windows!
   */
  triggerAirhornHeckle() {
    const p = this.player;
    if (p.airhornCooldown > 0) return;

    const upgraded = p.upgrades.airhorn > 0;
    p.airhornCooldown = upgraded ? 1.4 : 1.9;
    const radius = upgraded ? 440 : 275;

    window.sound.playAirhorn(upgraded);

    const heckles = [
      'YOU SUCK, DUDE! BWAAAAH!',
      'NICE PANTS, DORK!',
      'YOUR WIFE IS IN MY CART!',
      'MISS IT, ASSWIPE! UH-HUH-HUH!',
      'FORE-SKIN! HEH-HEH!'
    ];
    p.say(heckles[Math.floor(Math.random() * heckles.length)], 1.8);

    this.shockwaves.push({
      x: p.x,
      y: p.y,
      r: 20,
      maxR: radius,
      color: upgraded ? '#ff3b2f' : '#f7d53b'
    });

    let shankCount = 0;
    for (const g of this.golfers) {
      if (g.state === 'ragdoll') continue;
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d <= radius) {
        if (g.state === 'backswing') {
          g.executeSwing(this, true); // SHANK!
          shankCount++;
          this.score += 180;
          this.disruption = Math.min(100, this.disruption + 12);
          this.addFloatingText(g.x, g.y - 35, 'BACKSWING RUINED! SHANK! +180', '#ff3b2f');
        } else {
          g.furious = true;
          g.timer = Math.min(g.timer, 0.5);
          g.say('SHUT THAT DAMN HORN UP!', 1.5);
        }
      }
    }

    if (shankCount > 0) {
      setTimeout(() => window.sound.playChuckle('beavis'), 250);
    }
  }

  /**
   * PVC Potato-Gun Ball Cannon (F, Left-Click, or Mobile FIRE button)
   */
  fireBallCannon(autoAim = false) {
    const p = this.player;
    if (p.upgrades.cannon <= 0) {
      if (p.cannonCooldown <= 0) {
        this.addFloatingText(p.x, p.y - 30, 'BUY BALL CANNON IN SHOP!', '#f7d53b');
        p.cannonCooldown = 0.8;
      }
      return;
    }
    if (p.cannonCooldown > 0) return;
    if (p.walletBalls <= 0 && p.ballsCarried <= 0) {
      this.addFloatingText(p.x, p.y - 30, 'OUT OF BALL AMMO!', '#ff4d3b');
      return;
    }

    // Consume 1 ball from wallet (or carried stash)
    if (p.walletBalls > 0) p.walletBalls--;
    else p.ballsCarried--;

    p.cannonCooldown = 0.35;
    window.sound.playCannonFire();

    let aimAngle = p.angle;
    if (autoAim || this.isTouchDevice) {
      // Auto-aim at closest active Golfer or Ranger McVicker within range!
      let bestDist = 520;
      let target = null;
      if (this.ranger && this.ranger.stunTimer <= 0) {
        const rd = Math.hypot(this.ranger.x - p.x, this.ranger.y - p.y);
        if (rd < bestDist) {
          bestDist = rd;
          target = this.ranger;
        }
      }
      for (const g of this.golfers) {
        if (g.state !== 'ragdoll') {
          const gd = Math.hypot(g.x - p.x, g.y - p.y);
          if (gd < bestDist) {
            bestDist = gd;
            target = g;
          }
        }
      }
      if (target) {
        aimAngle = Math.atan2(target.y - p.y, target.x - p.x);
      }
    } else {
      // Desktop: Aim toward mouse cursor in world space
      const viewW = this.width / this.worldScale;
      const viewH = this.height / this.worldScale;
      this.mouse.worldX = this.camera.x + (this.mouse.x / this.width) * viewW;
      this.mouse.worldY = this.camera.y + (this.mouse.y / this.height) * viewH;
      aimAngle = Math.atan2(this.mouse.worldY - p.y, this.mouse.worldX - p.x);
    }

    const speed = 640;
    this.balls.push(
      new window.GolfBall({
        x: p.x + Math.cos(aimAngle) * 26,
        y: p.y + Math.sin(aimAngle) * 26,
        z: 14,
        vx: Math.cos(aimAngle) * speed,
        vy: Math.sin(aimAngle) * speed,
        vz: 45,
        firedByPlayer: true
      })
    );

    this.spawnParticles(p.x + Math.cos(aimAngle) * 26, p.y + Math.sin(aimAngle) * 26, '#e0f7fa', 6);
  }

  /**
   * Called when an incoming 140mph golf ball nails Snotty at head height!
   */
  onPlayerHeadHit(ball) {
    const p = this.player;
    if (p.hurtTimer > 0) return;

    this.camera.shake = 18;
    this.vhsGlitchTimer = 0.45;

    // Check Fiberglass Cart Roof first
    if (p.hasRoof) {
      p.hasRoof = false;
      p.hurtTimer = 0.9;
      window.sound.playCrash('thud');
      this.addFloatingText(p.x, p.y - 36, 'ROOF BLOCKED IT!', '#73b3c9');
      this.spawnParticles(p.x, p.y, '#efe3c8', 14);
      p.say('WOAH! ROOF BLEW OFF!');
      return;
    }

    // Check Galvanized Trash-Can Lid Helmet second
    if (p.hasHelmet) {
      p.hasHelmet = false;
      p.hurtTimer = 0.9;
      window.sound.playHeadBonk(false);
      this.addFloatingText(p.x, p.y - 36, 'CLANG! HELMET SAVED YOU!', '#f7d53b');
      this.spawnParticles(p.x, p.y, '#8f999e', 12);
      p.say('HEH-HEH, EARS RINGING!');
      return;
    }

    // Direct unhelmeted skull impact! Grow a throbbing purple goose-egg lump!
    p.lumps++;
    p.hurtTimer = 1.25;
    p.concussionSpin = Math.min(2.2, p.lumps * 0.75);

    window.sound.playHeadBonk(p.lumps >= p.maxLumps);
    window.sound.playScream(390);
    this.spawnParticles(p.x, p.y - 10, '#d92b2b', 14);

    if (p.lumps >= p.maxLumps) {
      this.deathReason = '3 GOLF BALLS TO THE FOREHEAD';
      this.triggerGameOver();
    } else {
      this.addFloatingText(p.x, p.y - 38, `BONK! LUMP ${p.lumps}/3`, '#ff2a1f');
      const reactions = ['OW! MY FOREHEAD!', 'I SEE BIRDS, DUDE!', 'DAMMIT! MY SKULL!'];
      p.say(reactions[p.lumps % reactions.length], 2.0);
    }
  }

  openShop() {
    this.state = 'shop';
    window.sound.updateEngine(0, false, false, true);
    window.sound.playChuckle('beavis');
  }

  closeShop() {
    // If player reached the episode ball quota, advance to next Episode!
    if (this.player.ballsCarried >= this.quota) {
      this.episode++;
      this.quota = Math.floor(this.quota * 1.3);
      this.setupEpisode(this.episode, false);
      this.player.say(`EPISODE ${this.episode}: MORE RICH DORKS TO ROB!`);
    }
    this.state = 'playing';
  }

  buyShopItem(item) {
    const p = this.player;
    if (p.walletBalls < item.cost) {
      window.sound.playHeadBonk(false);
      return;
    }

    if (item.id === 'helmet') {
      if (p.hasHelmet) return;
      p.hasHelmet = true;
    } else if (item.id === 'roof') {
      if (p.hasRoof) return;
      p.hasRoof = true;
    } else if (item.id === 'soda') {
      p.lumps = Math.max(0, p.lumps - 1);
      p.turboFuel = 100;
    } else if (item.id === 'governor') {
      p.upgrades.governor++;
    } else if (item.id === 'airhorn') {
      p.upgrades.airhorn++;
    } else if (item.id === 'cannon') {
      p.upgrades.cannon++;
    } else if (item.id === 'armor') {
      p.upgrades.armor++;
    }

    p.walletBalls -= item.cost;
    window.sound.playBallPickup(4);
    window.sound.playChuckle(Math.random() < 0.5 ? 'butthead' : 'beavis');
  }

  handleShopClick(mx, my) {
    const w = this.width;
    const h = this.height;
    const narrow = w < 600;
    const panelW = Math.min(760, w - (narrow ? 16 : 40));
    const panelH = Math.min(560, h - (narrow ? 16 : 40));
    const px = (w - panelW) / 2;
    const py = (h - panelH) / 2;

    const leftColW = narrow ? 0 : 200;
    const listX = narrow ? px + 14 : px + leftColW + 38;
    const listW = narrow ? panelW - 28 : panelW - (leftColW + 60);
    const listY = py + (narrow ? 62 : 74);
    const availH = panelH - (narrow ? 120 : 140);
    const rowH = Math.min(56, Math.floor(availH / this.shopItems.length));
    const itemH = rowH - 6;

    for (let i = 0; i < this.shopItems.length; i++) {
      const iy = listY + i * rowH;
      if (mx >= listX && mx <= listX + listW && my >= iy && my <= iy + itemH) {
        this.buyShopItem(this.shopItems[i]);
        return;
      }
    }

    // Check "RESUME" button at bottom
    const btnW = narrow ? panelW - 28 : 240;
    const btnH = narrow ? 42 : 46;
    const bx = narrow ? px + 14 : px + panelW - btnW - 24;
    const by = py + panelH - btnH - 12;
    if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
      this.closeShop();
    }
  }

  triggerGameOver() {
    this.state = 'gameover';
    if (this.score > this.highScore) this.highScore = this.score;
    window.sound.updateEngine(0, false, false, true);
    window.sound.playChuckle('butthead');
  }

  update(dt) {
    if (this.state !== 'playing') return;

    if (this.vhsGlitchTimer > 0) this.vhsGlitchTimer -= dt;
    if (this.camera.shake > 0) this.camera.shake = Math.max(0, this.camera.shake - dt * 35);

    this.world.update(dt, this);
    this.player.update(dt, this.keys, this.world, this);

    // Update music tempo based on Disruption / Ranger chase
    window.sound.intensity = 1.0 + (this.disruption / 100) * 0.35 + (this.ranger ? 0.15 : 0);

    // Spawn Ranger Buzz McVicker when Disruption reaches 70%!
    if (this.disruption >= 70 && !this.ranger) {
      this.ranger = {
        x: this.world.clubhouse.x + 220,
        y: this.world.clubhouse.y + 220,
        vx: 0,
        vy: 0,
        angle: Math.PI / 2,
        stunTimer: 0
      };
      this.addFloatingText(this.player.x, this.player.y - 50, 'WARNING: RANGER BUZZ McVICKER DEPLOYED THE TURF MOWER!', '#ff2a1f');
      window.sound.playScream(240);
    }

    // Update Ranger Buzz McVicker's Turf Mower
    if (this.ranger) {
      const r = this.ranger;
      if (r.stunTimer > 0) {
        r.stunTimer -= dt;
      } else {
        const dx = this.player.x - r.x;
        const dy = this.player.y - r.y;
        r.angle = Math.atan2(dy, dx);
        const rSpeed = 235 + this.episode * 15;
        r.vx = Math.cos(r.angle) * rSpeed;
        r.vy = Math.sin(r.angle) * rSpeed;
        r.x += r.vx * dt;
        r.y += r.vy * dt;

        // Check if player shot Ranger with Ball Cannon
        for (const b of this.balls) {
          if (b.firedByPlayer && b.inFlight && Math.hypot(b.x - r.x, b.y - r.y) < 34) {
            r.stunTimer = 3.5;
            b.inFlight = false;
            this.score += 300;
            this.addFloatingText(r.x, r.y - 30, 'RANGER McVICKER STUNNED! +300', '#f7d53b');
            window.sound.playHeadBonk(false);
          }
        }

        // Check collision between Ranger's Mower and Player Cart
        const dist = Math.hypot(this.player.x - r.x, this.player.y - r.y);
        if (dist < 42 && this.player.z < 12 && this.player.hurtTimer <= 0) {
          this.camera.shake = 16;
          window.sound.playCrash('thud');
          const push = 360;
          this.player.vx = Math.cos(r.angle) * push;
          this.player.vy = Math.sin(r.angle) * push;

          if (this.player.upgrades.armor > 0) {
            this.player.upgrades.armor--;
            this.player.hurtTimer = 1.1;
            this.addFloatingText(this.player.x, this.player.y - 35, 'TRASH-CAN BUMPER ABSORBED RANGER MOWER!', '#8f999e');
          } else {
            this.onPlayerHeadHit({ x: r.x, y: r.y });
          }
        }
      }
    }

    // Update Golfers & check Cart-vs-Golfer slapstick ramming
    const p = this.player;
    const cartSpeed = Math.hypot(p.vx, p.vy);
    for (const g of this.golfers) {
      g.update(dt, this.world, this);

      if (g.state !== 'ragdoll' && p.z < 18) {
        const d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < 32 && cartSpeed > 75) {
          g.knockOut(p.vx, p.vy, this);
          this.camera.shake = Math.min(20, 6 + cartSpeed * 0.035);
          if (Math.random() < 0.7) window.sound.playChuckle(cartSpeed > 280 ? 'beavis' : 'butthead');
          p.say(cartSpeed > 280 ? 'HEH-HEH! FLY, FATASS, FLY!' : 'UH-HUH-HUH! ROADKILL!');
        }
      }
    }

    // Check Cart vs Smashable Props (Bushes, Small Trees, Golf Bags, Port-a-Potties, Wedding Cake, Buffet)
    for (const prop of this.world.props) {
      if (prop.intact && p.z < 16 && Math.hypot(p.x - prop.x, p.y - prop.y) < prop.r + 21) {
        prop.intact = false;
        this.score += prop.points;

        // Launch the prop with 3D tumbling physics based on cart velocity!
        const impactAngle = Math.atan2(p.vy, p.vx);
        const speed = Math.max(120, cartSpeed);
        prop.vx = Math.cos(impactAngle) * speed * 0.95 + (Math.random() - 0.5) * 60;
        prop.vy = Math.sin(impactAngle) * speed * 0.95 + (Math.random() - 0.5) * 60;
        prop.vz = 95 + speed * 0.35;
        prop.angle = impactAngle;
        prop.spin = (Math.random() < 0.5 ? 1 : -1) * (6 + speed * 0.03);

        if (prop.type === 'bush') {
          // Shred ornamental bush into leaves & flower petals!
          window.sound.playCrash('thud');
          this.disruption = Math.min(100, this.disruption + 3);
          this.spawnParticles(prop.x, prop.y, '#488231', 10);
          this.spawnParticles(prop.x, prop.y, prop.flowerColor || '#ff69b4', 6);
          this.addFloatingText(prop.x, prop.y - 22, `BUSH SHREDDED! +${prop.points}`, '#a4ff3b');
          // 50% chance a lost golf ball pops out of the bush!
          if (Math.random() < 0.5) {
            this.balls.push(
              new window.GolfBall({
                x: prop.x,
                y: prop.y,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                vz: 85
              })
            );
          }
        } else if (prop.type === 'small_tree') {
          // Snap small sapling tree off at the stump!
          this.camera.shake = 7;
          p.vx *= 0.92;
          p.vy *= 0.92;
          window.sound.playCrash('thud');
          this.disruption = Math.min(100, this.disruption + 6);
          this.spawnParticles(prop.x, prop.y, '#488231', 12);
          this.spawnParticles(prop.x, prop.y, '#8c6239', 6);
          this.addFloatingText(prop.x, prop.y - 26, `TREE MOWED DOWN! +${prop.points}`, '#a4ff3b');
        } else if (prop.type === 'golf_bag') {
          // Send leather golf bag flying & spill clubs + golf balls everywhere!
          this.camera.shake = 9;
          window.sound.playCrash('glass');
          this.disruption = Math.min(100, this.disruption + 10);
          this.addFloatingText(prop.x, prop.y - 28, `GOLF BAG SMASHED! +${prop.points}`, '#f7d53b');
          // Eject 3 spinning golf clubs
          for (let c = 0; c < 3; c++) {
            const ca = impactAngle + (Math.random() - 0.5) * 1.4;
            const csp = 140 + Math.random() * 180;
            this.world.flyingClubs.push({
              x: prop.x,
              y: prop.y,
              z: 10,
              vx: Math.cos(ca) * csp,
              vy: Math.sin(ca) * csp,
              vz: 110 + Math.random() * 90,
              angle: Math.random() * Math.PI * 2,
              spin: (Math.random() < 0.5 ? 1 : -1) * 16
            });
          }
          // Spill 2-3 golf balls from the bag pockets
          for (let b = 0; b < 2; b++) {
            this.balls.push(
              new window.GolfBall({
                x: prop.x,
                y: prop.y,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                vz: 95,
                kind: b === 0 && Math.random() < 0.35 ? 'gold' : 'standard'
              })
            );
          }
        } else if (prop.type === 'porta_potty') {
          // Explosive Port-a-Potty! Blue sewage flood + eject occupied snob golfer in ragdoll mode!
          this.camera.shake = 15;
          p.vx *= 0.88;
          p.vy *= 0.88;
          window.sound.playCrash('thud');
          if (window.sound.playWaterSplash) window.sound.playWaterSplash();
          window.sound.playChuckle('beavis');
          this.disruption = Math.min(100, this.disruption + 16);
          this.spawnParticles(prop.x, prop.y, '#29b6f6', 20);
          this.spawnParticles(prop.x, prop.y, '#ffffff', 8);
          this.addFloatingText(prop.x, prop.y - 32, `PORT-A-JOHN NUKED! +${prop.points}`, '#29b6f6');
          p.say('HEH-HEH! BLUE WATER EVERYWHERE!');

          if (prop.occupied) {
            const victim = new window.SnobGolfer(
              90 + Math.floor(Math.random() * 50),
              prop.x,
              prop.y,
              this.world.greens[0],
              'ceo'
            );
            this.golfers.push(victim);
            victim.knockOut(p.vx * 1.25 + 80, p.vy * 1.25 - 60, this, 'OCCUPANT EJECTED! +300');
            victim.say('I WAS IN THERE!! NOT THE BLUE WATER!!', 3.2);
          }
        } else {
          // Wedding Cake, Champagne Fountain, Buffet, Bride & Groom
          this.camera.shake = 12;
          this.disruption = Math.min(100, this.disruption + 15);
          window.sound.playCrash(prop.type === 'champagne_table' ? 'glass' : 'thud');
          window.sound.playChuckle('beavis');
          this.addFloatingText(prop.x, prop.y - 30, `${prop.name} WRECKED! +${prop.points}`, '#ff4d3b');
          this.spawnParticles(prop.x, prop.y, '#fff8f0', 16);

          for (let i = 0; i < 3; i++) {
            this.balls.push(
              new window.GolfBall({
                x: prop.x,
                y: prop.y,
                vx: (Math.random() - 0.5) * 190,
                vy: (Math.random() - 0.5) * 190,
                vz: 110,
                kind: prop.type === 'wedding_cake' ? 'gold' : 'standard'
              })
            );
          }
        }
      }
    }

    // Check Cart vs Country Club Swans
    for (const s of this.world.swans) {
      if (s.alive && Math.hypot(p.x - s.x, p.y - s.y) < 28) {
        s.alive = false;
        window.sound.playCrash('swan');
        this.score += 175;
        this.disruption = Math.min(100, this.disruption + 8);
        this.addFloatingText(s.x, s.y - 25, 'PRIZED COUNTRY CLUB SWAN LAUNCHED! +175', '#ffffff');
        this.spawnParticles(s.x, s.y, '#ffffff', 18);
      }
    }

    // Check Cart vs Roaming Booze Cart
    const bc = this.world.bevCart;
    if (bc.hitCooldown <= 0 && Math.hypot(p.x - bc.x, p.y - bc.y) < bc.r + 24 && cartSpeed > 100) {
      bc.hitCooldown = 3.5;
      bc.vx = p.vx * 0.9;
      bc.vy = p.vy * 0.9;
      p.turboFuel = 100;
      this.score += 250;
      this.disruption = Math.min(100, this.disruption + 12);
      window.sound.playCrash('glass');
      this.addFloatingText(bc.x, bc.y - 35, 'BOOZE CART ROBBED! +100% NACHO TURBO & BALLS! +250', '#f7d53b');
      for (let i = 0; i < 3; i++) {
        this.balls.push(
          new window.GolfBall({
            x: bc.x,
            y: bc.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            vz: 100,
            kind: 'gold'
          })
        );
      }
    }

    // Update Golf Balls & Scoop Collection
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.update(dt, this.world, this);

      // Can scoop up any ball that is low to the ground (z < 16) and not fired by player in the first 0.25s
      if ((!b.firedByPlayer || b.age > 0.35) && b.z < 16) {
        const dist = Math.hypot(p.x - b.x, p.y - b.y);
        if (dist < 28) {
          p.ballsCarried += b.value;
          p.walletBalls += b.value;
          const snatchBonus = b.rollingToCup ? 150 : 0;
          const pts = b.value * 100 + snatchBonus;
          this.score += pts;

          window.sound.playBallPickup(b.value);

          if (b.rollingToCup) {
            this.disruption = Math.min(100, this.disruption + 9);
            this.addFloatingText(b.x, b.y - 25, `PUTT STOLEN! +${pts}`, '#ff3b2f');
            p.say('YOINK!');
          } else if (b.kind === 'gold') {
            this.addFloatingText(b.x, b.y - 25, `GOLD BALL! +${pts}`, '#ffd230');
          } else if (b.kind === 'toxic') {
            p.turboFuel = Math.min(100, p.turboFuel + 30);
            this.addFloatingText(b.x, b.y - 25, `TOXIC BALL! +${pts}`, '#9dff2e');
          } else {
            this.addFloatingText(b.x, b.y - 20, `+${pts}`, '#ffffff');
          }

          this.balls.splice(i, 1);

          // Check if quota reached — notify player they can hit Dumpster Couch [B] for Episode clear!
          if (p.ballsCarried >= this.quota && p.ballsCarried - b.value < this.quota) {
            this.addFloatingText(p.x, p.y - 50, 'QUOTA MET! PRESS [B]!', '#a4ff3b');
            window.sound.playChuckle('butthead');
          }
          continue;
        }
      }

      if (b.age > 28 && !b.inFlight) {
        this.balls.splice(i, 1);
      }
    }

    // Keep minimum balls on the course
    if (this.balls.length < 10) {
      const f = this.world.fairways[Math.floor(Math.random() * this.world.fairways.length)];
      this.balls.push(
        new window.GolfBall({
          x: f.x + (Math.random() - 0.5) * 180,
          y: f.y + (Math.random() - 0.5) * 180
        })
      );
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.r += 720 * dt;
      if (sw.r >= sw.maxR) this.shockwaves.splice(i, 1);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Comic Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 38 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Smooth camera follow (scaled by worldScale for mobile viewports!)
    const viewW = this.width / this.worldScale;
    const viewH = this.height / this.worldScale;
    const targetCamX = this.player.x - viewW / 2 + this.player.vx * 0.22;
    const targetCamY = this.player.y - viewH / 2 + this.player.vy * 0.22;
    this.camera.x += (targetCamX - this.camera.x) * Math.min(1, dt * 7);
    this.camera.y += (targetCamY - this.camera.y) * Math.min(1, dt * 7);
    this.camera.x = Math.max(0, Math.min(this.world.width - viewW, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.world.height - viewH, this.camera.y));
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (this.state === 'title') {
      this.drawTitleScreen();
      return;
    }

    // World Space Render with Camera + Mobile Zoom + Concussion Tilt & Shake
    ctx.save();
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;

    if (this.player.concussionSpin > 0.05) {
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.sin(Date.now() * 0.008) * 0.035 * this.player.concussionSpin);
      ctx.translate(-w / 2, -h / 2);
    }

    ctx.scale(this.worldScale, this.worldScale);
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // 1. Draw Course & Collateral Props
    this.world.draw(this.renderer, this.camera);

    // 2. Draw Airhorn Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = Math.max(0, 1 - sw.r / sw.maxR);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Golfers
    for (const g of this.golfers) {
      this.renderer.drawGolfer(g);
      if (g.speechTimer > 0) {
        this.renderer.drawSpeechBubble(g.x, g.y - 32 - (g.z || 0), g.speechText, '#fff7e0', '#161311');
      }
    }

    // 4. Draw Ranger Buzz McVicker's Turf Mower
    if (this.ranger) {
      this.renderer.drawRanger(this.ranger);
      const rLabel = this.ranger.stunTimer > 0 ? 'STUNNED! ($#%@!)' : 'RANGER: "I\'LL MOW YOUR ASS!"';
      this.renderer.drawSpeechBubble(this.ranger.x, this.ranger.y - 28, rLabel, '#d92b2b', '#ffffff');
    }

    // 5. Draw Snotty's Golf Cart
    this.renderer.drawGolfCart(this.player);
    if (this.player.speechTimer > 0) {
      this.renderer.drawSpeechBubble(this.player.x, this.player.y - 34 - this.player.z, this.player.speechText, '#f7d53b', '#161311');
    }

    // 6. Draw 3D Golf Balls & Danger Reticles
    for (const b of this.balls) {
      b.draw(this.renderer);
    }

    // 7. Draw Particles
    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }

    // 8. Draw Comic Floating Score Texts (Crisp high-contrast cartoon font)
    ctx.font = '900 17px "Trebuchet MS", "Arial Black", system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.strokeStyle = '#161311';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // Draw 90s MTV Cartoon HUD
    this.drawHUD();

    if (this.state === 'shop') {
      this.drawShopOverlay();
    } else if (this.state === 'gameover') {
      this.drawGameOverOverlay();
    }
  }

  drawHUD() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const p = this.player;
    const compact = w < 600;
    const fontStack = '"Trebuchet MS", "Arial Black", system-ui, -apple-system, sans-serif';

    // 1. Top-Left Compact Card: Live Portrait + Focused Stats & Visual Head Health
    const portSize = compact ? 66 : 82;
    const pad = compact ? 8 : 14;
    this.renderer.drawCaddiePortrait(pad, pad, portSize, {
      lumps: p.lumps,
      ducking: p.ducking,
      talking: p.speechTimer > 0,
      hasHelmet: p.hasHelmet,
      hurtTimer: p.hurtTimer
    });

    const statsX = pad + portSize + 6;
    const statsW = compact ? 158 : 200;
    this.renderer.drawBoilBox(statsX, pad, statsW, portSize, 'rgba(20, 17, 15, 0.92)', '#161311', 3, 1.2, 701);

    ctx.textAlign = 'left';
    ctx.font = `900 ${compact ? 15 : 18}px ${fontStack}`;
    ctx.fillStyle = p.ballsCarried >= this.quota ? '#a4ff3b' : '#f7d53b';
    ctx.fillText(`BALLS: ${p.ballsCarried}/${this.quota}`, statsX + 10, pad + (compact ? 20 : 25));

    ctx.font = `900 ${compact ? 13 : 15}px ${fontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${this.score}`, statsX + 10, pad + (compact ? 38 : 46));

    // Visual Head Health Hearts/Pips
    ctx.font = `900 ${compact ? 11 : 13}px ${fontStack}`;
    ctx.fillStyle = '#e8d09b';
    ctx.fillText('HEAD:', statsX + 10, pad + (compact ? 56 : 68));

    const hitsLeft = Math.max(0, p.maxLumps - p.lumps);
    const pipStart = statsX + (compact ? 54 : 66);
    const pipStep = compact ? 16 : 21;
    const pipR = compact ? 5.8 : 7.2;
    for (let i = 0; i < 3; i++) {
      const pipX = pipStart + i * pipStep;
      const pipY = pad + (compact ? 52 : 63);
      const alive = i < hitsLeft;
      this.renderer.drawBoilEllipse(
        pipX,
        pipY,
        pipR,
        pipR,
        alive ? '#a4ff3b' : '#9e479c',
        '#161311',
        2,
        0.4,
        8,
        720 + i
      );
    }

    if (p.hasHelmet || p.hasRoof) {
      ctx.font = `900 ${compact ? 10 : 12}px ${fontStack}`;
      ctx.fillStyle = '#7be0ff';
      ctx.fillText(p.hasHelmet ? '+LID' : '+ROOF', pipStart + 3 * pipStep - 2, pad + (compact ? 56 : 68));
    }

    // 2. Top-Right: Tappable SHOP button on Mobile OR Minimap Radar on Desktop
    if (this.isMobile) {
      const btns = this.getMobileButtons();
      const sb = btns.shopBtn;
      const quotaMet = p.ballsCarried >= this.quota;
      this.renderer.drawBoilBox(
        sb.x,
        sb.y,
        sb.w,
        sb.h,
        quotaMet ? '#5cb82e' : '#4a3d31',
        '#f7d53b',
        2.8,
        1.1,
        704
      );
      ctx.textAlign = 'center';
      ctx.font = `900 ${compact ? 13 : 14}px ${fontStack}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(quotaMet ? 'NEXT EP!' : `SHOP (${p.walletBalls})`, sb.x + sb.w / 2, sb.y + sb.h * 0.63);

      // Compact Rage Bar below top-right shop button on narrow phones, or top-center on wider screens
      const rageW = compact ? sb.w : Math.min(180, Math.max(120, sb.x - (statsX + statsW + 16)));
      const rageX = compact ? sb.x : statsX + statsW + (sb.x - (statsX + statsW) - rageW) / 2;
      const rageY = compact ? sb.y + sb.h + 5 : pad;
      const rageH = compact ? 28 : 42;
      this.renderer.drawBoilBox(rageX, rageY, rageW, rageH, 'rgba(20, 17, 15, 0.92)', '#161311', 2.4, 1.0, 702);
      ctx.font = `900 ${compact ? 10 : 12}px ${fontStack}`;
      ctx.fillStyle = this.disruption >= 70 ? '#ff4d3b' : '#f7d53b';
      ctx.fillText(
        this.disruption >= 70 ? 'RANGER!' : `RAGE ${Math.floor(this.disruption)}%`,
        rageX + rageW / 2,
        rageY + (compact ? 12 : 16)
      );
      const bPad = compact ? 6 : 10;
      const bY = rageY + (compact ? 16 : 23);
      const bH = compact ? 7 : 11;
      ctx.fillStyle = '#2b2522';
      ctx.fillRect(rageX + bPad, bY, rageW - bPad * 2, bH);
      ctx.fillStyle = this.disruption >= 70 ? '#ff2a1f' : '#eb7a23';
      ctx.fillRect(rageX + bPad, bY, Math.max(2, ((rageW - bPad * 2) * this.disruption) / 100), bH);
    } else {
      const mapSize = 96;
      const mapX = w - mapSize - 14;
      const mapY = 14;
      this.renderer.drawBoilBox(mapX, mapY, mapSize, mapSize, 'rgba(38, 58, 28, 0.9)', '#161311', 3, 1.2, 705);

      const sx = mapSize / this.world.width;
      const sy = mapSize / this.world.height;
      for (const g of this.world.greens) {
        ctx.fillStyle = '#7cb554';
        ctx.beginPath();
        ctx.arc(mapX + g.x * sx, mapY + g.y * sy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const b of this.balls) {
        ctx.fillStyle = b.kind === 'gold' ? '#ffd230' : '#ffffff';
        ctx.fillRect(mapX + b.x * sx - 1.5, mapY + b.y * sy - 1.5, 3, 3);
      }
      for (const g of this.golfers) {
        ctx.fillStyle = g.aimAtPlayer ? '#ff2a1f' : '#eb5e7b';
        ctx.fillRect(mapX + g.x * sx - 2, mapY + g.y * sy - 2, 4, 4);
      }
      ctx.fillStyle = '#f7d53b';
      ctx.beginPath();
      ctx.arc(mapX + p.x * sx, mapY + p.y * sy, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Top-Center Compact Rage Meter
      const availLeft = statsX + statsW + 12;
      const availRight = mapX - 12;
      const barW = Math.min(200, Math.max(140, availRight - availLeft));
      const barX = availLeft + (availRight - availLeft - barW) / 2;
      this.renderer.drawBoilBox(barX, 14, barW, 46, 'rgba(20, 17, 15, 0.92)', '#161311', 2.8, 1.2, 702);
      ctx.font = `900 13px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = this.disruption >= 70 ? '#ff4d3b' : '#f7d53b';
      ctx.fillText(
        this.disruption >= 70 ? 'RANGER CHASE!' : `RAGE: ${Math.floor(this.disruption)}%`,
        barX + barW / 2,
        30
      );
      this.renderer.drawBoilBox(barX + 12, 37, barW - 24, 13, '#2b2522', '#161311', 1.8, 0.6, 703);
      const fillW = Math.max(3, ((barW - 28) * this.disruption) / 100);
      ctx.fillStyle = this.disruption >= 70 ? '#ff2a1f' : '#eb7a23';
      ctx.fillRect(barX + 14, 39, fillW, 9);
    }

    // Punchy Incoming Ball Alert (only flashes when a ball is flying at your head!)
    const incoming = this.balls.some((b) => b.inFlight && b.aimedAtPlayer);
    if (incoming && Math.floor(Date.now() / 110) % 2 === 0) {
      const alW = compact ? 195 : 225;
      const alY = compact ? 84 : 68;
      this.renderer.drawBoilBox(w / 2 - alW / 2, alY, alW, 32, '#d92b2b', '#161311', 3, 1.2, 709);
      ctx.font = `900 ${compact ? 14 : 16}px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.isMobile ? 'FORE! TAP DUCK!' : 'FORE! DUCK [C]!', w / 2, alY + 21);
    }

    // 4. Draw On-Screen Multi-Touch Virtual Controls on Mobile, or Compact Bottom Pill on Desktop
    if (this.isMobile && this.state === 'playing') {
      this.drawMobileControls();
    } else if (!this.isMobile) {
      const botW = Math.min(580, w - 28);
      const botX = (w - botW) / 2;
      const botY = h - 42;
      this.renderer.drawBoilBox(botX, botY, botW, 32, 'rgba(20, 17, 15, 0.9)', '#161311', 2.2, 0.9, 710);
      ctx.font = `900 13px ${fontStack}`;
      ctx.fillStyle = p.ballsCarried >= this.quota ? '#a4ff3b' : '#ffffff';
      ctx.textAlign = 'center';
      const label =
        p.ballsCarried >= this.quota
          ? 'QUOTA MET! PRESS [B] FOR NEXT EPISODE & UPGRADES!'
          : `[WASD] Drive  •  [SPACE] Horn  •  [C] Duck  •  [SHIFT] Turbo  •  [B] Shop (${p.walletBalls})`;
      ctx.fillText(label, w / 2, botY + 21);
    }
  }

  /**
   * Draw Hand-Inked Boiling Virtual Thumbstick & Action Buttons for Mobile Players
   */
  drawMobileControls() {
    const ctx = this.ctx;
    const tc = this.touchControls;
    const btns = this.getMobileButtons();
    const fontStack = '"Trebuchet MS", "Arial Black", system-ui, -apple-system, sans-serif';

    ctx.save();
    // 1. Virtual Thumbstick (Bottom-Left)
    ctx.globalAlpha = tc.stickActive ? 0.9 : 0.65;
    this.renderer.drawBoilEllipse(
      tc.stickBaseX,
      tc.stickBaseY,
      46,
      46,
      'rgba(20, 17, 15, 0.72)',
      '#f3e5c8',
      2.5,
      1.1,
      14,
      950
    );
    ctx.strokeStyle = 'rgba(243, 229, 200, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tc.stickBaseX - 28, tc.stickBaseY);
    ctx.lineTo(tc.stickBaseX + 28, tc.stickBaseY);
    ctx.moveTo(tc.stickBaseX, tc.stickBaseY - 28);
    ctx.lineTo(tc.stickBaseX, tc.stickBaseY + 28);
    ctx.stroke();

    // Draggable Thumb Knob
    this.renderer.drawBoilEllipse(
      tc.stickKnobX,
      tc.stickKnobY,
      22,
      22,
      '#f7d53b',
      '#161311',
      2.8,
      0.9,
      10,
      951
    );
    if (!tc.stickActive) {
      ctx.font = `900 10px ${fontStack}`;
      ctx.fillStyle = '#161311';
      ctx.textAlign = 'center';
      ctx.fillText('STEER', tc.stickKnobX, tc.stickKnobY + 3.5);
    }

    // 2. Action Buttons (Bottom-Right: HORN, DUCK, TURBO, and FIRE if cannon owned)
    const actionList = [btns.hornBtn, btns.duckBtn, btns.turboBtn];
    if (this.player.upgrades.cannon > 0) {
      actionList.push(btns.fireBtn);
    }

    actionList.forEach((b, idx) => {
      const pressed =
        (b.id === 'duck' && tc.duck) ||
        (b.id === 'turbo' && tc.turbo) ||
        (b.id === 'horn' && this.player.airhornCooldown > 1.2);
      ctx.globalAlpha = pressed ? 0.98 : 0.82;
      const r = pressed ? b.r * 0.92 : b.r;
      this.renderer.drawBoilEllipse(b.cx, b.cy, r, r, b.color, '#161311', 2.8, 1.0, 12, 960 + idx);

      ctx.font = `900 ${b.r > 32 ? 13 : 11}px ${fontStack}`;
      ctx.fillStyle = b.fg;
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.cx, b.cy + 4.5);
    });

    ctx.restore();
  }

  /**
   * 1994 MTV Episode Title Card Screen (Crisp Mobile & Desktop Typography)
   */
  drawTitleScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const narrow = w < 580;
    const fontStack = '"Trebuchet MS", "Arial Black", system-ui, -apple-system, sans-serif';

    ctx.fillStyle = '#181412';
    ctx.fillRect(0, 0, w, h);

    const cardW = Math.min(720, w - (narrow ? 16 : 32));
    const cardH = Math.min(480, h - (narrow ? 16 : 32));
    const cx = (w - cardW) / 2;
    const cy = (h - cardH) / 2;

    this.renderer.drawBoilBox(cx, cy, cardW, cardH, '#26201c', '#f7d53b', 5, 2.0, 800);

    // Snotty & Cletus portraits on either side of the Title Banner
    const pSize = narrow ? 62 : 108;
    const pPad = narrow ? 12 : 24;
    this.renderer.drawCaddiePortrait(cx + pPad, cy + 20, pSize, {
      lumps: 1,
      talking: Math.floor(Date.now() / 450) % 2 === 0
    });
    this.renderer.drawCletusPortrait(cx + cardW - pSize - pPad, cy + 20, pSize, Math.floor(Date.now() / 450) % 2 === 1);

    const titleAvailW = cardW - (pSize + pPad + 10) * 2;
    ctx.textAlign = 'center';
    ctx.font = `900 ${narrow ? 28 : 44}px ${fontStack}`;
    ctx.fillStyle = '#f7d53b';
    ctx.strokeStyle = '#161311';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeText('CRAZY CADDIE', w / 2, cy + (narrow ? 52 : 76), titleAvailW);
    ctx.fillText('CRAZY CADDIE', w / 2, cy + (narrow ? 52 : 76), titleAvailW);

    ctx.font = `900 ${narrow ? 13 : 19}px ${fontStack}`;
    ctx.fillStyle = '#a4ff3b';
    ctx.fillText('EPISODE 1: "FORE-HEAD TRAUMA"', w / 2, cy + (narrow ? 76 : 110), titleAvailW);

    // Clean 4-Point How to Play Box (short, punchy lines that never squish horizontally!)
    const boxX = cx + (narrow ? 14 : 32);
    const boxW = cardW - (narrow ? 28 : 64);
    const boxY = cy + (narrow ? 98 : 148);
    const boxH = cardH - (narrow ? 174 : 234);
    this.renderer.drawBoilBox(boxX, boxY, boxW, boxH, '#fff7e0', '#161311', 3.5, 1.4, 805);

    ctx.textAlign = 'left';
    ctx.font = `900 ${narrow ? 13 : 16}px ${fontStack}`;
    ctx.fillStyle = '#161311';
    const lines = this.isMobile
      ? [
          '• STEAL BALLS: Scoop up balls & rolling putts!',
          '• DODGE HEADSHOTS: Tap DUCK on red targets!',
          '• AIRHORN HECKLE: Tap HORN as golfers swing!',
          '• MOD SHOP: Tap SHOP for helmets & cannons!'
        ]
      : [
          '• STEAL GOLF BALLS: Scoop up balls & snatch rolling putts!',
          '• DODGE HEADSHOTS [C]: Duck or drift from red target reticles!',
          '• AIRHORN HECKLE [SPACE]: Blast golfers mid-swing so they shank!',
          '• DUMPSTER SHOP [B]: Trade balls for helmets & ball cannons!'
        ];
    const lineStep = Math.min(42, Math.floor((boxH - 20) / 4));
    lines.forEach((line, i) => {
      ctx.fillText(line, boxX + (narrow ? 12 : 20), boxY + 30 + i * lineStep, boxW - (narrow ? 22 : 36));
    });

    // Flashing Start Button
    const pulse = Math.sin(Date.now() * 0.008) * 5;
    const btnW = Math.min(340, cardW - 32);
    const btnH = narrow ? 46 : 52;
    this.renderer.drawBoilBox(w / 2 - btnW / 2 - pulse / 2, cy + cardH - btnH - 16, btnW + pulse, btnH, '#d92b2b', '#161311', 4, 1.4, 810);
    ctx.textAlign = 'center';
    ctx.font = `900 ${narrow ? 18 : 21}px ${fontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.isMobile ? 'TAP TO START' : '[SPACE] OR CLICK TO START', w / 2, cy + cardH - 16 - btnH * 0.34);
  }

  /**
   * Focused "Dumpster Couch" Upgrade Shop (Crisp Legible Mobile & Desktop Typography)
   */
  drawShopOverlay() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const p = this.player;
    const narrow = w < 600;
    const fontStack = '"Trebuchet MS", "Arial Black", system-ui, -apple-system, sans-serif';

    ctx.fillStyle = 'rgba(10, 8, 7, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const panelW = Math.min(760, w - (narrow ? 16 : 40));
    const panelH = Math.min(560, h - (narrow ? 16 : 40));
    const px = (w - panelW) / 2;
    const py = (h - panelH) / 2;

    this.renderer.drawBoilBox(px, py, panelW, panelH, '#2e2722', '#f7d53b', 4.5, 1.8, 850);

    // Header
    ctx.textAlign = 'left';
    ctx.font = `900 ${narrow ? 18 : 24}px ${fontStack}`;
    ctx.fillStyle = '#f7d53b';
    ctx.fillText('DUMPSTER MOD SHOP', px + (narrow ? 14 : 24), py + (narrow ? 32 : 42));

    ctx.textAlign = 'right';
    ctx.font = `900 ${narrow ? 16 : 20}px ${fontStack}`;
    ctx.fillStyle = '#a4ff3b';
    ctx.fillText(`${p.walletBalls} BALLS`, px + panelW - (narrow ? 14 : 24), py + (narrow ? 32 : 42));

    // Left column: Snotty & Cletus portraits (hidden on narrow portrait phones so items get 100% width!)
    const leftColW = narrow ? 0 : 200;
    if (!narrow) {
      const pSize = 94;
      this.renderer.drawCletusPortrait(px + 22, py + 70, pSize, true);
      this.renderer.drawCaddiePortrait(px + 22 + pSize + 10, py + 70, pSize, {
        lumps: p.lumps,
        hasHelmet: p.hasHelmet,
        talking: false
      });

      this.renderer.drawBoilBox(px + 22, py + 180, leftColW, 132, '#fff7e0', '#161311', 3, 1.1, 855);
      ctx.textAlign = 'left';
      ctx.font = `900 14px ${fontStack}`;
      ctx.fillStyle = '#161311';
      ctx.fillText('CLETUS:', px + 34, py + 206);
      ctx.font = `bold 13px ${fontStack}`;
      ctx.fillStyle = '#3b2f2a';
      const couchTalk = [
        '"Heh-heh, trade me',
        'stolen golf balls for',
        'helmets & potato guns!',
        'Tap or press [1]-[7]!"'
      ];
      couchTalk.forEach((line, idx) => {
        ctx.fillText(line, px + 34, py + 230 + idx * 21);
      });
    }

    // Right column (or Full Width on mobile): Clickable/Tappable Shop Items (1-7)
    const listX = narrow ? px + 14 : px + leftColW + 38;
    const listW = narrow ? panelW - 28 : panelW - (leftColW + 60);
    const listY = py + (narrow ? 48 : 70);
    const availH = panelH - (narrow ? 110 : 136);
    const rowH = Math.min(56, Math.floor(availH / this.shopItems.length));
    const itemH = rowH - 5;

    this.shopItems.forEach((item, i) => {
      const iy = listY + i * rowH;
      const canAfford = p.walletBalls >= item.cost;
      const alreadyOwned =
        (item.id === 'helmet' && p.hasHelmet) ||
        (item.id === 'roof' && p.hasRoof);

      const bg = alreadyOwned ? '#3d4a3a' : canAfford ? '#4a3d31' : '#26211e';
      this.renderer.drawBoilBox(listX, iy, listW, itemH, bg, '#161311', 2.5, 1.0, 860 + i);

      ctx.textAlign = 'left';
      ctx.font = `900 ${narrow ? 13 : 15}px ${fontStack}`;
      ctx.fillStyle = alreadyOwned ? '#a4ff3b' : canAfford ? '#f7d53b' : '#9c928a';
      ctx.fillText(`${i + 1}. ${item.name}`, listX + 10, iy + itemH * 0.44, listW - 88);

      ctx.font = `bold ${narrow ? 11.5 : 13}px ${fontStack}`;
      ctx.fillStyle = '#f3ece0';
      ctx.fillText(item.desc, listX + 10, iy + itemH * 0.82, listW - 88);

      ctx.textAlign = 'right';
      ctx.font = `900 ${narrow ? 13 : 15}px ${fontStack}`;
      ctx.fillStyle = alreadyOwned ? '#a4ff3b' : canAfford ? '#a4ff3b' : '#ff6b61';
      const costLabel = alreadyOwned ? 'ON' : `${item.cost} BALLS`;
      ctx.fillText(costLabel, listX + listW - 10, iy + itemH * 0.6);
    });

    // Bottom button: Return to Course
    const btnW = narrow ? panelW - 28 : 240;
    const btnH = narrow ? 42 : 46;
    const bx = narrow ? px + 14 : px + panelW - btnW - 24;
    const by = py + panelH - btnH - 12;
    const quotaMet = p.ballsCarried >= this.quota;
    this.renderer.drawBoilBox(bx, by, btnW, btnH, quotaMet ? '#5cb82e' : '#d92b2b', '#161311', 3.5, 1.2, 890);

    ctx.textAlign = 'center';
    ctx.font = `900 ${narrow ? 16 : 18}px ${fontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      quotaMet ? 'START NEXT EPISODE' : 'BACK TO GOLF CART',
      bx + btnW / 2,
      by + btnH * 0.65
    );
  }

  /**
   * Clean, Punchy Game Over Screen ("KNOCKED OUT!")
   */
  drawGameOverOverlay() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const narrow = w < 540;
    const fontStack = '"Trebuchet MS", "Arial Black", system-ui, -apple-system, sans-serif';

    ctx.fillStyle = 'rgba(12, 8, 8, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const cardW = Math.min(520, w - 24);
    const cardH = Math.min(400, h - 24);
    const cx = (w - cardW) / 2;
    const cy = (h - cardH) / 2;

    this.renderer.drawBoilBox(cx, cy, cardW, cardH, '#261c1a', '#d92b2b', 5, 1.8, 910);

    // 1. Big Bold Headline at the top
    ctx.textAlign = 'center';
    ctx.font = `900 ${narrow ? 34 : 42}px ${fontStack}`;
    ctx.fillStyle = '#ff3b2f';
    ctx.fillText('KNOCKED OUT!', w / 2, cy + 52);

    // 2. Centered Portraits side-by-side below headline
    const pSize = narrow ? 94 : 108;
    this.renderer.drawCaddiePortrait(w / 2 - pSize - 12, cy + 70, pSize, {
      lumps: 3,
      hurtTimer: 1
    });
    this.renderer.drawCletusPortrait(w / 2 + 12, cy + 70, pSize, true);

    // 3. Single punchy roast quote & score box
    this.renderer.drawBoilBox(cx + 24, cy + 192, cardW - 48, 102, '#fff7e0', '#161311', 3, 1.2, 915);
    ctx.font = `900 ${narrow ? 14 : 17}px ${fontStack}`;
    ctx.fillStyle = '#161311';
    ctx.fillText('"Uh-huh-huh... right in the forehead. Cool."', w / 2, cy + 226, cardW - 68);

    ctx.font = `900 ${narrow ? 20 : 24}px ${fontStack}`;
    ctx.fillStyle = '#2d4c1e';
    ctx.fillText(`SCORE: ${this.score}  •  EPISODE ${this.episode}`, w / 2, cy + 272, cardW - 68);

    // 4. Play Again Button
    const btnW = Math.min(260, cardW - 48);
    this.renderer.drawBoilBox(w / 2 - btnW / 2, cy + cardH - 70, btnW, 48, '#d92b2b', '#161311', 3.5, 1.2, 920);
    ctx.font = `900 ${narrow ? 18 : 21}px ${fontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.isMobile ? 'TAP TO PLAY AGAIN' : '[SPACE] PLAY AGAIN', w / 2, cy + cardH - 39);
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.renderer.updateBoil(timestamp);
    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new CrazyCaddieGame();
});
