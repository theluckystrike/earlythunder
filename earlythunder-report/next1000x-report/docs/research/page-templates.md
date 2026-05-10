# next1000x.com — Programmatic Page Templates

Each template below is implementation-ready. Data placeholders use `{{double_braces}}` and pull directly from the Supabase `opportunities` table unless otherwise noted.

---

## 1. What-Is Page Template: `/blog/what-is-[slug]`

### Title Tag
```
What is {{opportunity.name}}? {{opportunity.ticker ? `(${opportunity.ticker})` : ''}} | next1000x Research
```
Character limit: 60. If over 60 characters, truncate to:
```
What is {{opportunity.name}}? | next1000x Research
```

### Meta Description
```
{{opportunity.one_liner}} Scored {{opportunity.composite_score}}/100 on the 8-Signal Pattern Filter. Read our full research brief on {{opportunity.name}}.
```
Character limit: 155.

### Full Page Structure

```html
<!-- Breadcrumb -->
<nav aria-label="Breadcrumb">
  Home > Research > {{opportunity.category}} > {{opportunity.name}}
</nav>

<!-- H1 -->
<h1>What is {{opportunity.name}}? A Deep-Dive Research Brief</h1>

<!-- Published/Updated dates for schema -->
<time datetime="{{opportunity.created_at}}">Published: {{formatDate(opportunity.created_at)}}</time>
<time datetime="{{opportunity.updated_at}}">Updated: {{formatDate(opportunity.updated_at)}}</time>

<!-- Score badge (above fold) -->
<div class="score-badge">
  <span class="score-value">{{opportunity.composite_score}}</span>/100
  <span class="score-label">Composite Score</span>
  <span class="category-tag">{{opportunity.category}}</span>
</div>

<!-- Section: TL;DR -->
<h2>TL;DR — {{opportunity.name}} in 30 Seconds</h2>
<div class="tldr-box">
  <p><strong>What it does:</strong> {{opportunity.one_liner}}</p>
  <p><strong>Category:</strong> <a href="/blog/{{slugifyCategory(opportunity.category)}}-opportunities-2026">{{opportunity.category}}</a></p>
  <p><strong>Composite Score:</strong> {{opportunity.composite_score}}/100</p>
  <p><strong>Top Signal:</strong> {{opportunity.top_signal_name}} ({{opportunity.top_signal_score}}/10)</p>
  <p><strong>Key Catalyst:</strong> {{opportunity.catalysts[0].description}}</p>
  {{#if opportunity.ticker}}
  <p><strong>Ticker:</strong> {{opportunity.ticker}}</p>
  {{/if}}
</div>

<!-- Section: What Does It Do -->
<h2>What Does {{opportunity.name}} Do?</h2>
<p>{{opportunity.description}}</p>
<!-- If description is < 200 words, supplement with AI-expanded context stored in opportunity.extended_description -->
{{#if opportunity.extended_description}}
<p>{{opportunity.extended_description}}</p>
{{/if}}

<!-- Section: 8-Signal Score Breakdown -->
<h2>The 8-Signal Score Breakdown</h2>
<p>Our <a href="/methodology">8-Signal Pattern Filter</a> evaluates every opportunity across eight dimensions. Here is how {{opportunity.name}} performs:</p>

<!-- Score visualization: radar chart or bar chart component -->
<ScoreRadarChart scores="{{opportunity.scores}}" />

<h3>1. Market Timing — {{opportunity.scores.market_timing}}/10</h3>
<p>{{opportunity.signal_commentary.market_timing}}</p>

<h3>2. Team & Execution — {{opportunity.scores.team}}/10</h3>
<p>{{opportunity.signal_commentary.team}}</p>

<h3>3. Technology Moat — {{opportunity.scores.tech_moat}}/10</h3>
<p>{{opportunity.signal_commentary.tech_moat}}</p>

<h3>4. Tokenomics / Cap Structure — {{opportunity.scores.tokenomics}}/10</h3>
<p>{{opportunity.signal_commentary.tokenomics}}</p>

<h3>5. Community & Network Effects — {{opportunity.scores.community}}/10</h3>
<p>{{opportunity.signal_commentary.community}}</p>

<h3>6. Regulatory Positioning — {{opportunity.scores.regulatory}}/10</h3>
<p>{{opportunity.signal_commentary.regulatory}}</p>

<h3>7. Catalyst Pipeline — {{opportunity.scores.catalysts}}/10</h3>
<p>{{opportunity.signal_commentary.catalysts}}</p>

<h3>8. Asymmetric Upside — {{opportunity.scores.asymmetry}}/10</h3>
<p>{{opportunity.signal_commentary.asymmetry}}</p>

<!-- Section: Key Catalysts -->
<h2>Key Catalysts to Watch</h2>
<ul>
  {{#each opportunity.catalysts}}
  <li>
    <strong>{{this.description}}</strong>
    {{#if this.date}} — Expected: {{formatDate(this.date)}}{{/if}}
    {{#if this.impact}} — Impact: {{this.impact}}{{/if}}
  </li>
  {{/each}}
</ul>

<!-- CTA: Mid-page -->
<div class="cta-box">
  <h3>Track {{opportunity.name}} Score Changes</h3>
  <p>Get alerted when {{opportunity.name}}'s score moves. Free accounts get weekly digests; Pro gets instant alerts.</p>
  <a href="/pricing" class="cta-button">Start Tracking — Free</a>
</div>

<!-- Section: Risk Factors -->
<h2>Risk Factors</h2>
<ul>
  {{#each opportunity.risks}}
  <li><strong>{{this.title}}:</strong> {{this.description}}</li>
  {{/each}}
</ul>

<!-- Section: Comparison Table -->
<h2>How {{opportunity.name}} Compares</h2>
<p>Here is how {{opportunity.name}} ranks among other <a href="/blog/{{slugifyCategory(opportunity.category)}}-opportunities-2026">{{opportunity.category}}</a> opportunities:</p>

<table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Project</th>
      <th>Composite Score</th>
      <th>Top Signal</th>
      <th>Compare</th>
    </tr>
  </thead>
  <tbody>
    {{#each categoryPeers as peer, index}}
    <tr class="{{peer.slug === opportunity.slug ? 'highlighted' : ''}}">
      <td>#{{index + 1}}</td>
      <td><a href="/blog/what-is-{{peer.slug}}">{{peer.name}}</a></td>
      <td>{{peer.composite_score}}/100</td>
      <td>{{peer.top_signal_name}} ({{peer.top_signal_score}}/10)</td>
      <td>
        {{#if peer.slug !== opportunity.slug}}
        <a href="/blog/{{alphabetize(opportunity.slug, peer.slug)}}-vs-{{alphabetize(peer.slug, opportunity.slug)}}">Compare</a>
        {{else}}
        —
        {{/if}}
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>

<!-- Section: FAQ -->
<h2>Frequently Asked Questions</h2>

<div class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Is {{opportunity.name}} a good investment?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">{{opportunity.name}} currently scores {{opportunity.composite_score}}/100 on our 8-Signal Pattern Filter. {{#if opportunity.composite_score >= 80}}This places it in the top tier of our database, suggesting strong potential.{{else if opportunity.composite_score >= 60}}This indicates solid potential with some areas for improvement.{{else}}This suggests a mixed outlook — proceed with thorough due diligence.{{/if}} Read our <a href="/blog/is-{{opportunity.slug}}-a-good-investment">full investment analysis</a> for details.</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">What category does {{opportunity.name}} fall into?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">{{opportunity.name}} is classified under <a href="/blog/{{slugifyCategory(opportunity.category)}}-opportunities-2026">{{opportunity.category}}</a> in the next1000x database.{{#if opportunity.subcategory}} More specifically, it belongs to the {{opportunity.subcategory}} subcategory.{{/if}}</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">What is {{opportunity.name}}'s current score?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">As of {{formatDate(opportunity.updated_at)}}, {{opportunity.name}} holds a composite score of {{opportunity.composite_score}}/100. Its highest-scoring signal is {{opportunity.top_signal_name}} at {{opportunity.top_signal_score}}/10.</p>
    </div>
  </div>

  {{#if opportunity.ticker}}
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Where can I buy {{opportunity.name}}?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">{{opportunity.name}} ({{opportunity.ticker}}) is available on {{joinList(opportunity.exchanges)}}. Read our <a href="/blog/how-to-buy-{{opportunity.slug}}">step-by-step buying guide</a> for detailed instructions.</p>
    </div>
  </div>
  {{/if}}
</div>

<!-- Section: Related Opportunities -->
<h2>Related Opportunities</h2>
<div class="related-grid">
  {{#each relatedOpportunities as related}}
  <a href="/blog/what-is-{{related.slug}}" class="related-card">
    <h4>{{related.name}}</h4>
    <p>{{related.one_liner}}</p>
    <span class="score">{{related.composite_score}}/100</span>
  </a>
  {{/each}}
</div>

<!-- Bottom CTA -->
<div class="cta-box cta-bottom">
  <h3>Unlock the Full Database</h3>
  <p>{{opportunity.name}} is one of {{totalOpportunities}} opportunities in our database. Get full access to all scores, alerts, and research.</p>
  <a href="/pricing" class="cta-button-primary">View Plans</a>
  <a href="/" class="cta-button-secondary">Browse Free Tier</a>
</div>
```

