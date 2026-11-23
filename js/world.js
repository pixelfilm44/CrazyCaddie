/**
 * CRAZY CADDIE: Procedural Country Club Course & Collateral Chaos Props
 * Includes fairways, putting greens (track tire-burn skid marks!), sand bunkers (jump ramps),
 * Swan Pond, Toxic Chemical Hazard Pond, Country Club Wedding Reception, and Clubhouse windows.
 */

class GolfCourseWorld {
  constructor(level = 1) {
    this.width = 2600;
    this.height = 2000;
    this.level = level;

    this.skidMarks = []; // Tire tracks on putting greens & fairways
    this.maxSkidMarks = 320;

    this.fairways = [];
    this.greens = [];
    this.bunkers = [];
    this.ponds = [];
    this.trees = [];
    this.props = []; // Smashable wedding tables, cake, champagne towers, carts, windows
    this.swans = [];

    this.generateCourse(level);
  }

  generateCourse(level) {
    // 3 sprawling holes across Bushwood Estates Country Club
    this.fairways = [
      // Hole 1: "The CEO's Kidney" (Bottom Left to Top Left)
      { x: 450, y: 1520, rx: 310, ry: 210, angle: -0.3 },
      { x: 520, y: 1120, rx: 280, ry: 340, angle: 0.15 },
      { x: 580, y: 620, rx: 290, ry: 280, angle: -0.1 },

      // Hole 2: "Swan Lake Massacre" (Top Center to Right)
      { x: 1250, y: 550, rx: 380, ry: 220, angle: 0.2 },
      { x: 1850, y: 680, rx: 340, ry: 260, angle: 0.45 },

      // Hole 3: "Toxic Dump & Wedding Green" (Bottom Right to Center)
      { x: 1920, y: 1380, rx: 370, ry: 260, angle: -0.25 },
      { x: 1320, y: 1340, rx: 350, ry: 240, angle: 0.1 }
    ];

    // Putting Greens (Drifting on these ruins the turf for huge bonus disruption points!)
    this.greens = [
      { id: 1, name: '1st Green (Founder\'s Memorial)', x: 590, y: 470, r: 145, flagBroken: false, turfRuined: 0 },
      { id: 2, name: '9th Green (Swan Terrace)', x: 2050, y: 690, r: 150, flagBroken: false, turfRuined: 0 },
      { id: 3, name: '18th Green (Clubhouse Championship)', x: 1280, y: 1290, r: 165, flagBroken: false, turfRuined: 0 }
    ];

    // Sand Bunkers (Hitting these at speed launches your golf cart into the air!)
    this.bunkers = [
      { x: 440, y: 860, rx: 85, ry: 52 },
      { x: 730, y: 520, rx: 70, ry: 48 },
      { x: 1460, y: 470, rx: 95, ry: 55 },
      { x: 1880, y: 830, rx: 80, ry: 50 },
      { x: 1540, y: 1440, rx: 92, ry: 58 },
      { x: 1080, y: 1180, rx: 78, ry: 50 }
    ];

    // Water Hazards & Secret Easter-Egg Green Radioactive Pond tucked in the far corner!
    this.ponds = [
      { x: 1140, y: 860, rx: 195, ry: 125, toxic: false, label: 'SWAN POND' },
      { x: 2310, y: 1730, rx: 115, ry: 78, toxic: true, label: '' }
    ];

    // Angry Prized Country Club Swans swimming around Swan Pond
    this.swans = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.swans.push({
        x: 1140 + Math.cos(a) * 110,
        y: 860 + Math.sin(a) * 70,
        vx: Math.cos(a + 1.5) * 35,
        vy: Math.sin(a + 1.5) * 35,
        angle: a,
        feathersTimer: 0,
        alive: true
      });
    }

    // Clubhouse & Country Club Wedding Reception Pavilion (Center-Top)
    this.clubhouse = {
      x: 1080,
      y: 120,
      w: 440,
      h: 170,
      windowsBroken: [false, false, false, false]
    };

