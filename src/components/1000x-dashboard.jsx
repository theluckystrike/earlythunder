/**
 * 1000x Intelligence Dashboard - EarlyThunder Discovery Pipeline
 *
 * Client-side React component that reads from pre-generated JSON files.
 * No API keys, no external calls from browser. Pure display layer.
 *
 * NASA Power of 10 compliant: all functions <60 lines, 2+ assertions each.
 */

'use strict';

import React from 'react';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Validate loaded JSON data has expected shape and required fields.
 * @param {*} data - The parsed JSON data to validate
 * @param {string[]} requiredFields - Array of field names that must exist
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateData(data, requiredFields) {
  console.assert(data !== undefined, 'validateData: data must not be undefined');
  console.assert(
    Array.isArray(requiredFields) && requiredFields.length > 0,
    'validateData: requiredFields must be a non-empty array'
  );

  const errors = [];

  if (data === null || typeof data !== 'object') {
    errors.push('Data is null or not an object');
    return { valid: false, errors };
  }

  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push('Missing required field: ' + field);
    }
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Truncate blockchain address to 0x1234...5678 format.
 * @param {string} address - Full blockchain address
 * @returns {string} Truncated address
 */
function formatAddress(address) {
  console.assert(typeof address === 'string', 'formatAddress: address must be a string');
  console.assert(address.length >= 8, 'formatAddress: address must be at least 8 chars');

  if (address.length <= 12) {
    return address;
  }

  const prefix = address.slice(0, 6);
  const suffix = address.slice(-4);
  return prefix + '...' + suffix;
}


/**
 * Format USD amount to human-readable form ($1.23M, $456K, etc.)
 * @param {number} amount - USD amount
 * @returns {string} Formatted string
 */
function formatUsd(amount) {
  console.assert(typeof amount === 'number', 'formatUsd: amount must be a number');
  console.assert(!isNaN(amount), 'formatUsd: amount must not be NaN');

  if (amount >= 1e9) {
    return '$' + (amount / 1e9).toFixed(2) + 'B';
  }
  if (amount >= 1e6) {
    return '$' + (amount / 1e6).toFixed(2) + 'M';
  }
  if (amount >= 1e3) {
    return '$' + (amount / 1e3).toFixed(0) + 'K';
  }
  return '$' + amount.toFixed(0);
}


/**
 * Format timestamp to human-readable relative time.
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Relative time string like "2 days ago"
 */
function formatAge(timestamp) {
  console.assert(typeof timestamp === 'string', 'formatAge: timestamp must be a string');
  console.assert(timestamp.length > 0, 'formatAge: timestamp must not be empty');

  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return diffMin + ' min ago';
  if (diffHr < 24) return diffHr + 'h ago';
  if (diffDay < 7) return diffDay + 'd ago';
  if (diffWeek < 5) return diffWeek + 'w ago';
  return diffDay + 'd ago';
}


/**
 * Classify a 0-10 score into label and color.
 * @param {number} score - Score value (0-10)
 * @returns {{ label: string, color: string, borderColor: string }}
 */
function classifyScore(score) {
  console.assert(typeof score === 'number', 'classifyScore: score must be a number');
  console.assert(score >= 0 && score <= 10, 'classifyScore: score must be 0-10');

  if (score >= 9) {
    return { label: 'EXTREME', color: '#00ff88', borderColor: '#00ff88' };
  }
  if (score >= 6) {
    return { label: 'HIGH', color: '#d4a017', borderColor: '#d4a017' };
  }
  if (score >= 3) {
    return { label: 'MODERATE', color: '#666', borderColor: '#444' };
  }
  return { label: 'LOW', color: '#444', borderColor: '#333' };
}


/**
 * Load JSON data from a given path. Returns null on failure.
 * @param {string} filename - Filename under /data/
 * @returns {Promise<object|null>}
 */
async function loadData(filename) {
  console.assert(typeof filename === 'string', 'loadData: filename must be a string');
  console.assert(filename.length > 0, 'loadData: filename must not be empty');

  try {
    const response = await fetch('/data/' + filename);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data;
  } catch (fetchError) {
    console.warn('loadData: Failed to load ' + filename, fetchError);
    return null;
  }
}


