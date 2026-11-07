export const commands = [
  { command: '$ soc-cli threats --live --region jp-east', output: ['[OK] threat feed connected', 'UNKNOWN / 203.0.113.17 / flagged', '[READY] defensive policy available'] },
  { command: '$ fw-ctl isolate --segment karte-cloud-link --reason "anomalous ingress"', output: ['[OK] segment policy staged', '[OK] documentation-range peers filtered', '[READY] isolation prepared'] },
  { command: '$ ids-ctl signatures reload --profile hospital-strict', output: ['[OK] local signature set verified', '[OK] defensive rules reloaded'] },
  { command: '$ dr-ctl failover --to dr-site-west --confirm', output: ['[OK] standby health verified', '[OK] replica consistency checked', '[READY] routing policy prepared', '[OK] failover simulation complete'] },
  { command: '$ karte-ctl health --deep', output: ['[OK] storage consistency verified', '[OK] application health checked', '[OK] simulated services available'] },
] as const;