    // Smashable Collateral Props: Wedding Cake, Port-a-Potties, Golf Bags, Small Trees, and Bushes!
    this.flyingClubs = []; // Ejected golf clubs from smashed golf bags
    this.props = [
      // Wedding reception lawn south of Clubhouse
      { type: 'wedding_cake', name: 'WEDDING CAKE', x: 1300, y: 360, r: 26, intact: true, points: 350 },
      { type: 'champagne_table', name: 'CHAMPAGNE FOUNTAIN', x: 1210, y: 380, r: 24, intact: true, points: 250 },
      { type: 'banquet_table', name: 'SHRIMP BUFFET', x: 1390, y: 380, r: 24, intact: true, points: 250 },
      { type: 'bride_groom', name: 'BRIDE & GROOM', x: 1300, y: 315, r: 22, intact: true, points: 400 },

      // 5 Explosive Port-a-Potties across the course (some occupied by snobs!)
      { type: 'porta_potty', name: 'PORT-A-POTTY', x: 360, y: 1180, r: 24, intact: true, points: 300, occupied: true },
      { type: 'porta_potty', name: 'PORT-A-POTTY', x: 740, y: 1450, r: 24, intact: true, points: 300, occupied: false },
      { type: 'porta_potty', name: 'PORT-A-POTTY', x: 960, y: 540, r: 24, intact: true, points: 300, occupied: true },
      { type: 'porta_potty', name: 'PORT-A-POTTY', x: 1750, y: 1120, r: 24, intact: true, points: 300, occupied: true },
      { type: 'porta_potty', name: 'PORT-A-POTTY', x: 1640, y: 1510, r: 24, intact: true, points: 300, occupied: false },

      // 10 Standalone Leather Golf Bags full of clubs & balls
      { type: 'golf_bag', name: 'GOLF BAG', x: 495, y: 1410, r: 17, intact: true, points: 150, bagColor: '#b8251e' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 555, y: 1010, r: 17, intact: true, points: 150, bagColor: '#2b5b84' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 675, y: 765, r: 17, intact: true, points: 150, bagColor: '#c99e52' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 860, y: 1520, r: 17, intact: true, points: 150, bagColor: '#b8251e' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 1215, y: 570, r: 17, intact: true, points: 150, bagColor: '#2d4c1e' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 1620, y: 420, r: 17, intact: true, points: 150, bagColor: '#c99e52' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 1715, y: 655, r: 17, intact: true, points: 150, bagColor: '#b8251e' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 1975, y: 905, r: 17, intact: true, points: 150, bagColor: '#2b5b84' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 1895, y: 1405, r: 17, intact: true, points: 150, bagColor: '#c99e52' },
      { type: 'golf_bag', name: 'GOLF BAG', x: 1155, y: 1465, r: 17, intact: true, points: 150, bagColor: '#b8251e' }
    ];

    // 14 Knock-Over Small Sapling / Birch Trees along fairways
    const smallTreeSpots = [
      [380, 1340], [630, 1290], [430, 680], [760, 740], [950, 880],
      [1050, 460], [1440, 640], [1760, 510], [2160, 860], [1980, 1180],
      [1620, 1220], [1420, 1520], [1160, 1120], [820, 1020]
    ];
    smallTreeSpots.forEach(([sx, sy], i) => {
      this.props.push({
        type: 'small_tree',
        name: 'SAPLING TREE',
        x: sx,
        y: sy,
        r: 19,
        intact: true,
        points: 75,
        seed: i * 13
      });
    });

    // 18 Ornamental Country Club Bushes & Azalea Hedges (plus secret hedge ring hiding the Easter-egg pond!)
    const bushSpots = [
      [1120, 315], [1170, 315], [1430, 315], [1480, 315],
      [580, 1590], [770, 1580], [610, 1160], [490, 810],
      [710, 430], [1100, 650], [1360, 490], [1820, 750],
      [2040, 560], [2020, 1340], [1740, 1420], [1410, 1240],
      [1190, 1390], [990, 1310],
      // Secret thicket screening the hidden Radioactive Pond in the bottom-right corner
      [2165, 1685], [2185, 1745], [2235, 1635], [2295, 1625]
    ];
    bushSpots.forEach(([bx, by], i) => {
      this.props.push({
        type: 'bush',
        name: 'ORNAMENTAL BUSH',
        x: bx,
        y: by,
        r: 16,
        intact: true,
        points: 50,
        flowerColor: i % 2 === 0 ? '#ff69b4' : '#f7d53b',
        seed: i * 19
      });
    });

    // Initialize physics fields for all props so they can fly and tumble when hit!
    this.props.forEach((p) => {
      p.stumpX = p.x;
      p.stumpY = p.y;
      p.z = 0;
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
      p.angle = 0;
      p.spin = 0;
    });