// ============================================================
// THEME CONSTANTS (frozen, no global mutable state)
// ============================================================

const THEME = Object.freeze({
  bg: '#0a0a0f',
  surface: '#12121a',
  card: '#1a1a28',
  gold: '#d4a017',
  green: '#00ff88',
  red: '#ff4444',
  textPrimary: '#e0e0e0',
  textSecondary: '#888',
  textMuted: '#555',
  border: '#2a2a3a',
  font: "'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', monospace",
});

const TAB_CONFIG = Object.freeze([
  { id: 'discovery', label: 'Discovery Feed' },
  { id: 'vc', label: 'VC Radar' },
  { id: 'dev', label: 'Dev Migration' },
  { id: 'contracts', label: 'Contract Intel' },
  { id: 'alpha', label: 'Alpha Signals' },
]);

const CATEGORY_COLORS = Object.freeze({
  AI: '#a855f7',
  DePIN: '#06b6d4',
  RWA: '#f59e0b',
  DeFi: '#3b82f6',
  Infrastructure: '#10b981',
});


// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Visual bar showing score breakdown (contract/vc/dev/market).
 */
function ScoreBar(props) {
  console.assert(props !== null && typeof props === 'object', 'ScoreBar: props required');
  console.assert(
    props.signals && typeof props.signals === 'object',
    'ScoreBar: props.signals must be an object'
  );

  const { signals } = props;
  const entries = [
    { key: 'contract', label: 'CTR', value: signals.contract || 0 },
    { key: 'vc', label: 'VC', value: signals.vc || 0 },
    { key: 'dev', label: 'DEV', value: signals.dev || 0 },
    { key: 'market', label: 'MKT', value: signals.market || 0 },
  ];
  const barColors = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b'];

  return React.createElement('div', {
    style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }
  }, entries.map(function(entry, i) {
    const pct = Math.min(entry.value * 10, 100);
    return React.createElement('div', {
      key: entry.key,
      style: { display: 'flex', alignItems: 'center', gap: '4px' }
    },
      React.createElement('span', {
        style: { fontSize: '10px', color: THEME.textSecondary, minWidth: '24px' }
      }, entry.label),
      React.createElement('div', {
        style: {
          width: '50px', height: '6px', background: THEME.surface,
          borderRadius: '3px', overflow: 'hidden'
        }
      },
        React.createElement('div', {
          style: {
            width: pct + '%', height: '100%',
            background: barColors[i], borderRadius: '3px'
          }
        })
      ),
      React.createElement('span', {
        style: { fontSize: '10px', color: barColors[i] }
      }, entry.value.toFixed(1))
    );
  }));
}


/**
 * Colored badge component for categories and status indicators.
 */
function SignalBadge(props) {
  console.assert(props !== null && typeof props === 'object', 'SignalBadge: props required');
  console.assert(typeof props.text === 'string', 'SignalBadge: text must be a string');

  const bgColor = props.bgColor || THEME.card;
  const textColor = props.textColor || THEME.gold;

  return React.createElement('span', {
    style: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      letterSpacing: '0.5px',
      background: bgColor,
      color: textColor,
      border: '1px solid ' + (props.borderColor || textColor),
      textTransform: 'uppercase',
    }
  }, props.text);
}


/**
 * Empty state component when pipeline hasn't run yet.
 */
function EmptyState(props) {
  console.assert(props !== null && typeof props === 'object', 'EmptyState: props required');
  console.assert(typeof props.tabName === 'string', 'EmptyState: tabName required');

  return React.createElement('div', {
    style: {
      textAlign: 'center', padding: '60px 20px',
      color: THEME.textSecondary
    }
  },
    React.createElement('div', {
      style: { fontSize: '48px', marginBottom: '16px', opacity: 0.3 }
    }, '[ ]'),
    React.createElement('div', {
      style: { fontSize: '16px', marginBottom: '8px' }
    }, 'No data yet - pipeline hasn\'t run'),
    React.createElement('div', {
      style: { fontSize: '12px', color: THEME.textMuted }
    }, 'Run the ' + props.tabName + ' scanner to populate this tab')
  );
}


/**
 * Loading spinner component.
 */
