// src/utils/models.ts
export type TrafficInspector = {
  name: string;
  licenseNumber: string;
  isAvailable: boolean;
};

export const sampleInspectors: TrafficInspector[] = [
  { name: 'Ali Hassan', licenseNumber: '145', isAvailable: true },
  { name: 'Mohammad Chahine', licenseNumber: '122', isAvailable: true },
  { name: 'Rami El Haddad', licenseNumber: '142', isAvailable: false },
  { name: 'Khaled Aboud', licenseNumber: '151', isAvailable: true },
  { name: 'Hassan Fakhry', licenseNumber: '152', isAvailable: true },
  { name: 'Omar Nasr', licenseNumber: '180', isAvailable: false },
];
