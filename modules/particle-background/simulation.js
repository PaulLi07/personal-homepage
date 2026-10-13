(function () {
  "use strict";
  const TAU = Math.PI * 2;
  const EMPTY = new Float32Array(0);
  const clock = () => typeof performance !== "undefined" ? performance.now() : Date.now();
  const wrap = (value, length) => ((value % length) + length) % length;

  function dimension(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 100000) {
      throw new RangeError("Particle viewport dimensions must be positive and no larger than 100000.");
    }
    return value;
  }
  function particleCount(value) {
    if (!Number.isInteger(value) || value < 0 || value > 12000) throw new RangeError("Invalid particle count.");
    return value;
  }

  window.Homepage.createDustSimulation = function ({width, height, count, config = {}, random = Math.random} = {}) {
    let settings = window.Homepage.particleConfig.normalize(config);
    let w = dimension(width), h = dimension(height);
    let total = particleCount(count === undefined ? settings.count : count);
    if (typeof random !== "function") throw new TypeError("Particle random source must be a function.");
    let disposed = false, elapsed = 0, lastStepMs = 0;
    let x, y, vx, vy, size, alpha, variation, sizeRatio, particles;
    let columns, rows, cellWidth, cellHeight, cells;
    let population, sumX, sumY, sumVX, sumVY;

    function sample() {
      const value = random();
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError("Particle random source must return a finite value between zero and one.");
      }
      return Math.min(value, 0.999999999);
    }
    const phases = Array.from({length: 6}, () => sample() * TAU);

    function alive() { if (disposed) throw new Error("The particle simulation has been disposed."); }
    function expose() {
      // 渲染端只读这些数组；改数量后必须重新读取 particles getter。
      particles = Object.freeze({count: total, x, y, vx, vy, size, alpha});
    }
    function makeGrid() {
      // 最多 65536 格，避免极大逻辑视口造成不受控的内存分配。
      const span = Math.max(42, Math.min(76, settings.flowScale * 0.27), Math.sqrt(w * h / 60000));
      columns = Math.max(1, Math.ceil(w / span));
      rows = Math.max(1, Math.ceil(h / span));
      cellWidth = w / columns; cellHeight = h / rows; cells = columns * rows;
      population = new Uint32Array(cells);
      sumX = new Float64Array(cells); sumY = new Float64Array(cells);
      sumVX = new Float64Array(cells); sumVY = new Float64Array(cells);
    }
    function allocate(next, oldWidth = w, oldHeight = h) {
      const old = particles;
      const oldVariation = variation, oldSizeRatio = sizeRatio;
      x = new Float32Array(next); y = new Float32Array(next);
      vx = new Float32Array(next); vy = new Float32Array(next);
      size = new Float32Array(next); alpha = new Float32Array(next);
      variation = new Float32Array(next); sizeRatio = new Float32Array(next);
      for (let i = 0; i < next; i += 1) {
        if (old && i < old.count) {
          x[i] = wrap(old.x[i] * w / oldWidth, w); y[i] = wrap(old.y[i] * h / oldHeight, h);
          vx[i] = old.vx[i]; vy[i] = old.vy[i]; alpha[i] = old.alpha[i];
          variation[i] = oldVariation[i]; sizeRatio[i] = oldSizeRatio[i];
        } else {
          x[i] = sample() * w; y[i] = sample() * h;
          const angle = sample() * TAU;
          variation[i] = 0.82 + sample() * 0.36;
          sizeRatio[i] = sample(); alpha[i] = 0.35 + sample() * 0.65;
          vx[i] = Math.cos(angle) * settings.averageSpeed * variation[i];
          vy[i] = Math.sin(angle) * settings.averageSpeed * variation[i];
        }
        size[i] = settings.minSize + sizeRatio[i] * (settings.maxSize - settings.minSize);
        if (x[i] >= w) x[i] = 0;
        if (y[i] >= h) y[i] = 0;
      }
      total = next; expose();
    }
    allocate(total); makeGrid();

    function resize(nextWidth, nextHeight, nextCount = total) {
      alive();
      const newWidth = dimension(nextWidth), newHeight = dimension(nextHeight), newCount = particleCount(nextCount);
      const oldWidth = w, oldHeight = h;
      w = newWidth; h = newHeight;
      allocate(newCount, oldWidth, oldHeight); makeGrid();
      return particles;
    }
    function updateConfig(patch) {
      alive();
      const next = window.Homepage.particleConfig.normalize(patch, settings);
      const resetGrid = settings.flowScale !== next.flowScale;
      settings = next;
      for (let i = 0; i < total; i += 1) size[i] = settings.minSize + sizeRatio[i] * (settings.maxSize - settings.minSize);
      // 主动设置零平均速度立即消除旧漂移，下一步仍可接收局部手势。
      if (settings.averageSpeed === 0) { vx.fill(0); vy.fill(0); }
      if (resetGrid) makeGrid();
      return settings;
    }
    function aggregate() {
      population.fill(0); sumX.fill(0); sumY.fill(0); sumVX.fill(0); sumVY.fill(0);
      for (let i = 0; i < total; i += 1) {
        const column = Math.min(columns - 1, Math.floor(x[i] / cellWidth));
        const row = Math.min(rows - 1, Math.floor(y[i] / cellHeight));
        const cell = row * columns + column;
        population[cell] += 1; sumX[cell] += x[i]; sumY[cell] += y[i];
        sumVX[cell] += vx[i]; sumVY[cell] += vy[i];
      }
    }

    function step(dt, pointer = null, time) {
      alive();
      if (typeof dt !== "number" || !Number.isFinite(dt) || dt < 0) throw new RangeError("Particle time step must be finite and nonnegative.");
      if (time !== undefined && (typeof time !== "number" || !Number.isFinite(time))) throw new RangeError("Particle time must be finite.");
      const delta = Math.min(dt, 0.05);
      if (!delta || !total || !settings.enabled) { lastStepMs = 0; return; }
      const started = clock();
      elapsed = time === undefined ? elapsed + delta : time;
      // 对极大绝对时间取周期范围，保持三角函数输入稳定。
      const t = elapsed % 100000;
      const pointerActive = pointer?.active === true && Number.isFinite(pointer.x) && Number.isFinite(pointer.y);
      const px = pointerActive ? pointer.x : 0, py = pointerActive ? pointer.y : 0;
      const offsetX = pointerActive && Number.isFinite(pointer.offsetX) ? pointer.offsetX : 0;
      const offsetY = pointerActive && Number.isFinite(pointer.offsetY) ? pointer.offsetY : 0;
      const pvx = pointerActive && Number.isFinite(pointer.vx) ? Math.max(-3000, Math.min(3000, pointer.vx)) : 0;
      const pvy = pointerActive && Number.isFinite(pointer.vy) ? Math.max(-3000, Math.min(3000, pointer.vy)) : 0;
      const gestureSpeed = Math.min(2000, Math.hypot(pvx, pvy));
      const radius = settings.interactionRadius, radiusSquared = radius * radius;
      const blend = 1 - Math.exp(-delta * (settings.averageSpeed === 0 ? 3.5 : 2.3));
      const softSquared = Math.pow(Math.min(cellWidth, cellHeight) * 0.42, 2) + 1;
      aggregate();
      for (let i = 0; i < total; i += 1) {
        const positionX = x[i], positionY = y[i];
        const column = Math.min(columns - 1, Math.floor(positionX / cellWidth));
        const row = Math.min(rows - 1, Math.floor(positionY / cellHeight));
        const ownCell = row * columns + column;
        let neighbors = 0, alignmentX = 0, alignmentY = 0;
        let cohesionX = 0, cohesionY = 0, separationX = 0, separationY = 0;
        // 九邻格只读取聚合量；密集群体也不会退化为逐粒子的平方遍历。
        for (let oy = -1; oy <= 1; oy += 1) {
          if ((rows === 1 && oy !== 0) || (rows === 2 && oy === 1)) continue;
          const neighborRow = (row + oy + rows) % rows;
          for (let ox = -1; ox <= 1; ox += 1) {
            if ((columns === 1 && ox !== 0) || (columns === 2 && ox === 1)) continue;
            const cell = neighborRow * columns + (column + ox + columns) % columns;
            const own = cell === ownCell ? 1 : 0;
            const n = population[cell] - own;
            if (!n) continue;
            let dx = (sumX[cell] - own * positionX) / n - positionX;
            let dy = (sumY[cell] - own * positionY) / n - positionY;
            if (dx > w * 0.5) dx -= w; else if (dx < -w * 0.5) dx += w;
            if (dy > h * 0.5) dy -= h; else if (dy < -h * 0.5) dy += h;
            neighbors += n;
            alignmentX += sumVX[cell] - own * vx[i]; alignmentY += sumVY[cell] - own * vy[i];
            cohesionX += dx * n; cohesionY += dy * n;
            const repulsion = n / (dx * dx + dy * dy + softSquared);
            separationX -= dx * repulsion; separationY -= dy * repulsion;
          }
        }

        // 三尺度流函数的旋度：连续涡旋由局部聚合演化，不指定轨迹或字形。
        const fx = positionX / settings.flowScale, fy = positionY / settings.flowScale;
        const a = fx + t * 0.13 + phases[0], b = fy - t * 0.11 + phases[1];
        const u = fx * 0.56 + fy * 0.83 + t * 0.06 + phases[2];
        const v = -fx * 0.76 + fy * 0.46 - t * 0.075 + phases[3];
        const q = fx * 1.72 - fy * 0.93 + t * 0.21 + phases[4];
        const r = fx * 0.81 + fy * 1.51 - t * 0.16 + phases[5];
        const sinA = Math.sin(a), cosA = Math.cos(a), sinB = Math.sin(b), cosB = Math.cos(b);
        const sinU = Math.sin(u), cosU = Math.cos(u), sinV = Math.sin(v), cosV = Math.cos(v);
        const sinQ = Math.sin(q), cosQ = Math.cos(q), sinR = Math.sin(r), cosR = Math.cos(r);
        let directionX = -sinA * sinB + 0.58 * (0.83 * cosU * sinV + 0.46 * sinU * cosV)
          + 0.22 * settings.turbulence * (-0.93 * cosQ * cosR - 1.51 * sinQ * sinR);
        let directionY = -cosA * cosB - 0.58 * (0.56 * cosU * sinV - 0.76 * sinU * cosV)
          - 0.22 * settings.turbulence * (1.72 * cosQ * cosR - 0.81 * sinQ * sinR);
        const flowLength = Math.hypot(directionX, directionY) || 1;
        directionX /= flowLength; directionY /= flowLength;
        if (neighbors) {
          const alignmentLength = Math.hypot(alignmentX, alignmentY);
          if (alignmentLength > 0.001) {
            directionX += settings.alignment * alignmentX / alignmentLength;
            directionY += settings.alignment * alignmentY / alignmentLength;
          }
          cohesionX /= neighbors; cohesionY /= neighbors;
          const cohesionLength = Math.hypot(cohesionX, cohesionY);
          if (cohesionLength > 0.001) {
            const weight = settings.cohesion * Math.min(1, cohesionLength / (cellWidth * 0.3 + 1));
            directionX += weight * cohesionX / cohesionLength; directionY += weight * cohesionY / cohesionLength;
          }
          const separationLength = Math.hypot(separationX, separationY);
          if (separationLength > 0.001) {
            const weight = settings.separation * Math.min(1, separationLength * 20 / neighbors);
            directionX += weight * separationX / separationLength; directionY += weight * separationY / separationLength;
          }
        }
        const length = Math.hypot(directionX, directionY) || 1;
        const targetSpeed = settings.averageSpeed * variation[i];
        let nextVX = vx[i] + (directionX / length * targetSpeed - vx[i]) * blend;
        let nextVY = vy[i] + (directionY / length * targetSpeed - vy[i]) * blend;
        if (pointerActive && settings.interactionStrength) {
          // 输入与可见粒子使用同一坐标系，视差及边缘回绕后搅动仍跟随鼠标。
          const dx = wrap(positionX + offsetX, w) - px, dy = wrap(positionY + offsetY, h) - py;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < radiusSquared) {
            const distance = Math.sqrt(distanceSquared), divisor = Math.max(distance, 1);
            const influence = Math.pow(1 - distance / radius, 2) * settings.interactionStrength;
            const turn = dx * pvy - dy * pvx < 0 ? -1 : 1;
            const rotation = (24 + gestureSpeed * 0.045) * turn;
            const repel = 12 + gestureSpeed * 0.018;
            nextVX += influence * delta * 4 * (-dy / divisor * rotation + dx / divisor * repel + pvx * 0.12);
            nextVY += influence * delta * 4 * (dx / divisor * rotation + dy / divisor * repel + pvy * 0.12);
          }
        }
        const speed = Math.hypot(nextVX, nextVY), limit = Math.max(80, settings.averageSpeed * 3 + 240);
        if (speed > limit) { nextVX *= limit / speed; nextVY *= limit / speed; }
        vx[i] = nextVX; vy[i] = nextVY;
        x[i] = wrap(positionX + nextVX * delta, w); y[i] = wrap(positionY + nextVY * delta, h);
        if (x[i] >= w) x[i] = 0;
        if (y[i] >= h) y[i] = 0;
      }
      lastStepMs = Math.max(0, clock() - started);
    }

    function stats() {
      let finite = true, speedSum = 0, maxSpeed = 0;
      for (let i = 0; i < total; i += 1) {
        const speed = Math.hypot(vx[i], vy[i]);
        finite = finite && Number.isFinite(x[i]) && Number.isFinite(y[i]) && Number.isFinite(speed)
          && x[i] >= 0 && x[i] < w && y[i] >= 0 && y[i] < h;
        speedSum += speed; maxSpeed = Math.max(maxSpeed, speed);
      }
      return Object.freeze({count: total, width: w, height: h, finite,
        meanSpeed: total ? speedSum / total : 0, maxSpeed, gridCells: disposed ? 0 : cells, lastStepMs, disposed});
    }
    function dispose() {
      if (disposed) return;
      for (const array of [x, y, vx, vy, size, alpha, variation, sizeRatio, population, sumX, sumY, sumVX, sumVY]) array.fill(0);
      x = y = vx = vy = size = alpha = variation = sizeRatio = EMPTY;
      population = sumX = sumY = sumVX = sumVY = null;
      total = 0; disposed = true; lastStepMs = 0; expose();
    }
    return Object.freeze({resize, updateConfig, step, stats, dispose, get particles() { return particles; }});
  };
}());