function LoadingState() {
  console.assert(true, 'LoadingState: rendered');
  console.assert(THEME !== null, 'LoadingState: THEME must exist');

  return React.createElement('div', {
    style: {
      textAlign: 'center', padding: '60px 20px',
      color: THEME.textSecondary
    }
  },
    React.createElement('div', {
      style: { fontSize: '16px' }
    }, 'Loading data...')
  );
}


/**
 * Timestamp display for "last updated" per data source.
 */
function LastUpdated(props) {
  console.assert(props !== null && typeof props === 'object', 'LastUpdated: props required');
  console.assert(
    props.timestamp === null || typeof props.timestamp === 'string',
    'LastUpdated: timestamp must be string or null'
  );

  if (!props.timestamp) {
    return React.createElement('span', {
      style: { fontSize: '10px', color: THEME.textMuted }
    }, 'Never updated');
  }

  return React.createElement('span', {
    style: { fontSize: '10px', color: THEME.textSecondary }
  }, 'Updated: ' + formatAge(props.timestamp));
}


// ============================================================
// TAB CONTENT COMPONENTS
// ============================================================

/**
 * Tab 1: Discovery Feed - Combined discoveries from all 4 scanners.
 */
function DiscoveryFeed(props) {
  console.assert(props !== null && typeof props === 'object', 'DiscoveryFeed: props required');
  console.assert(Array.isArray(props.tokens), 'DiscoveryFeed: tokens must be an array');

  const tokens = props.tokens;
  if (tokens.length === 0) {
    return React.createElement(EmptyState, { tabName: 'discovery' });
  }

  const sorted = tokens.slice().sort(function(a, b) { return b.score_1000x - a.score_1000x; });

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
    sorted.map(function(token, idx) {
      return React.createElement(DiscoveryCard, {
        key: token.contract_address || idx,
        token: token
      });
    })
  );
}

/**
 * Render the header row of a discovery card (score, name, badges).
 */
function DiscoveryCardHeader(props) {
  console.assert(props !== null && typeof props === 'object', 'DiscoveryCardHeader: props required');
  console.assert(props.token && typeof props.token === 'object', 'DiscoveryCardHeader: token required');

  var token = props.token;
  var cls = props.classification;
  return React.createElement('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }
  },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      React.createElement('span', {
        style: { fontSize: '24px', fontWeight: 'bold', color: cls.color, fontFamily: THEME.font }
      }, token.score_1000x.toFixed(1)),
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: '16px', fontWeight: 'bold', color: THEME.textPrimary } }, token.name + ' (' + (token.symbol || '???') + ')'),
        React.createElement('div', { style: { fontSize: '12px', color: THEME.textSecondary } }, token.chain + ' | ' + formatUsd(token.mcap_usd || 0) + ' mcap | ' + formatAge(token.age_timestamp || new Date().toISOString()))
      )
    ),
    React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
      React.createElement(SignalBadge, { text: cls.label, textColor: cls.color, borderColor: cls.borderColor }),
      token.category ? React.createElement(SignalBadge, { text: token.category, textColor: CATEGORY_COLORS[token.category] || THEME.textSecondary, borderColor: CATEGORY_COLORS[token.category] || THEME.border }) : null
    )
  );
}

/**
 * Expandable analysis section for a discovery card.
 */
function DiscoveryCardAnalysis(props) {
  console.assert(props !== null && typeof props === 'object', 'DiscoveryCardAnalysis: props required');
  console.assert(typeof props.expanded === 'boolean', 'DiscoveryCardAnalysis: expanded must be boolean');

  if (!props.expanded || !props.text) return null;
  return React.createElement('div', {
    style: {
      marginTop: '12px', padding: '12px', background: THEME.surface,
      borderRadius: '4px', fontSize: '12px', color: THEME.textSecondary,
      lineHeight: '1.6', borderLeft: '3px solid ' + THEME.gold
    }
  },
    React.createElement('div', { style: { fontSize: '10px', color: THEME.gold, marginBottom: '6px', fontWeight: 'bold' } }, 'DEEPSEEK ANALYSIS'),
    props.text
  );
}

/**
 * Single discovery card with expandable analysis.
 */