    // Roaming Beverage Cart ("Booze & Cigars")
    this.bevCart = {
      x: 920,
      y: 1100,
      vx: 75,
      vy: 40,
      angle: 0.4,
      r: 28,
      hitCooldown: 0
    };

    // Perimeter & Interior Pine/Oak Trees
    this.trees = [];
    const treeSpots = [
      [180, 320], [190, 740], [160, 1240], [210, 1720],
      [880, 350], [870, 720], [840, 1220], [920, 1780],
      [1580, 220], [1680, 920], [1560, 1750],
      [2380, 340], [2420, 880], [2390, 1320], [2410, 1820]
    ];
    treeSpots.forEach(([tx, ty], idx) => {
      this.trees.push({ x: tx, y: ty, r: 34 + (idx % 3) * 6, seed: idx * 17 });
    });
  }

  addSkidMark(x1, y1, x2, y2, onGreen = false) {
    this.skidMarks.push({
      x1,
      y1,
      x2,
      y2,
      color: onGreen ? 'rgba(74, 46, 21, 0.75)' : 'rgba(42, 34, 24, 0.45)',
      width: onGreen ? 7 : 5
    });
    if (this.skidMarks.length > this.maxSkidMarks) {
      this.skidMarks.shift();
    }
  }

  isOnGreen(x, y) {
    for (const g of this.greens) {
      const dx = x - g.x;
      const dy = y - g.y;
      if (dx * dx + dy * dy < g.r * g.r) return g;
    }
    return null;
  }

  isInBunker(x, y) {
    for (const b of this.bunkers) {
      const dx = (x - b.x) / b.rx;
      const dy = (y - b.y) / b.ry;
      if (dx * dx + dy * dy < 1.0) return b;
    }
    return null;
  }

  isInPond(x, y) {
    for (const p of this.ponds) {
      const dx = (x - p.x) / p.rx;
      const dy = (y - p.y) / p.ry;
      if (dx * dx + dy * dy < 0.92) return p;
    }
    return null;
  }

  update(dt, game) {
    // Update swimming swans
    for (const s of this.swans) {
      if (!s.alive) continue;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const pond = this.ponds[0];
      const dx = s.x - pond.x;
      const dy = s.y - pond.y;
      if ((dx * dx) / (pond.rx * pond.rx) + (dy * dy) / (pond.ry * pond.ry) > 0.72) {
        const a = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.6;
        s.vx = Math.cos(a) * 45;
        s.vy = Math.sin(a) * 45;
      }
      s.angle = Math.atan2(s.vy, s.vx);
    }

    // Update roaming Beverage Cart
    const bc = this.bevCart;
    if (bc.hitCooldown > 0) bc.hitCooldown -= dt;
    bc.x += bc.vx * dt;
    bc.y += bc.vy * dt;
    if (bc.x < 350 || bc.x > this.width - 350) bc.vx *= -1;
    if (bc.y < 420 || bc.y > this.height - 320) bc.vy *= -1;
    bc.angle = Math.atan2(bc.vy, bc.vx);

    // Update tumbling / knocked-over props (Port-a-Potties, Golf Bags, Small Trees, Bushes)
    for (const p of this.props) {
      if (p.intact) continue;
      if (Math.hypot(p.vx, p.vy) > 4 || p.z > 0 || p.vz !== 0) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.z > 0 || p.vz !== 0) {
          p.z += p.vz * dt;
          p.vz -= 520 * dt;
          p.angle += p.spin * dt;
          if (p.z <= 0) {
            p.z = 0;
            if (Math.abs(p.vz) > 65) {
              p.vz = -p.vz * 0.42;
              p.vx *= 0.68;
              p.vy *= 0.68;
              p.spin *= 0.65;
            } else {
              p.vz = 0;
            }
          }
        } else {
          p.vx *= Math.pow(0.86, dt * 60);
          p.vy *= Math.pow(0.86, dt * 60);
          p.angle += p.spin * 0.25 * dt;
          p.spin *= Math.pow(0.85, dt * 60);
        }
      }
    }

    // Update flying golf clubs ejected from smashed golf bags
    for (const fc of this.flyingClubs) {
      if (Math.hypot(fc.vx, fc.vy) > 3 || fc.z > 0 || fc.vz !== 0) {
        fc.x += fc.vx * dt;
        fc.y += fc.vy * dt;
        if (fc.z > 0 || fc.vz !== 0) {
          fc.z += fc.vz * dt;
          fc.vz -= 500 * dt;
          fc.angle += fc.spin * dt;
          if (fc.z <= 0) {
            fc.z = 0;
            if (Math.abs(fc.vz) > 55) {
              fc.vz = -fc.vz * 0.45;
              fc.vx *= 0.65;
              fc.vy *= 0.65;
            } else {
              fc.vz = 0;
              fc.spin = 0;
            }
          }
        } else {
          fc.vx *= Math.pow(0.85, dt * 60);
          fc.vy *= Math.pow(0.85, dt * 60);
        }
      }
    }
  }

  draw(renderer, camera) {
    const ctx = renderer.ctx;

    // 1. Deep Rough Grass Background with subtle mowing stripes
    ctx.fillStyle = renderer.palette.rough;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let sx = 0; sx < this.width; sx += 120) {
      ctx.fillRect(sx, 0, 60, this.height);
    }

    //Course Fence Border
    renderer.drawBoilBox(25, 25, this.width - 50, this.height - 50, null, '#241f1b', 6, 2.5, 900);

    // 2. Fairways
    this.fairways.forEach((f, idx) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      renderer.drawBoilEllipse(0, 0, f.rx, f.ry, renderer.palette.fairway, '#2b451c', 3, 2.2, 18, 1000 + idx);
      ctx.restore();
    });

    // 3. Putting Greens
    this.greens.forEach((g, idx) => {
      renderer.drawBoilEllipse(g.x, g.y, g.r, g.r * 0.85, renderer.palette.green, '#2b451c', 3, 1.8, 16, 1100 + idx);
      // Golf Cup Hole
      ctx.fillStyle = '#141210';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Sand Bunkers (Ramp hazard!)
    this.bunkers.forEach((b, idx) => {
      renderer.drawBoilEllipse(b.x, b.y, b.rx, b.ry, renderer.palette.bunker, '#6e5831', 3, 2.0, 14, 1200 + idx);
      // Sand lip shading + "RAMP!" hint
      renderer.drawBoilLine(b.x - b.rx * 0.5, b.y - b.ry * 0.3, b.x + b.rx * 0.5, b.y - b.ry * 0.3, '#ab8e57', 2.5, 1.2, 1250 + idx);
    });

    // 5. Tire Burn Skid Marks (permanent evidence of your vandalism!)
    ctx.lineCap = 'round';
    for (const s of this.skidMarks) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }

    // 6. Water & Glowing Green Radioactive Ponds
    this.ponds.forEach((p, idx) => {
      if (p.toxic) {
        // Outer neon green radioactive glow ring
        ctx.save();
        ctx.fillStyle = 'rgba(118, 255, 3, 0.25)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx + 16, p.ry + 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const fill = p.toxic ? '#52e016' : renderer.palette.water;
      const border = p.toxic ? '#a4ff3b' : '#161311';
      renderer.drawBoilEllipse(p.x, p.y, p.rx, p.ry, fill, border, 3.8, 2.2, 16, 1300 + idx);

      if (p.toxic) {
        // Inner dark green outline & bubbling neon-green sludge rings
        renderer.drawBoilEllipse(p.x, p.y, p.rx - 5, p.ry - 4, null, '#161311', 2.4, 1.8, 16, 1305 + idx);
        const bPulse = (Date.now() * 0.04) % 25;
        renderer.drawBoilEllipse(p.x - 45, p.y + 10, 11 + bPulse * 0.5, 8 + bPulse * 0.3, '#b9ff4f', '#161311', 1.8, 1.0, 8, 1310 + idx);
        renderer.drawBoilEllipse(p.x + 50, p.y - 22, 9 + bPulse * 0.4, 7 + bPulse * 0.3, '#b9ff4f', '#161311', 1.8, 1.0, 8, 1311 + idx);

        // Leaking Yellow Radioactive Barrel on shore
        renderer.drawBoilBox(p.x - p.rx + 10, p.y - 14, 22, 28, '#ffea00', '#161311', 2.4, 0.8, 1320 + idx);
        renderer.drawBoilLine(p.x - p.rx + 10, p.y, p.x - p.rx + 32, p.y, '#161311', 3, 0.4, 1321 + idx);
      }

      if (p.label) {
        ctx.save();
        ctx.font = '900 14px "Trebuchet MS", "Arial Black", system-ui, sans-serif';
        ctx.strokeStyle = '#161311';
        ctx.lineWidth = 3.5;
        ctx.textAlign = 'center';
        ctx.strokeText(p.label, p.x, p.y + 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(p.label, p.x, p.y + 5);
        ctx.restore();
      }
    });

    // 7. Swimming Country Club Swans
    this.swans.forEach((s, idx) => {
      if (!s.alive) return;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      renderer.drawBoilEllipse(0, 0, 11, 7, '#f7f5f0', '#161311', 2, 0.9, 8, 1400 + idx);
      renderer.drawBoilLine(6, 0, 14, -4, '#f7f5f0', 4, 0.8, 1410 + idx);
      renderer.drawBoilPolygon([[14, -6], [20, -4], [14, -2]], '#eb7a23', '#161311', 1.5, 0.5, 1420 + idx);
      ctx.restore();
    });

    // 8. Putting Green Flagsticks
    this.greens.forEach((g, idx) => {
      if (!g.flagBroken) {
        renderer.drawBoilLine(g.x, g.y, g.x, g.y - 52, '#f0ECE1', 3, 1.0, 1500 + idx);
        renderer.drawBoilPolygon(
          [[g.x, g.y - 52], [g.x + 26, g.y - 43], [g.x, g.y - 34]],
          '#d92b2b',
          '#161311',
          2.2,
          1.2,
          1510 + idx
        );
      } else {
        // Bent broken flagstick lying on green!
        renderer.drawBoilLine(g.x, g.y, g.x + 35, g.y + 12, '#f0ECE1', 2.5, 1.0, 1520 + idx);
      }
    });

    // 9. Bushwood Estates Clubhouse & Stained Glass Windows (hit with shanked golf balls!)
    const ch = this.clubhouse;
    renderer.drawBoilBox(ch.x, ch.y, ch.w, ch.h, '#d9cbb0', '#161311', 4, 2.0, 1600);
    // Red Tile Mansard Roof
    renderer.drawBoilPolygon(
      [[ch.x - 15, ch.y], [ch.x + ch.w + 15, ch.y], [ch.x + ch.w - 20, ch.y - 45], [ch.x + 20, ch.y - 45]],
      '#8f2d24',
      '#161311',
      3.5,
      1.8,
      1601
    );
    // 4 Large Picture Windows
    for (let w = 0; w < 4; w++) {
      const wx = ch.x + 32 + w * 102;
      const wy = ch.y + 45;
      const broken = ch.windowsBroken[w];
      renderer.drawBoilBox(wx, wy, 72, 65, broken ? '#1c1917' : '#73b3c9', '#161311', 3, 1.2, 1610 + w);
      if (broken) {
        // Jagged glass shards
        renderer.drawBoilPolygon([[wx, wy], [wx + 18, wy + 14], [wx, wy + 25]], '#a6d9eb', '#161311', 1.5, 0.8, 1620 + w);
        renderer.drawBoilPolygon([[wx + 72, wy + 65], [wx + 50, wy + 48], [wx + 72, wy + 30]], '#a6d9eb', '#161311', 1.5, 0.8, 1630 + w);
      }
    }
    ctx.save();
    ctx.font = '900 17px "Trebuchet MS", "Arial Black", system-ui, sans-serif';
    ctx.fillStyle = '#161311';
    ctx.textAlign = 'center';
    ctx.fillText('BUSHWOOD CLUBHOUSE', ch.x + ch.w / 2, ch.y + 27);
    ctx.restore();

    // 10. Smashable Collateral Props (Bushes, Small Trees, Golf Bags, Port-a-Potties, Wedding Cake)
    this.props.forEach((p, idx) => {
      if (!p.intact) {
        // 10a. Ground Stump / Puddle at original location (stumpX, stumpY)
        if (p.type === 'porta_potty') {
          // Huge neon-blue chemical sewage puddle!
          renderer.drawBoilEllipse(p.stumpX, p.stumpY, 32, 22, 'rgba(41, 182, 246, 0.78)', '#161311', 2, 1.4, 12, 1700 + idx);
          // Roll of toilet paper floating in puddle
          renderer.drawBoilBox(p.stumpX - 10, p.stumpY - 5, 8, 6, '#ffffff', '#161311', 1.5, 0.5, 1701 + idx);
        } else if (p.type === 'small_tree') {
          // Snapped wooden tree stump in the ground!
          renderer.drawBoilEllipse(p.stumpX, p.stumpY, 7, 5, '#8c6239', '#161311', 2, 0.7, 8, 1702 + idx);
        } else if (p.type === 'bush') {
          // Flattened shredded bush leaves & crushed flowers
          renderer.drawBoilEllipse(p.stumpX, p.stumpY, 18, 12, 'rgba(54, 92, 34, 0.75)', '#161311', 1.8, 1.3, 10, 1703 + idx);
          renderer.drawBoilEllipse(p.stumpX + 5, p.stumpY - 3, 4, 4, p.flowerColor || '#ff69b4', '#161311', 1.2, 0.5, 6, 1704 + idx);
          return;
        }

        // 10b. Tumbling / Toppled Prop Body at (p.x, p.y - p.z)
        ctx.save();
        ctx.translate(p.x, p.y - (p.z || 0));
        ctx.rotate(p.angle || 0);

        if (p.type === 'porta_potty') {
          // Toppled blue plastic Port-a-John lying on its side with broken door!
          renderer.drawBoilBox(-22, -14, 44, 28, '#2b8cbe', '#161311', 2.6, 1.2, 1720 + idx);
          renderer.drawBoilBox(-18, -10, 16, 20, '#1b4f6b', '#161311', 2, 0.9, 1721 + idx);
        } else if (p.type === 'golf_bag') {
          // Spilled leather golf bag lying on its side
          renderer.drawBoilBox(-14, -7, 28, 14, p.bagColor || '#b8251e', '#161311', 2.3, 1.0, 1735 + idx);
          renderer.drawBoilLine(-10, -7, -10, 7, '#f3e5c8', 2, 0.5, 1736 + idx);
        } else if (p.type === 'small_tree') {
          // Felled sapling trunk & leafy crown lying on the grass
          renderer.drawBoilBox(-18, -3, 22, 6, '#7a5230', '#161311', 2, 0.8, 1745 + idx);
          renderer.drawBoilEllipse(8, 0, 16, 13, '#3b6e28', '#161311', 2.3, 1.4, 10, 1746 + idx);
        } else {
          // Smashed wedding cake / banquet debris
          renderer.drawBoilEllipse(0, 0, p.r * 1.1, p.r * 0.75, 'rgba(235, 222, 200, 0.8)', '#161311', 2, 1.4, 10, 1705 + idx);
          renderer.drawBoilLine(-12, -7, 13, 9, '#8c3b2b', 3, 1.0, 1706 + idx);
        }
        ctx.restore();
        return;
      }

      // Intact Standing Prop
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'wedding_cake') {
        renderer.drawBoilEllipse(0, 0, 24, 24, '#fff8f0', '#161311', 2.5, 1.2, 12, 1710);
        renderer.drawBoilEllipse(0, -6, 16, 16, '#ffd6e0', '#161311', 2.2, 1.0, 10, 1711);
        renderer.drawBoilEllipse(0, -12, 9, 9, '#fff8f0', '#161311', 2.0, 0.8, 8, 1712);
      } else if (p.type === 'porta_potty') {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(-16, -12, 38, 34);
        // Blue plastic Port-a-John walls & white vent roof
        renderer.drawBoilBox(-18, -18, 36, 36, '#2b8cbe', '#161311', 2.8, 1.2, 1720 + idx);
        renderer.drawBoilBox(-13, -13, 26, 26, '#56b4e9', '#161311', 2.2, 0.9, 1721 + idx);
        // White vent pipe & "OCCUPIED" red latch
        renderer.drawBoilEllipse(-10, -10, 3.5, 3.5, '#f3e5c8', '#161311', 1.8, 0.5, 6, 1722 + idx);
        renderer.drawBoilBox(-4, 13, 8, 4, p.occupied ? '#ff2a1f' : '#a4ff3b', '#161311', 1.5, 0.4, 1723 + idx);
      } else if (p.type === 'golf_bag') {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.26)';
        ctx.beginPath();
        ctx.ellipse(2, 5, 13, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Stand legs
        renderer.drawBoilLine(-4, 2, -13, 12, '#24211e', 2.2, 0.5, 1730 + idx);
        renderer.drawBoilLine(4, 2, -6, 14, '#24211e', 2.2, 0.5, 1731 + idx);
        // Leather golf bag cylinder
        renderer.drawBoilPolygon(
          [[-8, 9], [7, -9], [14, -4], [-1, 14]],
          p.bagColor || '#b8251e',
          '#161311',
          2.4,
          0.9,
          1732 + idx
        );
        // Shiny clubs sticking out top of bag
        renderer.drawBoilLine(8, -7, 17, -17, '#d4dce0', 2.2, 0.6, 1733 + idx);
        renderer.drawBoilLine(10, -5, 20, -12, '#d4dce0', 2.2, 0.6, 1734 + idx);
        renderer.drawBoilEllipse(17, -17, 3.5, 2, '#3b4042', '#161311', 1.6, 0.4, 6, 1735 + idx);
      } else if (p.type === 'small_tree') {
        // Knock-over Small Sapling Tree
        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        ctx.beginPath();
        ctx.arc(4, 6, 17, 0, Math.PI * 2);
        ctx.fill();
        // Birch trunk visible at center
        renderer.drawBoilEllipse(0, 0, 17, 16, '#488231', '#161311', 2.5, 1.5, 10, 1740 + idx);
        renderer.drawBoilEllipse(-4, -4, 10, 9, '#62a644', '#161311', 1.8, 1.1, 8, 1741 + idx);
      } else if (p.type === 'bush') {
        // Knock-over Ornamental Bush with flowers
        renderer.drawBoilEllipse(0, 0, 15, 13, '#336121', '#161311', 2.3, 1.4, 9, 1750 + idx);
        renderer.drawBoilEllipse(-4, -3, 3.2, 3.2, p.flowerColor, '#161311', 1.3, 0.5, 6, 1751 + idx);
        renderer.drawBoilEllipse(5, 2, 3.2, 3.2, p.flowerColor, '#161311', 1.3, 0.5, 6, 1752 + idx);
        renderer.drawBoilEllipse(2, -5, 2.8, 2.8, p.flowerColor, '#161311', 1.3, 0.5, 6, 1753 + idx);
      } else if (p.type === 'bride_groom') {
        renderer.drawBoilEllipse(-10, 0, 13, 13, '#ffffff', '#161311', 2.4, 1.1, 10, 1730);
        renderer.drawBoilEllipse(10, 0, 10, 10, '#1c1a19', '#161311', 2.4, 1.1, 10, 1731);
      } else {
        renderer.drawBoilBox(-22, -14, 44, 28, '#e8dfd1', '#161311', 2.5, 1.2, 1740 + idx);
      }
      ctx.restore();
    });

    // 10c. Draw Flying/Scattered Golf Clubs from smashed Golf Bags
    this.flyingClubs.forEach((fc, idx) => {
      ctx.save();
      ctx.translate(fc.x, fc.y - (fc.z || 0));
      ctx.rotate(fc.angle);
      renderer.drawBoilLine(-11, 0, 11, 0, '#d4dce0', 2.2, 0.6, 1790 + idx);
      renderer.drawBoilEllipse(11, 0, 3.8, 2.2, '#3b4042', '#161311', 1.6, 0.4, 6, 1791 + idx);
      ctx.restore();
    });

    // 11. Roaming Beverage Cart
    const bc = this.bevCart;
    ctx.save();
    ctx.translate(bc.x, bc.y);
    ctx.rotate(bc.angle);
    renderer.drawBoilBox(-22, -14, 44, 28, '#e04f80', '#161311', 2.8, 1.2, 1800);
    renderer.drawBoilEllipse(0, 0, 18, 18, '#f7d53b', '#161311', 2.4, 1.1, 10, 1801);
    ctx.restore();

    // 12. Trees
    this.trees.forEach((t) => {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.arc(t.x + 8, t.y + 10, t.r, 0, Math.PI * 2);
      ctx.fill();
      renderer.drawBoilEllipse(t.x, t.y, t.r, t.r * 0.92, '#2d4c1e', '#161311', 3, 2.0, 12, 1900 + t.seed);
      renderer.drawBoilEllipse(t.x - 6, t.y - 6, t.r * 0.6, t.r * 0.55, '#3e662b', '#161311', 2, 1.5, 9, 1950 + t.seed);
    });
  }
}

window.GolfCourseWorld = GolfCourseWorld;
