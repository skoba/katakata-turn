// Protocol structure only: no patient segments, identifiers, names or dates.
export const packetFragments = [
  'MSH|^~\\&|',
  '"resourceType":"Bundle"',
  '(0008,0060) MODALITY',
  'ACK|DEMO|OFFLINE',
] as const;