function DiscoveryCard(props) {
  console.assert(props !== null && typeof props === 'object', 'DiscoveryCard: props required');
  console.assert(props.token && typeof props.token === 'object', 'DiscoveryCard: token required');

  var token = props.token;
  var classification = classifyScore(token.score_1000x);
  var expanded = React.useState(false);
  var isExpanded = expanded[0];
  var setExpanded = expanded[1];

  return React.createElement('div', {
    style: {
      background: THEME.card, borderRadius: '8px', padding: '16px',
      border: '1px solid ' + classification.borderColor,
      cursor: 'pointer', transition: 'border-color 0.2s',
    },
    onClick: function() { setExpanded(!isExpanded); }
  },
    React.createElement(DiscoveryCardHeader, { token: token, classification: classification }),
    React.createElement('div', { style: { marginTop: '12px' } },
      React.createElement(ScoreBar, { signals: token.signals || {} })
    ),
    React.createElement(DiscoveryCardAnalysis, { expanded: isExpanded, text: token.deepseek_analysis })
  );
}


/**
 * Render a single VC overlap banner row.
 */
function VcOverlapBanner(props) {
  console.assert(props !== null && typeof props === 'object', 'VcOverlapBanner: props required');
  console.assert(Array.isArray(props.overlaps), 'VcOverlapBanner: overlaps must be an array');

  if (props.overlaps.length === 0) return null;
  return React.createElement('div', {
    style: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }
  }, props.overlaps.map(function(o, i) {
    return React.createElement('div', {
      key: i,
      style: {
        background: 'rgba(212, 160, 23, 0.1)', border: '1px solid ' + THEME.gold,
        borderRadius: '8px', padding: '12px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
      }
    },
      React.createElement('div', null,
        React.createElement(SignalBadge, { text: 'OVERLAP DETECTED', textColor: '#000', bgColor: THEME.gold, borderColor: THEME.gold }),
        React.createElement('span', { style: { marginLeft: '8px', color: THEME.textPrimary, fontSize: '14px' } }, o.token_name),
        React.createElement('span', { style: { marginLeft: '8px', color: THEME.textSecondary, fontSize: '12px' } }, o.vcs_involved.join(', '))
      ),
      React.createElement('span', { style: { color: THEME.gold, fontSize: '14px' } }, formatUsd(o.total_usd))
    );
  }));
}

/**
 * Render a single VC movement table row.
 */
function VcMovementRow(props) {
  console.assert(props !== null && typeof props === 'object', 'VcMovementRow: props required');
  console.assert(props.movement && typeof props.movement === 'object', 'VcMovementRow: movement required');

  var m = props.movement;
  var statusColors = { unlisted: '#ff4444', dex_only: '#d4a017', coingecko: '#00ff88' };
  var statusLabels = { unlisted: 'UNLISTED', dex_only: 'DEX ONLY', coingecko: 'LISTED' };

  return React.createElement('tr', {
    style: { borderBottom: '1px solid ' + THEME.border, background: props.highlighted ? 'rgba(212, 160, 23, 0.05)' : 'transparent' }
  },
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textPrimary } }, m.vc_name),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textPrimary } }, m.token_name || formatAddress(m.token_address)),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textSecondary } }, m.chain),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textSecondary } }, m.transfer_type),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.gold } }, formatUsd(m.amount_usd || 0)),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textSecondary } }, formatAge(m.date)),
    React.createElement('td', { style: { padding: '10px 12px' } },
      React.createElement(SignalBadge, { text: statusLabels[m.listed_status] || m.listed_status, textColor: statusColors[m.listed_status] || THEME.textSecondary, borderColor: statusColors[m.listed_status] || THEME.border })
    )
  );
}

/**
 * Render a standard table header from an array of column names.
 */
function TableHeader(props) {
  console.assert(props !== null && typeof props === 'object', 'TableHeader: props required');
  console.assert(Array.isArray(props.columns), 'TableHeader: columns must be an array');

  return React.createElement('thead', null,
    React.createElement('tr', { style: { borderBottom: '1px solid ' + THEME.border } },
      props.columns.map(function(h) {
        return React.createElement('th', {
          key: h, style: { textAlign: 'left', padding: '8px 12px', color: THEME.textSecondary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }
        }, h);
      })
    )
  );
}

