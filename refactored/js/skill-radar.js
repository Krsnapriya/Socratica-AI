/* ============================================================
   Socratica AI — ATC-style PPI Sweep Radar
   ============================================================
   Circular Plan Position Indicator radar with rotating sweep
   beam, range rings, problem contact blips, and automatic
   domain detection from the current learning trajectory.
   ============================================================ */

(function () {
  'use strict';

  const CX = 200, CY = 200, R = 170;
  const N = 5;
  const START_ANGLE = -Math.PI / 2;
  const DEG = Math.PI / 180;
  const SWEEP_RPM = 0.012; // radians per frame (~1 full rotation in 8s)

  // ── Geometry helpers ──────────────────────────────────────
  function pol(angle) { return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) }; }

  function polF(angle, f) { return { x: CX + R * f * Math.cos(angle), y: CY + R * f * Math.sin(angle) }; }

  function domainAngle(idx) { return START_ANGLE + (2 * Math.PI * idx) / N; }

  function diffToR(diff) { return diff === 'Easy' ? 0.3 : diff === 'Hard' ? 0.75 : 0.55; }

  function diffColor(d) { return d === 'Easy' ? '#bace99' : d === 'Hard' ? '#ffb4ab' : '#ffb95f'; }

  // ── Blip model from engine ────────────────────────────────
  function buildBlips() {
    if (!window.SocraticEngine) return [];
    const domains = SocraticEngine.getSkillDomains();
    const probs = SocraticEngine.getProblems();
    const blips = [];
    probs.forEach(function (p) {
      var skills = SocraticEngine.getSkillForProblem(p.id);
      var baseAngle = domainAngle(domains[skills[0]].vertexIndex);
      // Add a small per-problem offset within the sector
      var offset = (skills.indexOf(skills[0]) || probs.indexOf(p) % 3) * 0.08 - 0.08;
      var angle = baseAngle + offset;
      var rFrac = diffToR(p.difficulty);
      var pos = polF(angle, rFrac);
      blips.push({
        id: p.id,
        label: p.problem,
        difficulty: p.difficulty,
        color: diffColor(p.difficulty),
        skills: skills,
        x: pos.x, y: pos.y,
        angle: angle,
        radiusFrac: rFrac
      });
    });
    return blips;
  }

  // ── Active domain from current problem ────────────────────
  function getActiveDomain() {
    if (!window.SocraticEngine) return null;
    var idx = SocraticEngine.getCurrentProblemIndex();
    var probs = SocraticEngine.getProblems();
    if (!probs[idx]) return null;
    var skills = SocraticEngine.getSkillForProblem(probs[idx].id);
    return skills.length ? skills[0] : null;
  }

  function getActiveAngle() {
    if (!window.SocraticEngine) return null;
    var dId = getActiveDomain();
    if (!dId) return null;
    var domains = SocraticEngine.getSkillDomains();
    return domainAngle(domains[dId].vertexIndex);
  }

  var _lastFrameId = null;

  // ── Build SVG radar ───────────────────────────────────────
  function render(container) {
    if (!container) return;
    if (_lastFrameId) { cancelAnimationFrame(_lastFrameId); _lastFrameId = null; }
    if (!window.SocraticEngine) { container.innerHTML = '<div class="text-on-surface-variant text-sm">Engine not loaded</div>'; return; }

    var activeDomain = getActiveDomain();
    var activeAngle = getActiveAngle();
    var blips = buildBlips();
    var domains = SocraticEngine.getSkillDomains();
    var domainIds = Object.keys(domains);
    var filter = SocraticEngine.getSkillFilter();

    container.innerHTML = '';
    container.style.position = 'relative';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 450');
    svg.setAttribute('class', 'w-full max-w-[420px]');
    svg.setAttribute('aria-label', 'PPI Sweep Radar — rotating scan with problem contacts');
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    // ── Defs ────────────────────────────────────────────────
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML =
      '<filter id="blip-glow"><feGaussianBlur result="b" stdDeviation="2.5"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="blip-hot"><feGaussianBlur result="b" stdDeviation="5"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="sweep-blur"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<radialGradient id="sweep-grad" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#bace99" stop-opacity="0.12"/>' +
        '<stop offset="70%" stop-color="#bace99" stop-opacity="0.06"/>' +
        '<stop offset="100%" stop-color="#bace99" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="scan-grad" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#bace99" stop-opacity="0.04"/>' +
        '<stop offset="100%" stop-color="#bace99" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<clipPath id="radar-clip"><circle cx="200" cy="200" r="170"/></clipPath>';
    svg.appendChild(defs);

    // ── Background (CRT display) ────────────────────────────
    var bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', CX); bg.setAttribute('cy', CY);
    bg.setAttribute('r', R + 2);
    bg.setAttribute('fill', '#060e20');
    bg.setAttribute('stroke', '#464555');
    bg.setAttribute('stroke-width', '2');
    svg.appendChild(bg);

    // ── Range rings ─────────────────────────────────────────
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (f) {
      var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', CX); ring.setAttribute('cy', CY);
      ring.setAttribute('r', R * f);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#464555');
      ring.setAttribute('stroke-width', f === 1.0 ? 1.5 : 0.5);
      ring.setAttribute('opacity', f === 1.0 ? '0.6' : '0.25');
      svg.appendChild(ring);
    });

    // ── Axis spokes ─────────────────────────────────────────
    for (var i = 0; i < N; i++) {
      var p = pol(domainAngle(i));
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', CX); line.setAttribute('y1', CY);
      line.setAttribute('x2', p.x); line.setAttribute('y2', p.y);
      line.setAttribute('stroke', '#464555');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('opacity', '0.3');
      svg.appendChild(line);
    }

    // ── Domain labels (around perimeter) ────────────────────
    domainIds.forEach(function (id) {
      var d = domains[id];
      var angle = domainAngle(d.vertexIndex);
      var labelPos = polF(angle, 1.12);
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelPos.x);
      text.setAttribute('y', labelPos.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-family', 'JetBrains Mono, monospace');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', id === activeDomain ? '#bace99' : '#918fa1');
      text.setAttribute('font-weight', id === activeDomain ? '700' : '400');
      text.setAttribute('letter-spacing', '0.08em');
      text.textContent = d.short.toUpperCase();
      svg.appendChild(text);
    });

    // ── Blips (problem contacts) ────────────────────────────
    var blipEls = [];
    blips.forEach(function (b) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-blip-id', b.id);

      // Glow dot
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', b.x);
      dot.setAttribute('cy', b.y);
      dot.setAttribute('r', '5');
      dot.setAttribute('fill', b.color);
      dot.setAttribute('opacity', '0.85');
      dot.setAttribute('filter', 'url(#blip-glow)');

      // Inner bright core
      var core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('cx', b.x);
      core.setAttribute('cy', b.y);
      core.setAttribute('r', '2');
      core.setAttribute('fill', '#ffffff');
      core.setAttribute('opacity', '0.9');

      // Label (shown on hover via CSS)
      var lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', b.x + 10);
      lbl.setAttribute('y', b.y - 10);
      lbl.setAttribute('font-family', 'JetBrains Mono, monospace');
      lbl.setAttribute('font-size', '8');
      lbl.setAttribute('fill', '#c7c4d8');
      lbl.setAttribute('opacity', '0');
      lbl.setAttribute('class', 'blip-label');
      lbl.textContent = b.label;

      g.appendChild(dot);
      g.appendChild(core);
      g.appendChild(lbl);

      // Click handler — focus problem
      g.style.cursor = 'pointer';
      g.addEventListener('click', function () {
        if (window.SocraticEngine) {
          SocraticEngine.switchProblem(b.id);
          render(container);
        }
      });
      g.addEventListener('mouseenter', function () {
        lbl.setAttribute('opacity', '1');
        dot.setAttribute('r', '7');
      });
      g.addEventListener('mouseleave', function () {
        lbl.setAttribute('opacity', '0');
        dot.setAttribute('r', '5');
      });

      // Store reference for sweep animation
      g._blipData = b;
      g._dot = dot;
      g._core = core;

      svg.appendChild(g);
      blipEls.push(g);
    });

    // ── Sweep beam (animated wedge) ─────────────────────────
    var sweepGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sweepGroup.setAttribute('clip-path', 'url(#radar-clip)');

    // Leading-edge bright line
    var leader = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leader.setAttribute('x1', CX); leader.setAttribute('y1', CY);
    leader.setAttribute('x2', CX + R + 10); leader.setAttribute('y2', CY);
    leader.setAttribute('stroke', '#bace99');
    leader.setAttribute('stroke-width', '1.5');
    leader.setAttribute('opacity', '0.7');

    // Trailing wedge (wide fade)
    var wedge = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    wedge.setAttribute('fill', 'url(#sweep-grad)');
    var w = 20 * DEG;
    wedge.setAttribute('points', [CX, CY, CX + (R + 10) * Math.cos(-w), CY + (R + 10) * Math.sin(-w), CX + R + 10, CY].join(','));

    // Scan persistence glow (wide, very faint)
    var trail = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trail.setAttribute('fill', 'url(#scan-grad)');
    var tw = 40 * DEG;
    trail.setAttribute('points', [CX, CY, CX + (R + 10) * Math.cos(-tw), CY + (R + 10) * Math.sin(-tw), CX + R + 10, CY].join(','));

    sweepGroup.appendChild(trail);
    sweepGroup.appendChild(wedge);
    sweepGroup.appendChild(leader);
    svg.appendChild(sweepGroup);

    // ── Sweep animation ─────────────────────────────────────
    var sweepAngle = 0;
    var lastTime = 0;

    function animateSweep(time) {
      if (!lastTime) lastTime = time;
      var dt = time - lastTime;
      lastTime = time;

      sweepAngle += SWEEP_RPM * dt;
      if (sweepAngle > 2 * Math.PI) sweepAngle -= 2 * Math.PI;

      // Rotate sweep group
      sweepGroup.setAttribute('transform', 'rotate(' + (sweepAngle * 180 / Math.PI) + ', ' + CX + ', ' + CY + ')');

      // Check which blips are near the sweep leading edge
      var beamAngle = sweepAngle % (2 * Math.PI);
      blipEls.forEach(function (el) {
        var b = el._blipData;
        if (!b) return;
        // Normalize blip angle to 0-2PI
        var blipA = ((b.angle - START_ANGLE) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        var diff = Math.abs(beamAngle - blipA);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        var isNear = diff < 0.15;
        var isActive = activeDomain && b.skills.indexOf(activeDomain) !== -1;

        if (isNear && isActive) {
          el._dot.setAttribute('r', '8');
          el._dot.setAttribute('filter', 'url(#blip-hot)');
          el._dot.setAttribute('opacity', '1');
        } else if (isNear) {
          el._dot.setAttribute('r', '6');
          el._dot.setAttribute('filter', 'url(#blip-hot)');
          el._dot.setAttribute('opacity', '0.95');
        } else {
          el._dot.setAttribute('r', '5');
          el._dot.setAttribute('filter', 'url(#blip-glow)');
          el._dot.setAttribute('opacity', '0.6');
        }
      });

      _lastFrameId = requestAnimationFrame(animateSweep);
    }

    // ── Center hub ──────────────────────────────────────────
    var hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hub.setAttribute('cx', CX); hub.setAttribute('cy', CY);
    hub.setAttribute('r', '6');
    hub.setAttribute('fill', 'none');
    hub.setAttribute('stroke', '#bace99');
    hub.setAttribute('stroke-width', '2');
    hub.setAttribute('opacity', '0.4');
    svg.appendChild(hub);

    // ── Active domain indicator ─────────────────────────────
    if (activeDomain) {
      var ad = domains[activeDomain];
      var aPos = pol(domainAngle(ad.vertexIndex));
      var marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      marker.setAttribute('cx', aPos.x);
      marker.setAttribute('cy', aPos.y);
      marker.setAttribute('r', '10');
      marker.setAttribute('fill', 'none');
      marker.setAttribute('stroke', '#ffb95f');
      marker.setAttribute('stroke-width', '1');
      marker.setAttribute('opacity', '0.5');
      marker.innerHTML = '<animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite"/>';
      svg.appendChild(marker);

      var adLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      adLabel.setAttribute('x', CX);
      adLabel.setAttribute('y', CY + R + 28);
      adLabel.setAttribute('text-anchor', 'middle');
      adLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
      adLabel.setAttribute('font-size', '10');
      adLabel.setAttribute('fill', '#ffb95f');
      adLabel.setAttribute('font-weight', '600');
      adLabel.setAttribute('letter-spacing', '0.1em');
      adLabel.textContent = 'TRACKING: ' + ad.short.toUpperCase();
      svg.appendChild(adLabel);
    }

    // ── Filter info banner ──────────────────────────────────
    if (filter) {
      var fg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      var fb = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      fb.setAttribute('x', '120'); fb.setAttribute('y', '410');
      fb.setAttribute('width', '160'); fb.setAttribute('height', '18');
      fb.setAttribute('rx', '4');
      fb.setAttribute('fill', '#171f33');
      fb.setAttribute('stroke', '#464555');
      fb.setAttribute('stroke-width', '1');
      fg.appendChild(fb);

      var ft = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ft.setAttribute('x', '200'); ft.setAttribute('y', '423');
      ft.setAttribute('text-anchor', 'middle');
      ft.setAttribute('font-family', 'JetBrains Mono, monospace');
      ft.setAttribute('font-size', '8');
      ft.setAttribute('fill', '#bace99');
      ft.setAttribute('letter-spacing', '0.05em');
      ft.textContent = 'socratica --focus ' + filter.toUpperCase();
      fg.appendChild(ft);
      svg.appendChild(fg);
    }

    container.appendChild(svg);

    // ── Start sweep animation ───────────────────────────────
    _lastFrameId = requestAnimationFrame(animateSweep);
  }

  window.SkillRadar = { render: render };

})();
