// Lighthouse CI budget for the accounts route (desktop preset).
// The run is authenticated by sending the BFF session cookie obtained by scripts/lighthouse.sh.
module.exports = {
  ci: {
    collect: {
      url: [`${process.env.LHCI_BASE_URL || 'http://localhost:9000'}/accounts`],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless=new',
        extraHeaders: JSON.stringify({ Cookie: `bk_session=${process.env.LHCI_COOKIE || ''}` }),
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: process.env.LHCI_OUT || '.lighthouseci' },
  },
}