### Internal Links Checklist
- [x] Category roundup page from category badge and comparison section
- [x] Comparison pages from comparison table
- [x] Investment analysis page from FAQ
- [x] How-to-buy page from FAQ
- [x] Methodology page from scoring section
- [x] Main opportunity page (database entry) from CTA
- [x] Related opportunity what-is pages from related section
- [x] Pricing page from CTAs

### CTA Placement Strategy
1. **Score badge (above fold):** Passive — shows value immediately, links to sign up for tracking
2. **Mid-page CTA (after catalysts):** Active — "Track score changes" email capture
3. **Bottom CTA (after all content):** Conversion — "Unlock full database" with pricing link

---

## 2. Category Roundup Template: `/blog/[category-slug]-opportunities-2026`

### Title Tag
```
Best {{opportunity.category}} Investment Opportunities in 2026 | next1000x
```

### Meta Description
```
Ranked list of the top {{categoryCount}} {{opportunity.category}} opportunities scored by our 8-Signal Pattern Filter. Updated {{formatDate(now)}}.
```

### Full Page Structure

```html
<nav aria-label="Breadcrumb">
  Home > Research > {{category.name}} Opportunities 2026
</nav>

<h1>Best {{category.name}} Investment Opportunities in 2026</h1>

<div class="page-meta">
  <span>{{categoryCount}} opportunities tracked</span>
  <span>Last updated: {{formatDate(now)}}</span>
  <span>Average score: {{categoryAvgScore}}/100</span>
</div>

<!-- Section: Context -->
<h2>Why {{category.name}} Matters in 2026</h2>
<p>{{category.editorial_intro}}</p>
<!-- editorial_intro is stored in a `categories` table, written once per category, 200-400 words -->

<!-- Section: Methodology -->
<h2>Our Scoring Methodology</h2>
<p>Every opportunity is evaluated across 8 signals: Market Timing, Team & Execution, Technology Moat, Tokenomics/Cap Structure, Community & Network Effects, Regulatory Positioning, Catalyst Pipeline, and Asymmetric Upside. Each signal is scored 1-10, producing a composite score out of 100. <a href="/methodology">Learn more about our methodology</a>.</p>

<!-- Section: Ranked List -->
<h2>Top {{category.name}} Opportunities Ranked</h2>

{{#each opportunities as opp, index}}
<div class="opportunity-card" id="{{opp.slug}}">
  <h3>#{{index + 1}}. {{opp.name}} {{#if opp.ticker}}({{opp.ticker}}){{/if}} — Score: {{opp.composite_score}}/100</h3>
  <p>{{opp.one_liner}}</p>
  <div class="card-details">
    <div class="signal-mini">
      <span>Top Signal: {{opp.top_signal_name}} ({{opp.top_signal_score}}/10)</span>
      <span>Weakest: {{opp.bottom_signal_name}} ({{opp.bottom_signal_score}}/10)</span>
    </div>
    <p><strong>Key Catalyst:</strong> {{opp.catalysts[0].description}}</p>
    {{#if index < 3}}
    <!-- Top 3 get expanded view with all signal scores visible -->
    <div class="signal-bar-chart">
      {{#each opp.scores as score, signal}}
      <div class="bar" style="width: {{score * 10}}%">{{signal}}: {{score}}/10</div>
      {{/each}}
    </div>
    {{/if}}
  </div>
  <div class="card-actions">
    <a href="/blog/what-is-{{opp.slug}}">Read Full Analysis</a>
    {{#if opp.ticker}}
    <a href="/blog/how-to-buy-{{opp.slug}}">How to Buy</a>
    {{/if}}
  </div>
</div>

{{#if index === 2}}
<!-- Paywall hint after top 3 for free tier -->
<div class="paywall-teaser" data-tier="free">
  <p>Viewing top 3 of {{categoryCount}}. <a href="/pricing">Upgrade to Pro</a> for full rankings, detailed scores, and alerts.</p>
</div>
{{/if}}

{{/each}}

<!-- Section: Score Distribution -->
<h2>Score Distribution in {{category.name}}</h2>
<p>Understanding how scores are distributed helps contextualize individual ratings.</p>
<ScoreDistributionChart data="{{categoryScoreDistribution}}" />
<ul>
  <li>Highest score: {{maxScore}}/100 ({{maxScoredProject.name}})</li>
  <li>Lowest score: {{minScore}}/100 ({{minScoredProject.name}})</li>
  <li>Average: {{categoryAvgScore}}/100</li>
  <li>Median: {{categoryMedianScore}}/100</li>
</ul>

<!-- Section: How to Use -->
<h2>How to Use This List</h2>
<p>The next1000x database is designed for asymmetric opportunity discovery, not financial advice.</p>
<ul>
  <li><strong>Free tier:</strong> Browse all opportunities, see composite scores, read one-liners and key catalysts.</li>
  <li><strong>Pro tier:</strong> Full 8-signal breakdowns, score change alerts, catalyst reminders, comparison tools, and export functionality.</li>
</ul>
<div class="cta-box">
  <a href="/pricing" class="cta-button">Unlock Full Access — Start Free Trial</a>
</div>

<!-- Section: FAQ -->
<h2>Frequently Asked Questions</h2>

<div class="faq-section">
  <h3>How often is this list updated?</h3>
  <p>Scores are re-evaluated continuously. This page refreshes every 6 hours to reflect the latest composite scores. Major score changes trigger email alerts for Pro subscribers.</p>

  <h3>What is the 8-Signal Pattern Filter?</h3>
  <p>It is a proprietary scoring framework that evaluates opportunities across 8 dimensions: Market Timing, Team & Execution, Technology Moat, Tokenomics/Cap Structure, Community & Network Effects, Regulatory Positioning, Catalyst Pipeline, and Asymmetric Upside. <a href="/methodology">Full methodology here</a>.</p>

  <h3>Are these financial recommendations?</h3>
  <p>No. next1000x provides research and scoring data. All investment decisions should be made after your own due diligence. See our <a href="/disclaimer">disclaimer</a>.</p>

  <h3>How do I get notified of new {{category.name}} opportunities?</h3>
  <p>Sign up for our <a href="/newsletter">weekly brief</a> or upgrade to Pro for real-time alerts when new opportunities are added or scores change.</p>
</div>

<!-- Section: Related Categories -->
<h2>Explore Other Categories</h2>
<div class="category-grid">
  {{#each otherCategories as cat}}
  <a href="/blog/{{cat.slug}}-opportunities-2026" class="category-card">
    <h4>{{cat.name}}</h4>
    <span>{{cat.count}} opportunities</span>
  </a>
  {{/each}}
</div>
```

