export interface Flow {
  id: string;
  count: number;
}

export interface Msa {
  id: string;
  name: string;
  net: number;
  centroid: number[];
  totalIncoming: number;
  totalOutgoing: number;
  netAsPercent: number;
  population: number;
  feature: any;
  outgoing: Flow[];
  incoming: Flow[];
}