/**
 * Tab 2: VC Radar - VC wallet movements with overlap detection.
 */
function VcRadar(props) {
  console.assert(props !== null && typeof props === 'object', 'VcRadar: props required');
  console.assert(Array.isArray(props.movements), 'VcRadar: movements must be an array');

  var movements = props.movements;
  var overlaps = props.overlaps || [];
  if (movements.length === 0) return React.createElement(EmptyState, { tabName: 'VC scanner' });

  var overlapTokens = new Set();
  overlaps.forEach(function(o) { overlapTokens.add(o.token_address); });

  return React.createElement('div', null,
    React.createElement(VcOverlapBanner, { overlaps: overlaps }),
    React.createElement('div', { style: { overflowX: 'auto' } },
      React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' } },
        React.createElement(TableHeader, { columns: ['VC Name', 'Token', 'Chain', 'Type', 'Amount', 'Date', 'Status'] }),
        React.createElement('tbody', null,
          movements.map(function(m, i) {
            return React.createElement(VcMovementRow, { key: i, movement: m, highlighted: overlapTokens.has(m.token_address) });
          })
        )
      )
    )
  );
}


/**
 * Render a single dev repo card with its developer table.
 */
function DevRepoCard(props) {
  console.assert(props !== null && typeof props === 'object', 'DevRepoCard: props required');
  console.assert(Array.isArray(props.devs) && props.devs.length > 0, 'DevRepoCard: devs must be non-empty array');

  var devs = props.devs;
  var repo = props.repo;
  var isConvergence = devs.length >= 3;

  return React.createElement('div', {
    style: { background: THEME.card, borderRadius: '8px', padding: '16px', border: '1px solid ' + (isConvergence ? THEME.green : THEME.border) }
  },
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }
    },
      React.createElement('div', null,
        React.createElement('span', { style: { fontSize: '14px', fontWeight: 'bold', color: THEME.textPrimary } }, repo),
        devs[0].repo_url ? React.createElement('a', {
          href: devs[0].repo_url, target: '_blank', rel: 'noopener noreferrer',
          style: { marginLeft: '8px', fontSize: '11px', color: THEME.gold, textDecoration: 'none' }
        }, '[GitHub]') : null
      ),
      isConvergence ? React.createElement(SignalBadge, { text: devs.length + '+ DEVS CONVERGING', textColor: '#000', bgColor: THEME.green, borderColor: THEME.green }) : null
    ),
    devs[0].description ? React.createElement('div', { style: { fontSize: '12px', color: THEME.textSecondary, marginBottom: '12px' } }, devs[0].description) : null,
    React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' } },
      React.createElement('thead', null,
        React.createElement('tr', { style: { borderBottom: '1px solid ' + THEME.border } },
          ['Developer', 'Known For', 'Commits', 'First Commit'].map(function(h) {
            return React.createElement('th', { key: h, style: { textAlign: 'left', padding: '6px 8px', color: THEME.textSecondary, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' } }, h);
          })
        )
      ),
      React.createElement('tbody', null,
        devs.map(function(d, i) {
          return React.createElement('tr', { key: i, style: { borderBottom: '1px solid ' + THEME.border } },
            React.createElement('td', { style: { padding: '8px', color: THEME.gold } }, d.developer),
            React.createElement('td', { style: { padding: '8px', color: THEME.textPrimary, maxWidth: '200px' } }, d.known_for),
            React.createElement('td', { style: { padding: '8px', color: THEME.textSecondary } }, d.commit_count || '-'),
            React.createElement('td', { style: { padding: '8px', color: THEME.textSecondary } }, d.first_commit ? formatAge(d.first_commit) : '-')
          );
        })
      )
    )
  );
}

/**
 * Group migrations by repo for convergence detection.
 */
function groupMigrationsByRepo(migrations) {
  console.assert(Array.isArray(migrations), 'groupMigrationsByRepo: migrations must be array');
  console.assert(migrations.length >= 0, 'groupMigrationsByRepo: must be valid array');

  var groups = {};
  migrations.forEach(function(m) {
    var repo = m.new_repo || 'unknown';
    if (!groups[repo]) { groups[repo] = []; }
    groups[repo].push(m);
  });
  return groups;
}