---

## 3. Subcategory Template: `/blog/best-[subcategory]-investments`

### Title Tag
```
Best {{subcategory.display_name}} Investments for 2026 | next1000x
```

### Meta Description
```
Top {{subcategoryCount}} {{subcategory.display_name}} investment opportunities ranked by our 8-Signal Pattern Filter. Scores, catalysts, and risk analysis.
```

### Full Page Structure

```html
<nav aria-label="Breadcrumb">
  Home > Research > {{parentCategory.name}} > Best {{subcategory.display_name}} Investments
</nav>

<h1>Best {{subcategory.display_name}} Investments for 2026</h1>

<h2>What Are {{subcategory.display_name}} Projects?</h2>
<p>{{subcategory.definition}}</p>
<!-- definition stored in subcategories table, 100-200 words -->

<h2>Why {{subcategory.display_name}} Is a 1000x Opportunity</h2>
<p>{{subcategory.thesis}}</p>
<!-- thesis stored in subcategories table, 200-300 words covering TAM, growth, and key drivers -->

<h2>Top {{subcategory.display_name}} Opportunities</h2>
{{#each opportunities as opp, index}}
<div class="opportunity-card">
  <h3>#{{index + 1}}. {{opp.name}} — Score: {{opp.composite_score}}/100</h3>
  <p>{{opp.one_liner}}</p>
  <p><strong>Key Catalyst:</strong> {{opp.catalysts[0].description}}</p>
  <a href="/blog/what-is-{{opp.slug}}">Full Analysis</a>
</div>
{{/each}}

<h2>How We Score {{subcategory.display_name}} Projects</h2>
<p>All projects are scored using the same <a href="/methodology">8-Signal Pattern Filter</a> regardless of subcategory. This ensures comparability across the entire next1000x database.</p>

<h2>Investment Risks in {{subcategory.display_name}}</h2>
<ul>
  {{#each subcategory.risks as risk}}
  <li><strong>{{risk.title}}:</strong> {{risk.description}}</li>
  {{/each}}
</ul>

<h2>Frequently Asked Questions</h2>
<h3>How many {{subcategory.display_name}} projects does next1000x track?</h3>
<p>We currently track {{subcategoryCount}} {{subcategory.display_name}} opportunities, updated continuously.</p>

<h3>What is the average score for {{subcategory.display_name}} projects?</h3>
<p>The average composite score is {{subcategoryAvgScore}}/100, compared to the database-wide average of {{globalAvgScore}}/100.</p>

<h2>Related Research</h2>
<ul>
  <li><a href="/blog/{{parentCategory.slug}}-opportunities-2026">All {{parentCategory.name}} Opportunities</a></li>
  {{#each relatedSubcategories as sub}}
  <li><a href="/blog/best-{{sub.slug}}-investments">Best {{sub.display_name}} Investments</a></li>
  {{/each}}
</ul>
```

