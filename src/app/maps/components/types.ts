export type Asset = {
  id: string;
  assetName?: string;
  latitude?: number;
  longitude?: number;
  unit?: string;
  status?: string;
  location?: string;
};

export type UserPin = {
  uid: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  pinColor?: string;
};
