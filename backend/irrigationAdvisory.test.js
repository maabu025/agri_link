const { calculateAdvisory } = require('./irrigationAdvisory');

describe('calculateAdvisory', () => {
  test('returns "urgent" when 3+ days since watering', () => {
    const result = calculateAdvisory({
      crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1,
      days_since_watered: 3, temperature: 32,
    });
    expect(result.urgency).toBe('urgent');
    expect(result.next_watering_in_days).toBe(0);
  });

  test('returns "soon" when exactly 2 days since watering', () => {
    const result = calculateAdvisory({
      crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1,
      days_since_watered: 2, temperature: 32,
    });
    expect(result.urgency).toBe('soon');
    expect(result.next_watering_in_days).toBe(1);
  });

  test('returns "ok" when 1 day since watering', () => {
    const result = calculateAdvisory({
      crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1,
      days_since_watered: 1, temperature: 32,
    });
    expect(result.urgency).toBe('ok');
    expect(result.next_watering_in_days).toBe(2);
  });

  test('KNOWN BUG: days_since_watered=0 (watered today) should be "ok", not "soon"', () => {
    const result = calculateAdvisory({
      crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1,
      days_since_watered: 0, temperature: 32,
    });
    expect(result.urgency).toBe('ok');
  });

  test('sandy soil requires more water than clay soil, all else equal', () => {
    const sandy = calculateAdvisory({ crop_type: 'Maize', soil_type: 'sandy', area_hectares: 1, days_since_watered: 1, temperature: 32 });
    const clay  = calculateAdvisory({ crop_type: 'Maize', soil_type: 'clay',  area_hectares: 1, days_since_watered: 1, temperature: 32 });
    expect(sandy.water_needed_liters).toBeGreaterThan(clay.water_needed_liters);
  });

  test('higher temperature increases water needed', () => {
    const hot  = calculateAdvisory({ crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1, days_since_watered: 1, temperature: 40 });
    const mild = calculateAdvisory({ crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1, days_since_watered: 1, temperature: 28 });
    expect(hot.water_needed_liters).toBeGreaterThan(mild.water_needed_liters);
  });

  test('larger area scales water needed proportionally', () => {
    const oneHa = calculateAdvisory({ crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1, days_since_watered: 1, temperature: 32 });
    const twoHa = calculateAdvisory({ crop_type: 'Maize', soil_type: 'loamy', area_hectares: 2, days_since_watered: 1, temperature: 32 });
    expect(twoHa.water_needed_liters).toBe(oneHa.water_needed_liters * 2);
  });

  test('unrecognized crop falls back to default water need (5 L/ha base)', () => {
    const result = calculateAdvisory({ crop_type: 'Unknown Crop', soil_type: 'loamy', area_hectares: 1, days_since_watered: 1, temperature: 32 });
    expect(result.water_needed_liters).toBeGreaterThan(0);
  });

  test('recommends earlier watering time (5-7am) when very hot', () => {
    const result = calculateAdvisory({ crop_type: 'Maize', soil_type: 'loamy', area_hectares: 1, days_since_watered: 1, temperature: 38 });
    expect(result.best_watering_time).toBe('5:00 AM – 7:00 AM');
  });
});