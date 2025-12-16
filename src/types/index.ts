// src/types/index.ts

export type Asset = {
  id: string;
  article?: string;
  typeOfEquipment?: string;
  acquisitionDate?: any;
  acquisitionValue?: number;
  createdAt?: any;
  description?: string;
  propertyNumber?: number;
  serialNumber?: string;
  assignedTo?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  photoUrls?: string[];
  [key: string]: any;
};

export type Office = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type User = {
  uid: string;
  fullname: string;
  assignedAssets?: string[];
};
