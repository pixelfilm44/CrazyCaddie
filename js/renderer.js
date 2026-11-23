/**
 * CRAZY CADDY CARNAGE: Procedural 90s Cel-Animation Cartoon Renderer
 * Features deterministic 12-FPS "Line Boil", grotesque caricature portraits,
 * hand-inked crosshatching, and comic speech bubbles.
 */

class CartoonRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boilFrame = 0;
    this.lastBoilTime = 0;

    // 90s Cel-Animation Palette (muddy, sun-bleached, high-contrast ink)
    this.palette = {
      ink: '#161311',
      paper: '#f3e5c8',
      fairway: '#5d8a41',
      rough: '#3f632b',
      green: '#7cb554',
      bunker: '#d8be82',
      water: '#36687a',
      toxic: '#7be026',
      asphalt: '#4a4744',
      skin: '#e8b496',
      skinRed: '#d95b52',
      gums: '#d46a7e',
      teeth: '#f2ead3',
      blood: '#b8251e',
      bruise: '#7c3f8c',
      gold: '#f5c236',
      accentYellow: '#f7d53b'
    };
  }

  updateBoil(timestamp) {
    // 12 FPS cel-animation boil cadence (~83ms per boil tick)
    if (timestamp - this.lastBoilTime > 83) {
      this.boilFrame = (this.boilFrame + 1) % 64;
      this.lastBoilTime = timestamp;
    }
  }

  // Deterministic pseudo-random jitter based on seed + boilFrame
  jitter(seed, amp = 1.6) {
    const n = Math.sin(seed * 12.9898 + this.boilFrame * 78.233) * 43758.5453;
    return ((n - Math.floor(n)) * 2 - 1) * amp;
  }

  /**
   * Draw a hand-inked boiling polygon
   */
  drawBoilPolygon(pts, fillStyle, strokeStyle = '#161311', lineWidth = 2.5, boilAmp = 1.5, seedOffset = 0) {
    const ctx = this.ctx;
    if (pts.length < 2) return;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const jx = this.jitter(seedOffset + i * 3.1, boilAmp);
      const jy = this.jitter(seedOffset + i * 7.3 + 19, boilAmp);
      if (i === 0) ctx.moveTo(pts[i][0] + jx, pts[i][1] + jy);
      else ctx.lineTo(pts[i][0] + jx, pts[i][1] + jy);
    }
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle && lineWidth > 0) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  /**
   * Draw a sketchy boiling rectangle (great for HUD panels, signs, carts)
   */
  drawBoilBox(x, y, w, h, fillStyle, strokeStyle = '#161311', lineWidth = 3, boilAmp = 1.8, seed = 1) {
    const pts = [
      [x, y],
      [x + w * 0.5, y],
      [x + w, y],
      [x + w, y + h * 0.5],
      [x + w, y + h],
      [x + w * 0.5, y + h],
      [x, y + h],
      [x, y + h * 0.5]
    ];
    this.drawBoilPolygon(pts, fillStyle, strokeStyle, lineWidth, boilAmp, seed);
  }

  /**
   * Draw a boiling hand-inked circle/ellipse
   */
  drawBoilEllipse(cx, cy, rx, ry, fillStyle, strokeStyle = '#161311', lineWidth = 2.5, boilAmp = 1.2, segments = 12, seed = 0) {
    const pts = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    this.drawBoilPolygon(pts, fillStyle, strokeStyle, lineWidth, boilAmp, seed + Math.floor(cx));
  }

  /**
   * Draw a boiling line between two points
   */
  drawBoilLine(x1, y1, x2, y2, strokeStyle = '#161311', lineWidth = 2.5, boilAmp = 1.4, seed = 0) {
    const ctx = this.ctx;
    const mx = (x1 + x2) * 0.5 + this.jitter(seed + 1, boilAmp);
    const my = (y1 + y2) * 0.5 + this.jitter(seed + 2, boilAmp);
    ctx.beginPath();
    ctx.moveTo(x1 + this.jitter(seed + 3, boilAmp * 0.5), y1 + this.jitter(seed + 4, boilAmp * 0.5));
    ctx.quadraticCurveTo(mx, my, x2 + this.jitter(seed + 5, boilAmp * 0.5), y2 + this.jitter(seed + 6, boilAmp * 0.5));
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /**
   * Draw a close-up 90s cartoon portrait of "SNOTTY" the Crazy Caddie
   * Shows upper gums, bloodshot squinty eyes, massive forehead, and concussion lumps!
   */
  drawCaddiePortrait(x, y, size, state = {}) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    const s = size / 100;
    ctx.scale(s, s);

    const lumps = state.lumps || 0;
    const ducking = state.ducking || false;
    const talking = state.talking || false;
    const hasHelmet = state.hasHelmet || false;
    const hurtFlash = state.hurtTimer > 0;
    const isLizard = state.isLizard || false;

    // Background portrait box (radioactive neon green if mutated into Lizard!)
    this.drawBoilBox(
      0,
      0,
      100,
      100,
      hurtFlash ? '#d93829' : isLizard ? '#3a7d1c' : '#c99e52',
      '#161311',
      3.5,
      1.6,
      77
    );

    // Diagonal ink hatch lines in background
    ctx.strokeStyle = 'rgba(22, 19, 17, 0.18)';
    ctx.lineWidth = 1.5;
    for (let i = -80; i < 100; i += 14) {
      ctx.beginPath();
      ctx.moveTo(Math.max(4, i), 4);
      ctx.lineTo(Math.min(96, i + 70), 96);
      ctx.stroke();
    }

    if (ducking && !isLizard) {
      ctx.translate(0, 22);
    }

    const skinColor = isLizard ? '#66e024' : this.palette.skin;

    // Scaly / Skinny neck
    this.drawBoilPolygon(
      [[35, 72], [63, 72], [68, 96], [30, 96]],
      skinColor,
      this.palette.ink,
      2.5,
      1.2,
      10
    );
    // Torn Caddie Bib
    this.drawBoilPolygon(
      [[20, 84], [80, 84], [88, 98], [12, 98]],
      isLizard ? '#7be0ff' : '#e3ded1',
      this.palette.ink,
      2.5,
      1.2,
      12
    );

    if (isLizard) {
      // Dorsal lizard spikes along side of head/neck
      this.drawBoilPolygon([[16, 42], [26, 36], [25, 50]], '#ffbe1a', this.palette.ink, 2, 1.0, 15);
      this.drawBoilPolygon([[14, 60], [26, 54], [25, 68]], '#ffbe1a', this.palette.ink, 2, 1.0, 16);
    }

    // Giant Head
    this.drawBoilPolygon(
      [
        [26, 24],
        [74, 22],
        [80, 48],
        [72, 79],
        [30, 79],
        [22, 52]
      ],
      hurtFlash ? '#f2857e' : skinColor,
      this.palette.ink,
      2.8,
      1.4,
      20
    );

    // Pulsating Purple Goose-Egg Concussion Lumps on head!
    for (let i = 0; i < lumps; i++) {
      const lx = 36 + i * 18;
      const ly = 16 - i * 3;
      const pulse = Math.sin(Date.now() * 0.015 + i) * 2;
      this.drawBoilEllipse(lx, ly, 9 + pulse, 11 + pulse, '#9e479c', this.palette.ink, 2.2, 1.3, 10, 30 + i);
      this.drawBoilLine(lx - 11, ly - 10, lx - 6, ly - 15, '#d92b2b', 2, 1.0, 41 + i);
      this.drawBoilLine(lx + 11, ly - 10, lx + 6, ly - 15, '#d92b2b', 2, 1.0, 45 + i);
    }

    // Hair / Helmet / Lizard Spines
    if (isLizard) {
      // Lizard Dorsal Crest Spines on top of head + ragged pompadour tufts!
      this.drawBoilPolygon([[34, 24], [42, 6], [50, 23]], '#ff5722', this.palette.ink, 2.4, 1.1, 55);
      this.drawBoilPolygon([[48, 23], [58, 4], [66, 23]], '#ffbe1a', this.palette.ink, 2.4, 1.1, 56);
      this.drawBoilPolygon([[62, 23], [74, 8], [76, 26]], '#ff5722', this.palette.ink, 2.4, 1.1, 57);
    } else if (!hasHelmet) {
      this.drawBoilPolygon(
        [
          [24, 34],
          [18, 15],
          [32, 8],
          [48, 5],
          [66, 7],
          [82, 16],
          [75, 32],
          [62, 24],
          [36, 25]
        ],
        '#593e25',
        this.palette.ink,
        2.5,
        1.7,
        50
      );
      this.drawBoilLine(40, 6, 44, 1, this.palette.ink, 2, 1.2, 51);
      this.drawBoilLine(58, 7, 65, 2, this.palette.ink, 2, 1.2, 52);
    } else {
      // Galvanized Trash-Can Lid Helmet strapped to head!
      this.drawBoilPolygon(
        [
          [14, 30],
          [22, 14],
          [78, 14],
          [86, 30]
        ],
        '#8f999e',
        this.palette.ink,
        2.8,
        1.3,
        60
      );
      this.drawBoilBox(42, 7, 16, 7, '#6f787d', this.palette.ink, 2.2, 1.0, 62);
    }

    // Heavy furrowed brow & forehead wrinkles
    this.drawBoilLine(34, 33, 66, 32, this.palette.ink, 1.8, 1.0, 70);
    this.drawBoilLine(30, 41, 47, 45, this.palette.ink, 2.6, 1.1, 71);
    this.drawBoilLine(70, 41, 53, 45, this.palette.ink, 2.6, 1.1, 72);

    // Eyes (Yellow Reptile Slit Eyes if Lizard!)
    const eyeFill = isLizard ? '#ffea00' : '#f7efe1';
    this.drawBoilEllipse(39, 47, 7.5, 5, eyeFill, this.palette.ink, 2, 0.9, 8, 80);
    this.drawBoilEllipse(61, 47, 7.5, 5, eyeFill, this.palette.ink, 2, 0.9, 8, 81);
    ctx.fillStyle = isLizard ? '#d92b2b' : this.palette.ink;
    if (isLizard) {
      // Vertical reptile slit pupils!
      ctx.fillRect(39, 43, 2.4, 8);
      ctx.fillRect(60, 43, 2.4, 8);
    } else {
      ctx.beginPath();
      ctx.arc(40 + this.jitter(82, 0.7), 47, 2.1, 0, Math.PI * 2);
      ctx.arc(60 + this.jitter(83, 0.7), 47, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nose / Reptile Snout nostrils
    this.drawBoilPolygon(
      [[47, 46], [56, 55], [44, 56]],
      skinColor,
      this.palette.ink,
      2.2,
      0.9,
      90
    );
    ctx.fillStyle = this.palette.ink;
    ctx.beginPath();
    ctx.arc(47, 54, 1.7, 0, Math.PI * 2);
    ctx.arc(52, 54, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (Fangs + Forked Tongue / Fire glow if Lizard, else Upper Gums & Braces)
    const mouthH = talking || isLizard ? 16 : 12;
    this.drawBoilBox(34, 61, 32, mouthH, '#3b1518', this.palette.ink, 2.4, 1.1, 100);
    if (isLizard) {
      // Sharp reptile fangs & flickering forked fire tongue!
      this.drawBoilPolygon([[36, 61], [41, 69], [45, 61]], '#ffffff', this.palette.ink, 1.6, 0.6, 101);
      this.drawBoilPolygon([[55, 61], [59, 69], [64, 61]], '#ffffff', this.palette.ink, 1.6, 0.6, 102);
      this.drawBoilLine(50, 72, 68, 76, '#ff2a1f', 2.8, 1.1, 103);
      this.drawBoilLine(68, 76, 75, 72, '#ff2a1f', 2.2, 0.9, 104);
      this.drawBoilLine(68, 76, 75, 80, '#ff2a1f', 2.2, 0.9, 105);
    } else {
      this.drawBoilBox(35, 61, 30, 5.5, this.palette.gums, this.palette.ink, 1.5, 0.8, 101);
      this.drawBoilBox(36, 66, 28, 5.5, this.palette.teeth, this.palette.ink, 1.6, 0.8, 102);
      for (let tx = 41; tx <= 59; tx += 6) {
        this.drawBoilLine(tx, 66, tx, 71.5, this.palette.ink, 1.4, 0.5, 105 + tx);
      }
      this.drawBoilLine(36, 68.8, 64, 68.8, '#6e7b85', 1.5, 0.4, 110);
    }

    ctx.restore();
  }

  /**
   * Draw Cletus (Your Idiot Co-Caddie on the Dumpster Couch)
   */
  drawCletusPortrait(x, y, size, talking = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    const s = size / 100;
    ctx.scale(s, s);

    this.drawBoilBox(0, 0, 100, 100, '#5a7347', '#161311', 3.5, 1.6, 201);

    // Neck & AC/DC-style ripped t-shirt ("SKULL")
    this.drawBoilPolygon([[36, 72], [64, 72], [68, 96], [32, 96]], this.palette.skin, this.palette.ink, 2.5, 1.1, 202);
    this.drawBoilPolygon([[16, 82], [84, 82], [92, 98], [8, 98]], '#262423', this.palette.ink, 2.5, 1.2, 203);

    // Underbite jaw head
    this.drawBoilPolygon(
      [[30, 28], [70, 28], [76, 56], [78, 80], [22, 80], [24, 56]],
      this.palette.skin,
      this.palette.ink,
      2.8,
      1.4,
      204
    );

    // Backward Red Baseball Cap & blonde mullet tufts
    this.drawBoilPolygon([[16, 36], [20, 55], [27, 45]], '#d4b44a', this.palette.ink, 2, 1.3, 205);
    this.drawBoilPolygon([[84, 36], [80, 55], [73, 45]], '#d4b44a', this.palette.ink, 2, 1.3, 206);
    this.drawBoilPolygon([[24, 32], [28, 12], [72, 12], [76, 32]], '#b82c25', this.palette.ink, 2.6, 1.3, 207);
    this.drawBoilBox(68, 25, 22, 7, '#b82c25', this.palette.ink, 2.4, 1.2, 208);

    // Bugged-out manic eyes
    this.drawBoilEllipse(39, 45, 7.5, 6.5, '#f7efe1', this.palette.ink, 2.2, 1.0, 8, 210);
    this.drawBoilEllipse(61, 45, 7.5, 6.5, '#f7efe1', this.palette.ink, 2.2, 1.0, 8, 211);
    ctx.fillStyle = this.palette.ink;
    ctx.beginPath();
    ctx.arc(40, 45, 2.2, 0, Math.PI * 2);
    ctx.arc(60, 45, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Pointy nose
    this.drawBoilPolygon([[48, 43], [58, 54], [46, 55]], this.palette.skin, this.palette.ink, 2.2, 1.0, 212);

    // Manic Grin
    const mh = talking ? 14 : 9;
    this.drawBoilBox(34, 62, 34, mh, '#3b1518', this.palette.ink, 2.4, 1.1, 213);
    this.drawBoilBox(35, 62, 32, 5, this.palette.teeth, this.palette.ink, 1.6, 0.9, 214);

    ctx.restore();
  }

  /**
   * Draw Top-Down 3/4 Golf Cart OR Giant Mutant Lizard ("SNOTZILLA") with Whipping Tail & Fire Breath!
   */
  drawGolfCart(player) {
    if (player.isLizard) {
      this.drawMutantLizard(player);
      return;
    }

    const ctx = this.ctx;
    ctx.save();

    // Jump offset when hitting sand bunker ramps, or bobbing up/down when floating in a pond!
    const bobOffset = player.inWater ? Math.sin(player.waterBobPhase || 0) * 3.2 - 3 : 0;
    const zOffset = (player.z || 0) + bobOffset;

    // 1. High-Visibility Arcade Locator Ring & Forward Direction Chevron on the ground
    ctx.save();
    ctx.translate(player.x, player.y + 4);
    ctx.rotate(player.angle);

    if (player.inWater) {
      // Expanding boiling water wake ripples around the floating cart!
      const ripplePulse = (Date.now() * 0.02) % 10;
      const ringColor = player.waterToxic ? '#a4ff3b' : '#b8e8fa';
      this.drawBoilEllipse(0, 0, 32 + ripplePulse * 0.6, 22 + ripplePulse * 0.4, null, ringColor, 2.5, 1.3, 14, 305);
      this.drawBoilEllipse(0, 0, 39 + ripplePulse * 0.9, 27 + ripplePulse * 0.6, null, 'rgba(255,255,255,0.55)', 1.8, 1.4, 14, 306);
    } else {
      // Subtle bright arcade highlight halo + dark drop shadow so cart pops off green turf!
      ctx.fillStyle = 'rgba(255, 230, 50, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, -2, 36, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(0, 3, 31, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Forward-Pointing Directional Arrow Chevron in front of the cart
    this.drawBoilPolygon(
      [
        [36, -9],
        [47, 0],
        [36, 9],
        [39, 0]
      ],
      '#ffea00',
      '#161311',
      2.2,
      0.7,
      308
    );
    ctx.restore();

    // 2. Cart body lifted by zOffset (scaled 1.22x for crystal-clear visibility on mobile & desktop!)
    ctx.translate(player.x, player.y - zOffset);
    const waveTilt = player.inWater ? Math.sin((player.waterBobPhase || 0) * 0.7) * 0.06 : 0;
    ctx.rotate(player.angle + waveTilt);
    ctx.scale(1.22, 1.22);

    // 3. Glowing Headlight Cones projecting forward
    ctx.save();
    const grad = ctx.createLinearGradient(22, 0, 62, 0);
    grad.addColorStop(0, 'rgba(255, 248, 160, 0.55)');
    grad.addColorStop(1, 'rgba(255, 248, 160, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(22, -10);
    ctx.lineTo(62, -22);
    ctx.lineTo(62, 22);
    ctx.lineTo(22, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4 Chunky Rubber Tires with whitewall rims (partially submerged when floating in water)
    if (!player.inWater) {
      const wheelCoords = [
        [-17, -16],
        [15, -16],
        [-17, 16],
        [15, 16]
      ];
      wheelCoords.forEach(([wx, wy], idx) => {
        this.drawBoilBox(wx - 5.5, wy - 4, 11, 8, '#141210', this.palette.ink, 2.2, 0.8, 300 + idx);
        // Bright yellow rim hubcap
        ctx.fillStyle = '#f7d53b';
        ctx.fillRect(wx - 2, wy - 1.5, 4, 3);
      });
    }

    // Rear bumper & battery compartment
    this.drawBoilBox(-25, -13, 12, 26, '#ff3b2f', this.palette.ink, 2.6, 1.0, 310);

    // Main Fiberglass Cart Chassis — Pure Crisp White with thick 3.2px ink border!
    const bodyColor = player.upgrades.armor > 0 ? '#a8b8c0' : '#ffffff';
    this.drawBoilPolygon(
      [
        [-21, -14],
        [18, -13],
        [25, -9],
        [25, 9],
        [18, 13],
        [-21, 14]
      ],
      bodyColor,
      this.palette.ink,
      3.2,
      1.1,
      311
    );

    // Blazing Hot-Rod Yellow-Orange Front Hood & Red Flame Racing Stripe!
    this.drawBoilPolygon(
      [
        [6, -12.5],
        [18, -12.5],
        [24.5, -8.5],
        [24.5, 8.5],
        [18, 12.5],
        [6, 12.5]
      ],
      '#ffb300',
      this.palette.ink,
      2.4,
      0.9,
      312
    );
    // Red Hot-Rod Flame Stripe on Hood
    this.drawBoilPolygon(
      [
        [24, -4],
        [11, -7],
        [15, -2],
        [9, 0],
        [15, 2],
        [11, 7],
        [24, 4]
      ],
      '#ff2a1f',
      this.palette.ink,
      1.8,
      0.7,
      313
    );

    // Bright Headlight Lamps on front corners
    this.drawBoilBox(22, -10, 4, 5, '#ffffa8', this.palette.ink, 1.8, 0.4, 340);
    this.drawBoilBox(22, 5, 4, 5, '#ffffa8', this.palette.ink, 1.8, 0.4, 341);

    // Bench Seat (Bold red vinyl) & Dark Floorboard
    this.drawBoilBox(-13, -11.5, 12, 23, '#d92b2b', this.palette.ink, 2.2, 0.8, 314);
    this.drawBoilBox(-1, -10, 9, 20, '#2b2826', this.palette.ink, 1.8, 0.7, 315);

    // Stolen Golf Ball Basket on the back (fills up visually as you collect balls!)
    this.drawBoilBox(-26, -10.5, 11, 21, '#262320', this.palette.ink, 2.4, 0.8, 316);
    const visibleBalls = Math.min(12, Math.floor(player.ballsCarried / 2));
    for (let b = 0; b < visibleBalls; b++) {
      const bx = -23 + (b % 2) * 4.2;
      const by = -7 + Math.floor(b / 2) * 2.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Steering column & wheel
    this.drawBoilLine(11, -3, 4, -3, this.palette.ink, 2.6, 0.5, 317);
    this.drawBoilEllipse(4, -3, 2.8, 5.5, null, this.palette.ink, 2.4, 0.5, 8, 318);

    // Snotty the Caddie sitting in driver seat!
    const headX = player.ducking ? 5 : -3;
    const headRadius = player.ducking ? 7 : 9;
    // Caddie Torso & bright caddie bib
    this.drawBoilEllipse(-3, -3, 7.5, 8.5, '#7be0ff', this.palette.ink, 2.3, 0.8, 8, 320);

    // Caddie Big Forehead & Pompadour (or Trash-Can Lid Helmet!)
    this.drawBoilEllipse(headX, -3, headRadius, headRadius * 0.9, this.palette.skin, this.palette.ink, 2.4, 0.9, 10, 321);
    if (player.hasHelmet) {
      this.drawBoilEllipse(headX, -3, headRadius + 1.8, headRadius + 1.2, '#b0bec5', this.palette.ink, 2.4, 0.9, 10, 322);
      this.drawBoilBox(headX - 3, -5, 5, 4, '#ffea00', this.palette.ink, 1.5, 0.4, 345);
    } else {
      // Pompadour hair pointing forward
      this.drawBoilPolygon(
        [
          [headX - 6, -9.5],
          [headX + 8.5, -7.5],
          [headX + 9.5, 1],
          [headX - 6, 3]
        ],
        '#593e25',
        this.palette.ink,
        2.2,
        1.0,
        323
      );
    }

    // Pulsating purple lump on top of head if concussed
    if (player.lumps > 0) {
      this.drawBoilEllipse(headX - 2, -8.5, 4.8, 4.8, '#b342b0', this.palette.ink, 2.0, 0.8, 8, 324);
    }

    // Double-Decker Airhorn mounted on hood if upgraded
    if (player.upgrades.airhorn > 0) {
      this.drawBoilPolygon([[12, 8], [24, 5], [24, 12]], '#ff2a1f', this.palette.ink, 2.2, 0.8, 325);
    }

    // PVC Potato-Gun Ball Cannon mounted on passenger side if unlocked!
    if (player.upgrades.cannon > 0) {
      this.drawBoilBox(-4, 6, 29, 6.5, '#29b6f6', this.palette.ink, 2.3, 0.8, 326);
      this.drawBoilBox(22, 5, 5, 8.5, '#161311', this.palette.ink, 2, 0.7, 327);
    }

    // Fiberglass Sun Roof (bright yellow-white striped canopy when equipped!)
    if (player.hasRoof) {
      this.drawBoilBox(-18, -13, 34, 26, 'rgba(255, 245, 190, 0.82)', this.palette.ink, 2.8, 1.1, 330);
      this.drawBoilLine(-16, -11, 14, 11, 'rgba(255, 59, 47, 0.45)', 2.5, 0.7, 331);
    }

    ctx.restore();
  }

  /**
   * Draw SNOTZILLA: Giant Scaly Mutant Lizard with Massive Whipping Tail & Flamethrower Breath!
   */
  drawMutantLizard(player) {
    const ctx = this.ctx;

    // 1. Draw the ditched/abandoned steaming Golf Cart near the Radioactive Pond if present!
    if (player.abandonedCart) {
      const ac = player.abandonedCart;
      ctx.save();
      ctx.translate(ac.x, ac.y);
      ctx.rotate(ac.angle);
      ctx.globalAlpha = 0.85;
      this.drawBoilBox(-21, -13, 42, 26, '#d6ccb8', this.palette.ink, 2.5, 1.0, 390);
      this.drawBoilBox(4, -12, 17, 24, '#ffb300', this.palette.ink, 2, 0.8, 391);
      ctx.restore();
    }

    // 2. Draw Roaring Flamethrower Fire Breath Cone in world space if active!
    if (player.fireBreathTimer > 0) {
      ctx.save();
      ctx.translate(player.x, player.y - (player.z || 0));
      ctx.rotate(player.angle);

      const range = player.fireBreathRange || 230;
      const spread = 58;
      // Outer roaring orange-red flame cone
      this.drawBoilPolygon(
        [
          [20, -6],
          [range * 0.55, -spread * 0.65],
          [range, -spread],
          [range * 1.08, 0],
          [range, spread],
          [range * 0.55, spread * 0.65],
          [20, 6]
        ],
        'rgba(255, 65, 20, 0.85)',
        '#161311',
        2.5,
        3.8,
        395
      );
      // Inner white-hot yellow core flame
      this.drawBoilPolygon(
        [
          [22, -3],
          [range * 0.72, -spread * 0.45],
          [range * 0.85, 0],
          [range * 0.72, spread * 0.45],
          [22, 3]
        ],
        '#ffea00',
        '#ff9100',
        2,
        2.8,
        396
      );
      ctx.restore();
    }

    // 3. Draw Massive Whipping Segmented Lizard Tail in world space!
    const segs = player.tailSegments || [];
    for (let i = segs.length - 1; i >= 0; i--) {
      const seg = segs[i];
      const tRatio = 1 - i / segs.length; // Larger near base, tapering to spiked club tip
      const r = 6 + tRatio * 13;

      // Tail shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(seg.x, seg.y + 5, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Scaly green tail segment
      this.drawBoilEllipse(
        seg.x,
        seg.y - (player.z || 0) * tRatio,
        r,
        r * 0.88,
        i % 2 === 0 ? '#4cbb17' : '#66e024',
        this.palette.ink,
        2.6,
        1.1,
        10,
        400 + i
      );

      // Yellow-orange dorsal spike on each tail segment
      this.drawBoilEllipse(
        seg.x,
        seg.y - (player.z || 0) * tRatio - 2,
        r * 0.42,
        r * 0.35,
        '#ffbe1a',
        this.palette.ink,
        1.6,
        0.6,
        6,
        420 + i
      );
    }

    // 4. Draw Giant Mutant Lizard Body & Clawed Limbs
    ctx.save();
    const zOffset = player.z || 0;

    // Radioactive green aura ring + shadow on ground
    ctx.save();
    ctx.translate(player.x, player.y + 5);
    ctx.rotate(player.angle);
    ctx.fillStyle = 'rgba(118, 255, 3, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Forward direction chevron
    this.drawBoilPolygon([[38, -8], [49, 0], [38, 8], [41, 0]], '#a4ff3b', '#161311', 2.2, 0.6, 430);
    ctx.restore();

    ctx.translate(player.x, player.y - zOffset);
    ctx.rotate(player.angle);
    ctx.scale(1.28, 1.28);

    const walkCycle = Math.sin((player.walkPhase || 0) * 1.4) * 6;

    // Stomping scaly hind legs & 3-toed claws
    this.drawBoilBox(-12 - walkCycle * 0.5, -22, 12, 9, '#3a9410', this.palette.ink, 2.4, 0.9, 431);
    this.drawBoilBox(-12 + walkCycle * 0.5, 13, 12, 9, '#3a9410', this.palette.ink, 2.4, 0.9, 432);

    // Clawed front arms reaching forward
    this.drawBoilBox(4 + walkCycle * 0.6, -20, 14, 7, '#4cbb17', this.palette.ink, 2.4, 0.9, 433);
    this.drawBoilBox(4 - walkCycle * 0.6, 13, 14, 7, '#4cbb17', this.palette.ink, 2.4, 0.9, 434);

    // Massive Scaly Lizard Torso + Shredded Cyan Caddie Bib
    this.drawBoilEllipse(-2, 0, 20, 15, '#4cbb17', this.palette.ink, 3.0, 1.2, 12, 435);
    this.drawBoilPolygon([[-8, -11], [10, -12], [6, 12], [-10, 10]], '#7be0ff', this.palette.ink, 2.2, 1.0, 436);

    // Dorsal orange-yellow Godzilla spines down back
    for (let s = -12; s <= 4; s += 8) {
      this.drawBoilPolygon([[s - 4, 0], [s, -5], [s + 4, 0], [s, 5]], '#ffbe1a', this.palette.ink, 2.0, 0.7, 440 + s);
    }

    // Giant Reptile Snout & Jaws
    this.drawBoilPolygon(
      [
        [8, -11],
        [27, -8],
        [31, 0],
        [27, 8],
        [8, 11]
      ],
      '#66e024',
      this.palette.ink,
      2.8,
      1.1,
      450
    );

    // Glowing Yellow Reptile Slit Eyes
    this.drawBoilEllipse(16, -6, 4.5, 3, '#ffea00', this.palette.ink, 1.8, 0.5, 8, 451);
    this.drawBoilEllipse(16, 6, 4.5, 3, '#ffea00', this.palette.ink, 1.8, 0.5, 8, 452);
    ctx.fillStyle = '#d92b2b';
    ctx.fillRect(15.5, -7.5, 2, 3);
    ctx.fillRect(15.5, 4.5, 2, 3);

    // Flickering Forked Tongue
    if (player.fireBreathTimer <= 0 && Math.floor(Date.now() / 180) % 2 === 0) {
      this.drawBoilLine(31, 0, 40, 0, '#ff2a1f', 2.2, 0.7, 453);
      this.drawBoilLine(40, 0, 45, -4, '#ff2a1f', 1.8, 0.6, 454);
      this.drawBoilLine(40, 0, 45, 4, '#ff2a1f', 1.8, 0.6, 455);
    }

    ctx.restore();
  }

  /**
   * Draw COUNTRY CLUB KONG: Giant Gorilla Boss in a Torn Pink Argyle Sweater-Vest & Golf Visor!
   */
  drawKong(kong) {
    const ctx = this.ctx;

    // 1. Draw hurled golf carts / boulders in flight
    if (kong.projectiles) {
      kong.projectiles.forEach((proj, idx) => {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath();
        ctx.ellipse(proj.x, proj.y + 6, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(proj.x, proj.y - (proj.z || 0));
        ctx.rotate(proj.angle || 0);
        // Hurled crushed golf cart / country club boulder
        this.drawBoilBox(-18, -12, 36, 24, '#efe3c8', this.palette.ink, 2.8, 1.2, 600 + idx);
        this.drawBoilBox(-14, -9, 14, 18, '#d92b2b', this.palette.ink, 2, 0.9, 620 + idx);
        ctx.restore();
      });
    }

    ctx.save();
    const zOffset = kong.z || 0;

    // Giant ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(kong.x, kong.y + 10, 44, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(kong.x, kong.y - zOffset);

    if (kong.state === 'defeated') {
      ctx.rotate(kong.ragdollAngle || 0.5);
    } else {
      ctx.rotate(kong.angle);
    }

    const chestBeat = kong.state === 'roar' ? Math.sin(Date.now() * 0.03) * 8 : Math.sin((kong.walkPhase || 0) * 1.2) * 6;
    const furColor = kong.burnTimer > 0 ? '#8c3b2b' : '#3b281e';
    const skinColor = '#5e4336';

    // Massive Muscular Gorilla Arms & Giant Hairy Fists
    this.drawBoilBox(-6 + chestBeat, -44, 28, 18, furColor, this.palette.ink, 3.2, 1.4, 650);
    this.drawBoilEllipse(24 + chestBeat, -38, 14, 13, skinColor, this.palette.ink, 3.0, 1.2, 10, 651);

    this.drawBoilBox(-6 - chestBeat, 26, 28, 18, furColor, this.palette.ink, 3.2, 1.4, 652);
    this.drawBoilEllipse(24 - chestBeat, 38, 14, 13, skinColor, this.palette.ink, 3.0, 1.2, 10, 653);

    // Hulking Gorilla Barrel Chest in a Torn Pastel-Pink Country Club Argyle Sweater-Vest!
    this.drawBoilEllipse(-4, 0, 32, 28, furColor, this.palette.ink, 3.5, 1.5, 14, 654);
    this.drawBoilPolygon(
      [
        [-22, -24],
        [14, -22],
        [18, 22],
        [-22, 24]
      ],
      '#eb5e7b',
      this.palette.ink,
      3.0,
      1.3,
      655
    );
    // Argyle yellow diamond pattern on Kong's sweater vest
    this.drawBoilPolygon([[-6, -12], [2, -6], [-6, 0], [-14, -6]], '#f7d53b', this.palette.ink, 1.8, 0.7, 656);
    this.drawBoilPolygon([[-6, 2], [2, 8], [-6, 14], [-14, 8]], '#f7d53b', this.palette.ink, 1.8, 0.7, 657);

    // Giant Angry Gorilla Head with Snarling Fangs & Tiny White Country Club Visor!
    this.drawBoilEllipse(14, 0, 18, 17, furColor, this.palette.ink, 3.2, 1.3, 12, 660);
    this.drawBoilEllipse(21, 0, 11, 13, skinColor, this.palette.ink, 2.5, 1.0, 10, 661);

    // Bloodshot furious Kong eyes
    this.drawBoilEllipse(19, -6, 4.5, 3.5, '#ffea00', this.palette.ink, 2, 0.5, 8, 662);
    this.drawBoilEllipse(19, 6, 4.5, 3.5, '#ffea00', this.palette.ink, 2, 0.5, 8, 663);
    ctx.fillStyle = '#d92b2b';
    ctx.beginPath();
    ctx.arc(20, -6, 1.8, 0, Math.PI * 2);
    ctx.arc(20, 6, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Roaring Ape Jaws
    this.drawBoilBox(24, -7, 8, 14, '#3b1518', this.palette.ink, 2.2, 0.9, 664);
    this.drawBoilBox(25, -6, 3, 12, '#ffffff', this.palette.ink, 1.5, 0.5, 665);

    // Tiny Crooked White Country Club Visor on top of Kong's dome!
    this.drawBoilPolygon([[12, -11], [26, -8], [26, 8], [12, 11]], '#ffffff', this.palette.ink, 2.2, 0.8, 666);

    ctx.restore();
  }

  /**
   * Draw Country Club Snob Golfer (with polo shirt, plaid pants, backswing indicator, or airborne flipping ragdoll!)
   */
  drawGolfer(g) {
    const ctx = this.ctx;

    // Draw flying/dropped golf club if knocked out
    if (g.droppedClub) {
      const dc = g.droppedClub;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(dc.x, dc.y + 4, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(dc.x, dc.y - (dc.z || 0));
      ctx.rotate(dc.angle);
      this.drawBoilLine(-12, 0, 12, 0, '#d4dce0', 2.4, 0.7, g.id + 71);
      this.drawBoilEllipse(12, 0, 4, 2.5, '#3b4042', this.palette.ink, 1.8, 0.5, 6, g.id + 72);
      ctx.restore();
    }

    ctx.save();

    // Ground shadow (shrinks slightly as golfer flies high into the air!)
    const zHeight = g.z || 0;
    const shadowScale = Math.max(0.45, 1 - zHeight * 0.003);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 5, 14 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (g.state === 'ragdoll' || g.state === 'ko') {
      // Lift body by airborne height zHeight and scale up for 3D camera zoom!
      ctx.translate(g.x, g.y - zHeight);
      const airScale = 1 + Math.min(0.75, zHeight * 0.0045);
      ctx.scale(airScale, airScale);
      ctx.rotate(g.ragdollAngle || 0);

      // 3D End-Over-End Somersault flip squash while airborne!
      if (zHeight > 2) {
        const flipScale = 0.35 + 0.65 * Math.abs(Math.cos(g.flipPhase || 0));
        const flipSign = Math.cos(g.flipPhase || 0) >= 0 ? 1 : -1;
        ctx.scale(flipScale * flipSign, 1);
      }

      const flail = Math.sin(g.limbFlail || 0) * 6;

      // Flailing hairy legs in ugly plaid shorts
      ctx.save();
      ctx.translate(-10, -5);
      ctx.rotate(-0.35 + flail * 0.06);
      this.drawBoilBox(-12, -3, 13, 6, g.pantsColor, this.palette.ink, 2, 1.0, g.id + 1);
      this.drawBoilBox(-18, -2.5, 7, 5, this.palette.skin, this.palette.ink, 1.8, 0.8, g.id + 5);
      ctx.restore();

      ctx.save();
      ctx.translate(-10, 5);
      ctx.rotate(0.35 - flail * 0.06);
      this.drawBoilBox(-12, -3, 13, 6, g.pantsColor, this.palette.ink, 2, 1.0, g.id + 2);
      this.drawBoilBox(-18, -2.5, 7, 5, this.palette.skin, this.palette.ink, 1.8, 0.8, g.id + 6);
      ctx.restore();

      // Flailing arms
      this.drawBoilLine(2, -9, 8 + flail, -18, g.shirtColor, 4.5, 1.0, g.id + 7);
      this.drawBoilLine(2, 9, 8 - flail, 18, g.shirtColor, 4.5, 1.0, g.id + 8);

      // Fat polo torso
      this.drawBoilEllipse(0, 0, 12, 9.5, g.shirtColor, this.palette.ink, 2.3, 1.1, 10, g.id + 3);

      // Big red snob head with X eyes
      this.drawBoilEllipse(13, 0, 7.5, 7.5, this.palette.skinRed, this.palette.ink, 2.2, 1.0, 10, g.id + 4);
      this.drawBoilLine(11, -4, 15, -1, this.palette.ink, 1.8, 0.4, g.id + 15);
      this.drawBoilLine(15, -4, 11, -1, this.palette.ink, 1.8, 0.4, g.id + 16);
      this.drawBoilLine(11, 1, 15, 4, this.palette.ink, 1.8, 0.4, g.id + 17);
      this.drawBoilLine(15, 1, 11, 4, this.palette.ink, 1.8, 0.4, g.id + 18);

      ctx.restore();

      // Orbiting concussion stars when laid out on the turf
      if (zHeight <= 2) {
        ctx.save();
        const starSpin = Date.now() * 0.007;
        for (let s = 0; s < 3; s++) {
          const a = starSpin + (s * Math.PI * 2) / 3;
          const sx = g.x + Math.cos(a) * 16;
          const sy = g.y - 16 + Math.sin(a) * 6;
          ctx.fillStyle = '#f7d53b';
          ctx.strokeStyle = '#161311';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }

    ctx.translate(g.x, g.y);

    // Backswing danger ring (press SPACE / E to Airhorn Heckle right now!)
    if (g.state === 'backswing') {
      const pulse = 24 + Math.sin(Date.now() * 0.025) * 5;
      ctx.strokeStyle = g.aimAtPlayer ? '#ff2a1f' : '#f7d53b';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.rotate(g.angle);

    // Chubby Golf Snob Torso (Pastel Polo Shirt & Sweater Vest)
    this.drawBoilEllipse(0, 0, 10, 12, g.shirtColor, this.palette.ink, 2.4, 1.1, 10, g.id + 10);

    // Golf Club (Driver / 3-Iron)
    const swingAngle =
      g.state === 'backswing'
        ? -1.8 + Math.sin(Date.now() * 0.03) * 0.15
        : g.state === 'followthrough'
        ? 1.6
        : 0.4;
    const clubLen = 24;
    const cx = Math.cos(swingAngle) * clubLen;
    const cy = Math.sin(swingAngle) * clubLen;
    this.drawBoilLine(4, 8, 4 + cx, 8 + cy, '#d4dce0', 2.4, 0.9, g.id + 11);
    this.drawBoilEllipse(4 + cx, 8 + cy, 4, 2.5, '#3b4042', this.palette.ink, 1.8, 0.6, 6, g.id + 12);

    // Red sweaty face & white country club visor
    const headColor = g.aimAtPlayer || g.state === 'furious' ? '#e0483d' : this.palette.skin;
    this.drawBoilEllipse(2, 0, 7.5, 7.5, headColor, this.palette.ink, 2.3, 1.0, 10, g.id + 13);
    // White Visor brim
    this.drawBoilPolygon([[5, -6], [12, -4], [12, 4], [5, 6]], '#f5f2eb', this.palette.ink, 2, 0.8, g.id + 14);

    ctx.restore();

    // Compact exclamation badge above golfer during backswing
    if (g.state === 'backswing') {
      ctx.save();
      ctx.font = '900 14px "Trebuchet MS", "Arial Black", system-ui, sans-serif';
      ctx.textAlign = 'center';
      const label = g.aimAtPlayer ? 'FORE!' : 'HORN!';
      const tw = ctx.measureText(label).width + 14;
      this.drawBoilBox(g.x - tw / 2, g.y - 38, tw, 22, g.aimAtPlayer ? '#d92b2b' : '#f7d53b', '#161311', 2.2, 0.9, g.id + 99);
      ctx.fillStyle = g.aimAtPlayer ? '#ffffff' : '#161311';
      ctx.fillText(label, g.x, g.y - 22);
      ctx.restore();
    }
  }

  /**
   * Draw Head Ranger Chuck's High-Speed Turf Mower Boss Cart
   */
  drawRanger(r) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 28, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spinning Lawn Mower Blades on front!
    const bladeSpin = (Date.now() * 0.025) % (Math.PI * 2);
    for (let b = -9; b <= 9; b += 18) {
      ctx.save();
      ctx.translate(22, b);
      ctx.rotate(bladeSpin);
      this.drawBoilLine(-8, 0, 8, 0, '#cfd8dc', 3, 0.5, 501);
      this.drawBoilLine(0, -8, 0, 8, '#cfd8dc', 3, 0.5, 502);
      ctx.restore();
    }

    // Heavy Red Turf Tractor Body
    this.drawBoilBox(-24, -15, 44, 30, '#b8251e', this.palette.ink, 2.8, 1.3, 505);

    // Flashing Security Siren on hood
    const sirenOn = Math.floor(Date.now() / 120) % 2 === 0;
    this.drawBoilEllipse(12, 0, 5, 5, sirenOn ? '#ff2a1f' : '#2979ff', this.palette.ink, 2, 0.8, 8, 506);

    // Veiny purple-faced Head Ranger
    this.drawBoilEllipse(-4, 0, 9, 9, '#d95b52', this.palette.ink, 2.4, 1.1, 10, 507);
    // Aviator shades
    this.drawBoilBox(1, -5, 4, 4, '#111', this.palette.ink, 1.5, 0.5, 508);
    this.drawBoilBox(1, 1, 4, 4, '#111', this.palette.ink, 1.5, 0.5, 509);

    ctx.restore();
  }

  /**
   * Draw Comic Speech Bubble with boiling border (High-contrast legible cartoon font)
   */
  drawSpeechBubble(x, y, text, bg = '#fff7e0', fg = '#161311') {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '900 15px "Trebuchet MS", "Arial Black", system-ui, sans-serif';
    const pad = 12;
    const tw = ctx.measureText(text).width + pad * 2;
    const th = 28;
    const bx = x - tw / 2;
    const by = y - th - 12;

    this.drawBoilBox(bx, by, tw, th, bg, '#161311', 2.5, 1.0, Math.floor(x));
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, by + 19);
    ctx.restore();
  }
}

window.CartoonRenderer = CartoonRenderer;
