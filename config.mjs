export const config = {
  // The default actions are things that have frequently been the
  // source of incidents in the past, so to verify that we're not hitting
  // a normal cause let's rule them out immediately.
  defaultActions: [
    'Was there a recent deploy?',
    'Was a feature flag toggled recently?',
    'Has there been an infrastructure changed recently?'
  ],

  // In most cases the incident goes through all of these states to reach a successful conclusion.
  // Implicitly the first status is where we start each incident.
  statuses: ['Investigating', 'Identified', 'Monitoring', 'Resolved']
}
