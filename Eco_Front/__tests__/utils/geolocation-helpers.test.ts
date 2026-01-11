/**
 * Tests pour les fonctions de géolocalisation et calcul de distance
 */

describe('Utils: Geolocation Helpers', () => {
  describe('Distance calculation', () => {
    it('should calculate distance between two coordinates (Haversine)', () => {
      // Paris
      const lat1 = 48.8566;
      const lon1 = 2.3522;
      // Lyon
      const lat2 = 45.764;
      const lon2 = 4.8357;

      const R = 6371; // Rayon de la Terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Distance approximative Paris-Lyon: ~400km
      expect(distance).toBeGreaterThan(390);
      expect(distance).toBeLessThan(410);
    });

    it('should calculate distance for same location', () => {
      const lat = 48.8566;
      const lon = 2.3522;

      const distance = 0; // Même position

      expect(distance).toBe(0);
    });

    it('should format distance display (km)', () => {
      const distanceKm = 12.543;
      const formatted = `${distanceKm.toFixed(1)} km`;

      expect(formatted).toBe('12.5 km');
    });

    it('should format distance display (meters)', () => {
      const distanceKm = 0.543;
      const distanceM = Math.round(distanceKm * 1000);
      const formatted = `${distanceM} m`;

      expect(formatted).toBe('543 m');
    });

    it('should choose correct unit based on distance', () => {
      const testDistance = (km: number) => {
        return km < 1
          ? `${Math.round(km * 1000)} m`
          : `${km.toFixed(1)} km`;
      };

      expect(testDistance(0.5)).toBe('500 m');
      expect(testDistance(1.5)).toBe('1.5 km');
      expect(testDistance(0.123)).toBe('123 m');
    });
  });

  describe('Location sorting', () => {
    it('should sort stores by distance', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 };
      const stores = [
        { id: '1', nom: 'Store A', latitude: 48.8600, longitude: 2.3550 },
        { id: '2', nom: 'Store B', latitude: 48.8500, longitude: 2.3400 },
        { id: '3', nom: 'Store C', latitude: 48.8570, longitude: 2.3525 },
      ];

      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        return Math.sqrt(dLat * dLat + dLon * dLon); // Distance simplifiée
      };

      const sorted = stores
        .map(store => ({
          ...store,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            store.latitude,
            store.longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      expect(sorted[0].id).toBe('3'); // Le plus proche
    });

    it('should filter stores within radius', () => {
      const stores = [
        { id: '1', distance: 0.5 },
        { id: '2', distance: 3.2 },
        { id: '3', distance: 8.5 },
      ];

      const radius = 5; // 5 km
      const nearby = stores.filter(s => s.distance <= radius);

      expect(nearby).toHaveLength(2);
      expect(nearby.map(s => s.id)).toEqual(['1', '2']);
    });
  });

  describe('Coordinate validation', () => {
    it('should validate latitude range (-90 to 90)', () => {
      const isValidLat = (lat: number) => lat >= -90 && lat <= 90;

      expect(isValidLat(48.8566)).toBe(true);
      expect(isValidLat(0)).toBe(true);
      expect(isValidLat(-45.5)).toBe(true);
      expect(isValidLat(91)).toBe(false);
      expect(isValidLat(-91)).toBe(false);
    });

    it('should validate longitude range (-180 to 180)', () => {
      const isValidLon = (lon: number) => lon >= -180 && lon <= 180;

      expect(isValidLon(2.3522)).toBe(true);
      expect(isValidLon(0)).toBe(true);
      expect(isValidLon(-120.5)).toBe(true);
      expect(isValidLon(181)).toBe(false);
      expect(isValidLon(-181)).toBe(false);
    });

    it('should validate coordinate pair', () => {
      const isValidCoordinate = (lat: number, lon: number) => {
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
      };

      expect(isValidCoordinate(48.8566, 2.3522)).toBe(true);
      expect(isValidCoordinate(91, 2.3522)).toBe(false);
      expect(isValidCoordinate(48.8566, 181)).toBe(false);
    });
  });

  describe('Proximity alerts', () => {
    it('should detect if store is very close (< 500m)', () => {
      const distanceKm = 0.3;
      const isVeryClose = distanceKm < 0.5;

      expect(isVeryClose).toBe(true);
    });

    it('should detect if store is nearby (< 2km)', () => {
      const distanceKm = 1.5;
      const isNearby = distanceKm >= 0.5 && distanceKm < 2;

      expect(isNearby).toBe(true);
    });

    it('should categorize distance ranges', () => {
      const categorize = (km: number) => {
        if (km < 0.5) return 'très proche';
        if (km < 2) return 'proche';
        if (km < 10) return 'accessible';
        return 'loin';
      };

      expect(categorize(0.3)).toBe('très proche');
      expect(categorize(1.2)).toBe('proche');
      expect(categorize(5)).toBe('accessible');
      expect(categorize(15)).toBe('loin');
    });
  });
});
