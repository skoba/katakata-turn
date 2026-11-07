export type TopologyNode = {
  id: string;
  label: string;
  detail?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'cloud' | 'switch' | 'terminal' | 'ap';
  system: number;
  labelSide?: 'left';
};

export const topologyCopy = {
  title: 'NETWORK TOPOLOGY',
  subtitle: 'クラウド・境界・院内セグメント',
  caption: 'SW / AP / 端末 — 架空構成',
  shield: 'SHIELD ACTIVE',
  failover: 'DR ROUTE ACTIVE',
  sources: ['UNKNOWN', 'BOTNET-NODE-07'],
};
export const topologySize = { width: 1240, height: 350 };

export const nodes: readonly TopologyNode[] = [
  {
    id: 'cloud',
    label: 'CLOUD-DC-EAST',
    detail: '電子カルテ AP / DB',
    x: 150,
    y: 85,
    width: 240,
    height: 76,
    shape: 'cloud',
    system: 0,
  },
  {
    id: 'dr',
    label: 'DR-SITE-WEST',
    detail: '待機系',
    x: 150,
    y: 275,
    width: 240,
    height: 70,
    shape: 'cloud',
    system: 0,
  },
  {
    id: 'edge',
    label: 'INTERNET EDGE',
    detail: 'FW / IDS',
    x: 390,
    y: 85,
    width: 210,
    height: 68,
    shape: 'switch',
    system: 8,
  },
  {
    id: 'vpn',
    label: '閉域網 / VPN GW',
    x: 585,
    y: 195,
    width: 210,
    height: 55,
    shape: 'switch',
    system: 8,
  },
  {
    id: 'core',
    label: '院内コア SW',
    x: 770,
    y: 195,
    width: 160,
    height: 55,
    shape: 'switch',
    system: 7,
  },
  {
    id: 'ward-a',
    label: '病棟 A',
    x: 1030,
    y: 30,
    width: 38,
    height: 16,
    shape: 'switch',
    system: 5,
    labelSide: 'left',
  },
  {
    id: 'ward-b',
    label: '病棟 B',
    x: 1030,
    y: 75,
    width: 38,
    height: 16,
    shape: 'switch',
    system: 5,
    labelSide: 'left',
  },
  {
    id: 'outpatient',
    label: '外来',
    x: 1030,
    y: 120,
    width: 38,
    height: 16,
    shape: 'switch',
    system: 4,
    labelSide: 'left',
  },
  {
    id: 'surgery',
    label: '手術室',
    x: 1030,
    y: 165,
    width: 38,
    height: 16,
    shape: 'switch',
    system: 1,
    labelSide: 'left',
  },
  {
    id: 'lab',
    label: '検査',
    x: 1030,
    y: 210,
    width: 38,
    height: 16,
    shape: 'switch',
    system: 2,
    labelSide: 'left',
  },
  {
    id: 'pharmacy',
    label: '薬剤',
    x: 1030,
    y: 255,
    width: 38,
    height: 16,
    shape: 'switch',
    system: 3,
    labelSide: 'left',
  },
  {
    id: 'billing',
    label: '医事',
    x: 1030,
    y: 300,
    width: 38,
    height: 16,
    shape: 'switch',
    system: 6,
    labelSide: 'left',
  },
  ...[
    ['ward-a', 30, 5, 'ナースステーション'],
    ['ward-b', 75, 5, '電子カルテ端末'],
    ['outpatient', 120, 4, '電子カルテ端末'],
    ['surgery', 165, 1, 'PACS ビューア'],
    ['lab', 210, 2, '検査端末'],
    ['pharmacy', 255, 3, '薬剤端末'],
    ['billing', 300, 6, 'プリンタ'],
  ].flatMap(([id, y, system, label]) => [
    {
      id: `${id}-ap`,
      label: '無線 AP',
      x: 1100,
      y: Number(y),
      width: 22,
      height: 20,
      shape: 'ap' as const,
      system: Number(system),
    },
    {
      id: `${id}-terminal`,
      label: String(label),
      x: 1170,
      y: Number(y),
      width: 26,
      height: 22,
      shape: 'terminal' as const,
      system: Number(system),
    },
  ]),
];

export type TopologyLink = {
  from: string;
  to: string;
  route?: 'primary' | 'dr';
};
export const links: readonly TopologyLink[] = [
  { from: 'cloud', to: 'edge', route: 'primary' },
  { from: 'edge', to: 'vpn', route: 'primary' },
  { from: 'dr', to: 'vpn', route: 'dr' },
  { from: 'vpn', to: 'core' },
  ...[
    'ward-a',
    'ward-b',
    'outpatient',
    'surgery',
    'lab',
    'pharmacy',
    'billing',
  ].flatMap((id) => [
    { from: 'core', to: id },
    { from: id, to: `${id}-ap` },
    { from: `${id}-ap`, to: `${id}-terminal` },
  ]),
];

// Attack particles enter from outside and reach the primary cloud link.
export const attackPath = [
  { x: 35, y: 180 },
  { x: 285, y: 180 },
  { x: 285, y: 135 },
  { x: 285, y: 85 },
  { x: 390, y: 85 },
  { x: 150, y: 85 },
];
