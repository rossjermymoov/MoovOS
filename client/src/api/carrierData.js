import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const carrierDataApi = {
  // Import weight classes from parsed CSV rows
  importWeightClasses: (rows) =>
    api.post('/carrier-data/import/weight-classes', { rows }).then(r => r.data),

  // Import zones from parsed CSV rows
  importZones: (rows) =>
    api.post('/carrier-data/import/zones', { rows }).then(r => r.data),

  // List weight classes for a service
  getWeightClasses: (serviceCode, courierCode) =>
    api.get('/carrier-data/weight-classes', {
      params: { service_code: serviceCode, courier_code: courierCode },
    }).then(r => r.data),

  // List zones for a service
  getZones: (serviceCode, courierCode) =>
    api.get('/carrier-data/zones', {
      params: { service_code: serviceCode, courier_code: courierCode },
    }).then(r => r.data),

  // Resolve a postcode area to a zone name
  zoneLookup: (serviceCode, postcode, iso = 'GB') =>
    api.get('/carrier-data/zone-lookup', {
      params: { service_code: serviceCode, postcode, iso },
    }).then(r => r.data),

  // List all services that have DC data imported
  getServices: () =>
    api.get('/carrier-data/services').then(r => r.data),
};

export default carrierDataApi;