---

## 4. Comparison Template: `/blog/[project-a]-vs-[project-b]`

### Title Tag
```
{{opportunityA.name}} vs {{opportunityB.name}}: Which Is the Better Investment? | next1000x
```

### Meta Description
```
Side-by-side comparison of {{opportunityA.name}} ({{opportunityA.composite_score}}/100) and {{opportunityB.name}} ({{opportunityB.composite_score}}/100) across 8 investment signals.
```

### Full Page Structure

```html
<nav aria-label="Breadcrumb">
  Home > Research > Comparisons > {{opportunityA.name}} vs {{opportunityB.name}}
</nav>

<h1>{{opportunityA.name}} vs {{opportunityB.name}}: Which Is the Better 1000x Bet?</h1>

<p>Both {{opportunityA.name}} and {{opportunityB.name}} are tracked in the <a href="/blog/{{slugifyCategory(sharedCategory)}}-opportunities-2026">{{sharedCategory}}</a> category. Here is how they compare across our <a href="/methodology">8-Signal Pattern Filter</a>.</p>

<h2>Quick Comparison</h2>
<table class="comparison-table">
  <thead>
    <tr>
      <th>Signal</th>
      <th>{{opportunityA.name}}</th>
      <th>{{opportunityB.name}}</th>
      <th>Advantage</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Market Timing</td>
      <td>{{opportunityA.scores.market_timing}}/10</td>
      <td>{{opportunityB.scores.market_timing}}/10</td>
      <td>{{winner('market_timing')}}</td>
    </tr>
    <tr>
      <td>Team & Execution</td>
      <td>{{opportunityA.scores.team}}/10</td>
      <td>{{opportunityB.scores.team}}/10</td>
      <td>{{winner('team')}}</td>
    </tr>
    <tr>
      <td>Technology Moat</td>
      <td>{{opportunityA.scores.tech_moat}}/10</td>
      <td>{{opportunityB.scores.tech_moat}}/10</td>
      <td>{{winner('tech_moat')}}</td>
    </tr>
    <tr>
      <td>Tokenomics / Cap Structure</td>
      <td>{{opportunityA.scores.tokenomics}}/10</td>
      <td>{{opportunityB.scores.tokenomics}}/10</td>
      <td>{{winner('tokenomics')}}</td>
    </tr>
    <tr>
      <td>Community & Network Effects</td>
      <td>{{opportunityA.scores.community}}/10</td>
      <td>{{opportunityB.scores.community}}/10</td>
      <td>{{winner('community')}}</td>
    </tr>
    <tr>
      <td>Regulatory Positioning</td>
      <td>{{opportunityA.scores.regulatory}}/10</td>
      <td>{{opportunityB.scores.regulatory}}/10</td>
      <td>{{winner('regulatory')}}</td>
    </tr>
    <tr>
      <td>Catalyst Pipeline</td>
      <td>{{opportunityA.scores.catalysts}}/10</td>
      <td>{{opportunityB.scores.catalysts}}/10</td>
      <td>{{winner('catalysts')}}</td>
    </tr>
    <tr>
      <td>Asymmetric Upside</td>
      <td>{{opportunityA.scores.asymmetry}}/10</td>
      <td>{{opportunityB.scores.asymmetry}}/10</td>
      <td>{{winner('asymmetry')}}</td>
    </tr>
    <tr class="total-row">
      <td><strong>Composite Score</strong></td>
      <td><strong>{{opportunityA.composite_score}}/100</strong></td>
      <td><strong>{{opportunityB.composite_score}}/100</strong></td>
      <td><strong>{{compositeWinner}}</strong></td>
    </tr>
  </tbody>
</table>

<!-- Dual radar chart overlay -->
<ComparisonRadarChart
  scoresA="{{opportunityA.scores}}"
  scoresB="{{opportunityB.scores}}"
  labelA="{{opportunityA.name}}"
  labelB="{{opportunityB.name}}"
/>

<h2>{{opportunityA.name}} Overview</h2>
<p>{{opportunityA.one_liner}}</p>
<p><strong>Strongest signals:</strong> {{top3Signals(opportunityA)}}</p>
<p><a href="/blog/what-is-{{opportunityA.slug}}">Read Full {{opportunityA.name}} Analysis</a></p>

<h2>{{opportunityB.name}} Overview</h2>
<p>{{opportunityB.one_liner}}</p>
<p><strong>Strongest signals:</strong> {{top3Signals(opportunityB)}}</p>
<p><a href="/blog/what-is-{{opportunityB.slug}}">Read Full {{opportunityB.name}} Analysis</a></p>

<h2>Where {{opportunityA.name}} Wins</h2>
<ul>
  {{#each signalsWhereAWins as signal}}
  <li><strong>{{signal.name}} ({{signal.scoreA}}/10 vs {{signal.scoreB}}/10):</strong> {{signal.commentary}}</li>
  {{/each}}
</ul>

<h2>Where {{opportunityB.name}} Wins</h2>
<ul>
  {{#each signalsWhereBWins as signal}}
  <li><strong>{{signal.name}} ({{signal.scoreB}}/10 vs {{signal.scoreA}}/10):</strong> {{signal.commentary}}</li>
  {{/each}}
</ul>

<h2>Catalyst Comparison</h2>
<div class="dual-column">
  <div class="column">
    <h3>{{opportunityA.name}} Catalysts</h3>
    <ul>
      {{#each opportunityA.catalysts as cat}}
      <li>{{cat.description}}{{#if cat.date}} ({{formatDate(cat.date)}}){{/if}}</li>
      {{/each}}
    </ul>
  </div>
  <div class="column">
    <h3>{{opportunityB.name}} Catalysts</h3>
    <ul>
      {{#each opportunityB.catalysts as cat}}
      <li>{{cat.description}}{{#if cat.date}} ({{formatDate(cat.date)}}){{/if}}</li>
      {{/each}}
    </ul>
  </div>
</div>

<h2>Risk Comparison</h2>
<div class="dual-column">
  <div class="column">
    <h3>{{opportunityA.name}} Risks</h3>
    <ul>
      {{#each opportunityA.risks as risk}}
      <li>{{risk.description}}</li>
      {{/each}}
    </ul>
  </div>
  <div class="column">
    <h3>{{opportunityB.name}} Risks</h3>
    <ul>
      {{#each opportunityB.risks as risk}}
      <li>{{risk.description}}</li>
      {{/each}}
    </ul>
  </div>
</div>

<h2>The Verdict</h2>
<p>
  {{#if opportunityA.composite_score > opportunityB.composite_score}}
  {{opportunityA.name}} edges out {{opportunityB.name}} with a composite score of {{opportunityA.composite_score}} vs {{opportunityB.composite_score}}. The key differentiator is {{largestGapSignal.name}}, where {{opportunityA.name}} leads by {{largestGapSignal.gap}} points.
  {{else if opportunityB.composite_score > opportunityA.composite_score}}
  {{opportunityB.name}} edges out {{opportunityA.name}} with a composite score of {{opportunityB.composite_score}} vs {{opportunityA.composite_score}}. The key differentiator is {{largestGapSignal.name}}, where {{opportunityB.name}} leads by {{largestGapSignal.gap}} points.
  {{else}}
  These two opportunities are dead even at {{opportunityA.composite_score}}/100. The choice comes down to which signals matter most to your investment thesis.
  {{/if}}
</p>
<p>Both projects are tracked in our database. <a href="/pricing">Unlock full access</a> for detailed scoring, alerts, and export tools.</p>

<h2>Frequently Asked Questions</h2>
<h3>Which has a higher score, {{opportunityA.name}} or {{opportunityB.name}}?</h3>
<p>{{compositeWinner}} has the higher composite score: {{winnerScore}}/100 vs {{loserScore}}/100.</p>

<h3>Are {{opportunityA.name}} and {{opportunityB.name}} competitors?</h3>
<p>Both operate in the {{sharedCategory}} space{{#if sharedSubcategory}} and specifically in {{sharedSubcategory}}{{/if}}, so they share market overlap. However, their specific approaches differ significantly.</p>

<h3>Can I invest in both {{opportunityA.name}} and {{opportunityB.name}}?</h3>
<p>Yes. Many investors diversify across multiple opportunities within a category. See our <a href="/blog/{{slugifyCategory(sharedCategory)}}-opportunities-2026">full {{sharedCategory}} rankings</a> for context.</p>

<h2>More Comparisons in {{sharedCategory}}</h2>
<ul>
  {{#each relatedComparisons as comp}}
  <li><a href="/blog/{{comp.slug}}">{{comp.projectA}} vs {{comp.projectB}}</a></li>
  {{/each}}
</ul>
```