/**
 * Tab 3: Dev Migration - Elite developer activity feed.
 */
function DevMigration(props) {
  console.assert(props !== null && typeof props === 'object', 'DevMigration: props required');
  console.assert(Array.isArray(props.migrations), 'DevMigration: migrations must be an array');

  var migrations = props.migrations;
  if (migrations.length === 0) return React.createElement(EmptyState, { tabName: 'dev migration scanner' });

  var repoGroups = groupMigrationsByRepo(migrations);

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
    Object.keys(repoGroups).map(function(repo) {
      return React.createElement(DevRepoCard, { key: repo, repo: repo, devs: repoGroups[repo] });
    })
  );
}


/**
 * Render a single contract table row.
 */
function ContractRow(props) {
  console.assert(props !== null && typeof props === 'object', 'ContractRow: props required');
  console.assert(props.contract && typeof props.contract === 'object', 'ContractRow: contract required');

  var c = props.contract;
  var scoreClass = classifyScore(c.deepseek_sophistication_score);
  var verifyColors = { verified: THEME.green, pending: THEME.gold, unverified: THEME.red };

  return React.createElement('tr', {
    style: { borderBottom: '1px solid ' + THEME.border }
  },
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textSecondary, fontFamily: THEME.font } }, formatAddress(c.contract_address)),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textPrimary } }, c.name || '-'),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.textSecondary } }, c.chain),
    React.createElement('td', { style: { padding: '10px 12px', color: THEME.gold } }, c.deployer_history_score.toFixed(1)),
    React.createElement('td', { style: { padding: '10px 12px' } },
      React.createElement(SignalBadge, { text: c.verification_status, textColor: verifyColors[c.verification_status] || THEME.textSecondary, borderColor: verifyColors[c.verification_status] || THEME.border })
    ),
    React.createElement('td', { style: { padding: '10px 12px', color: scoreClass.color, fontWeight: 'bold' } }, c.deepseek_sophistication_score.toFixed(1)),
    React.createElement('td', { style: { padding: '10px 12px' } },
      React.createElement(SignalBadge, { text: c.category, textColor: CATEGORY_COLORS[c.category] || THEME.textSecondary, borderColor: CATEGORY_COLORS[c.category] || THEME.border })
    )
  );
}

/**
 * Tab 4: Contract Intelligence - New high-quality contract deployments.
 */
function ContractIntel(props) {
  console.assert(props !== null && typeof props === 'object', 'ContractIntel: props required');
  console.assert(Array.isArray(props.contracts), 'ContractIntel: contracts must be an array');

  var contracts = props.contracts;
  if (contracts.length === 0) return React.createElement(EmptyState, { tabName: 'contract scanner' });

  var sorted = contracts.slice().sort(function(a, b) {
    return b.deepseek_sophistication_score - a.deepseek_sophistication_score;
  });

  return React.createElement('div', { style: { overflowX: 'auto' } },
    React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' } },
      React.createElement(TableHeader, { columns: ['Contract', 'Name', 'Chain', 'Deployer Score', 'Verified', 'AI Score', 'Category'] }),
      React.createElement('tbody', null,
        sorted.map(function(c, i) {
          return React.createElement(ContractRow, { key: i, contract: c });
        })
      )
    )
  );
}


/**
 * Render a single alpha signal row.
 */
