/**
 * CRAZY CADDY CARNAGE: Entities — Player Golf Cart & Mutant Lizard, Snob Golfers, 3D Arcing Golf Balls,
 * Head Ranger Chuck's Turf Mower, Country Club Kong, and Slapstick Ragdolls.
 */

class PlayerCart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2;
    this.speed = 0;
    this.z = 0; // Airborne jump height from sand bunkers
    this.vz = 0;

    // Concussion / Head Trauma System (3 direct head lumps = Knocked Out!)
    this.lumps = 0;
    this.maxLumps = 3;
    this.concussionSpin = 0;
    this.hurtTimer = 0;
    this.ducking = false;
    this.hasHelmet = false;
    this.hasRoof = false;

    // Ball Stash & Upgrades
    this.ballsCarried = 0; // Current round balls collected
    this.walletBalls = 0;  // Currency for the Dumpster Couch Shop
    this.turboFuel = 100;
    this.airhornCooldown = 0;
    this.cannonCooldown = 0;

    this.upgrades = {
      governor: 0, // Speed & drift boost
      armor: 0,    // Trash-can chassis & knockback resistance
      airhorn: 0,  // "The Bowel Shaker" double radius
      cannon: 0    // PVC Potato-Gun Ball Cannon
    };

    // Floating in Water Hazard state
    this.inWater = false;
    this.waterToxic = false;
    this.waterBobPhase = 0;

    // Radioactive Mutant Lizard ("SNOTZILLA") state!
    this.isLizard = false;
    this.tailSegments = [];
    this.fireBreathTimer = 0;
    this.fireBreathRange = 235;
    this.walkPhase = 0;
    this.abandonedCart = null;

    this.speechText = '';
    this.speechTimer = 0;
  }

  mutateIntoLizard(game, pond) {
    if (this.isLizard) return;
    this.isLizard = true;
    this.inWater = false;
    this.lumps = 0; // Radioactive ooze heals all skull lumps!
    this.concussionSpin = 0;

    // Ditch the golf cart at the edge of the radioactive pond!
    this.abandonedCart = {
      x: this.x - Math.cos(this.angle) * 28,
      y: this.y - Math.sin(this.angle) * 28,
      angle: this.angle + 0.35
    };

    // Build 8 connected Whipping Lizard Tail segments trailing behind Snotzilla
    this.tailSegments = [];
    const backX = -Math.cos(this.angle);
    const backY = -Math.sin(this.angle);
    for (let i = 0; i < 8; i++) {
      this.tailSegments.push({
        x: this.x + backX * (18 + i * 13),
        y: this.y + backY * (18 + i * 13),
        vx: 0,
        vy: 0
      });
    }

    if (window.sound.playMutation) window.sound.playMutation();
    setTimeout(() => window.sound.playChuckle('high'), 350);

    game.camera.shake = 18;
    game.spawnParticles(this.x, this.y, '#a4ff3b', 28);
    game.spawnParticles(this.x, this.y, '#ffea00', 14);
    game.addFloatingText(this.x, this.y - 45, 'MUTATED INTO SNOTZILLA! PRESS [FIRE!] TO TORCH!', '#a4ff3b');
    this.say('ROAAAR! I\'M A GIANT FIRE-BREATHING LIZARD!', 3.2);

    // The panicked Golf Club immediately calls in COUNTRY CLUB KONG!
    if (game.spawnKong) {
      setTimeout(() => game.spawnKong(), 1400);
    }
  }

  updateTail(dt, angularVel) {
    if (!this.isLizard || !this.tailSegments.length) return;
    let leadX = this.x - Math.cos(this.angle) * 16;
    let leadY = this.y - Math.sin(this.angle) * 16;
    const spacing = 13.5;

    // Perpendicular vector for tail-whip impulse when turning!
    const perpX = -Math.sin(this.angle);
    const perpY = Math.cos(this.angle);

    for (let i = 0; i < this.tailSegments.length; i++) {
      const seg = this.tailSegments[i];
      // Add whip momentum proportional to turn rate & distance along tail
      const whipForce = -angularVel * (i + 1) * 32;
      seg.vx = (seg.vx + perpX * whipForce * dt) * Math.pow(0.84, dt * 60);
      seg.vy = (seg.vy + perpY * whipForce * dt) * Math.pow(0.84, dt * 60);

      seg.x += seg.vx * dt;
      seg.y += seg.vy * dt;

      const dx = seg.x - leadX;
      const dy = seg.y - leadY;
      const dist = Math.hypot(dx, dy) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;

      // Constrain segment to spacing distance behind lead point
      const targetX = leadX + nx * spacing;
      const targetY = leadY + ny * spacing;
      seg.vx += (targetX - seg.x) * 16 * dt;
      seg.vy += (targetY - seg.y) * 16 * dt;
      seg.x = targetX;
      seg.y = targetY;

      leadX = seg.x;
      leadY = seg.y;
    }
  }

  say(text, duration = 2.2) {
    this.speechText = text;
    this.speechTimer = duration;
  }

  update(dt, keys, world, game) {
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.speechTimer > 0) this.speechTimer -= dt;
    if (this.airhornCooldown > 0) this.airhornCooldown -= dt;
    if (this.cannonCooldown > 0) this.cannonCooldown -= dt;
    if (this.fireBreathTimer > 0) this.fireBreathTimer -= dt;
    if (this.concussionSpin > 0) this.concussionSpin = Math.max(0, this.concussionSpin - dt * 0.45);

    const tc = game.touchControls || {};

    // Ducking under steering wheel (C / Control or mobile DUCK button) reduces headshot hitbox!
    this.ducking = Boolean(!this.isLizard && (keys['KeyC'] || keys['ControlLeft'] || keys['ControlRight'] || tc.duck));

    // Check terrain before computing physics
    const inPond = world.isInPond(this.x, this.y);
    const inBunker = world.isInBunker(this.x, this.y);
    const onGreen = world.isOnGreen(this.x, this.y);

    // Driving into the Glowing Green Radioactive Pond mutates Snotty into the Giant Lizard!
    if (inPond && inPond.toxic && this.z <= 4 && !this.isLizard) {
      this.mutateIntoLizard(game, inPond);
    }

    // Handle Splash Entry & Shore Exit for Blue Water Hazards (Cart floats in Swan Pond; Lizard wades freely!)
    const currentlyInWater = Boolean(inPond && !inPond.toxic && !this.isLizard && this.z <= 2);
    if (currentlyInWater && !this.inWater) {
      // Just splashed into the pond!
      this.inWater = true;
      this.waterToxic = false;
      this.vx *= 0.35;
      this.vy *= 0.35;
      if (window.sound.playWaterSplash) window.sound.playWaterSplash();
      game.spawnParticles(this.x, this.y, '#a6d9eb', 16);
      game.addFloatingText(this.x, this.y - 30, 'SPLASH! FLOATING TO SHORE...', '#73b3c9');
      this.say('WE\'RE A BOAT, DUDE!');
    } else if (!currentlyInWater && this.inWater) {
      // Just hit the shore! Regain dry-land tire grip!
      this.inWater = false;
      this.waterToxic = false;
      game.spawnParticles(this.x, this.y, '#73b3c9', 8);
      game.addFloatingText(this.x, this.y - 26, 'BACK ON SHORE!', '#f7d53b');
    }

    if (this.inWater) {
      this.waterBobPhase += dt * 5.5;
    }

    // When floating in water, speed & acceleration drop way down; when Lizard, fast stomping & high turn rate!
    const topSpeed = this.inWater
      ? 78
      : this.isLizard
      ? 355 + this.upgrades.governor * 40
      : (335 + this.upgrades.governor * 55) * (this.ducking ? 0.78 : 1.0);
    const accel = this.inWater
      ? 145
      : this.isLizard
      ? 680
      : 540 + this.upgrades.governor * 90;
    const turnRate = (this.inWater ? 1.85 : this.isLizard ? 3.85 : this.ducking ? 2.4 : 3.35) + this.upgrades.governor * 0.25;

    let throttle = 0;
    if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
    if (keys['KeyS'] || keys['ArrowDown']) throttle -= 0.75;

    let steer = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) steer -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) steer += 1;

    // Mobile Virtual Thumbstick: point-to-steer + proportional throttle!
    if (tc.stickActive && tc.stickMag > 0.12) {
      const targetAngle = Math.atan2(tc.stickY, tc.stickX);
      let diff = targetAngle - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      steer = Math.max(-1.25, Math.min(1.25, diff * 2.2));
      throttle = Math.min(1, tc.stickMag * 1.15);
    }

    // Concussion wobble or floating water current sway
    if (this.concussionSpin > 0) {
      steer += Math.sin(Date.now() * 0.012) * 0.45 * this.concussionSpin;
    }
    if (this.inWater) {
      steer += Math.sin(this.waterBobPhase * 0.8) * 0.28;
    }

    // Turbo boost (disabled while waterlogged & floating!)
    const turboInput = Boolean(keys['ShiftLeft'] || keys['ShiftRight'] || tc.turbo);
    const turboActive = Boolean(!this.inWater && turboInput && this.turboFuel > 2 && throttle > 0);
    if (turboActive) {
      this.turboFuel = Math.max(0, this.turboFuel - 34 * dt);
    } else {
      this.turboFuel = Math.min(100, this.turboFuel + 12 * dt);
    }

    const effectiveMax = turboActive ? topSpeed * 1.42 : topSpeed;

    // Steer cart or Lizard
    const speedMag = Math.hypot(this.vx, this.vy);
    const steerFactor = this.inWater ? 0.85 : this.isLizard ? 1.0 : Math.min(1, speedMag / 90 + 0.35);
    const angularVel = steer * turnRate * steerFactor * (throttle < 0 ? -1 : 1);
    this.angle += angularVel * dt;

    if (this.isLizard) {
      this.walkPhase += (speedMag * 0.035 + Math.abs(angularVel) * 0.8) * dt;
      this.updateTail(dt, angularVel);
    }

    // Apply forward acceleration (or tire-paddle propulsion in water)
    const fx = Math.cos(this.angle);
    const fy = Math.sin(this.angle);
    if (throttle !== 0) {
      const a = turboActive ? accel * 1.65 : accel;
      this.vx += fx * throttle * a * dt;
      this.vy += fy * throttle * a * dt;
    }

    // If floating in a pond, apply a swirling water current that carries the cart outward toward the shore!
    if (this.inWater && inPond) {
      const dx = this.x - inPond.x;
      const dy = this.y - inPond.y;
      const dist = Math.hypot(dx, dy) || 1;
      // Outward radial push toward nearest shore + slight tangential swirl
      const outX = dx / dist;
      const outY = dy / dist;
      const swirlX = -outY * 0.35;
      const swirlY = outX * 0.35;
      const currentStrength = 52;
      this.vx += (outX + swirlX) * currentStrength * dt;
      this.vy += (outY + swirlY) * currentStrength * dt;

      if (Math.random() < 0.14) {
        game.spawnParticles(this.x + (Math.random() - 0.5) * 24, this.y + (Math.random() - 0.5) * 24, inPond.toxic ? '#a4ff3b' : '#cbeefa', 2);
      }
    }

    // Arcade Drift / Floating Physics: decompose velocity into forward and lateral components
    const forwardVel = this.vx * fx + this.vy * fy;
    const rx = -fy;
    const ry = fx;
    const lateralVel = this.vx * rx + this.vy * ry;

    const isDrifting = !this.inWater && Math.abs(lateralVel) > 65 && speedMag > 130;
    // In water, tires have almost zero lateral grip so the cart floats and slides sideways freely!
    const lateralGrip = this.inWater ? 0.985 : isDrifting ? 0.91 : 0.82;
    const newLateral = lateralVel * Math.pow(lateralGrip, dt * 60);

    // Sand bunker ramp jump!
    if (inBunker && this.z === 0 && speedMag > 195) {
      this.vz = Math.min(260, speedMag * 0.72);
      this.z = 2;
      game.addFloatingText(this.x, this.y - 30, 'AIR! +50', '#f7d53b');
      game.score += 50;
      if (Math.random() < 0.6) window.sound.playChuckle('high');
    }

    // Update airborne Z height
    if (this.z > 0 || this.vz !== 0) {
      this.z += this.vz * dt;
      this.vz -= 520 * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
        window.sound.playCrash('thud');
      }
    }

    const drag = this.inWater ? 0.94 : 0.975;
    let newForward = forwardVel * Math.pow(drag, dt * 60);
    if (Math.abs(newForward) > effectiveMax) {
      newForward = Math.sign(newForward) * (effectiveMax + (Math.abs(newForward) - effectiveMax) * 0.82);
    }

    const prevX = this.x;
    const prevY = this.y;

    this.vx = fx * newForward + rx * newLateral;
    this.vy = fy * newForward + ry * newLateral;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Keep inside Country Club fence
    const margin = 48;
    if (this.x < margin) { this.x = margin; this.vx *= -0.5; }
    if (this.x > world.width - margin) { this.x = world.width - margin; this.vx *= -0.5; }
    if (this.y < margin) { this.y = margin; this.vy *= -0.5; }
    if (this.y > world.height - margin) { this.y = world.height - margin; this.vy *= -0.5; }

    // Tree & Clubhouse solid collisions
    for (const t of world.trees) {
      const dx = this.x - t.x;
      const dy = this.y - t.y;
      const dist = Math.hypot(dx, dy);
      const minD = t.r + 18;
      if (dist < minD && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        this.x = t.x + nx * minD;
        this.y = t.y + ny * minD;
        this.vx *= -0.45;
        this.vy *= -0.45;
      }
    }

    const ch = world.clubhouse;
    if (
      this.x > ch.x - 20 &&
      this.x < ch.x + ch.w + 20 &&
      this.y > ch.y - 20 &&
      this.y < ch.y + ch.h + 20
    ) {
      this.y = ch.y + ch.h + 22;
      this.vy = Math.abs(this.vy) * 0.6;
    }

    // Leave tire-burn skid marks when drifting or on putting greens!
    if (this.z === 0 && (isDrifting || turboActive || (onGreen && speedMag > 130))) {
      world.addSkidMark(prevX, prevY, this.x, this.y, Boolean(onGreen));
      if (onGreen) {
        onGreen.turfRuined += dt * 32;
        game.disruption = Math.min(100, game.disruption + dt * 4.5);
        if (Math.floor(onGreen.turfRuined) % 25 === 0 && Math.random() < 0.35) {
          game.score += 40;
          game.addFloatingText(this.x, this.y - 24, 'TURF! +40', '#a4ff3b');
        }
        // Knock down flagstick if driving over center of green!
        if (!onGreen.flagBroken && Math.hypot(this.x - onGreen.x, this.y - onGreen.y) < 24) {
          onGreen.flagBroken = true;
          game.score += 200;
          game.disruption = Math.min(100, game.disruption + 14);
          game.addFloatingText(onGreen.x, onGreen.y - 30, 'FLAG! +200', '#ff4d3b');
          window.sound.playCrash('thud');
          window.sound.playChuckle('low');
          this.say('SCREW YOUR PAR!');
        }
      }
    }

    // Engine audio synth feedback
    window.sound.updateEngine(Math.min(1, speedMag / 380), isDrifting, turboActive, false);
  }
}