---

## 5. Investment Analysis Template: `/blog/is-[slug]-a-good-investment`

### Title Tag
```
Is {{opportunity.name}} a Good Investment? 8-Signal Analysis | next1000x
```

### Meta Description
```
{{opportunity.name}} scores {{opportunity.composite_score}}/100 on our 8-Signal Pattern Filter. Read the bull case, bear case, catalysts, and risk analysis.
```

### Full Page Structure

```html
<nav aria-label="Breadcrumb">
  Home > Research > Is {{opportunity.name}} a Good Investment?
</nav>

<h1>Is {{opportunity.name}} a Good Investment? 8-Signal Analysis</h1>

<h2>The Short Answer</h2>
<div class="verdict-box verdict-{{scoreClass(opportunity.composite_score)}}">
  <div class="verdict-score">{{opportunity.composite_score}}/100</div>
  <p>
    {{#if opportunity.composite_score >= 80}}
    <strong>Strong Conviction.</strong> {{opportunity.name}} scores in the top tier of our database across all 8 signals. The data supports serious consideration, though no investment is without risk.
    {{else if opportunity.composite_score >= 60}}
    <strong>Cautiously Optimistic.</strong> {{opportunity.name}} shows solid fundamentals across most signals but has notable gaps. Worth further diligence.
    {{else if opportunity.composite_score >= 40}}
    <strong>Mixed Signals.</strong> {{opportunity.name}} has potential upside but significant risk factors. Only for high-risk-tolerant investors.
    {{else}}
    <strong>Proceed with Extreme Caution.</strong> {{opportunity.name}} scores below average across our framework. Multiple risk factors present.
    {{/if}}
  </p>
</div>

<h2>Our 8-Signal Assessment</h2>
{{#each signalsSortedDesc as signal}}
<h3>{{signal.name}} — {{signal.score}}/10</h3>
<p>{{signal.commentary}}</p>
{{/each}}

<h2>Bull Case for {{opportunity.name}}</h2>
<ol>
  {{#each bullCaseSignals as signal}}
  <li><strong>{{signal.name}} ({{signal.score}}/10):</strong> {{signal.bull_commentary}}</li>
  {{/each}}
</ol>
<p><strong>Key bullish catalysts:</strong></p>
<ul>
  {{#each opportunity.catalysts as cat}}
  <li>{{cat.description}}</li>
  {{/each}}
</ul>

<h2>Bear Case for {{opportunity.name}}</h2>
<ol>
  {{#each bearCaseSignals as signal}}
  <li><strong>{{signal.name}} ({{signal.score}}/10):</strong> {{signal.bear_commentary}}</li>
  {{/each}}
</ol>
<p><strong>Key risks:</strong></p>
<ul>
  {{#each opportunity.risks as risk}}
  <li>{{risk.description}}</li>
  {{/each}}
</ul>

<h2>Key Catalysts That Could Change Everything</h2>
<table>
  <thead>
    <tr>
      <th>Catalyst</th>
      <th>Expected Date</th>
      <th>Impact</th>
    </tr>
  </thead>
  <tbody>
    {{#each opportunity.catalysts as cat}}
    <tr>
      <td>{{cat.description}}</td>
      <td>{{#if cat.date}}{{formatDate(cat.date)}}{{else}}TBD{{/if}}</td>
      <td>{{#if cat.impact}}{{cat.impact}}{{else}}Moderate-High{{/if}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

{{#if opportunity.investors}}
<h2>What Smart Money Is Doing</h2>
<ul>
  {{#each opportunity.investors as investor}}
  <li><strong>{{investor.name}}</strong>{{#if investor.round}} ({{investor.round}}){{/if}}{{#if investor.amount}} — ${{investor.amount}}{{/if}}</li>
  {{/each}}
</ul>
{{/if}}

<h2>How {{opportunity.name}} Stacks Up in {{opportunity.category}}</h2>
<p>{{opportunity.name}} ranks #{{categoryRank}} out of {{categoryCount}} in {{opportunity.category}}.</p>
<table>
  <thead>
    <tr><th>Rank</th><th>Project</th><th>Score</th></tr>
  </thead>
  <tbody>
    {{#each top5InCategory as peer, index}}
    <tr class="{{peer.slug === opportunity.slug ? 'highlighted' : ''}}">
      <td>#{{index + 1}}</td>
      <td><a href="/blog/what-is-{{peer.slug}}">{{peer.name}}</a></td>
      <td>{{peer.composite_score}}/100</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<h2>Frequently Asked Questions</h2>
<h3>What is {{opportunity.name}}'s composite score?</h3>
<p>{{opportunity.composite_score}}/100 as of {{formatDate(opportunity.updated_at)}}.</p>

<h3>What are the biggest risks of investing in {{opportunity.name}}?</h3>
<p>The primary risks are: {{joinList(opportunity.risks.map(r => r.title))}}. Its weakest signal is {{opportunity.bottom_signal_name}} at {{opportunity.bottom_signal_score}}/10.</p>

{{#if opportunity.ticker}}
<h3>Where can I buy {{opportunity.name}}?</h3>
<p>{{opportunity.ticker}} is available on {{joinList(opportunity.exchanges)}}. <a href="/blog/how-to-buy-{{opportunity.slug}}">Step-by-step guide here</a>.</p>
{{/if}}

<h3>Is {{opportunity.name}} undervalued?</h3>
<p>Our Asymmetric Upside signal scores {{opportunity.scores.asymmetry}}/10, {{#if opportunity.scores.asymmetry >= 7}}suggesting significant upside potential relative to current valuation.{{else if opportunity.scores.asymmetry >= 5}}suggesting moderate upside potential.{{else}}suggesting the current valuation may already reflect much of the known opportunity.{{/if}}</p>

<h2>Get Real-Time Score Updates</h2>
<div class="cta-box">
  <p>{{opportunity.name}}'s score can change at any time based on new developments. Pro subscribers get instant alerts when any tracked opportunity's score moves.</p>
  <a href="/pricing" class="cta-button">Start Tracking — Free Trial</a>
</div>
```

