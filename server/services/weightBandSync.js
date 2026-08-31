import { query } from '../db/index.js';

/**
 * Propagate weight band definitions from weight_bands to dc_weight_classes and customer_rates.
 * @param {string|number} serviceIdentifier - service_code or courier_service_id
 */
export async function propagateWeightBands(serviceIdentifier = null) {
  try {
    let serviceCondition = '';
    const params = [];
    if (serviceIdentifier) {
      params.push(String(serviceIdentifier));
      serviceCondition = `WHERE cs.service_code ILIKE $1 OR cs.id::text = $1`;
    }

    const { rows: bands } = await query(`
      SELECT 
        wb.id AS band_id,
        wb.zone_id,
        z.name AS zone_name,
        cs.id AS service_id,
        cs.service_code,
        cs.name AS service_name,
        wb.min_weight_kg,
        wb.max_weight_kg,
        wb.name AS band_name,
        wb.price_first,
        wb.price_sub
      FROM weight_bands wb
      JOIN zones z ON z.id = wb.zone_id
      JOIN courier_services cs ON cs.id = z.courier_service_id
      ${serviceCondition}
      ORDER BY cs.service_code, z.name, wb.min_weight_kg ASC
    `, params);

    if (!bands.length) return { updated: 0 };

    let updatedCount = 0;

    for (const b of bands) {
      const minKg = parseFloat(b.min_weight_kg) || 0;
      const maxKg = b.max_weight_kg != null ? parseFloat(b.max_weight_kg) : null;
      
      const computedLabel = maxKg != null
        ? `${minKg === Math.floor(minKg) ? Math.floor(minKg) : minKg}-${maxKg === Math.floor(maxKg) ? Math.floor(maxKg) : maxKg}kg`
        : `${minKg === Math.floor(minKg) ? Math.floor(minKg) : minKg}kg+`;
        
      const bandName = b.band_name && !['None', '', 'Parcel'].includes(b.band_name)
        ? b.band_name
        : computedLabel;

      // 1. Sync dc_weight_classes
      await query(`
        INSERT INTO dc_weight_classes (service_code, weight_class_name, min_weight_kg, max_weight_kg, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (service_code, weight_class_name) DO UPDATE
        SET min_weight_kg = EXCLUDED.min_weight_kg,
            max_weight_kg = EXCLUDED.max_weight_kg,
            updated_at = NOW()
      `, [b.service_code, bandName.toLowerCase(), minKg, maxKg]).catch(() => {});

      // Also register computed label if bandName was a custom title
      if (bandName.toLowerCase() !== computedLabel.toLowerCase()) {
        await query(`
          INSERT INTO dc_weight_classes (service_code, weight_class_name, min_weight_kg, max_weight_kg, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (service_code, weight_class_name) DO UPDATE
          SET min_weight_kg = EXCLUDED.min_weight_kg,
              max_weight_kg = EXCLUDED.max_weight_kg,
              updated_at = NOW()
        `, [b.service_code, computedLabel.toLowerCase(), minKg, maxKg]).catch(() => {});
      }

      // 2. Sync customer_rates bounds for matching zones and services
      const crUpdate = await query(`
        UPDATE customer_rates
        SET min_weight_kg = $1,
            max_weight_kg = $2,
            weight_class_name = $3
        WHERE service_code ILIKE $4
          AND zone_name ILIKE $5
          AND (
            LOWER(weight_class_name) = LOWER($3)
            OR LOWER(weight_class_name) = LOWER($6)
            OR (min_weight_kg = $1 AND (max_weight_kg = $2 OR max_weight_kg IS NULL))
            OR (
              -- Single band in zone fallback
              (SELECT COUNT(*) FROM weight_bands WHERE zone_id = $7) = 1
            )
          )
      `, [minKg, maxKg, bandName, b.service_code, b.zone_name, computedLabel, b.zone_id]);

      updatedCount += crUpdate.rowCount || 0;
    }

    console.log(`[weightBandSync] Propagated weight bands for ${serviceIdentifier || 'all services'}. Updated ${updatedCount} customer rates.`);
    return { updated: updatedCount, bands: bands.length };
  } catch (err) {
    console.error('[weightBandSync] error:', err.message);
    return { error: err.message };
  }
}
