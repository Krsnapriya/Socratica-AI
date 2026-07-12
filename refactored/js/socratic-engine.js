/* ============================================================
   Socratica AI — Socratic Differential Engine (Frontend)
   ============================================================
   Implements spec §3.2 Tier 1/Tier 2 detection,
   §3.4 Socratic AI hint system, §3.5 Trajectory Timeline.
   
   This is a simulation layer that demonstrates the behavior
   the backend differential engine will produce.
   ============================================================ */

(function () {
  'use strict';

  // ---- Skill Domain Model (for Radar Drill-Down) ----
  const SKILL_DOMAINS = {
    'logic': { label: 'Logic', short: 'Logic', level: 4, vertexIndex: 0, color: 'var(--primary)' },
    'algorithms': { label: 'Algorithms', short: 'Algorithms', level: 82, vertexIndex: 1, color: 'var(--secondary)' },
    'memory': { label: 'Memory Management', short: 'Memory', level: 3, vertexIndex: 2, color: 'var(--tertiary)' },
    'systems': { label: 'Systems', short: 'Systems', level: 74, vertexIndex: 3, color: 'var(--error)' },
    'data-structures': { label: 'Data Structures', short: 'Data Structures', level: 5, vertexIndex: 4, color: 'var(--primary-fixed)' }
  };

  // Map problem IDs to skill domains
  const PROBLEM_SKILL_MAP = {
    'reverse-linked-list': ['data-structures', 'algorithms'],
    'two-sum': ['algorithms', 'logic'],
    'lru-cache': ['systems', 'data-structures'],
    'dijkstra': ['algorithms', 'memory', 'logic']
  };

  // ---- Filter State ----
  function getStoredSkillFilter() {
    try { return localStorage.getItem('socratica-skill-filter') || null; } catch(e) { return null; }
  }

  function setStoredSkillFilter(domainId) {
    try {
      if (domainId) localStorage.setItem('socratica-skill-filter', domainId);
      else localStorage.removeItem('socratica-skill-filter');
    } catch(e) {}
  }

  // ---- Mock Telemetry Data (demo purposes) ----
  // Trace patterns: { loopDepth: number, branchingFactor: number }
  // Used by evaluateTier() for structural similarity comparison.
  const PROBLEMS = [
    {
      id: 'reverse-linked-list',
      problem: 'Reverse Linked List',
      language: 'Python 3.10',
      difficulty: 'Medium',
      category: 'Linked Lists',
      tracePattern: { loopDepth: 1, branchingFactor: 0 },
      rounds: [
        { round: 1, status: 'fail', steps: 156, divergenceStep: 156,
          studentState: { curr_val: 2, curr_next: 'None', prev_val: 1 },
          oracleState: { curr_val: 2, curr_next: 'Node(3)', prev_val: 1 },
          executionTime: 4.2, memoryUsage: 24, oracleTime: 0.01, oracleMemory: 14.2,
          hint: 'Trace through your loop manually with a two-node list. What does curr point to when the loop exits, and what remains to be done with that node?'
        },
        { round: 2, status: 'fail', steps: 98, divergenceStep: 98,
          studentState: { curr_val: 2, curr_next: 'Node(3)', prev_val: 1 },
          oracleState: { curr_val: 3, curr_next: 'Node(4)', prev_val: 2 },
          executionTime: 2.1, memoryUsage: 18, oracleTime: 0.01, oracleMemory: 14.2,
          hint: 'After the loop finishes, you have visited every node. What value should be returned as the new head, and does your code guarantee it points to the correct first node?'
        },
        { round: 3, status: 'running', steps: 42, divergenceStep: null,
          studentState: null, oracleState: null,
          executionTime: 0.8, memoryUsage: 14.5, oracleTime: 0.01, oracleMemory: 14.2, hint: null
        }
      ]
    },
    {
      id: 'two-sum',
      problem: 'Two Sum',
      language: 'Python 3.10',
      difficulty: 'Easy',
      category: 'Arrays & Hashing',
      tracePattern: { loopDepth: 1, branchingFactor: 1 },
      rounds: [
        { round: 1, status: 'fail', steps: 34, divergenceStep: 34,
          studentState: { i: 0, j: 5, target: 9, nums: '[2,7,11,15]' },
          oracleState: { i: 0, j: 1, target: 9, nums: '[2,7,11,15]' },
          executionTime: 0.8, memoryUsage: 8.5, oracleTime: 0.002, oracleMemory: 6.1,
          hint: 'What relationship should hold between the two indices you return? If the array has 4 elements, what valid index range can j be in?'
        },
        { round: 2, status: 'fail', steps: 22, divergenceStep: 22,
          studentState: { i: 0, j: 1, target: 9, complement: 2 },
          oracleState: { i: 0, j: 1, target: 9, complement: 7 },
          executionTime: 0.4, memoryUsage: 7.2, oracleTime: 0.002, oracleMemory: 6.1,
          hint: 'If the two numbers you need add to the target, and you know one of them, what arithmetic gives you the other?'
        },
        { round: 3, status: 'fail', steps: 14, divergenceStep: null,
          studentState: { i: 0, seen: '{2: 0, 7: 1}', complement: 2 },
          oracleState: { i: 0, seen: '{2: 0, 7: 1}', complement: 7 },
          executionTime: 0.15, memoryUsage: 6.8, oracleTime: 0.002, oracleMemory: 6.1,
          hint: 'When you store each number in the hash map, what key-value relationship lets you determine whether the current number completes a pair that sums to the target?'
        },
        { round: 4, status: 'running', steps: 8, divergenceStep: null,
          studentState: null, oracleState: null,
          executionTime: 0.05, memoryUsage: 6.2, oracleTime: 0.002, oracleMemory: 6.1, hint: null
        }
      ]
    },
    {
      id: 'lru-cache',
      problem: 'LRU Cache',
      language: 'Python 3.10',
      difficulty: 'Medium',
      category: 'System Design',
      tracePattern: { loopDepth: 2, branchingFactor: 2 },
      rounds: [
        { round: 1, status: 'fail', steps: 67, divergenceStep: 67,
          studentState: { cache: '{1: 1, 2: 2}', head: 'Node(2)', tail: 'Node(1)', capacity: 2 },
          oracleState: { cache: '{1: 1, 2: 2}', head: 'Node(2)', tail: 'Node(1)', capacity: 2 },
          executionTime: 1.8, memoryUsage: 32, oracleTime: 0.01, oracleMemory: 22.4,
          hint: 'What property must the head of the list satisfy after every get or put? After calling get(1), check whether the head still satisfies that property.'
        },
        { round: 2, status: 'fail', steps: 45, divergenceStep: 45,
          studentState: { curr: 'Node(2)', cache: '{1: Node(1), 2: Node(2)}' },
          oracleState: { curr: 'Node(1)', cache: '{1: Node(1), 2: Node(2)}' },
          executionTime: 1.1, memoryUsage: 28, oracleTime: 0.01, oracleMemory: 22.4,
          hint: 'When removing a node from the middle of a doubly linked list, which neighboring pointers must be updated to maintain the list structure?'
        },
        { round: 3, status: 'running', steps: 28, divergenceStep: null,
          studentState: null, oracleState: null,
          executionTime: 0.5, memoryUsage: 24, oracleTime: 0.01, oracleMemory: 22.4, hint: null
        }
      ]
    },
    {
      id: 'dijkstra',
      problem: "Dijkstra's Algorithm",
      language: 'Python 3.10',
      difficulty: 'Hard',
      category: 'Graphs',
      tracePattern: { loopDepth: 2, branchingFactor: 2 },
      rounds: [
        { round: 1, status: 'fail', steps: 210, divergenceStep: 210,
          studentState: { dist: '{A:0, B:4, C:12}', visited: '{A}', curr: 'A', neighbors: 'B:4, C:8' },
          oracleState: { dist: '{A:0, B:4, C:8}', visited: '{A}', curr: 'A', neighbors: 'B:4, C:8' },
          executionTime: 6.3, memoryUsage: 42, oracleTime: 0.05, oracleMemory: 35.1,
          hint: 'What should the initial distance be for a node that has a direct edge from the start node?'
        },
        { round: 2, status: 'fail', steps: 145, divergenceStep: 145,
          studentState: { curr: 'B', unvisited: '{C: 8, D: 12}', relax: 'D via C=8+5 vs D=12' },
          oracleState: { curr: 'B', unvisited: '{C: 8, D: 12}', relax: 'D via C=8+5=13 vs D=12' },
          executionTime: 3.8, memoryUsage: 36, oracleTime: 0.05, oracleMemory: 35.1,
          hint: 'When evaluating whether a newly discovered path is better, what comparison determines whether the known distance should be updated?'
        },
        { round: 3, status: 'running', steps: 72, divergenceStep: null,
          studentState: null, oracleState: null,
          executionTime: 1.2, memoryUsage: 35.5, oracleTime: 0.05, oracleMemory: 35.1, hint: null
        }
      ]
    }
  ];

  // ---- State ----
  let currentProblemIndex = 0;
  let data = { tier: 1 };
  let listeners = [];

  function deepCloneProblem(problem) {
    return { ...problem, rounds: problem.rounds.map(r => ({ ...r, studentState: r.studentState ? { ...r.studentState } : null, oracleState: r.oracleState ? { ...r.oracleState } : null })) };
  }

  function computeData(problemIdx) {
    const p = PROBLEMS[problemIdx];
    const startRound = Math.max(0, p.rounds.length - 2);
    const data = { ...deepCloneProblem(p), tier: 1, currentRound: startRound };
    // Auto-detect tier from trace patterns
    data.tier = Engine._detectTierForCurrent();
    return data;
  }

  // Initialize
  data = computeData(0);

  // ---- Public API ----
  const Engine = {
    getData() { return data; },

    getProblems() { return PROBLEMS.map(p => ({ id: p.id, problem: p.problem, difficulty: p.difficulty, category: p.category })); },

    getProblem(id) { return PROBLEMS.find(p => p.id === id) || null; },

    getCurrentProblemIndex() { return currentProblemIndex; },

    getSkillDomains() { return SKILL_DOMAINS; },

    getSkillFilter() { return getStoredSkillFilter(); },

    setSkillFilter(domainId) {
      if (domainId && !SKILL_DOMAINS[domainId]) return;
      setStoredSkillFilter(domainId === getStoredSkillFilter() ? null : domainId);
      window.dispatchEvent(new CustomEvent('skill-filter-changed', { detail: { domain: getStoredSkillFilter() } }));
    },

    clearSkillFilter() {
      setStoredSkillFilter(null);
      window.dispatchEvent(new CustomEvent('skill-filter-changed', { detail: { domain: null } }));
    },

    getProblemsForSkill(domainId) {
      if (!domainId) return PROBLEMS;
      return PROBLEMS.filter(p => (PROBLEM_SKILL_MAP[p.id] || []).includes(domainId));
    },

    getSkillForProblem(problemId) {
      return PROBLEM_SKILL_MAP[problemId] || [];
    },

    switchProblem(id) {
      const idx = PROBLEMS.findIndex(p => p.id === id);
      if (idx !== -1) {
        currentProblemIndex = idx;
        data = computeData(idx);
        this.notify();
      }
    },

    getRound(index) { return data.rounds[index] || null; },

    getCurrentRound() { return data.rounds[data.currentRound] || null; },

    getTier() { return data.tier; },

    setTier(t) {
      data.tier = t;
      this.notify();
    },

    // Simulate advancing a round
    advanceRound() {
      if (data.currentRound < data.rounds.length - 1) {
        data.currentRound++;
        this.notify();
      }
    },

    // Simulate resubmit (adds a new round with improved metrics)
    simulateResubmit() {
      const last = data.rounds[data.rounds.length - 1];
      const problem = PROBLEMS[currentProblemIndex];
      const genericHint = last.status === 'fail'
        ? 'Test your solution with inputs that are smaller than the examples. Does it still behave as expected in every case?'
        : null;
      const newRound = {
        round: last.round + 1,
        status: last.status === 'fail' ? Math.random() > 0.3 ? 'pass' : 'fail' : 'pass',
        steps: last.steps ? Math.max(1, last.steps - Math.floor(Math.random() * 30 + 10)) : 0,
        divergenceStep: null,
        studentState: null,
        oracleState: null,
        executionTime: last.executionTime * (0.6 + Math.random() * 0.3),
        memoryUsage: last.memoryUsage * (0.7 + Math.random() * 0.2),
        oracleTime: last.oracleTime,
        oracleMemory: last.oracleMemory,
        hint: genericHint
      };
      if (newRound.status === 'fail') {
        newRound.divergenceStep = newRound.steps;
        newRound.studentState = { curr_val: 2, curr_next: 'None', prev_val: 1 };
        newRound.oracleState = { curr_val: 2, curr_next: 'Node(3)', prev_val: 1 };
      }
      data.rounds.push(newRound);
      data.currentRound = data.rounds.length - 1;
      data.tier = this._detectTierForCurrent();
      this.notify();
    },

    // Evaluate Tier 1 vs Tier 2 (spec §3.2)
    // "honest detector": same order of magnitude AND similar control flow → Tier 1
    evaluateTier(studentSteps, oracleSteps, studentTrace, oracleTrace) {
      // Order-of-magnitude check: within ~3x tolerance
      const logRatio = Math.log10(studentSteps / oracleSteps);
      const isSameOrder = logRatio > -0.5 && logRatio < 0.5;

      // Structural similarity: compare trace patterns (loop depth + branching)
      const hasSimilarFlow = this._compareTracePatterns(studentTrace, oracleTrace);

      if (isSameOrder && hasSimilarFlow) {
        return 1; // Tier 1: step-level alignment is meaningful
      }
      return 2; // Tier 2: fall back to outcome-level comparison
    },

    _compareTracePatterns(student, oracle) {
      if (!student || !oracle) return false;
      const sDepth = student.loopDepth || 0;
      const oDepth = oracle.loopDepth || 0;
      const sBranch = student.branchingFactor || 0;
      const oBranch = oracle.branchingFactor || 0;
      const maxDepth = Math.max(sDepth, oDepth) || 1;
      const maxBranch = Math.max(sBranch, oBranch) || 1;
      const depthDiff = Math.abs(sDepth - oDepth) / maxDepth;
      const branchDiff = Math.abs(sBranch - oBranch) / maxBranch;
      return depthDiff <= 0.2 && branchDiff <= 0.3;
    },

    // Auto-detect tier based on current round's trace patterns
    _detectTierForCurrent() {
      const round = data.rounds[data.currentRound];
      if (!round) return data.tier;
      const problem = PROBLEMS[currentProblemIndex];
      const studentTrace = problem.tracePattern || { loopDepth: 0, branchingFactor: 0 };
      const oracleTrace = problem.tracePattern || { loopDepth: 0, branchingFactor: 0 };
      // For demo, simulate that later rounds converge toward oracle structure
      const progress = data.currentRound / Math.max(1, data.rounds.length - 1);
      const simStudentTrace = {
        loopDepth: Math.max(1, Math.round(studentTrace.loopDepth * (1 - progress * 0.3))),
        branchingFactor: Math.max(0, studentTrace.branchingFactor - Math.round(progress * studentTrace.branchingFactor * 0.5))
      };
      return this.evaluateTier(
        round.steps || 100,
        Math.max(1, (round.steps || 100) - 50),
        simStudentTrace,
        oracleTrace
      );
    },

    // Subscribe to changes
    subscribe(fn) {
      listeners.push(fn);
      return () => { listeners = listeners.filter(l => l !== fn); };
    },

    notify() {
      listeners.forEach(fn => fn(data));
    },

    // Reset to mock
    reset() { data = computeData(currentProblemIndex); this.notify(); }
  };

  // ---- DOM Binding Helpers ----
  function bindEngineToDOM() {
    // Tier badge
    const tierBadges = document.querySelectorAll('[data-tier-badge]');
    // Convergence timeline
    const timelineContainer = document.querySelector('[data-timeline-container]');
    // Divergence detail panel
    const detailPanel = document.querySelector('[data-divergence-panel]');
    // AI hint area
    const hintArea = document.querySelector('[data-mentor-hint]');
    // Step count
    const stepDisplay = document.querySelector('[data-step-count]');

    // Problem badge
    const problemBadge = document.querySelector('[data-problem-badge]');
    // Divergence label
    const divergenceLabel = document.querySelector('[data-divergence-label]');

    Engine.subscribe((state) => {
      // Update problem badge
      if (problemBadge) {
        problemBadge.textContent = state.problem;
      }

      // Update tier badge
      tierBadges.forEach(b => {
        const tier = state.tier;
        b.textContent = `Tier ${tier}`;
        b.className = 'tier-badge tier-' + tier;
      });

      // Update timeline
      if (timelineContainer) {
        renderTimeline(timelineContainer, state);
      }

      // Update divergence panel
      if (detailPanel) {
        renderDivergence(detailPanel, state);
      }

      // Update hint
      if (hintArea) {
        renderHint(hintArea, state);
      }

      // Update step count
      if (stepDisplay) {
        const round = state.rounds[state.currentRound];
        if (round) {
          stepDisplay.textContent = round.divergenceStep
            ? `Step ${round.divergenceStep}/${round.steps}`
            : `Step ${round.steps}/${round.steps}`;
        }
      }

      // Update divergence label
      if (divergenceLabel) {
        const round = state.rounds[state.currentRound];
        if (round && round.divergenceStep) {
          divergenceLabel.textContent = `Divergence at Step ${round.divergenceStep}`;
          divergenceLabel.className = 'text-tertiary';
        } else if (round && round.status === 'running') {
          divergenceLabel.textContent = 'Analyzing execution...';
          divergenceLabel.className = 'text-tertiary';
        } else {
          divergenceLabel.textContent = 'Converged';
          divergenceLabel.className = 'text-secondary';
        }
      }
    });
  }

  function renderTimeline(container, state) {
    const rounds = state.rounds;
    let html = '<div class="flex items-center w-full gap-2">';
    rounds.forEach((r, i) => {
      if (i > 0) html += '<div class="w-4 h-px bg-outline-variant shrink-0"></div>';
      const isLast = i === rounds.length - 1;
      const isCurrent = i === state.currentRound;
      const width = isLast ? 'flex-[1.5]' : 'flex-1';

      html += `<div class="${width} flex flex-col relative group cursor-pointer hover:bg-surface-container-high rounded p-1">`;
      html += `<div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden relative">`;

      if (r.status === 'fail') {
        html += `<div class="absolute top-0 left-0 h-full w-full bg-error opacity-50"></div>`;
        html += `<div class="absolute top-0 right-0 h-full w-1 bg-error"></div>`;
      } else if (r.status === 'pass') {
        html += `<div class="absolute top-0 left-0 h-full w-full bg-secondary"></div>`;
      } else if (r.status === 'running') {
        html += `<div class="absolute top-0 left-0 h-[60%] w-[60%] bg-tertiary top-1/2 -translate-y-1/2 rounded-full" style="width:60%"></div>`;
      }

      html += `</div>`;
      html += `<div class="flex justify-between mt-1">`;
      html += `<span class="label-xs text-on-surface-variant">Round ${r.round}</span>`;
      if (r.status === 'fail') {
        html += `<span class="label-xs text-error flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">warning</span> Fail</span>`;
      } else if (r.status === 'pass') {
        html += `<span class="label-xs text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">check_circle</span> Pass</span>`;
      } else if (r.status === 'running') {
        html += `<span class="label-xs text-tertiary flex items-center gap-1 font-bold"><span class="spinner w-3 h-3 border-[1.5px] border-tertiary border-t-white"></span> Analyzing</span>`;
      }
      html += `</div></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderDivergence(panel, state) {
    const round = state.rounds[state.currentRound];
    if (!round || round.status === 'running' || !round.divergenceStep) {
      panel.innerHTML = `<div class="text-on-surface-variant text-sm text-center py-8">No divergence detected yet. Solution is converging.</div>`;
      return;
    }

    const tier = state.tier;
    if (tier === 1) {
      // Tier 1: Step-level variable inspection (spec §3.2)
      const vars = ['curr.val', 'curr.next', 'prev.val'];
      const sVals = [round.studentState?.curr_val, round.studentState?.curr_next, round.studentState?.prev_val];
      const oVals = [round.oracleState?.curr_val, round.oracleState?.curr_next, round.oracleState?.prev_val];
      const matches = sVals.map((v, i) => v === oVals[i]);

      let rows = '';
      vars.forEach((name, i) => {
        rows += `<tr class="${i < vars.length - 1 ? 'border-b border-outline-variant/50' : ''}">
          <td class="py-2 text-primary">${name}</td>
          <td class="py-2 ${matches[i] ? '' : 'text-error'}">${sVals[i] || '—'}</td>
          <td class="py-2">${oVals[i] || '—'}</td>
          <td class="py-2 text-center ${matches[i] ? 'text-secondary' : 'text-error'}">
            <span class="material-symbols-outlined text-[16px]">${matches[i] ? 'check_circle' : 'cancel'}</span>
          </td>
        </tr>`;
      });

      var timePct = round.oracleTime > 0 ? (round.oracleTime / round.executionTime * 100).toFixed(0) : 0;

      panel.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center gap-2 px-1">
            <span class="material-symbols-outlined text-[14px] text-primary">data_object</span>
            <span class="label-sm text-on-surface-variant uppercase">Variable State at Step ${round.divergenceStep}</span>
            <span class="tier-badge tier-1 ml-auto">Tier 1</span>
          </div>
          <div class="bg-surface-container-highest rounded border border-outline-variant p-4">
            <table class="w-full text-left font-code-md text-sm">
              <thead><tr class="text-outline border-b border-outline-variant">
                <th class="pb-2 font-normal">Variable</th>
                <th class="pb-2 font-normal">Student</th>
                <th class="pb-2 font-normal">Oracle</th>
                <th class="pb-2 font-normal w-8"></th>
              </tr></thead>
              <tbody class="text-on-surface">${rows}</tbody>
            </table>
          </div>
          <div class="flex gap-4">
            <div class="flex-1 bg-surface-container-highest rounded border border-outline-variant p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-[14px] text-outline">timer</span>
                <span class="label-sm text-on-surface-variant uppercase">Execution Time</span>
              </div>
              <div class="flex justify-between items-end">
                <div><span class="text-outline text-xs">Student</span><div class="font-code-md text-error text-xl font-bold">${round.executionTime}s</div></div>
                <div class="h-8 w-px bg-outline-variant mx-4"></div>
                <div class="text-right"><span class="text-outline text-xs">Oracle</span><div class="font-code-md text-secondary text-xl font-bold">${round.oracleTime}s</div></div>
              </div>
              <div class="mt-3 relative w-full h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                <div class="absolute top-0 left-0 h-full bg-secondary" style="width:${timePct}%"></div>
                <div class="absolute top-0 left-0 h-full w-full bg-error/40"></div>
              </div>
            </div>
            <div class="flex-1 bg-surface-container-highest rounded border border-outline-variant p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-[14px] text-outline">memory</span>
                <span class="label-sm text-on-surface-variant uppercase">Peak Memory</span>
              </div>
              <div class="flex justify-between items-end">
                <div><span class="text-outline text-xs">Student</span><div class="font-code-md text-error text-xl font-bold">${round.memoryUsage} MB</div></div>
                <div class="h-8 w-px bg-outline-variant mx-4"></div>
                <div class="text-right"><span class="text-outline text-xs">Oracle</span><div class="font-code-md text-secondary text-xl font-bold">${round.oracleMemory} MB</div></div>
              </div>
            </div>
          </div>
          <div class="bg-background rounded px-4 py-2 flex items-center gap-3 text-xs text-on-surface-variant border border-outline-variant/50">
            <span class="material-symbols-outlined text-[14px] text-secondary">security</span>
            <span>Sandbox: Network-isolated &middot; 256MB RAM &middot; Non-root &middot; 2s CPU cap</span>
          </div>
        </div>
      `;
    } else {
      // Tier 2: Performance Comparison Panel (spec §3.5)
      var timeDelta = round.oracleTime > 0 ? ((round.executionTime - round.oracleTime) / round.oracleTime * 100).toFixed(0) : 'N/A';
      var memDelta = round.oracleMemory > 0 ? ((round.memoryUsage - round.oracleMemory) / round.oracleMemory * 100).toFixed(0) : 'N/A';
      var isSlower = parseInt(timeDelta) > 0;
      var isHeavier = parseInt(memDelta) > 0;

      panel.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center gap-2 px-1">
            <span class="material-symbols-outlined text-[14px] text-tertiary">speed</span>
            <span class="label-sm text-tertiary uppercase">Tier 2: Outcome-Level Differential</span>
            <span class="tier-badge tier-2 ml-auto">Tier 2</span>
          </div>
          <div class="bg-surface-container-highest rounded border border-outline-variant overflow-hidden">
            <div class="p-4 border-b border-outline-variant/50">
              <p class="text-on-surface-variant text-sm">
                Control-flow shapes differ significantly between student and oracle solutions.
                Step-level trace alignment is not meaningful. Comparing resource usage instead.
              </p>
            </div>
            <div class="grid grid-cols-2 divide-x divide-outline-variant/50">
              <div class="p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-symbols-outlined text-[16px] ${isSlower ? 'text-error' : 'text-secondary'}">${isSlower ? 'trending_up' : 'trending_down'}</span>
                  <span class="label-sm text-on-surface-variant uppercase">Execution</span>
                </div>
                <div class="font-code-md text-2xl font-bold ${isSlower ? 'text-error' : 'text-secondary'}">${isSlower ? '▲' : '▼'} ${Math.abs(timeDelta)}%</div>
                <div class="text-on-surface-variant text-xs mt-1">Student: ${round.executionTime}s &middot; Oracle: ${round.oracleTime}s</div>
              </div>
              <div class="p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-symbols-outlined text-[16px] ${isHeavier ? 'text-error' : 'text-secondary'}">${isHeavier ? 'memory' : 'memory_alt'}</span>
                  <span class="label-sm text-on-surface-variant uppercase">Memory</span>
                </div>
                <div class="font-code-md text-2xl font-bold ${isHeavier ? 'text-error' : 'text-secondary'}">${isHeavier ? '▲' : '▼'} ${Math.abs(memDelta)}%</div>
                <div class="text-on-surface-variant text-xs mt-1">Student: ${round.memoryUsage}MB &middot; Oracle: ${round.oracleMemory}MB</div>
              </div>
            </div>
            <div class="bg-background p-4 border-t border-outline-variant/50">
              <span class="label-sm text-primary uppercase text-xs">Suggestion</span>
              <p class="text-on-surface-variant text-sm mt-1">The algorithmic approach differs at a structural level. Consider whether a different data structure or loop pattern could reduce complexity. Review the problem constraints and check if your current approach has fundamental inefficiencies.</p>
            </div>
          </div>
          <div class="bg-background rounded px-4 py-2 flex items-center gap-3 text-xs text-on-surface-variant border border-outline-variant/50">
            <span class="material-symbols-outlined text-[14px] text-secondary">security</span>
            <span>Sandbox: Network-isolated &middot; 256MB RAM &middot; Non-root &middot; 2s CPU cap</span>
          </div>
        </div>
      `;
    }
  }

  function renderHint(area, state) {
    const round = state.rounds[state.currentRound];
    if (!round || !round.hint) {
      area.style.display = 'none';
      return;
    }
    area.style.display = 'block';
    area.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[28px]">psychology</span>
        </div>
        <div class="flex-1">
          <h4 class="label-sm text-primary uppercase tracking-wide mb-2 font-bold flex justify-between items-center">
            <span>Socratic Mentor Hint</span>
            <span class="label-xs bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">AI Generated</span>
          </h4>
          <p class="font-body-md text-on-surface leading-relaxed text-sm">${round.hint}</p>
          <div class="mt-4 flex gap-2">
            <button class="btn btn-sm btn-ghost" onclick="console.log('Helpful clicked')">
              <span class="material-symbols-outlined text-[16px]">thumb_up</span> Helpful
            </button>
            <button class="btn btn-sm btn-ghost" onclick="console.log('Not Helpful clicked')">
              <span class="material-symbols-outlined text-[16px]">thumb_down</span> Not Helpful
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ---- Expose ----
  window.SocraticEngine = Engine;
  window.bindSocraticEngine = bindEngineToDOM;

})();