---

## 6. How-to-Buy Template: `/blog/how-to-buy-[slug]`

### Title Tag
```
How to Buy {{opportunity.name}} ({{opportunity.ticker}}) — Step-by-Step Guide | next1000x
```

### Meta Description
```
Learn how to buy {{opportunity.name}} ({{opportunity.ticker}}) in {{currentYear}}. Available on {{opportunity.exchanges[0]}} and more. Step-by-step guide with exchange comparison.
```

### Full Page Structure

```html
<nav aria-label="Breadcrumb">
  Home > Guides > How to Buy {{opportunity.name}}
</nav>

<h1>How to Buy {{opportunity.name}} ({{opportunity.ticker}}): Step-by-Step Guide</h1>

<h2>Quick Facts</h2>
<table class="quick-facts">
  <tr><td>Token/Ticker</td><td>{{opportunity.ticker}}</td></tr>
  <tr><td>Category</td><td><a href="/blog/{{slugifyCategory(opportunity.category)}}-opportunities-2026">{{opportunity.category}}</a></td></tr>
  <tr><td>next1000x Score</td><td>{{opportunity.composite_score}}/100</td></tr>
  <tr><td>Available On</td><td>{{joinList(opportunity.exchanges)}}</td></tr>
  {{#if opportunity.chain}}
  <tr><td>Primary Chain</td><td>{{opportunity.chain}}</td></tr>
  {{/if}}
</table>

<h2>Step 1 — Choose an Exchange</h2>
<p>{{opportunity.name}} ({{opportunity.ticker}}) is currently available on the following exchanges:</p>
<table>
  <thead>
    <tr>
      <th>Exchange</th>
      <th>Trading Pair</th>
      <th>Maker Fee</th>
      <th>Taker Fee</th>
      <th>Regions</th>
    </tr>
  </thead>
  <tbody>
    {{#each opportunity.exchange_details as ex}}
    <tr>
      <td><a href="{{ex.referral_link}}" rel="nofollow sponsored">{{ex.name}}</a></td>
      <td>{{ex.pair}}</td>
      <td>{{ex.maker_fee}}</td>
      <td>{{ex.taker_fee}}</td>
      <td>{{ex.regions}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>
<p><strong>Our recommendation:</strong> {{opportunity.recommended_exchange}} offers the best combination of liquidity, fees, and reliability for {{opportunity.ticker}}.</p>

<h2>Step 2 — Create and Verify Your Account</h2>
<ol>
  <li>Visit your chosen exchange and click "Sign Up" or "Register."</li>
  <li>Provide your email address and create a strong, unique password.</li>
  <li>Complete identity verification (KYC). Most exchanges require:
    <ul>
      <li>Government-issued photo ID (passport, driver's license)</li>
      <li>Proof of address (utility bill, bank statement)</li>
      <li>Selfie or video verification</li>
    </ul>
  </li>
  <li>Enable two-factor authentication (2FA) immediately. Use an authenticator app (Authy, Google Authenticator), not SMS.</li>
</ol>

<h2>Step 3 — Deposit Funds</h2>
<p>You have two options for funding your account:</p>
<h3>Option A: Deposit Fiat Currency</h3>
<ul>
  <li>Bank transfer (ACH in the US, SEPA in Europe) — lowest fees, 1-3 business days</li>
  <li>Debit card — instant but higher fees (typically 2-4%)</li>
  <li>Wire transfer — fast for large amounts, flat fee applies</li>
</ul>
<h3>Option B: Deposit Cryptocurrency</h3>
<ul>
  <li>If you already hold USDT, USDC, ETH, or BTC, transfer to your exchange wallet</li>
  <li>Always verify the deposit network matches (e.g., ERC-20 vs. TRC-20)</li>
  <li>Start with a small test transaction</li>
</ul>

<h2>Step 4 — Buy {{opportunity.name}} ({{opportunity.ticker}})</h2>
<ol>
  <li>Navigate to the {{opportunity.ticker}} trading page (search for "{{opportunity.ticker}}" in the exchange search bar).</li>
  <li>Select your trading pair (e.g., {{opportunity.ticker}}/USDT).</li>
  <li>Choose your order type:
    <ul>
      <li><strong>Market order:</strong> Buy immediately at the current price. Best for beginners. May have slight slippage on low-liquidity tokens.</li>
      <li><strong>Limit order:</strong> Set your desired price. Executes only when the market hits your price. Better for larger purchases.</li>
    </ul>
  </li>
  <li>Enter the amount you want to buy.</li>
  <li>Review the order details (total cost, fees) and confirm.</li>
</ol>
{{#if opportunity.low_liquidity}}
<div class="warning-box">
  <strong>Low Liquidity Warning:</strong> {{opportunity.ticker}} has relatively low trading volume. Consider using limit orders and splitting large purchases into smaller tranches to minimize slippage.
</div>
{{/if}}

<h2>Step 5 — Secure Your Investment</h2>
<p>Leaving tokens on an exchange carries counterparty risk. Consider moving to a personal wallet.</p>
<h3>Wallet Options</h3>
<ul>
  <li><strong>Hardware wallet (most secure):</strong> Ledger Nano X, Trezor Model T — best for holdings above $1,000</li>
  <li><strong>Software wallet:</strong> MetaMask (EVM chains), Phantom (Solana), or chain-specific wallets</li>
</ul>
{{#if opportunity.staking_info}}
<h3>Staking Options</h3>
<p>{{opportunity.staking_info}}</p>
{{/if}}

<h2>Should You Buy {{opportunity.name}}?</h2>
<p>{{opportunity.name}} currently scores <strong>{{opportunity.composite_score}}/100</strong> on our 8-Signal Pattern Filter. Before buying, we recommend reading our full analysis.</p>
<ul>
  <li><a href="/blog/what-is-{{opportunity.slug}}">What is {{opportunity.name}}?</a> — Full overview and score breakdown</li>
  <li><a href="/blog/is-{{opportunity.slug}}-a-good-investment">Is {{opportunity.name}} a good investment?</a> — Bull case, bear case, and catalysts</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>What is the minimum amount to buy {{opportunity.name}}?</h3>
<p>Most exchanges allow purchases starting from $1-$10. There is no protocol-level minimum for {{opportunity.ticker}}.</p>

<h3>Is {{opportunity.name}} available on Coinbase?</h3>
<p>{{#if opportunity.exchanges.includes('Coinbase')}}Yes, {{opportunity.ticker}} is listed on Coinbase.{{else}}No, {{opportunity.ticker}} is not currently available on Coinbase. It is available on {{joinList(opportunity.exchanges)}}.{{/if}}</p>

{{#if opportunity.staking_info}}
<h3>Can I stake {{opportunity.name}}?</h3>
<p>{{opportunity.staking_info}}</p>
{{/if}}

<h3>Is it safe to buy {{opportunity.name}}?</h3>
<p>All cryptocurrency and frontier investments carry risk. {{opportunity.name}} scores {{opportunity.scores.regulatory}}/10 on our Regulatory Positioning signal. Always invest only what you can afford to lose. Read our <a href="/blog/is-{{opportunity.slug}}-a-good-investment">full risk analysis</a>.</p>

<h2>Related Opportunities in {{opportunity.category}}</h2>
<div class="related-grid">
  {{#each relatedOpportunities as related}}
  <a href="/blog/how-to-buy-{{related.slug}}" class="related-card">
    <h4>How to Buy {{related.name}}</h4>
    <span class="score">{{related.composite_score}}/100</span>
  </a>
  {{/each}}
</div>
```