/**
 * 3D Arcing Golf Ball (can be lying on turf to collect, rolling toward a hole,
 * or flying through the air at 140mph toward Snotty's skull!)
 */
class GolfBall {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.z = opts.z || 0;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.vz = opts.vz || 0;

    this.targetX = opts.targetX || this.x;
    this.targetY = opts.targetY || this.y;
    this.aimedAtPlayer = Boolean(opts.aimedAtPlayer);
    this.firedByPlayer = Boolean(opts.firedByPlayer);
    this.shanked = Boolean(opts.shanked);

    // Ball types: 'standard' (1), 'gold' (3 - CEO trophy ball), 'toxic' (2 - glowing radioactive ball)
    this.kind = opts.kind || 'standard';
    this.value = this.kind === 'gold' ? 3 : this.kind === 'toxic' ? 2 : 1;

    this.inFlight = Math.hypot(this.vx, this.vy) > 25 || this.z > 1;
    this.rollingToCup = Boolean(opts.rollingToCup);
    this.collected = false;
    this.age = 0;
  }

  update(dt, world, game) {
    this.age += dt;

    if (this.inFlight) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.z += this.vz * dt;
      this.vz -= 390 * dt; // Gravity

      // Check if ball hits Clubhouse windows when shanked or fired!
      const ch = world.clubhouse;
      if (
        this.x > ch.x &&
        this.x < ch.x + ch.w &&
        this.y > ch.y &&
        this.y < ch.y + ch.h + 15
      ) {
        const wIdx = Math.min(3, Math.max(0, Math.floor(((this.x - ch.x) / ch.w) * 4)));
        if (!ch.windowsBroken[wIdx]) {
          ch.windowsBroken[wIdx] = true;
          window.sound.playCrash('glass');
          game.score += 350;
          game.disruption = Math.min(100, game.disruption + 18);
          game.addFloatingText(this.x, this.y, 'CLUBHOUSE WINDOW SHATTERED! +350', '#73b3c9');
          game.player.say('SMASHED THE VIP LOUNGE!');
        }
        this.vx *= -0.4;
        this.vy = Math.abs(this.vy) * 0.5;
        this.z = 2;
      }

      // Check if ball hits another Golfer (Friendly Fire from Heckle or Player's Ball Cannon!)
      if (this.shanked || this.firedByPlayer) {
        for (const g of game.golfers) {
          if (g.state !== 'ragdoll' && Math.hypot(this.x - g.x, this.y - g.y) < 26 && this.z < 42) {
            g.knockOut(this.vx * 0.6, this.vy * 0.6, game, this.shanked ? 'FRIENDLY FIRE GROIN SHOT! +300' : 'CANNON SNIPE! +250');
            this.vx *= -0.3;
            this.vy *= -0.3;
            this.z = 2;
            this.inFlight = false;
            break;
          }
        }
      }

      // Check if flying ball hits Snotty the Caddie in the head!
      if (!this.firedByPlayer) {
        const p = game.player;
        const distToPlayer = Math.hypot(this.x - p.x, this.y - p.y);
        // Lethal head-height zone: when ball height z is near Snotty's head (8 to 38)
        const headLow = 4 + p.z;
        const headHigh = (p.ducking ? 18 : 38) + p.z;
        const hitRadius = p.ducking ? 13 : 20;

        if (distToPlayer < hitRadius && this.z >= headLow && this.z <= headHigh) {
          game.onPlayerHeadHit(this);
          // Bounce ball off Snotty's massive forehead!
          this.vx = -this.vx * 0.45 + (Math.random() - 0.5) * 90;
          this.vy = -this.vy * 0.45 + (Math.random() - 0.5) * 90;
          this.vz = 110;
          this.aimedAtPlayer = false;
        }
      }

      // Bounce on turf
      if (this.z <= 0) {
        this.z = 0;
        if (Math.abs(this.vz) > 55) {
          this.vz = -this.vz * 0.44;
          this.vx *= 0.68;
          this.vy *= 0.68;
        } else {
          this.vz = 0;
          this.inFlight = false;
        }
      }
    } else {
      // Rolling along the ground
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= Math.pow(0.92, dt * 60);
      this.vy *= Math.pow(0.92, dt * 60);
      if (Math.hypot(this.vx, this.vy) < 8) {
        this.vx = 0;
        this.vy = 0;
        this.rollingToCup = false;
      }

      // Transform into radioactive ball if sitting near toxic pond!
      const pond = world.isInPond(this.x, this.y);
      if (pond && pond.toxic) {
        this.kind = 'toxic';
        this.value = 2;
      }
    }

    // Clamp to world
    this.x = Math.max(40, Math.min(world.width - 40, this.x));
    this.y = Math.max(40, Math.min(world.height - 40, this.y));
  }

  draw(renderer) {
    const ctx = renderer.ctx;

    // If aimed at player's head and in flight, draw pulsing RED HEADSHOT WARNING RETICLE at landing spot!
    if (this.inFlight && this.aimedAtPlayer) {
      const pulse = 18 + Math.sin(Date.now() * 0.03) * 6;
      ctx.save();
      ctx.strokeStyle = '#ff1e1e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, pulse, 0, Math.PI * 2);
      ctx.moveTo(this.targetX - pulse - 6, this.targetY);
      ctx.lineTo(this.targetX + pulse + 6, this.targetY);
      ctx.moveTo(this.targetX, this.targetY - pulse - 6);
      ctx.lineTo(this.targetX, this.targetY + pulse + 6);
      ctx.stroke();

      // Dashed trajectory line from ball shadow to reticle
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.targetX, this.targetY);
      ctx.stroke();
      ctx.restore();
    }

    // Ground shadow (separates from ball as z increases so player can see 3D height!)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.beginPath();
    const shadowR = Math.max(2.5, 5.5 - this.z * 0.025);
    ctx.arc(this.x, this.y + 3, shadowR, 0, Math.PI * 2);
    ctx.fill();

    // Actual Golf Ball at (x, y - z) with dynamic scale
    const drawY = this.y - this.z;
    const ballR = 5.2 + Math.min(7, this.z * 0.06);
    const fill =
      this.kind === 'gold'
        ? '#ffd230'
        : this.kind === 'toxic'
        ? '#9dff2e'
        : this.aimedAtPlayer && this.inFlight
        ? '#ffdede'
        : '#ffffff';

    ctx.fillStyle = fill;
    ctx.strokeStyle = '#161311';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(this.x, drawY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sparkle ring around collectable balls on the ground
    if (!this.inFlight && (this.kind !== 'standard' || this.rollingToCup)) {
      ctx.strokeStyle = this.rollingToCup ? '#ff3b2f' : fill;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, drawY, ballR + 4 + Math.sin(Date.now() * 0.015) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/**
 * Country Club Snob Golfer
 * Lines up shots toward greens — or goes FURIOUS and aims drivers straight at Snotty's head!
 */
class SnobGolfer {
  constructor(id, x, y, targetGreen, role = 'snob') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.vx = 0;
    this.vy = 0;
    this.targetGreen = targetGreen;
    this.role = role; // 'snob', 'ceo'

    const shirts = ['#eb5e7b', '#56b4e9', '#f5c236', '#8c6bb1', '#66c2a5'];
    const pants = ['#d9c398', '#c75246', '#5b8c5a', '#d48c46'];
    this.shirtColor = shirts[id % shirts.length];
    this.pantsColor = pants[id % pants.length];

    this.state = 'idle'; // 'idle', 'backswing', 'followthrough', 'ragdoll'
    this.timer = 1.2 + Math.random() * 2.5;
    this.angle = Math.atan2(targetGreen.y - y, targetGreen.x - x);
    this.aimAtPlayer = false;
    this.furious = false;

    // 3D Airborne Ragdoll ("Rag Dog") Physics state
    this.z = 0;
    this.vz = 0;
    this.ragdollAngle = 0;
    this.ragdollSpin = 0;
    this.flipPhase = 0;
    this.limbFlail = 0;
    this.bounces = 0;
    this.droppedClub = null;

    this.speechText = '';
    this.speechTimer = 0;
  }

  say(text, dur = 2.0) {
    this.speechText = text;
    this.speechTimer = dur;
  }

  knockOut(ivx, ivy, game, customLabel = null) {
    if (this.state === 'ragdoll' && this.z > 10) return;
    this.state = 'ragdoll';
    this.furious = true;

    const impactSpeed = Math.hypot(ivx, ivy);
    // Speed ratio: ~0.5 for a slow tap, ~1.2 for normal ram, ~1.8-2.2 for full speed / Nacho Turbo!
    const speedRatio = Math.min(2.3, Math.max(0.45, impactSpeed / 210));

    // Fly back faster & farther the harder you hit them
    const launchBoost = 1.05 + speedRatio * 0.38;
    this.vx = ivx * launchBoost;
    this.vy = ivy * launchBoost;

    // Launch high into the air & somersault!
    this.z = Math.max(this.z, 4);
    this.vz = 90 + impactSpeed * 0.95;
    this.ragdollSpin = (7 + speedRatio * 14) * (Math.random() < 0.5 ? 1 : -1);
    this.flipPhase = 0;
    this.limbFlail = Math.random() * 6;
    this.bounces = 0;

    // Stay down WAY longer when hit at high speed (6s on slow tap up to 17s+ on Turbo slam!)
    this.timer = 4.5 + speedRatio * 6.2;

    // Send their golf club flying through the air separately!
    this.droppedClub = {
      x: this.x,
      y: this.y,
      z: 14,
      vx: this.vx * 0.75 + (Math.random() - 0.5) * 180,
      vy: this.vy * 0.75 + (Math.random() - 0.5) * 180,
      vz: this.vz * 1.15,
      angle: this.angle,
      spin: (Math.random() < 0.5 ? 1 : -1) * 18
    };

    window.sound.playCrash('thud');
    window.sound.playScream(280 + Math.min(220, Math.floor(speedRatio * 95)));

    const cries =
      speedRatio > 1.35
        ? ['AAARGH! I CAN SEE MY HOUSE!', 'MY SPINE! CALL MY LAWYER!', 'WEEEE-AAARGH! MY PELVIS!']
        : ['MY TITANIUM HIP!', 'MY SCIATICA!', 'CALL SENATOR BUSHWOOD!'];
    this.say(cries[Math.floor(Math.random() * cries.length)], 2.6);

    const pts = speedRatio > 1.45 ? 350 : speedRatio > 1.0 ? 225 : 150;
    const defaultLabel =
      speedRatio > 1.45
        ? `MEGA AIR RAGDOLL! +${pts}`
        : speedRatio > 1.0
        ? `RAGDOLL FLIP! +${pts}`
        : `FLATTENED! +${pts}`;

    game.score += pts;
    game.disruption = Math.min(100, game.disruption + 8 + Math.floor(speedRatio * 5));
    game.addFloatingText(this.x, this.y - 28, customLabel || defaultLabel, speedRatio > 1.4 ? '#f7d53b' : '#ff4d3b');
    game.spawnParticles(this.x, this.y, '#ffffff', Math.floor(6 + speedRatio * 6));

    // Drop more prized golf balls from their pockets on harder hits!
    const ballsDropped = speedRatio > 1.4 ? 3 : 2;
    for (let i = 0; i < ballsDropped; i++) {
      game.balls.push(
        new GolfBall({
          x: this.x + (Math.random() - 0.5) * 24,
          y: this.y + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * (140 + speedRatio * 60),
          vy: (Math.random() - 0.5) * (140 + speedRatio * 60),
          vz: 85 + speedRatio * 45,
          kind: (this.role === 'ceo' && i === 0) || (speedRatio > 1.5 && i === 1) ? 'gold' : 'standard'
        })
      );
    }
  }

  update(dt, world, game) {
    if (this.speechTimer > 0) this.speechTimer -= dt;
    const p = game.player;
    const distToPlayer = Math.hypot(p.x - this.x, p.y - this.y);

    // Update flying dropped golf club
    if (this.droppedClub) {
      const dc = this.droppedClub;
      dc.x += dc.vx * dt;
      dc.y += dc.vy * dt;
      if (dc.z > 0 || dc.vz !== 0) {
        dc.z += dc.vz * dt;
        dc.vz -= 520 * dt;
        dc.angle += dc.spin * dt;
        if (dc.z <= 0) {
          dc.z = 0;
          if (Math.abs(dc.vz) > 65) {
            dc.vz = -dc.vz * 0.45;
            dc.vx *= 0.65;
            dc.vy *= 0.65;
            dc.spin *= 0.6;
          } else {
            dc.vz = 0;
            dc.spin = 0;
          }
        }
      } else {
        dc.vx *= Math.pow(0.86, dt * 60);
        dc.vy *= Math.pow(0.86, dt * 60);
      }
    }

    if (this.state === 'ragdoll') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Keep inside course fences with bounce
      const margin = 55;
      if (this.x < margin) { this.x = margin; this.vx *= -0.6; }
      if (this.x > world.width - margin) { this.x = world.width - margin; this.vx *= -0.6; }
      if (this.y < margin) { this.y = margin; this.vy *= -0.6; }
      if (this.y > world.height - margin) { this.y = world.height - margin; this.vy *= -0.6; }

      if (this.z > 0 || this.vz !== 0) {
        // Airborne flipping ragdoll! Low air drag so they soar far across the fairway
        this.vx *= Math.pow(0.985, dt * 60);
        this.vy *= Math.pow(0.985, dt * 60);
        this.z += this.vz * dt;
        this.vz -= 540 * dt; // Gravity
        this.ragdollAngle += this.ragdollSpin * dt;
        this.flipPhase += Math.abs(this.ragdollSpin) * 1.35 * dt;
        this.limbFlail += 24 * dt;

        // Bounce when slamming back onto the turf!
        if (this.z <= 0) {
          this.z = 0;
          if (Math.abs(this.vz) > 75 && this.bounces < 3) {
            this.bounces++;
            this.vz = -this.vz * 0.48;
            this.vx *= 0.74;
            this.vy *= 0.74;
            this.ragdollSpin *= -0.72;
            window.sound.playCrash('thud');
            game.spawnParticles(this.x, this.y, '#5d8a41', 7);
          } else {
            this.vz = 0;
            this.flipPhase = 0;
            window.sound.playCrash('thud');
          }
        }
      } else {
        // Skidding & lying flat on the turf
        this.vx *= Math.pow(0.88, dt * 60);
        this.vy *= Math.pow(0.88, dt * 60);
        const slideSpeed = Math.hypot(this.vx, this.vy);
        this.ragdollAngle += slideSpeed * 0.03 * dt;
        if (slideSpeed > 25) {
          this.limbFlail += slideSpeed * 0.08 * dt;
        }
        // Count down stay-down timer once on the ground
        this.timer -= dt;
      }

      if (this.timer <= 0 && this.z <= 0) {
        this.state = 'idle';
        this.timer = 1.1;
        this.furious = true;
        this.droppedClub = null;
        this.say('EAT 3-WOOD, YOU LUNATIC CADDIE!');
      }
      return;
    }

    // If player gets close or disruption is high, golfer gets FURIOUS and targets Snotty's head!
    if (distToPlayer < 460 || game.disruption > 45) {
      this.furious = true;
    }

    this.timer -= dt;

    if (this.state === 'idle') {
      this.aimAtPlayer = this.furious && distToPlayer < 680;
      if (this.aimAtPlayer) {
        // Lead the player's golf cart movement slightly!
        const tx = p.x + p.vx * 0.45;
        const ty = p.y + p.vy * 0.45;
        this.angle = Math.atan2(ty - this.y, tx - this.x);
      } else {
        this.angle = Math.atan2(this.targetGreen.y - this.y, this.targetGreen.x - this.x);
      }

      if (this.timer <= 0) {
        this.state = 'backswing';
        this.timer = 1.15; // 1.15s window for player to dodge, duck, or press SPACE to Airhorn Heckle!
        if (this.aimAtPlayer && distToPlayer < 620) {
          const threats = ['FORE, YOU LITTLE BASTARD!', 'AIM FOR HIS FOREHEAD!', 'GET OFF MY FAIRWAY!'];
          this.say(threats[this.id % threats.length], 1.5);
        }
      }
    } else if (this.state === 'backswing') {
      if (this.aimAtPlayer) {
        const tx = p.x + p.vx * 0.38;
        const ty = p.y + p.vy * 0.38;
        this.angle = Math.atan2(ty - this.y, tx - this.x);
      }
      if (this.timer <= 0) {
        this.executeSwing(game, false);
      }
    } else if (this.state === 'followthrough') {
      if (this.timer <= 0) {
        this.state = 'idle';
        this.timer = 2.0 + Math.random() * 1.8;
      }
    }
  }

  executeSwing(game, shanked = false) {
    this.state = 'followthrough';
    this.timer = 0.85;

    const p = game.player;
    let targetX = this.targetGreen.x + (Math.random() - 0.5) * 70;
    let targetY = this.targetGreen.y + (Math.random() - 0.5) * 70;
    let flightTime = 1.15;
    let aimedAtPlayer = false;

    if (shanked) {
      // Shanked by Airhorn Heckle! Aims directly at nearest other golfer, Clubhouse window, or Wedding Cake!
      let bestTarget = { x: game.world.clubhouse.x + 200, y: game.world.clubhouse.y + 80 };
      let bestDist = 9999;
      for (const other of game.golfers) {
        if (other !== this && other.state !== 'ragdoll') {
          const d = Math.hypot(other.x - this.x, other.y - this.y);
          if (d < bestDist && d < 550) {
            bestDist = d;
            bestTarget = { x: other.x, y: other.y };
          }
        }
      }
      targetX = bestTarget.x;
      targetY = bestTarget.y;
      flightTime = 0.65;
      this.say('AAARGH! MY BACKSWING!', 1.8);
    } else if (this.aimAtPlayer) {
      aimedAtPlayer = true;
      flightTime = Math.max(0.55, Math.min(1.05, Math.hypot(p.x - this.x, p.y - this.y) / 480));
      targetX = p.x + p.vx * flightTime * 0.55;
      targetY = p.y + p.vy * flightTime * 0.55;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const vx = dx / flightTime;
    const vy = dy / flightTime;
    // Gravity is 390; set vz so ball reaches z=0 at flightTime, passing through head height near target!
    const vz = 0.5 * 390 * flightTime;

    game.balls.push(
      new GolfBall({
        x: this.x + Math.cos(this.angle) * 16,
        y: this.y + Math.sin(this.angle) * 16,
        z: 6,
        vx,
        vy,
        vz,
        targetX,
        targetY,
        aimedAtPlayer,
        shanked,
        rollingToCup: !aimedAtPlayer && !shanked,
        kind: this.role === 'ceo' ? 'gold' : 'standard'
      })
    );

    window.sound.playGolfSwing(aimedAtPlayer);
  }
}

/**
 * COUNTRY CLUB KONG: Giant Gorilla called in by the Golf Club Board to fight Snotzilla!
 * Wears a torn pink argyle sweater-vest & tiny golf visor, beats his chest, hurls golf carts, and drops a Golden Trophy shower!
 */
class CountryClubKong {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.z = 160; // Drops in from the sky with an earth-shaking SLAM!
    this.vx = 0;
    this.vy = 0;
    this.vz = -180;
    this.angle = Math.PI / 2;
    this.walkPhase = 0;

    this.maxHp = 100;
    this.hp = 100;
    this.state = 'roar'; // 'roar', 'chase', 'throw', 'defeated'
    this.timer = 1.6;
    this.burnTimer = 0;
    this.hitCooldown = 0;
    this.ragdollAngle = 0;
    this.projectiles = [];

    this.speechText = 'KONG SMASH LIZARD CADDIE!!';
    this.speechTimer = 3.0;
  }

  say(text, dur = 2.4) {
    this.speechText = text;
    this.speechTimer = dur;
  }

  takeDamage(amount, sourceX, sourceY, game, label = 'KONG SCORCHED!') {
    if (this.state === 'defeated' || this.hitCooldown > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.burnTimer = 0.45;
    this.hitCooldown = 0.22;

    const pushAngle = Math.atan2(this.y - sourceY, this.x - sourceX);
    this.vx += Math.cos(pushAngle) * 140;
    this.vy += Math.sin(pushAngle) * 140;

    game.score += 100;
    game.spawnParticles(this.x, this.y, '#ff5722', 8);
    game.addFloatingText(this.x, this.y - 45, `${label} +100`, '#ffea00');

    if (this.hp <= 0) {
      this.defeat(game);
    } else if (Math.random() < 0.35) {
      const roars = [
        'OW! MY ARGYLE SWEATER VEST!',
        'KONG HATE FIRE BREATH!!',
        'MY COUNTRY CLUB FUR!!',
        'STOP WHIPPING ME WITH THAT TAIL!'
      ];
      this.say(roars[Math.floor(Math.random() * roars.length)], 2.0);
    }
  }

  defeat(game) {
    this.state = 'defeated';
    this.timer = 6.0;
    this.vz = 180;
    this.z = 5;
    this.ragdollAngle = 0.8;

    if (window.sound.playKongRoar) window.sound.playKongRoar();
    window.sound.playCrash('thud');
    setTimeout(() => window.sound.playChuckle('low'), 400);

    game.camera.shake = 24;
    game.score += 1500;
    this.say('MY COUNTRY CLUB MEMBERSHIP!! AAARGH!', 4.0);
    game.addFloatingText(this.x, this.y - 60, 'COUNTRY CLUB KONG DEFEATED! +1500 & GOLDEN BALL SHOWER!', '#a4ff3b');
    game.player.say('TIMBERRR! DOWN GOES THE BIG APE!', 3.5);

    // Shower the fairway with 10 Golden 24K Trophy Balls!
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const sp = 140 + Math.random() * 140;
      game.balls.push(
        new GolfBall({
          x: this.x,
          y: this.y,
          z: 18,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          vz: 120 + Math.random() * 80,
          kind: 'gold'
        })
      );
    }
  }

  update(dt, world, game) {
    if (this.speechTimer > 0) this.speechTimer -= dt;
    if (this.burnTimer > 0) this.burnTimer -= dt;
    if (this.hitCooldown > 0) this.hitCooldown -= dt;

    // Update airborne Z height (drop-in slam or leap!)
    if (this.z > 0 || this.vz !== 0) {
      this.z += this.vz * dt;
      this.vz -= 520 * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
        game.camera.shake = 16;
        window.sound.playCrash('thud');
        game.shockwaves.push({ x: this.x, y: this.y, r: 20, maxR: 220, color: '#ff5722' });
      }
    }

    // Update hurled golf cart projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.z += pr.vz * dt;
      pr.vz -= 420 * dt;
      pr.angle += 7 * dt;

      // Check hit against player
      const p = game.player;
      if (Math.hypot(pr.x - p.x, pr.y - p.y) < 38 && pr.z < 36) {
        game.camera.shake = 14;
        window.sound.playCrash('thud');
        const pushA = Math.atan2(p.y - pr.y, p.x - pr.x);
        p.vx += Math.cos(pushA) * 320;
        p.vy += Math.sin(pushA) * 320;
        game.addFloatingText(p.x, p.y - 35, 'HIT BY THROWN GOLF CART!', '#ff4d3b');
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.z <= 0) {
        window.sound.playCrash('thud');
        game.spawnParticles(pr.x, pr.y, '#efe3c8', 10);
        this.projectiles.splice(i, 1);
      }
    }

    if (this.state === 'defeated') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= Math.pow(0.88, dt * 60);
      this.vy *= Math.pow(0.88, dt * 60);
      this.timer -= dt;
      return;
    }

    const p = game.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    this.timer -= dt;

    if (this.state === 'roar') {
      if (this.timer <= 0) {
        this.state = 'chase';
        this.timer = 3.2;
      }
    } else if (this.state === 'chase') {
      const speed = 195;
      this.vx += (Math.cos(this.angle) * speed - this.vx) * Math.min(1, dt * 6);
      this.vy += (Math.sin(this.angle) * speed - this.vy) * Math.min(1, dt * 6);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.walkPhase += dt * 7;

      // Ground-pound knockback if Kong reaches the Lizard!
      if (dist < 56 && this.z <= 5) {
        this.vz = 150;
        this.z = 4;
        p.vx = Math.cos(this.angle) * 380;
        p.vy = Math.sin(this.angle) * 380;
        game.camera.shake = 15;
        window.sound.playCrash('thud');
        game.addFloatingText(p.x, p.y - 38, 'KONG BELLY SLAM!', '#ff4d3b');
        this.say('GET OFF MY COUNTRY CLUB!!', 2.0);
      }

      if (this.timer <= 0) {
        this.state = 'throw';
        this.timer = 1.1;
        if (window.sound.playKongRoar) window.sound.playKongRoar();
        this.say('EAT GOLF CART, SCALY FREAK!!', 1.8);

        // Hurl a whole golf cart at Snotzilla!
        const flightT = Math.max(0.65, Math.min(1.25, dist / 420));
        this.projectiles.push({
          x: this.x + Math.cos(this.angle) * 28,
          y: this.y + Math.sin(this.angle) * 28,
          z: 22,
          vx: (dx + p.vx * 0.35) / flightT,
          vy: (dy + p.vy * 0.35) / flightT,
          vz: 0.5 * 420 * flightT,
          angle: this.angle
        });
      }
    } else if (this.state === 'throw') {
      if (this.timer <= 0) {
        this.state = 'chase';
        this.timer = 3.0;
      }
    }
  }
}

window.PlayerCart = PlayerCart;
window.GolfBall = GolfBall;
window.SnobGolfer = SnobGolfer;
window.CountryClubKong = CountryClubKong;