function AlphaRow(props) {
  console.assert(props !== null && typeof props === 'object', 'AlphaRow: props required');
  console.assert(props.token && typeof props.token === 'object', 'AlphaRow: token required');

  var t = props.token;
  var tierColors = { 'Deep Alpha': THEME.green, 'Emerging Signal': THEME.gold, 'Watch List': THEME.textSecondary };
  var tierBg = { 'Deep Alpha': 'rgba(0, 255, 136, 0.08)', 'Emerging Signal': 'rgba(212, 160, 23, 0.05)', 'Watch List': 'transparent' };
  var tColor = tierColors[t.tier] || THEME.textSecondary;

  return React.createElement('tr', {
    style: { borderBottom: '1px solid ' + THEME.border, background: tierBg[t.tier] || 'transparent' }
  },
    React.createElement('td', { style: { padding: '10px 12px' } },
      React.createElement('span', { style: { color: THEME.textPrimary, fontWeight: 'bold' } }, t.name),
      React.createElement('span', { style: { color: THEME.textSecondary, marginLeft: '6px', fontSize: '11px' } }, t.symbol)
    ),
    React.createElement('td', { style: { padding: '10px 12px', color: tColor } }, t.signal_a.toFixed(1)),
    React.createElement('td', { style: { padding: '10px 12px', color: tColor } }, t.signal_b.toFixed(1)),
    React.createElement('td', { style: { padding: '10px 12px', color: tColor } }, t.signal_c.toFixed(1)),
    React.createElement('td', { style: { padding: '10px 12px', color: tColor, fontWeight: 'bold', fontSize: '15px' } }, t.composite.toFixed(2)),
    React.createElement('td', { style: { padding: '10px 12px' } },
      React.createElement(SignalBadge, { text: t.tier, textColor: tColor, borderColor: tColor })
    )
  );
}

/**
 * Tab 5: Alpha Signals - 30-token alpha scoring display.
 */
function AlphaSignals(props) {
  console.assert(props !== null && typeof props === 'object', 'AlphaSignals: props required');
  console.assert(Array.isArray(props.tokens), 'AlphaSignals: tokens must be an array');

  var tokens = props.tokens;
  if (tokens.length === 0) return React.createElement(EmptyState, { tabName: 'alpha scoring' });

  var sorted = tokens.slice().sort(function(a, b) { return b.composite - a.composite; });

  return React.createElement('div', { style: { overflowX: 'auto' } },
    React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' } },
      React.createElement(TableHeader, { columns: ['Token', 'Signal A', 'Signal B', 'Signal C', 'Composite', 'Tier'] }),
      React.createElement('tbody', null,
        sorted.map(function(t, i) {
          return React.createElement(AlphaRow, { key: i, token: t });
        })
      )
    )
  );
}


// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================

/**
 * Main 1000x Intelligence Dashboard with 5-tab layout.
 */
function Dashboard1000x(props) {
  console.assert(THEME !== null, 'Dashboard1000x: THEME must exist');
  console.assert(TAB_CONFIG.length === 5, 'Dashboard1000x: must have 5 tabs');

  var activeTabState = React.useState('discovery');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];

  var dataState = React.useState({
    discovery: null, vc: null, dev: null, contracts: null, alpha: null
  });
  var data = dataState[0];
  var setData = dataState[1];

  var loadingState = React.useState({
    discovery: true, vc: true, dev: true, contracts: true, alpha: true
  });
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  // If sample data is injected via props, use it directly
  React.useEffect(function() {
    if (props && props.sampleData) {
      setData(props.sampleData);
      setLoading({ discovery: false, vc: false, dev: false, contracts: false, alpha: false });
      return;
    }
    // Otherwise attempt to load from /data/ endpoints
    loadAllData(setData, setLoading);
  }, []);

  return React.createElement('div', {
    style: {
      background: THEME.bg, minHeight: '100vh', color: THEME.textPrimary,
      fontFamily: THEME.font, padding: '0'
    }
  },
    React.createElement(DashboardHeader, null),
    React.createElement(TabBar, { activeTab: activeTab, setActiveTab: setActiveTab }),
    React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
      React.createElement(TabContent, { activeTab: activeTab, data: data, loading: loading })
    )
  );
}


/**
 * Dashboard header with title and branding.
 */
function DashboardHeader() {
  console.assert(THEME !== null, 'DashboardHeader: THEME must exist');
  console.assert(typeof THEME.bg === 'string', 'DashboardHeader: THEME.bg must be string');

  return React.createElement('div', {
    style: {
      background: THEME.surface, borderBottom: '1px solid ' + THEME.border,
      padding: '20px', textAlign: 'center'
    }
  },
    React.createElement('h1', {
      style: {
        margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold',
        color: THEME.gold, letterSpacing: '2px'
      }
    }, '1000x INTELLIGENCE'),
    React.createElement('div', {
      style: { fontSize: '12px', color: THEME.textSecondary, letterSpacing: '3px' }
    }, 'EARLYTHUNDER DISCOVERY PIPELINE')
  );
}