---

## 7. Shared Components Across All Templates

### Email Capture Popup (triggered by scroll depth or exit intent)
```html
<div class="email-popup" id="email-capture">
  <h3>Get the Weekly 1000x Brief</h3>
  <p>Top-scored opportunities, score changes, and catalyst alerts — delivered every Monday.</p>
  <form action="/api/subscribe" method="POST">
    <input type="email" name="email" placeholder="you@example.com" required />
    <input type="hidden" name="source" value="{{currentPageUrl}}" />
    <input type="hidden" name="category_interest" value="{{opportunity.category}}" />
    <button type="submit">Subscribe — Free</button>
  </form>
  <p class="fine-print">Free tier. Upgrade anytime. Unsubscribe in one click.</p>
</div>
```

### Score Change Banner (shown when a score has changed in the last 7 days)
```html
{{#if opportunity.score_changed_recently}}
<div class="score-change-banner">
  Score updated {{daysAgo(opportunity.score_changed_at)}} day(s) ago:
  {{opportunity.previous_composite_score}} → {{opportunity.composite_score}}
  ({{opportunity.composite_score > opportunity.previous_composite_score ? '+' : ''}}{{opportunity.composite_score - opportunity.previous_composite_score}})
</div>
{{/if}}
```

### Disclaimer Footer (all pages)
```html
<div class="disclaimer">
  <p><strong>Disclaimer:</strong> next1000x provides research and scoring data for informational purposes only. Nothing on this site constitutes financial advice, a solicitation, or a recommendation to buy or sell any investment. Always conduct your own due diligence. <a href="/disclaimer">Full disclaimer</a>.</p>
</div>
```

