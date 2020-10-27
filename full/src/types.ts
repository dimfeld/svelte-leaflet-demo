export interface Flow {
  id: string;
  count: number;
}

export interface Msa {
  id: string;
  name: string;
  net: number;
  centroid: [lng: number, lat: number];
  totalIncoming: number;
  totalOutgoing: number;
  netAsPercent: number;
  population: number;
  feature: any;
  outgoing: Flow[];
  incoming: Flow[];
}