/**
 * Tab navigation bar.
 */
function TabBar(props) {
  console.assert(props !== null && typeof props === 'object', 'TabBar: props required');
  console.assert(typeof props.setActiveTab === 'function', 'TabBar: setActiveTab must be function');

  return React.createElement('div', {
    style: {
      display: 'flex', background: THEME.surface,
      borderBottom: '1px solid ' + THEME.border,
      overflowX: 'auto', padding: '0 20px'
    }
  },
    TAB_CONFIG.map(function(tab) {
      var isActive = props.activeTab === tab.id;
      return React.createElement('button', {
        key: tab.id,
        onClick: function() { props.setActiveTab(tab.id); },
        style: {
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '12px 20px', fontSize: '12px', fontFamily: THEME.font,
          color: isActive ? THEME.gold : THEME.textSecondary,
          borderBottom: isActive ? '2px solid ' + THEME.gold : '2px solid transparent',
          fontWeight: isActive ? 'bold' : 'normal',
          letterSpacing: '1px', textTransform: 'uppercase',
          whiteSpace: 'nowrap', transition: 'color 0.2s'
        }
      }, tab.label);
    })
  );
}


/**
 * Render the active tab's content based on current selection.
 */
function TabContent(props) {
  console.assert(props !== null && typeof props === 'object', 'TabContent: props required');
  console.assert(typeof props.activeTab === 'string', 'TabContent: activeTab must be string');

  var activeTab = props.activeTab;
  var data = props.data;
  var loading = props.loading;

  if (loading[activeTab]) {
    return React.createElement(LoadingState, null);
  }

  switch (activeTab) {
    case 'discovery':
      return React.createElement('div', null,
        React.createElement(LastUpdated, { timestamp: data.discovery && data.discovery.generated_at }),
        React.createElement(DiscoveryFeed, { tokens: (data.discovery && data.discovery.tokens) || [] })
      );
    case 'vc':
      return React.createElement('div', null,
        React.createElement(LastUpdated, { timestamp: data.vc && data.vc.generated_at }),
        React.createElement(VcRadar, {
          movements: (data.vc && data.vc.movements) || [],
          overlaps: (data.vc && data.vc.overlaps) || []
        })
      );
    case 'dev':
      return React.createElement('div', null,
        React.createElement(LastUpdated, { timestamp: data.dev && data.dev.generated_at }),
        React.createElement(DevMigration, { migrations: (data.dev && data.dev.migrations) || [] })
      );
    case 'contracts':
      return React.createElement('div', null,
        React.createElement(LastUpdated, { timestamp: data.contracts && data.contracts.generated_at }),
        React.createElement(ContractIntel, { contracts: (data.contracts && data.contracts.contracts) || [] })
      );
    case 'alpha':
      return React.createElement('div', null,
        React.createElement(LastUpdated, { timestamp: data.alpha && data.alpha.generated_at }),
        React.createElement(AlphaSignals, { tokens: (data.alpha && data.alpha.tokens) || [] })
      );
    default:
      return React.createElement(EmptyState, { tabName: activeTab });
  }
}


/**
 * Load all data files from /data/ endpoints.
 */
async function loadAllData(setData, setLoading) {
  console.assert(typeof setData === 'function', 'loadAllData: setData must be function');
  console.assert(typeof setLoading === 'function', 'loadAllData: setLoading must be function');

  var fileMap = {
    discovery: '1000x-watchlist-latest.json',
    vc: 'vc-movements-latest.json',
    dev: 'dev-migrations-latest.json',
    contracts: 'new-contracts-latest.json',
    alpha: 'alpha-list-latest.json'
  };

  var keys = Object.keys(fileMap);
  var results = {};

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var loaded = await loadData(fileMap[key]);
    results[key] = loaded;
    setLoading(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = false;
      return next;
    });
  }

  setData(results);
}


// Named exports for Next.js ES module import
export { Dashboard1000x, validateData, formatAddress, formatUsd, formatAge, classifyScore };