---

## 8. Helper Function Reference

These utility functions are referenced throughout the templates and should be implemented as shared utilities:

```typescript
// lib/templates/helpers.ts

export function slugifyCategory(category: string): string {
  const map: Record<string, string> = {
    'AI x Crypto': 'ai-crypto',
    'DePIN': 'depin',
    'DeSci': 'desci',
    'ZK/Privacy': 'zk-privacy',
    'Restaking': 'restaking',
    'RWA': 'rwa-real-world-assets',
    'Nuclear/Uranium': 'nuclear-uranium',
    'Fusion Energy': 'fusion-energy',
    'Quantum Computing': 'quantum-computing',
    'Frontier Biotech': 'frontier-biotech',
  }
  return map[category] ?? category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function alphabetize(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export function scoreClass(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'mixed'
  return 'weak'
}

export function topSignal(scores: Record<string, number>): { name: string; score: number } {
  const entries = Object.entries(scores)
  entries.sort((a, b) => b[1] - a[1])
  return { name: signalDisplayName(entries[0][0]), score: entries[0][1] }
}

export function signalDisplayName(key: string): string {
  const map: Record<string, string> = {
    market_timing: 'Market Timing',
    team: 'Team & Execution',
    tech_moat: 'Technology Moat',
    tokenomics: 'Tokenomics / Cap Structure',
    community: 'Community & Network Effects',
    regulatory: 'Regulatory Positioning',
    catalysts: 'Catalyst Pipeline',
    asymmetry: 'Asymmetric Upside',
  }
  return map[key] ?? key
}
```
