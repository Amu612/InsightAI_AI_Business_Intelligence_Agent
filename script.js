(function () {
  'use strict';

  /* ==========================================================================
     Configuration
     ========================================================================== */
  const API_ENDPOINT = '/api/analyze';
  const AGENTS = ['research', 'business', 'challenge', 'opportunity', 'roadmap', 'pitch'];
  const STEP_DURATION = 900;

  /* ==========================================================================
     DOM References
     ========================================================================== */
  const searchForm       = document.getElementById('searchForm');
  const companyInput     = document.getElementById('companyInput');
  const generateBtn      = document.getElementById('generateBtn');
  const loadingScreen    = document.getElementById('loadingScreen');
  const resultsDashboard = document.getElementById('resultsDashboard');
  const searchSection    = document.getElementById('search');
  const progressBar      = document.getElementById('progressBar');
  const progressPercent  = document.getElementById('progressPercent');
  const loadingCompanyName = document.getElementById('loadingCompanyName');
  const agentStepEls     = document.querySelectorAll('.agent-step');
  const tabNav           = document.getElementById('tabNav');
  const tabPanels        = document.getElementById('tabPanels');
  const newReportBtn     = document.getElementById('newReportBtn');

  let errorBanner = null;

  /* ==========================================================================
     Utility Helpers
     ========================================================================== */

  /** Escape HTML to prevent XSS */
  function esc(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function capitalize(str) {
    if (!str) return '';
    const s = String(str);
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function safeArr(val) {
    return Array.isArray(val) ? val : [];
  }

  function safeObj(val) {
    return val && typeof val === 'object' && !Array.isArray(val) ? val : {};
  }

  /* ==========================================================================
     API Call
     ========================================================================== */

  async function fetchAnalysis(companyName) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ companyName }),
      });

      let payload;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        payload = await response.json();
      } else {
        const txt = await response.text();
        payload = txt ? { error: txt } : {};
      }

      if (!response.ok) {
        // Look dynamically inside payload for descriptive server error messages
        const errDetails = payload?.error || payload?.message || `Server error (${response.status})`;
        return {
          ok: false,
          error: typeof errDetails === 'object' ? JSON.stringify(errDetails) : errDetails,
        };
      }
      return { ok: true, data: payload };

    } catch (err) {
      if (err.name === 'TypeError') {
        return { ok: false, error: 'Cannot reach server. Check your connection and try again.' };
      }
      return { ok: false, error: err.message || 'Unexpected error occurred.' };
    }
  }

  /* ==========================================================================
     Data Normalizer
     ========================================================================== */

  function normalize(raw, companyName) {
    const d  = raw?.data ?? raw ?? {};
    const ov = safeObj(d.overview);
    const bi = safeObj(d.businessInformation);

    return {
      company:        d.companyName ?? companyName,
      aiReadiness:    ov.aiReadiness ?? '—',
      roiPotential:   ov.roiPotential ?? '—',
      oppCount:       safeArr(d.aiOpportunities).length,
      challengeCount: safeArr(d.challenges).length,
      summary:        ov.summary ?? 'No summary available.',
      recommendations: safeArr(ov.recommendations),
      profile:        safeObj(bi.profile),
      market:         safeObj(bi.market),
      description:    bi.description ?? 'No description available.',
      challenges:     safeArr(d.challenges).map(normalizeChallenge),
      opportunities:  safeArr(d.aiOpportunities).map(normalizeOpportunity),
      roadmap:        safeArr(d.roadmap).map(normalizePhase),
      pitch: {
        headline: (d.ceoPitch?.headline) ?? `AI Transformation Strategy for ${companyName}`,
        sections: safeArr(d.ceoPitch?.sections).map(s => ({
          title:   s.title   ?? 'Section',
          content: s.content ?? '',
        })),
        cta: d.ceoPitch?.callToAction ?? d.ceoPitch?.cta ?? '',
      },
      agentTrace: safeArr(d.agentTrace),
    };
  }

  function normalizeChallenge(c) {
    return {
      id:              c.id ?? Math.random().toString(36).slice(2),
      title:           c.title ?? c.challenge ?? 'Untitled Challenge',
      challenge:       c.challenge ?? c.description ?? '',
      impact:          capitalize(c.impact ?? 'Medium'),
      reasoning:       c.reasoning ?? '',
      evidence:        c.evidence ?? '',
      confidenceScore: Number(c.confidenceScore ?? 75),
      effortToAddress: capitalize(c.effortToAddress ?? 'Medium'),
      x:               Number(c.x ?? 50),
      y:               Number(c.y ?? 50),
    };
  }

  function normalizeOpportunity(o) {
    return {
      id:             o.id ?? Math.random().toString(36).slice(2),
      title:          o.title ?? o.solutionName ?? 'Untitled Opportunity',
      problem:        o.problem ?? '',
      solution:       o.solution ?? o.solutionDetails ?? '',
      roi:            o.roi ?? '',
      difficulty:     capitalize(o.difficulty ?? 'Medium'),
      timeline:       o.timeline ?? '',
      priority:       capitalize(o.priority ?? 'Medium'),
      effortScore:    Number(o.effortScore ?? 50),
      impactScore:    Number(o.impactScore ?? 50),
      confidenceScore: Number(o.confidenceScore ?? 75),
    };
  }

  function normalizePhase(p) {
    return {
      phase:           p.phase ?? 'Phase',
      title:           p.title ?? '',
      duration:        p.duration ?? p.timeline ?? '',
      items:           safeArr(p.items ?? p.milestones ?? p.tasks),
      expectedOutcome: p.expectedOutcome ?? '',
      estimatedRoi:    p.estimatedRoi ?? p.estimatedROI ?? '',
    };
  }

  /* ==========================================================================
     Error Banner
     ========================================================================== */

  function ensureErrorBanner() {
    if (errorBanner) return errorBanner;
    errorBanner = document.createElement('div');
    errorBanner.className = 'section-hidden mt-4 p-4 rounded-xl border border-red-400/30 bg-red-400/10';
    errorBanner.setAttribute('role', 'alert');
    errorBanner.innerHTML = `
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-red-400">Analysis Failed</p>
          <p id="errorMessage" class="text-sm text-red-300/80 mt-1 font-mono break-words"></p>
        </div>
        <button type="button" id="dismissError" aria-label="Dismiss" class="text-red-400/60 hover:text-red-400 transition-colors shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>`;
    searchForm.appendChild(errorBanner);
    errorBanner.querySelector('#dismissError').addEventListener('click', hideError);
    return errorBanner;
  }

  function showError(msg) {
    const b = ensureErrorBanner();
    b.querySelector('#errorMessage').textContent = msg;
    b.classList.remove('section-hidden');
  }

  function hideError() {
    if (errorBanner) errorBanner.classList.add('section-hidden');
  }

  /* ==========================================================================
     View Management
     ========================================================================== */

  function showSection(section) {
    [searchSection, loadingScreen, resultsDashboard].forEach(el =>
      el.classList.toggle('section-hidden', el !== section)
    );
  }

  function switchTab(tabId) {
    tabNav.querySelectorAll('.tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.tab === tabId)
    );
    tabPanels.querySelectorAll('.tab-panel').forEach(panel =>
      panel.classList.toggle('active', panel.dataset.panel === tabId)
    );
  }

  function setButtonLoading(loading) {
    generateBtn.disabled = loading;
    if (loading) {
      generateBtn.dataset.orig = generateBtn.innerHTML;
      generateBtn.innerHTML = `
        <svg class="w-4 h-4 animate-spin animate-duration-1000" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Analyzing...`;
    } else if (generateBtn.dataset.orig) {
      generateBtn.innerHTML = generateBtn.dataset.orig;
      delete generateBtn.dataset.orig;
    }
  }

  /* ==========================================================================
     Loading Animation
     ========================================================================== */

  function resetAgents() {
    agentStepEls.forEach(s => s.classList.remove('active', 'completed'));
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
  }

  function runLoadingAnimation(company) {
    return new Promise(resolve => {
      resetAgents();
      loadingCompanyName.textContent = company;
      let current = 0;

      function tick() {
        if (current > 0) {
          agentStepEls[current - 1].classList.remove('active');
          agentStepEls[current - 1].classList.add('completed');
        }
        if (current >= AGENTS.length) {
          progressBar.style.width = '100%';
          progressPercent.textContent = '100%';
          setTimeout(resolve, 400);
          return;
        }
        agentStepEls[current].classList.add('active');
        const pct = Math.round(((current + 1) / AGENTS.length) * 100);
        progressBar.style.width = pct + '%';
        progressPercent.textContent = pct + '%';
        current++;
        setTimeout(tick, STEP_DURATION);
      }
      tick();
    });
  }

  /* ==========================================================================
     Card Builders
     ========================================================================== */

  const IMPACT_COLOR = {
    High:   { badge: 'text-red-400 bg-red-400/10 border-red-400/20',    dot: 'bg-red-400' },
    Medium: { badge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
    Low:    { badge: 'text-green-400 bg-green-400/10 border-green-400/20', dot: 'bg-green-400' },
  };

  const PRIORITY_COLOR = {
    Critical: 'text-red-400 bg-red-400/10 border-red-400/30',
    High:     'text-orange-400 bg-orange-400/10 border-orange-400/30',
    Medium:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    Low:      'text-green-400 bg-green-400/10 border-green-400/30',
  };

  const DIFFICULTY_COLOR = {
    Low:    'text-green-400',
    Medium: 'text-yellow-400',
    High:   'text-red-400',
  };

  function confidenceBar(score) {
    const pct = Math.min(100, Math.max(0, score));
    const color = pct >= 80 ? '#00E5FF' : pct >= 60 ? '#F59E0B' : '#EF4444';
    return `
      <div class="flex items-center gap-3">
        <div class="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div style="width:${pct}%;background:${color}" class="h-full rounded-full transition-all"></div>
        </div>
        <span class="text-xs font-mono font-bold" style="color:${color}">${pct}%</span>
      </div>`;
  }

  function emptyState(msg) {
    return `
      <div class="gradient-border p-10 text-center col-span-2">
        <div class="relative z-10">
          <svg class="w-10 h-10 text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-sm text-muted-light">${esc(msg)}</p>
        </div>
      </div>`;
  }

  function buildChallengeCard(ch) {
    const ic = IMPACT_COLOR[ch.impact] ?? IMPACT_COLOR.Medium;
    return `
      <div class="gradient-border p-6">
        <div class="relative z-10">
          <div class="flex items-start justify-between gap-3 mb-5">
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 rounded-full ${ic.dot} shrink-0 mt-2"></div>
              <h4 class="text-sm font-semibold text-white leading-snug">${esc(ch.title)}</h4>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium border ${ic.badge}">${esc(ch.impact)}</span>
          </div>

          <div class="space-y-4">
            <div>
              <p class="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Challenge</p>
              <p class="text-sm text-muted-light leading-relaxed">${esc(ch.challenge || ch.title)}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-3 rounded-xl bg-white/3 border border-white/5">
                <p class="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1.5">Reasoning</p>
                <p class="text-xs text-muted-light leading-relaxed">${esc(ch.reasoning)}</p>
              </div>
              <div class="p-3 rounded-xl bg-white/3 border border-white/5">
                <p class="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1.5">Evidence</p>
                <p class="text-xs text-muted-light leading-relaxed italic">${esc(ch.evidence)}</p>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <p class="text-[10px] text-muted uppercase tracking-wider font-semibold">Confidence Score</p>
                <span class="text-[10px] text-muted uppercase tracking-wider">Effort to Address:
                  <span class="${DIFFICULTY_COLOR[ch.effortToAddress] ?? 'text-yellow-400'} font-semibold">${esc(ch.effortToAddress)}</span>
                </span>
              </div>
              ${confidenceBar(ch.confidenceScore)}
            </div>
          </div>
        </div>
      </div>`;
  }

  function buildOpportunityCard(op) {
    const prioClass = PRIORITY_COLOR[op.priority] ?? PRIORITY_COLOR.Medium;
    const diffColor = DIFFICULTY_COLOR[op.difficulty] ?? 'text-yellow-400';
    return `
      <div class="gradient-border p-6 flex flex-col h-full hover:shadow-lg hover:shadow-accent/5 transition-all">
        <div class="relative z-10 flex flex-col flex-1">
          <div class="flex items-start justify-between gap-3 mb-4">
            <h4 class="text-base font-semibold text-white leading-snug">${esc(op.title)}</h4>
            <span class="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${prioClass}">${esc(op.priority)}</span>
          </div>

          <div class="space-y-4 flex-1">
            <div>
              <p class="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Problem
              </p>
              <p class="text-xs text-muted-light leading-relaxed">${esc(op.problem)}</p>
            </div>

            <div>
              <p class="text-[10px] text-accent uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                AI Solution
              </p>
              <p class="text-xs text-muted-light leading-relaxed">${esc(op.solution)}</p>
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <span class="text-[10px] text-muted">Diff: <span class="${diffColor} font-semibold">${esc(op.difficulty)}</span></span>
              <span class="text-[10px] text-muted">Time: <span class="text-white font-medium">${esc(op.timeline)}</span></span>
            </div>
            <div class="px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-md">
              <span class="text-[10px] text-accent font-semibold tracking-wide">ROI: ${esc(op.roi)}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  function buildOpportunityMatrix(opportunities) {
    const quadrants = [
      {
        key: 'q1',
        label: 'High Impact · Low Effort',
        tag: 'Quick Wins',
        tagClass: 'text-accent bg-accent/10 border-accent/20',
        borderClass: 'border-accent/25',
        filter: o => o.effortScore < 50 && o.impactScore >= 60,
      },
      {
        key: 'q2',
        label: 'High Impact · High Effort',
        tag: 'Strategic Bets',
        tagClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        borderClass: 'border-purple-400/20',
        filter: o => o.effortScore >= 50 && o.impactScore >= 60,
      },
      {
        key: 'q3',
        label: 'Low Impact · Low Effort',
        tag: 'Incremental',
        tagClass: 'text-muted-light bg-white/5 border-white/10',
        borderClass: 'border-white/10',
        filter: o => o.effortScore < 50 && o.impactScore < 60,
      },
      {
        key: 'q4',
        label: 'Low Impact · High Effort',
        tag: 'Hard Slogs',
        tagClass: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        borderClass: 'border-orange-400/15',
        filter: o => o.effortScore >= 50 && o.impactScore < 60,
      },
    ];

    return `
      <div class="gradient-border p-6 mb-6">
        <div class="relative z-10">
          <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-accent"></span>
            Opportunity Impact Matrix (2×2)
          </h3>
          <p class="text-xs text-muted mb-6">AI opportunities auto-positioned by effort required vs. business impact delivered.</p>

          <div class="grid grid-cols-2 gap-3">
            ${quadrants.map(q => {
              const items = opportunities.filter(q.filter);
              return `
                <div class="gradient-border p-4 ${q.borderClass}">
                  <div class="relative z-10">
                    <div class="flex items-center justify-between mb-3 flex-wrap gap-1">
                      <p class="text-[11px] font-semibold text-white">${esc(q.label)}</p>
                      <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${q.tagClass}">${esc(q.tag)}</span>
                    </div>
                    ${items.length
                      ? `<div class="space-y-2">
                          ${items.map(o => `
                            <div class="p-2.5 rounded-lg bg-white/3 border border-white/5">
                              <p class="text-[11px] text-white font-semibold truncate">${esc(o.title)}</p>
                              <div class="flex justify-between mt-1">
                                <span class="text-[10px] text-muted">${esc(o.timeline)}</span>
                                <span class="text-[10px] text-accent font-mono font-semibold">${o.impactScore}% impact</span>
                              </div>
                            </div>`).join('')}
                         </div>`
                      : `<p class="text-xs text-muted/50 italic">No opportunities in this quadrant.</p>`
                    }
                  </div>
                </div>`;
            }).join('')}
          </div>

          <div class="flex justify-between items-center mt-4 text-[10px] text-muted border-t border-white/5 pt-3">
            <span>← Low Effort</span>
            <span class="text-accent font-semibold">Effort →</span>
            <span>High Effort →</span>
          </div>
        </div>
      </div>`;
  }

  function buildAgentTracePanel(traces) {
    if (!traces || !traces.length) return '';

    const items = traces.map((t, i) => `
      <div class="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/2 transition-all">
        <div class="shrink-0 w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-base">
          ${esc(t.icon ?? '🤖')}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="text-sm font-semibold text-white">${esc(t.agent)}</span>
            <span class="flex items-center gap-1 text-[10px] font-medium text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
              ${esc(t.status ?? 'completed')}
            </span>
          </div>
          <p class="text-xs text-muted-light leading-relaxed font-mono">${esc(t.log)}</p>
        </div>
      </div>`).join('');

    return `
      <div class="gradient-border p-6 mt-6">
        <div class="relative z-10">
          <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-accent animate-pulse-slow"></span>
            AI Agent Trace Log
          </h3>
          <p class="text-xs text-muted mb-5">Real-time reasoning logs from each specialized analysis agent.</p>
          <div class="space-y-3">${items}</div>
        </div>
      </div>`;
  }

  /* ==========================================================================
     Section Renderers
     ========================================================================== */

  function renderOverview(data) {
    document.getElementById('statReadiness').textContent    = data.aiReadiness;
    document.getElementById('statOpportunities').textContent = data.oppCount;
    document.getElementById('statChallenges').textContent   = data.challengeCount;
    document.getElementById('statROI').textContent          = data.roiPotential;
    document.getElementById('overviewSummary').textContent  = data.summary;

    const recEl = document.getElementById('overviewRecommendations');
    recEl.innerHTML = data.recommendations.length
      ? data.recommendations.map(r => `
          <li class="flex items-start gap-3 text-sm text-muted-light">
            <span class="w-5 h-5 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </span>
            ${esc(r)}
          </li>`).join('')
      : '<li class="text-sm text-muted">No recommendations available.</li>';
  }

  function renderBusiness(data) {
    function dl(targetId, obj) {
      const entries = Object.entries(obj);
      document.getElementById(targetId).innerHTML = entries.length
        ? entries.map(([k, v]) => `
            <div class="flex justify-between items-center py-2 border-b border-border/50 gap-4">
              <dt class="text-sm text-muted shrink-0">${esc(k)}</dt>
              <dd class="text-sm font-medium text-white text-right">${esc(v)}</dd>
            </div>`).join('')
        : '<p class="text-sm text-muted">No data available.</p>';
    }
    dl('businessProfile', data.profile);
    dl('businessMarket',  data.market);
    document.getElementById('businessDescription').textContent = data.description;
  }

  function renderChallenges(data) {
    const el = document.getElementById('challengesList');
    el.innerHTML = data.challenges.length
      ? data.challenges.map(buildChallengeCard).join('')
      : emptyState('No challenges identified.');
  }

  function renderOpportunities(data) {
    const el = document.getElementById('opportunitiesList');
    if (!data.opportunities.length) {
      el.innerHTML = emptyState('No AI opportunities identified.');
      return;
    }

    const matrixHTML = buildOpportunityMatrix(data.opportunities);
    const cardsHTML  = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${data.opportunities.map(buildOpportunityCard).join('')}
    </div>`;

    el.innerHTML = matrixHTML + cardsHTML;

    const traceHTML = buildAgentTracePanel(data.agentTrace);
    el.insertAdjacentHTML('beforeend', traceHTML);
  }

  function renderRoadmap(data) {
    const el = document.getElementById('roadmapTimeline');
    if (!data.roadmap.length) {
      el.innerHTML = emptyState('No roadmap phases available.');
      return;
    }
    el.innerHTML =
      '<div class="absolute left-3 top-2 bottom-2 w-0.5 roadmap-line rounded-full"></div>' +
      data.roadmap.map((phase, i) => `
        <div class="relative">
          <div class="absolute -left-5 top-1 w-3 h-3 rounded-full bg-accent border-2 border-bg roadmap-dot"></div>
          <div class="mb-1 flex items-center gap-3 flex-wrap">
            <h4 class="text-sm font-semibold text-white">${esc(phase.phase)}${phase.title ? ' — ' + esc(phase.title) : ''}</h4>
            ${phase.duration ? `<span class="text-xs text-accent font-mono">${esc(phase.duration)}</span>` : ''}
          </div>
          ${phase.items.length
            ? `<ul class="space-y-2 mt-3">
                ${phase.items.map(item => `
                  <li class="flex items-start gap-2 text-sm text-muted-light">
                    <svg class="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    ${esc(item)}
                  </li>`).join('')}
               </ul>`
            : ''}
          ${phase.expectedOutcome
            ? `<div class="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/10">
                 <p class="text-[10px] text-accent uppercase font-semibold mb-1">Expected Outcome</p>
                 <p class="text-xs text-white/90">${esc(phase.expectedOutcome)}</p>
               </div>`
            : ''}
          ${phase.estimatedRoi
            ? `<div class="mt-2 p-3 rounded-xl bg-purple-400/5 border border-purple-400/10">
                 <p class="text-[10px] text-purple-400 uppercase font-semibold mb-1">Estimated ROI</p>
                 <p class="text-xs text-white/90">${esc(phase.estimatedRoi)}</p>
               </div>`
            : ''}
        </div>`).join('');
  }

  function renderPitch(data) {
    document.getElementById('pitchHeadline').textContent = data.pitch.headline;
    const sectionsEl = document.getElementById('pitchSections');
    sectionsEl.innerHTML = data.pitch.sections.length
      ? data.pitch.sections.map(s => `
          <div>
            <h4 class="text-sm font-semibold text-white mb-2">${esc(s.title)}</h4>
            <p class="text-sm text-muted-light leading-relaxed">${esc(s.content)}</p>
          </div>`).join('')
      : emptyState('No pitch sections available.');
    document.getElementById('pitchCTA').textContent =
      data.pitch.cta || 'Contact us to begin your AI transformation journey.';
  }

  function renderReport(data) {
    document.getElementById('reportCompanyName').textContent = data.company;
    document.getElementById('reportTimestamp').textContent =
      'Generated on ' + new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

    renderOverview(data);
    renderBusiness(data);
    renderChallenges(data);
    renderOpportunities(data);
    renderRoadmap(data);
    renderPitch(data);
  }

  /* ==========================================================================
     Main Flow
     ========================================================================== */

  async function handleGenerateReport(companyName) {
    hideError();
    setButtonLoading(true);
    showSection(loadingScreen);
    loadingScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Execute server analysis and layout interface sequences concurrently
    const [apiResult] = await Promise.all([
      fetchAnalysis(companyName),
      runLoadingAnimation(companyName),
    ]);

    setButtonLoading(false);

    if (!apiResult.ok) {
      showError(apiResult.error);
      showSection(searchSection);
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      renderReport(
        normalize(apiResult.data, companyName)
      );
      showSection(resultsDashboard);
      switchTab('overview');
      resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (renderErr) {
      console.error('Render error:', renderErr);
      showError('Report received but failed to render. Please try again.');
      showSection(searchSection);
    }
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */

  searchForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const company = companyInput.value.trim();
    if (!company) {
      showError('Please enter a company name.');
      companyInput.focus();
      return;
    }
    try {
      await handleGenerateReport(company);
    } catch (err) {
      console.error('Unexpected top-level error:', err);
      showError('An unexpected error occurred. Please try again.');
      showSection(searchSection);
      setButtonLoading(false);
    }
  });

  tabNav.addEventListener('click', function (e) {
    const btn = e.target.closest('.tab-btn');
    if (btn) switchTab(btn.dataset.tab);
  });

  newReportBtn.addEventListener('click', function () {
    hideError();
    companyInput.value = '';
    companyInput.focus();
    showSection(searchSection);
    searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  companyInput.addEventListener('input', hideError);

})();