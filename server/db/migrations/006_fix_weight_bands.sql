-- 006_fix_weight_bands.sql
-- Update weight band min/max for all services using authoritative weight_classes data
-- Single-band services (named flat rates like 'Parcel') had wrong max values in the seed

-- ── Single-band services ────────────────────────────────────────────────────

-- Yodel Channel Islands (1CEN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '1CEN');

-- Yodel Channel Islands POD (1CEP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '1CEP');

-- Yodel Xpect Large 24 (1VN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '1VN');

-- Yodel Xpect Large 24 POD (1VP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '1VP');

-- Yodel XXL 24 Non POD (1XXN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 32.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '1XXN');

-- Yodel XXL 24 POD (1XXP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 32.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '1XXP');

-- Yodel Xpect Medium 48 POD (2VMP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 17.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '2VMP');

-- Yodel Xpect Large 48 (2VN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '2VN');

-- Yodel Xpect Large 48 POD (2VP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '2VP');

-- Yodel Xpect XXL 48 Non POD (2XXN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 32.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '2XXN');

-- Yodel Xpect XXL 48 POD (2XXP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 32.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = '2XXP');

-- Yodel Channel Islands (AGL-1CEN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-1CEN');

-- Yodel Xpect Mini 24 (AGL-1SVN): Packet
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 3.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-1SVN');

-- Yodel Xpect Medium 24 (AGL-1VMN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 17.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-1VMN');

-- Xpect Large 24 (AGL-1VN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-1VN');

-- Yodel Xpect Medium 48 (AGL-2VMN): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 17.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-2VMN');

-- Xpect Medium Northern Ireland (AGL-2VMNNI): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 17.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-2VMNNI');

-- Yodel Xpect Mini 48 (AGL-2VSN): Packet
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 3.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-2VSN');

-- Yodel Xpect Mini N.I. (AGL-2VSNNI): Packet
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 3.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'AGL-2VSNNI');

-- Yodel Xpect Medium 24 (DG-PC24): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 17.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-PC24');

-- Yodel Xpect Mini 24 (DG-PC24MINI): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 3.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-PC24MINI');

-- Yodel Xpect Medium 48 (DG-PC48): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 17.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-PC48');

-- Yodel Xpect 48 Mini (DG-PCBI): Up to 3kg
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 3.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-PCBI');

-- Yodel Letter Boxable (DG-PCBILB): Packet
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-PCBILB');

-- Yodel Xpect Medium 24 POD (DG-PCST): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 17.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-PCST');

-- Yodel Xpect 48 XL (DG-PCSU): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-PCSU');

-- Royal Mail 24 Letter Boxable (DG-TRNN): Up to 1KG
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-TRNN');

-- Royal Mail 48 Letter Boxable (DG-TRSN): Up to 1KG
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-TRSN');

-- DHL Bagit 1Kg C2C (DHL-1KGC2C): Small Bagit
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHL-1KGC2C');

-- DHL Bagit 2Kg C2C (DHL-2KGC2C): Medium Bagit
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHL-2KGC2C');

-- DHL Bagit 5Kg C2C (DHL-5KGC2C): Large Bagit
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 5.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHL-5KGC2C');

-- DHL Next Day Perishable (DHL-NDPER): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHL-NDPER');

-- DHL Parcel C2C (DHL-PRCLC2C): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHL-PRCLC2C');

-- DHL Ecommerce Parcel 12.00 (DHLPCUK-221): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-221');

-- DHL Ecommerce Parcel 10.30 (DHLPCUK-222): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-222');

-- DHL Ecommerce Saturday (DHLPCUK-225): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-225');

-- DHl Ecommerce Saturday 10.30 (DHLPCUK-226): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-226');

-- DHL Ecommerce Bagit Medium (DHLPCUK-250): Medium Bagit
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-250');

-- DHL Ecommerce Bagit Large (DHLPCUK-260): Large Bagit
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 5.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-260');

-- DHL Ecommerce Parcel 09.00 (DHLPCUK-3): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-3');

-- DHL Ecommerce 48 Hour (DHLPCUK-48): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-48');

-- DHL Ecommerce Saturday 09.00 (DHLPCUK-5): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-5');

-- DHL Parcel 1K Insurance (DHLPCUK1K-220): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK1K-220');

-- DHL 72 Hour (DHLPUK-72): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPUK-72');

-- DHL Parcel Leave Safe (DHLPUKC-210): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPUKC-210');

-- DHL Ecommerce Parcel (DHLPUKC-220): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPUKC-220');

-- DHL Ecommerce Bagit Small (DHLPUKC-240): Small Bagit
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPUKC-240');

-- DPD Sunday (DPD-01): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-01');

-- DPD Two Day (DPD-11): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-11');

-- DPD Two Day Out of Gauge (DPD-11OOG): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-11OOG');

-- DPD Ireland (DPD-11ROI): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-11ROI');

-- DPD Next Day (DPD-12): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-12');

-- DPD Next Day N Ireland (DPD-12OFF): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-12OFF');

-- DPD Next Day Out of Gauge (DPD-12OOG): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-12OOG');

-- DPD Next Day 12.00 (DPD-13): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-13');

-- DPD Next Day 10.30 (DPD-14): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-14');

-- DPD Saturday (DPD-16): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-16');

-- DPD Saturday Out of Gauge (DPD-16OOG): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-16OOG');

-- DPD Saturday 12.00 (DPD-17): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-17');

-- DPD Saturday 10.30 (DPD-18): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-18');

-- DPD Classic Parcel (DPD-19): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 31.5
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-19');

-- DPD Classic Road DDP (DPD-19DDP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 31.5
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-19DDP');

-- DPD Shop Return (DPD-22): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 20.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-22');

-- DPD Two Day Offshore (DPD-2DAYOFD): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-2DAYOFD');

-- DPD 2 Day Offshore (DPD-2DAYOFF): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-2DAYOFF');

-- DPD Classic ExpressPak (DPD-39): Expresspak
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 5.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-39');

-- DPD Classic Expresspak DDP (DPD-39DDP): Expresspak
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 3
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-39DDP');

-- DPD Swap IT Next Day (DPD-42): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-42');

-- DPD Next Day 5k Insurance (DPD-5000): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-5000');

-- DPD Two Day 5k Insurance (DPD-5000TWO): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-5000TWO');

-- DPD Next Day Parcel 2Kg (DPD-ND2KG): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-ND2KG');

-- DPD N Ireland At Risk (DPD-NIAR): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-NIAR');

-- DPD NI At Risk 5K Insurance (DPD-NIAR5K): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-NIAR5K');

-- DPD Saturday 5k Insurance (DPD-SAT5K): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-SAT5K');

-- Evri 24 Postable (EVRI-24POST): Postable
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-24POST');

-- Evri 48 Postable (EVRI-48POST): Postable
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48POST');

-- Evri 48 Postable C2C (EVRI-48POSTC2C): Postable
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48POSTC2C');

-- Light and Large (EVRI-LAL): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-LAL');

-- Light and Large POD (EVRI-LALP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30.01
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-LALP');

-- PPI Label (PPI-Default): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1000
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'PPI-Default');

-- Royal Mail 1st Class Signed For (RMCD-BPR1): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-BPR1');

-- Royal Mail 1st Class Signed For LL (RMCD-BPR1-LL): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-BPR1-LL');

-- Royal Mail 24 Letter (RMCD-CRL24L): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL24L');

-- Royal Mail 24 Large Letter (RMCD-CRL24LL): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL24LL');

-- Royal Mail 24 Medium Parcel (RMCD-CRL24MP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL24MP');

-- Royal Mail 24 Small Parcel (RMCD-CRL24SP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL24SP');

-- Royal Mail 48 Letter (RMCD-CRL48L): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL48L');

-- Royal Mail 48 Large Letter (RMCD-CRL48LL): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL48LL');

-- Royal Mail 48 Medium Parcel (RMCD-CRL48MP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL48MP');

-- Royal Mail 48 Small Parcel (RMCD-CRL48SP): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-CRL48SP');

-- Royal Mail Special Delivery (RMCD-SD1): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-SD1');

-- Royal Mail Tracked 24 (RMCD-TPN24): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-TPN24');

-- Royal Mail Tracked 48 (RMCD-TPS48): Parcel
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'RMCD-TPS48');

-- Testy Service 1 (Testy Service 1): Parcek
UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 30
  WHERE zone_id IN (
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'Testy Service 1');


-- ── Multi-band services — fix by sorted min_weight position ─────────────────

-- Royal Mail Tracked 24 (DG-TPNN): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-TPNN'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Royal Mail Tracked 24 Signature (DG-TPNS): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-TPNS'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Royal Mail Tracked 48 (DG-TPSN): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-TPSN'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Royal Mail Tracked 48 Signature (DG-TPSS): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DG-TPSS'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- DHL Parcel UK Worldwide Air (DHLPCUK-101): 140 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-101'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 140 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 5, max_weight_kg = 5.5 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 5.5, max_weight_kg = 6 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 6, max_weight_kg = 6.5 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 6.5, max_weight_kg = 7 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 7, max_weight_kg = 7.5 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 7.5, max_weight_kg = 8 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 8, max_weight_kg = 8.5 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 8.5, max_weight_kg = 9 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 9, max_weight_kg = 9.5 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 9.5, max_weight_kg = 10 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 10, max_weight_kg = 10.5 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 10.5, max_weight_kg = 11 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 11, max_weight_kg = 11.5 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 11.5, max_weight_kg = 12 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 12, max_weight_kg = 12.5 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 12.5, max_weight_kg = 13 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 13, max_weight_kg = 13.5 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 13.5, max_weight_kg = 14 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 14, max_weight_kg = 14.5 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 14.5, max_weight_kg = 15 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 15, max_weight_kg = 15.5 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 15.5, max_weight_kg = 16 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 16, max_weight_kg = 16.5 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 16.5, max_weight_kg = 17 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 17, max_weight_kg = 17.5 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 17.5, max_weight_kg = 18 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 18, max_weight_kg = 18.5 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 18.5, max_weight_kg = 19 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 19, max_weight_kg = 19.5 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 19.5, max_weight_kg = 20 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 20, max_weight_kg = 20.5 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 20.5, max_weight_kg = 21 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 21, max_weight_kg = 21.5 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 21.5, max_weight_kg = 22 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 22, max_weight_kg = 22.5 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 22.5, max_weight_kg = 23 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 23, max_weight_kg = 23.5 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 23.5, max_weight_kg = 24 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 24, max_weight_kg = 24.5 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 24.5, max_weight_kg = 25 WHERE id = band_ids[50];
      UPDATE weight_bands SET min_weight_kg = 25, max_weight_kg = 25.5 WHERE id = band_ids[51];
      UPDATE weight_bands SET min_weight_kg = 25.5, max_weight_kg = 26 WHERE id = band_ids[52];
      UPDATE weight_bands SET min_weight_kg = 26, max_weight_kg = 26.5 WHERE id = band_ids[53];
      UPDATE weight_bands SET min_weight_kg = 26.5, max_weight_kg = 27 WHERE id = band_ids[54];
      UPDATE weight_bands SET min_weight_kg = 27, max_weight_kg = 27.5 WHERE id = band_ids[55];
      UPDATE weight_bands SET min_weight_kg = 27.5, max_weight_kg = 28 WHERE id = band_ids[56];
      UPDATE weight_bands SET min_weight_kg = 28, max_weight_kg = 28.5 WHERE id = band_ids[57];
      UPDATE weight_bands SET min_weight_kg = 28.5, max_weight_kg = 29 WHERE id = band_ids[58];
      UPDATE weight_bands SET min_weight_kg = 29, max_weight_kg = 29.5 WHERE id = band_ids[59];
      UPDATE weight_bands SET min_weight_kg = 29.5, max_weight_kg = 30 WHERE id = band_ids[60];
      UPDATE weight_bands SET min_weight_kg = 30, max_weight_kg = 30.5 WHERE id = band_ids[61];
      UPDATE weight_bands SET min_weight_kg = 30.5, max_weight_kg = 31 WHERE id = band_ids[62];
      UPDATE weight_bands SET min_weight_kg = 31, max_weight_kg = 31.5 WHERE id = band_ids[63];
      UPDATE weight_bands SET min_weight_kg = 31.5, max_weight_kg = 32 WHERE id = band_ids[64];
      UPDATE weight_bands SET min_weight_kg = 32, max_weight_kg = 32.5 WHERE id = band_ids[65];
      UPDATE weight_bands SET min_weight_kg = 32.5, max_weight_kg = 33 WHERE id = band_ids[66];
      UPDATE weight_bands SET min_weight_kg = 33, max_weight_kg = 33.5 WHERE id = band_ids[67];
      UPDATE weight_bands SET min_weight_kg = 33.5, max_weight_kg = 34 WHERE id = band_ids[68];
      UPDATE weight_bands SET min_weight_kg = 34, max_weight_kg = 34.5 WHERE id = band_ids[69];
      UPDATE weight_bands SET min_weight_kg = 34.5, max_weight_kg = 35 WHERE id = band_ids[70];
      UPDATE weight_bands SET min_weight_kg = 35, max_weight_kg = 35.5 WHERE id = band_ids[71];
      UPDATE weight_bands SET min_weight_kg = 35.5, max_weight_kg = 36 WHERE id = band_ids[72];
      UPDATE weight_bands SET min_weight_kg = 36, max_weight_kg = 36.5 WHERE id = band_ids[73];
      UPDATE weight_bands SET min_weight_kg = 36.5, max_weight_kg = 37 WHERE id = band_ids[74];
      UPDATE weight_bands SET min_weight_kg = 37, max_weight_kg = 37.5 WHERE id = band_ids[75];
      UPDATE weight_bands SET min_weight_kg = 37.5, max_weight_kg = 38 WHERE id = band_ids[76];
      UPDATE weight_bands SET min_weight_kg = 38, max_weight_kg = 38.5 WHERE id = band_ids[77];
      UPDATE weight_bands SET min_weight_kg = 38.5, max_weight_kg = 39 WHERE id = band_ids[78];
      UPDATE weight_bands SET min_weight_kg = 39, max_weight_kg = 39.5 WHERE id = band_ids[79];
      UPDATE weight_bands SET min_weight_kg = 39.5, max_weight_kg = 40 WHERE id = band_ids[80];
      UPDATE weight_bands SET min_weight_kg = 40, max_weight_kg = 40.5 WHERE id = band_ids[81];
      UPDATE weight_bands SET min_weight_kg = 40.5, max_weight_kg = 41 WHERE id = band_ids[82];
      UPDATE weight_bands SET min_weight_kg = 41, max_weight_kg = 41.5 WHERE id = band_ids[83];
      UPDATE weight_bands SET min_weight_kg = 41.5, max_weight_kg = 42 WHERE id = band_ids[84];
      UPDATE weight_bands SET min_weight_kg = 42, max_weight_kg = 42.5 WHERE id = band_ids[85];
      UPDATE weight_bands SET min_weight_kg = 42.5, max_weight_kg = 43 WHERE id = band_ids[86];
      UPDATE weight_bands SET min_weight_kg = 43, max_weight_kg = 43.5 WHERE id = band_ids[87];
      UPDATE weight_bands SET min_weight_kg = 43.5, max_weight_kg = 44 WHERE id = band_ids[88];
      UPDATE weight_bands SET min_weight_kg = 44, max_weight_kg = 44.5 WHERE id = band_ids[89];
      UPDATE weight_bands SET min_weight_kg = 44.5, max_weight_kg = 45 WHERE id = band_ids[90];
      UPDATE weight_bands SET min_weight_kg = 45, max_weight_kg = 45.5 WHERE id = band_ids[91];
      UPDATE weight_bands SET min_weight_kg = 45.5, max_weight_kg = 46 WHERE id = band_ids[92];
      UPDATE weight_bands SET min_weight_kg = 46, max_weight_kg = 46.5 WHERE id = band_ids[93];
      UPDATE weight_bands SET min_weight_kg = 46.5, max_weight_kg = 47 WHERE id = band_ids[94];
      UPDATE weight_bands SET min_weight_kg = 47, max_weight_kg = 47.5 WHERE id = band_ids[95];
      UPDATE weight_bands SET min_weight_kg = 47.5, max_weight_kg = 48 WHERE id = band_ids[96];
      UPDATE weight_bands SET min_weight_kg = 48, max_weight_kg = 48.5 WHERE id = band_ids[97];
      UPDATE weight_bands SET min_weight_kg = 48.5, max_weight_kg = 49 WHERE id = band_ids[98];
      UPDATE weight_bands SET min_weight_kg = 49, max_weight_kg = 49.5 WHERE id = band_ids[99];
      UPDATE weight_bands SET min_weight_kg = 49.5, max_weight_kg = 50 WHERE id = band_ids[100];
      UPDATE weight_bands SET min_weight_kg = 50, max_weight_kg = 50.5 WHERE id = band_ids[101];
      UPDATE weight_bands SET min_weight_kg = 50.5, max_weight_kg = 51 WHERE id = band_ids[102];
      UPDATE weight_bands SET min_weight_kg = 51, max_weight_kg = 51.5 WHERE id = band_ids[103];
      UPDATE weight_bands SET min_weight_kg = 51.5, max_weight_kg = 52 WHERE id = band_ids[104];
      UPDATE weight_bands SET min_weight_kg = 52, max_weight_kg = 52.5 WHERE id = band_ids[105];
      UPDATE weight_bands SET min_weight_kg = 52.5, max_weight_kg = 53 WHERE id = band_ids[106];
      UPDATE weight_bands SET min_weight_kg = 53, max_weight_kg = 53.5 WHERE id = band_ids[107];
      UPDATE weight_bands SET min_weight_kg = 53.5, max_weight_kg = 54 WHERE id = band_ids[108];
      UPDATE weight_bands SET min_weight_kg = 54, max_weight_kg = 54.5 WHERE id = band_ids[109];
      UPDATE weight_bands SET min_weight_kg = 54.5, max_weight_kg = 55 WHERE id = band_ids[110];
      UPDATE weight_bands SET min_weight_kg = 55, max_weight_kg = 55.5 WHERE id = band_ids[111];
      UPDATE weight_bands SET min_weight_kg = 55.5, max_weight_kg = 56 WHERE id = band_ids[112];
      UPDATE weight_bands SET min_weight_kg = 56, max_weight_kg = 56.5 WHERE id = band_ids[113];
      UPDATE weight_bands SET min_weight_kg = 56.5, max_weight_kg = 57 WHERE id = band_ids[114];
      UPDATE weight_bands SET min_weight_kg = 57, max_weight_kg = 57.5 WHERE id = band_ids[115];
      UPDATE weight_bands SET min_weight_kg = 57.5, max_weight_kg = 58 WHERE id = band_ids[116];
      UPDATE weight_bands SET min_weight_kg = 58, max_weight_kg = 58.5 WHERE id = band_ids[117];
      UPDATE weight_bands SET min_weight_kg = 58.5, max_weight_kg = 59 WHERE id = band_ids[118];
      UPDATE weight_bands SET min_weight_kg = 59, max_weight_kg = 59.5 WHERE id = band_ids[119];
      UPDATE weight_bands SET min_weight_kg = 59.5, max_weight_kg = 60 WHERE id = band_ids[120];
      UPDATE weight_bands SET min_weight_kg = 60, max_weight_kg = 60.5 WHERE id = band_ids[121];
      UPDATE weight_bands SET min_weight_kg = 60.5, max_weight_kg = 61 WHERE id = band_ids[122];
      UPDATE weight_bands SET min_weight_kg = 61, max_weight_kg = 61.5 WHERE id = band_ids[123];
      UPDATE weight_bands SET min_weight_kg = 61.5, max_weight_kg = 62 WHERE id = band_ids[124];
      UPDATE weight_bands SET min_weight_kg = 62, max_weight_kg = 62.5 WHERE id = band_ids[125];
      UPDATE weight_bands SET min_weight_kg = 62.5, max_weight_kg = 63 WHERE id = band_ids[126];
      UPDATE weight_bands SET min_weight_kg = 63, max_weight_kg = 63.5 WHERE id = band_ids[127];
      UPDATE weight_bands SET min_weight_kg = 63.5, max_weight_kg = 64 WHERE id = band_ids[128];
      UPDATE weight_bands SET min_weight_kg = 64, max_weight_kg = 64.5 WHERE id = band_ids[129];
      UPDATE weight_bands SET min_weight_kg = 64.5, max_weight_kg = 65 WHERE id = band_ids[130];
      UPDATE weight_bands SET min_weight_kg = 65, max_weight_kg = 65.5 WHERE id = band_ids[131];
      UPDATE weight_bands SET min_weight_kg = 65.5, max_weight_kg = 66 WHERE id = band_ids[132];
      UPDATE weight_bands SET min_weight_kg = 66, max_weight_kg = 66.5 WHERE id = band_ids[133];
      UPDATE weight_bands SET min_weight_kg = 66.5, max_weight_kg = 67 WHERE id = band_ids[134];
      UPDATE weight_bands SET min_weight_kg = 67, max_weight_kg = 67.5 WHERE id = band_ids[135];
      UPDATE weight_bands SET min_weight_kg = 67.5, max_weight_kg = 68 WHERE id = band_ids[136];
      UPDATE weight_bands SET min_weight_kg = 68, max_weight_kg = 68.5 WHERE id = band_ids[137];
      UPDATE weight_bands SET min_weight_kg = 68.5, max_weight_kg = 69 WHERE id = band_ids[138];
      UPDATE weight_bands SET min_weight_kg = 69, max_weight_kg = 69.5 WHERE id = band_ids[139];
      UPDATE weight_bands SET min_weight_kg = 69.5, max_weight_kg = 70 WHERE id = band_ids[140];
    END IF;
  END LOOP;
END $$;

-- DHL Ecommerce International Economy Road (DHLPCUK-204): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DHLPCUK-204'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 20.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 30.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- DPD Air Express (DPD-10): 63 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-10'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 63 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 5, max_weight_kg = 5.5 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 5.5, max_weight_kg = 6 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 6, max_weight_kg = 6.5 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 6.5, max_weight_kg = 7 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 7, max_weight_kg = 7.5 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 7.5, max_weight_kg = 8 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 8, max_weight_kg = 8.5 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 8.5, max_weight_kg = 9 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 9, max_weight_kg = 9.5 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 9.5, max_weight_kg = 10 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 10, max_weight_kg = 10.5 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 10.5, max_weight_kg = 11 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 11, max_weight_kg = 11.5 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 11.5, max_weight_kg = 12 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 12, max_weight_kg = 12.5 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 12.5, max_weight_kg = 13 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 13, max_weight_kg = 13.5 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 13.5, max_weight_kg = 14 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 14, max_weight_kg = 14.5 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 14.5, max_weight_kg = 15 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 15, max_weight_kg = 15.5 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 15.5, max_weight_kg = 16 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 16, max_weight_kg = 16.5 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 16.5, max_weight_kg = 17 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 17, max_weight_kg = 17.5 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 17.5, max_weight_kg = 18 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 18, max_weight_kg = 18.5 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 18.5, max_weight_kg = 19 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 19, max_weight_kg = 19.5 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 19.5, max_weight_kg = 20 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 20, max_weight_kg = 20.5 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 20.5, max_weight_kg = 21 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 21, max_weight_kg = 21.5 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 21.5, max_weight_kg = 22 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 22, max_weight_kg = 22.5 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 22.5, max_weight_kg = 23 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 23, max_weight_kg = 23.5 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 23.5, max_weight_kg = 24 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 24, max_weight_kg = 24.5 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 24.5, max_weight_kg = 25 WHERE id = band_ids[50];
      UPDATE weight_bands SET min_weight_kg = 25, max_weight_kg = 25.5 WHERE id = band_ids[51];
      UPDATE weight_bands SET min_weight_kg = 25.5, max_weight_kg = 26 WHERE id = band_ids[52];
      UPDATE weight_bands SET min_weight_kg = 26, max_weight_kg = 26.5 WHERE id = band_ids[53];
      UPDATE weight_bands SET min_weight_kg = 26.5, max_weight_kg = 27 WHERE id = band_ids[54];
      UPDATE weight_bands SET min_weight_kg = 27, max_weight_kg = 27.5 WHERE id = band_ids[55];
      UPDATE weight_bands SET min_weight_kg = 27.5, max_weight_kg = 28 WHERE id = band_ids[56];
      UPDATE weight_bands SET min_weight_kg = 28, max_weight_kg = 28.5 WHERE id = band_ids[57];
      UPDATE weight_bands SET min_weight_kg = 28.5, max_weight_kg = 29 WHERE id = band_ids[58];
      UPDATE weight_bands SET min_weight_kg = 29, max_weight_kg = 29.5 WHERE id = band_ids[59];
      UPDATE weight_bands SET min_weight_kg = 29.5, max_weight_kg = 30 WHERE id = band_ids[60];
      UPDATE weight_bands SET min_weight_kg = 30, max_weight_kg = 30.5 WHERE id = band_ids[61];
      UPDATE weight_bands SET min_weight_kg = 30.5, max_weight_kg = 31 WHERE id = band_ids[62];
      UPDATE weight_bands SET min_weight_kg = 31, max_weight_kg = 31.5 WHERE id = band_ids[63];
    END IF;
  END LOOP;
END $$;

-- DPD Air Express DDP (DPD-10DDP): 63 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-10DDP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 63 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 5, max_weight_kg = 5.5 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 5.5, max_weight_kg = 6 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 6, max_weight_kg = 6.5 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 6.5, max_weight_kg = 7 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 7, max_weight_kg = 7.5 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 7.5, max_weight_kg = 8 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 8, max_weight_kg = 8.5 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 8.5, max_weight_kg = 9 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 9, max_weight_kg = 9.5 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 9.5, max_weight_kg = 10 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 10, max_weight_kg = 10.5 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 10.5, max_weight_kg = 11 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 11, max_weight_kg = 11.5 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 11.5, max_weight_kg = 12 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 12, max_weight_kg = 12.5 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 12.5, max_weight_kg = 13 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 13, max_weight_kg = 13.5 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 13.5, max_weight_kg = 14 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 14, max_weight_kg = 14.5 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 14.5, max_weight_kg = 15 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 15, max_weight_kg = 15.5 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 15.5, max_weight_kg = 16 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 16, max_weight_kg = 16.5 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 16.5, max_weight_kg = 17 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 17, max_weight_kg = 17.5 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 17.5, max_weight_kg = 18 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 18, max_weight_kg = 18.5 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 18.5, max_weight_kg = 19 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 19, max_weight_kg = 19.5 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 19.5, max_weight_kg = 20 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 20, max_weight_kg = 20.5 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 20.5, max_weight_kg = 21 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 21, max_weight_kg = 21.5 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 21.5, max_weight_kg = 22 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 22, max_weight_kg = 22.5 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 22.5, max_weight_kg = 23 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 23, max_weight_kg = 23.5 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 23.5, max_weight_kg = 24 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 24, max_weight_kg = 24.5 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 24.5, max_weight_kg = 25 WHERE id = band_ids[50];
      UPDATE weight_bands SET min_weight_kg = 25, max_weight_kg = 25.5 WHERE id = band_ids[51];
      UPDATE weight_bands SET min_weight_kg = 25.5, max_weight_kg = 26 WHERE id = band_ids[52];
      UPDATE weight_bands SET min_weight_kg = 26, max_weight_kg = 26.5 WHERE id = band_ids[53];
      UPDATE weight_bands SET min_weight_kg = 26.5, max_weight_kg = 27 WHERE id = band_ids[54];
      UPDATE weight_bands SET min_weight_kg = 27, max_weight_kg = 27.5 WHERE id = band_ids[55];
      UPDATE weight_bands SET min_weight_kg = 27.5, max_weight_kg = 28 WHERE id = band_ids[56];
      UPDATE weight_bands SET min_weight_kg = 28, max_weight_kg = 28.5 WHERE id = band_ids[57];
      UPDATE weight_bands SET min_weight_kg = 28.5, max_weight_kg = 29 WHERE id = band_ids[58];
      UPDATE weight_bands SET min_weight_kg = 29, max_weight_kg = 29.5 WHERE id = band_ids[59];
      UPDATE weight_bands SET min_weight_kg = 29.5, max_weight_kg = 30 WHERE id = band_ids[60];
      UPDATE weight_bands SET min_weight_kg = 30, max_weight_kg = 30.5 WHERE id = band_ids[61];
      UPDATE weight_bands SET min_weight_kg = 30.5, max_weight_kg = 31 WHERE id = band_ids[62];
      UPDATE weight_bands SET min_weight_kg = 31, max_weight_kg = 31.5 WHERE id = band_ids[63];
    END IF;
  END LOOP;
END $$;

-- DPD Drop Off Next Day QR Code (DPD-12DROPQR): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-12DROPQR'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- DPD Direct Lite (DPD-20): 4 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-20'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 4 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
    END IF;
  END LOOP;
END $$;

-- DPD Expresspak (DPD-32): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-32'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- DPD Classic Air (DPD-60): 63 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-60'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 63 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 5, max_weight_kg = 5.5 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 5.5, max_weight_kg = 6 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 6, max_weight_kg = 6.5 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 6.5, max_weight_kg = 7 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 7, max_weight_kg = 7.5 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 7.5, max_weight_kg = 8 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 8, max_weight_kg = 8.5 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 8.5, max_weight_kg = 9 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 9, max_weight_kg = 9.5 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 9.5, max_weight_kg = 10 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 10, max_weight_kg = 10.5 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 10.5, max_weight_kg = 11 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 11, max_weight_kg = 11.5 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 11.5, max_weight_kg = 12 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 12, max_weight_kg = 12.5 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 12.5, max_weight_kg = 13 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 13, max_weight_kg = 13.5 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 13.5, max_weight_kg = 14 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 14, max_weight_kg = 14.5 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 14.5, max_weight_kg = 15 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 15, max_weight_kg = 15.5 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 15.5, max_weight_kg = 16 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 16, max_weight_kg = 16.5 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 16.5, max_weight_kg = 17 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 17, max_weight_kg = 17.5 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 17.5, max_weight_kg = 18 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 18, max_weight_kg = 18.5 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 18.5, max_weight_kg = 19 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 19, max_weight_kg = 19.5 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 19.5, max_weight_kg = 20 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 20, max_weight_kg = 20.5 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 20.5, max_weight_kg = 21 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 21, max_weight_kg = 21.5 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 21.5, max_weight_kg = 22 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 22, max_weight_kg = 22.5 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 22.5, max_weight_kg = 23 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 23, max_weight_kg = 23.5 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 23.5, max_weight_kg = 24 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 24, max_weight_kg = 24.5 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 24.5, max_weight_kg = 25 WHERE id = band_ids[50];
      UPDATE weight_bands SET min_weight_kg = 25, max_weight_kg = 25.5 WHERE id = band_ids[51];
      UPDATE weight_bands SET min_weight_kg = 25.5, max_weight_kg = 26 WHERE id = band_ids[52];
      UPDATE weight_bands SET min_weight_kg = 26, max_weight_kg = 26.5 WHERE id = band_ids[53];
      UPDATE weight_bands SET min_weight_kg = 26.5, max_weight_kg = 27 WHERE id = band_ids[54];
      UPDATE weight_bands SET min_weight_kg = 27, max_weight_kg = 27.5 WHERE id = band_ids[55];
      UPDATE weight_bands SET min_weight_kg = 27.5, max_weight_kg = 28 WHERE id = band_ids[56];
      UPDATE weight_bands SET min_weight_kg = 28, max_weight_kg = 28.5 WHERE id = band_ids[57];
      UPDATE weight_bands SET min_weight_kg = 28.5, max_weight_kg = 29 WHERE id = band_ids[58];
      UPDATE weight_bands SET min_weight_kg = 29, max_weight_kg = 29.5 WHERE id = band_ids[59];
      UPDATE weight_bands SET min_weight_kg = 29.5, max_weight_kg = 30 WHERE id = band_ids[60];
      UPDATE weight_bands SET min_weight_kg = 30, max_weight_kg = 30.5 WHERE id = band_ids[61];
      UPDATE weight_bands SET min_weight_kg = 30.5, max_weight_kg = 31 WHERE id = band_ids[62];
      UPDATE weight_bands SET min_weight_kg = 31, max_weight_kg = 31.5 WHERE id = band_ids[63];
    END IF;
  END LOOP;
END $$;

-- DPD Air Classic DDP (DPD-60DDP): 63 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-60DDP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 63 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 5, max_weight_kg = 5.5 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 5.5, max_weight_kg = 6 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 6, max_weight_kg = 6.5 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 6.5, max_weight_kg = 7 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 7, max_weight_kg = 7.5 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 7.5, max_weight_kg = 8 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 8, max_weight_kg = 8.5 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 8.5, max_weight_kg = 9 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 9, max_weight_kg = 9.5 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 9.5, max_weight_kg = 10 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 10, max_weight_kg = 10.5 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 10.5, max_weight_kg = 11 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 11, max_weight_kg = 11.5 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 11.5, max_weight_kg = 12 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 12, max_weight_kg = 12.5 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 12.5, max_weight_kg = 13 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 13, max_weight_kg = 13.5 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 13.5, max_weight_kg = 14 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 14, max_weight_kg = 14.5 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 14.5, max_weight_kg = 15 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 15, max_weight_kg = 15.5 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 15.5, max_weight_kg = 16 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 16, max_weight_kg = 16.5 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 16.5, max_weight_kg = 17 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 17, max_weight_kg = 17.5 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 17.5, max_weight_kg = 18 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 18, max_weight_kg = 18.5 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 18.5, max_weight_kg = 19 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 19, max_weight_kg = 19.5 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 19.5, max_weight_kg = 20 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 20, max_weight_kg = 20.5 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 20.5, max_weight_kg = 21 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 21, max_weight_kg = 21.5 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 21.5, max_weight_kg = 22 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 22, max_weight_kg = 22.5 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 22.5, max_weight_kg = 23 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 23, max_weight_kg = 23.5 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 23.5, max_weight_kg = 24 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 24, max_weight_kg = 24.5 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 24.5, max_weight_kg = 25 WHERE id = band_ids[50];
      UPDATE weight_bands SET min_weight_kg = 25, max_weight_kg = 25.5 WHERE id = band_ids[51];
      UPDATE weight_bands SET min_weight_kg = 25.5, max_weight_kg = 26 WHERE id = band_ids[52];
      UPDATE weight_bands SET min_weight_kg = 26, max_weight_kg = 26.5 WHERE id = band_ids[53];
      UPDATE weight_bands SET min_weight_kg = 26.5, max_weight_kg = 27 WHERE id = band_ids[54];
      UPDATE weight_bands SET min_weight_kg = 27, max_weight_kg = 27.5 WHERE id = band_ids[55];
      UPDATE weight_bands SET min_weight_kg = 27.5, max_weight_kg = 28 WHERE id = band_ids[56];
      UPDATE weight_bands SET min_weight_kg = 28, max_weight_kg = 28.5 WHERE id = band_ids[57];
      UPDATE weight_bands SET min_weight_kg = 28.5, max_weight_kg = 29 WHERE id = band_ids[58];
      UPDATE weight_bands SET min_weight_kg = 29, max_weight_kg = 29.5 WHERE id = band_ids[59];
      UPDATE weight_bands SET min_weight_kg = 29.5, max_weight_kg = 30 WHERE id = band_ids[60];
      UPDATE weight_bands SET min_weight_kg = 30, max_weight_kg = 30.5 WHERE id = band_ids[61];
      UPDATE weight_bands SET min_weight_kg = 30.5, max_weight_kg = 31 WHERE id = band_ids[62];
      UPDATE weight_bands SET min_weight_kg = 31, max_weight_kg = 31.5 WHERE id = band_ids[63];
    END IF;
  END LOOP;
END $$;

-- DPD Direct (DPD-80): 10 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-80'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 10 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
    END IF;
  END LOOP;
END $$;

-- DPD Freight Two Day (DPD-81): 95 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-81'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 95 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 5.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 6.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 6.01, max_weight_kg = 7.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 7.01, max_weight_kg = 8.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 8.01, max_weight_kg = 9.01 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 9.01, max_weight_kg = 10.01 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 11.01 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 11.01, max_weight_kg = 12.01 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 12.01, max_weight_kg = 13.01 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 13.01, max_weight_kg = 14.01 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 14.01, max_weight_kg = 15.01 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 16.01 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 16.01, max_weight_kg = 17.01 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 17.01, max_weight_kg = 18.01 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 18.01, max_weight_kg = 19.01 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 19.01, max_weight_kg = 20.01 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 21.01 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 21.01, max_weight_kg = 22.01 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 22.01, max_weight_kg = 23.01 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 23.01, max_weight_kg = 24.01 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 24.01, max_weight_kg = 25.01 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 26.01 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 26.01, max_weight_kg = 27.01 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 27.01, max_weight_kg = 28.01 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 28.01, max_weight_kg = 29.01 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 29.01, max_weight_kg = 30.01 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 30.01, max_weight_kg = 31.01 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 31.01, max_weight_kg = 32.01 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 32.01, max_weight_kg = 33.01 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 33.01, max_weight_kg = 34.01 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 34.01, max_weight_kg = 35.01 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 35.01, max_weight_kg = 36.01 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 36.01, max_weight_kg = 37.01 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 37.01, max_weight_kg = 38.01 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 38.01, max_weight_kg = 39.01 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 39.01, max_weight_kg = 40.01 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 40.01, max_weight_kg = 41.01 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 41.01, max_weight_kg = 42.01 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 42.01, max_weight_kg = 43.01 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 43.01, max_weight_kg = 44.01 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 44.01, max_weight_kg = 45.01 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 45.01, max_weight_kg = 46.01 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 46.01, max_weight_kg = 47.01 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 47.01, max_weight_kg = 48.01 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 48.01, max_weight_kg = 49.01 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 49.01, max_weight_kg = 50.01 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 50.01, max_weight_kg = 51.01 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 51.01, max_weight_kg = 52.01 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 52.01, max_weight_kg = 53.01 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 53.01, max_weight_kg = 54.01 WHERE id = band_ids[50];
      UPDATE weight_bands SET min_weight_kg = 54.01, max_weight_kg = 55.01 WHERE id = band_ids[51];
      UPDATE weight_bands SET min_weight_kg = 55.01, max_weight_kg = 56.01 WHERE id = band_ids[52];
      UPDATE weight_bands SET min_weight_kg = 56.01, max_weight_kg = 57.01 WHERE id = band_ids[53];
      UPDATE weight_bands SET min_weight_kg = 57.01, max_weight_kg = 58.01 WHERE id = band_ids[54];
      UPDATE weight_bands SET min_weight_kg = 58.01, max_weight_kg = 59.01 WHERE id = band_ids[55];
      UPDATE weight_bands SET min_weight_kg = 59.01, max_weight_kg = 60.01 WHERE id = band_ids[56];
      UPDATE weight_bands SET min_weight_kg = 60.01, max_weight_kg = 61.01 WHERE id = band_ids[57];
      UPDATE weight_bands SET min_weight_kg = 61.01, max_weight_kg = 62.01 WHERE id = band_ids[58];
      UPDATE weight_bands SET min_weight_kg = 62.01, max_weight_kg = 63.01 WHERE id = band_ids[59];
      UPDATE weight_bands SET min_weight_kg = 63.01, max_weight_kg = 64.01 WHERE id = band_ids[60];
      UPDATE weight_bands SET min_weight_kg = 64.01, max_weight_kg = 65.01 WHERE id = band_ids[61];
      UPDATE weight_bands SET min_weight_kg = 65.01, max_weight_kg = 66.01 WHERE id = band_ids[62];
      UPDATE weight_bands SET min_weight_kg = 66.01, max_weight_kg = 67.01 WHERE id = band_ids[63];
      UPDATE weight_bands SET min_weight_kg = 67.01, max_weight_kg = 68.01 WHERE id = band_ids[64];
      UPDATE weight_bands SET min_weight_kg = 68.01, max_weight_kg = 69.01 WHERE id = band_ids[65];
      UPDATE weight_bands SET min_weight_kg = 69.01, max_weight_kg = 70.01 WHERE id = band_ids[66];
      UPDATE weight_bands SET min_weight_kg = 70.01, max_weight_kg = 71.01 WHERE id = band_ids[67];
      UPDATE weight_bands SET min_weight_kg = 71.01, max_weight_kg = 72.01 WHERE id = band_ids[68];
      UPDATE weight_bands SET min_weight_kg = 72.01, max_weight_kg = 73.01 WHERE id = band_ids[69];
      UPDATE weight_bands SET min_weight_kg = 73.01, max_weight_kg = 74.01 WHERE id = band_ids[70];
      UPDATE weight_bands SET min_weight_kg = 74.01, max_weight_kg = 75.01 WHERE id = band_ids[71];
      UPDATE weight_bands SET min_weight_kg = 75.01, max_weight_kg = 76.01 WHERE id = band_ids[72];
      UPDATE weight_bands SET min_weight_kg = 76.01, max_weight_kg = 77.01 WHERE id = band_ids[73];
      UPDATE weight_bands SET min_weight_kg = 77.01, max_weight_kg = 78.01 WHERE id = band_ids[74];
      UPDATE weight_bands SET min_weight_kg = 78.01, max_weight_kg = 79.01 WHERE id = band_ids[75];
      UPDATE weight_bands SET min_weight_kg = 79.01, max_weight_kg = 80.01 WHERE id = band_ids[76];
      UPDATE weight_bands SET min_weight_kg = 80.01, max_weight_kg = 81.01 WHERE id = band_ids[77];
      UPDATE weight_bands SET min_weight_kg = 81.01, max_weight_kg = 82.01 WHERE id = band_ids[78];
      UPDATE weight_bands SET min_weight_kg = 82.01, max_weight_kg = 83.01 WHERE id = band_ids[79];
      UPDATE weight_bands SET min_weight_kg = 83.01, max_weight_kg = 84.01 WHERE id = band_ids[80];
      UPDATE weight_bands SET min_weight_kg = 84.01, max_weight_kg = 85.01 WHERE id = band_ids[81];
      UPDATE weight_bands SET min_weight_kg = 85.01, max_weight_kg = 86.01 WHERE id = band_ids[82];
      UPDATE weight_bands SET min_weight_kg = 86.01, max_weight_kg = 87.01 WHERE id = band_ids[83];
      UPDATE weight_bands SET min_weight_kg = 87.01, max_weight_kg = 88.01 WHERE id = band_ids[84];
      UPDATE weight_bands SET min_weight_kg = 88.01, max_weight_kg = 89.01 WHERE id = band_ids[85];
      UPDATE weight_bands SET min_weight_kg = 89.01, max_weight_kg = 90.01 WHERE id = band_ids[86];
      UPDATE weight_bands SET min_weight_kg = 90.01, max_weight_kg = 91.01 WHERE id = band_ids[87];
      UPDATE weight_bands SET min_weight_kg = 91.01, max_weight_kg = 92.01 WHERE id = band_ids[88];
      UPDATE weight_bands SET min_weight_kg = 92.01, max_weight_kg = 93.01 WHERE id = band_ids[89];
      UPDATE weight_bands SET min_weight_kg = 93.01, max_weight_kg = 94.01 WHERE id = band_ids[90];
      UPDATE weight_bands SET min_weight_kg = 94.01, max_weight_kg = 95.01 WHERE id = band_ids[91];
      UPDATE weight_bands SET min_weight_kg = 95.01, max_weight_kg = 96.01 WHERE id = band_ids[92];
      UPDATE weight_bands SET min_weight_kg = 96.01, max_weight_kg = 97.01 WHERE id = band_ids[93];
      UPDATE weight_bands SET min_weight_kg = 97.01, max_weight_kg = 98.01 WHERE id = band_ids[94];
      UPDATE weight_bands SET min_weight_kg = 98.01, max_weight_kg = 99.01 WHERE id = band_ids[95];
    END IF;
  END LOOP;
END $$;

-- DPD Freight Next Day (DPD-82): 95 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-82'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 95 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 5.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 6.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 6.01, max_weight_kg = 7.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 7.01, max_weight_kg = 8.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 8.01, max_weight_kg = 9.01 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 9.01, max_weight_kg = 10.01 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 11.01 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 11.01, max_weight_kg = 12.01 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 12.01, max_weight_kg = 13.01 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 13.01, max_weight_kg = 14.01 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 14.01, max_weight_kg = 15.01 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 16.01 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 16.01, max_weight_kg = 17.01 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 17.01, max_weight_kg = 18.01 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 18.01, max_weight_kg = 19.01 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 19.01, max_weight_kg = 20.01 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 21.01 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 21.01, max_weight_kg = 22.01 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 22.01, max_weight_kg = 23.01 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 23.01, max_weight_kg = 24.01 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 24.01, max_weight_kg = 25.01 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 26.01 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 26.01, max_weight_kg = 27.01 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 27.01, max_weight_kg = 28.01 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 28.01, max_weight_kg = 29.01 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 29.01, max_weight_kg = 30.01 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 30.01, max_weight_kg = 31.01 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 31.01, max_weight_kg = 32.01 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 32.01, max_weight_kg = 33.01 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 33.01, max_weight_kg = 34.01 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 34.01, max_weight_kg = 35.01 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 35.01, max_weight_kg = 36.01 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 36.01, max_weight_kg = 37.01 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 37.01, max_weight_kg = 38.01 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 38.01, max_weight_kg = 39.01 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 39.01, max_weight_kg = 40.01 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 40.01, max_weight_kg = 41.01 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 41.01, max_weight_kg = 42.01 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 42.01, max_weight_kg = 43.01 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 43.01, max_weight_kg = 44.01 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 44.01, max_weight_kg = 45.01 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 45.01, max_weight_kg = 46.01 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 46.01, max_weight_kg = 47.01 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 47.01, max_weight_kg = 48.01 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 48.01, max_weight_kg = 49.01 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 49.01, max_weight_kg = 50.01 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 50.01, max_weight_kg = 51.01 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 51.01, max_weight_kg = 52.01 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 52.01, max_weight_kg = 53.01 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 53.01, max_weight_kg = 54.01 WHERE id = band_ids[50];
      UPDATE weight_bands SET min_weight_kg = 54.01, max_weight_kg = 55.01 WHERE id = band_ids[51];
      UPDATE weight_bands SET min_weight_kg = 55.01, max_weight_kg = 56.01 WHERE id = band_ids[52];
      UPDATE weight_bands SET min_weight_kg = 56.01, max_weight_kg = 57.01 WHERE id = band_ids[53];
      UPDATE weight_bands SET min_weight_kg = 57.01, max_weight_kg = 58.01 WHERE id = band_ids[54];
      UPDATE weight_bands SET min_weight_kg = 58.01, max_weight_kg = 59.01 WHERE id = band_ids[55];
      UPDATE weight_bands SET min_weight_kg = 59.01, max_weight_kg = 60.01 WHERE id = band_ids[56];
      UPDATE weight_bands SET min_weight_kg = 60.01, max_weight_kg = 61.01 WHERE id = band_ids[57];
      UPDATE weight_bands SET min_weight_kg = 61.01, max_weight_kg = 62.01 WHERE id = band_ids[58];
      UPDATE weight_bands SET min_weight_kg = 62.01, max_weight_kg = 63.01 WHERE id = band_ids[59];
      UPDATE weight_bands SET min_weight_kg = 63.01, max_weight_kg = 64.01 WHERE id = band_ids[60];
      UPDATE weight_bands SET min_weight_kg = 64.01, max_weight_kg = 65.01 WHERE id = band_ids[61];
      UPDATE weight_bands SET min_weight_kg = 65.01, max_weight_kg = 66.01 WHERE id = band_ids[62];
      UPDATE weight_bands SET min_weight_kg = 66.01, max_weight_kg = 67.01 WHERE id = band_ids[63];
      UPDATE weight_bands SET min_weight_kg = 67.01, max_weight_kg = 68.01 WHERE id = band_ids[64];
      UPDATE weight_bands SET min_weight_kg = 68.01, max_weight_kg = 69.01 WHERE id = band_ids[65];
      UPDATE weight_bands SET min_weight_kg = 69.01, max_weight_kg = 70.01 WHERE id = band_ids[66];
      UPDATE weight_bands SET min_weight_kg = 70.01, max_weight_kg = 71.01 WHERE id = band_ids[67];
      UPDATE weight_bands SET min_weight_kg = 71.01, max_weight_kg = 72.01 WHERE id = band_ids[68];
      UPDATE weight_bands SET min_weight_kg = 72.01, max_weight_kg = 73.01 WHERE id = band_ids[69];
      UPDATE weight_bands SET min_weight_kg = 73.01, max_weight_kg = 74.01 WHERE id = band_ids[70];
      UPDATE weight_bands SET min_weight_kg = 74.01, max_weight_kg = 75.01 WHERE id = band_ids[71];
      UPDATE weight_bands SET min_weight_kg = 75.01, max_weight_kg = 76.01 WHERE id = band_ids[72];
      UPDATE weight_bands SET min_weight_kg = 76.01, max_weight_kg = 77.01 WHERE id = band_ids[73];
      UPDATE weight_bands SET min_weight_kg = 77.01, max_weight_kg = 78.01 WHERE id = band_ids[74];
      UPDATE weight_bands SET min_weight_kg = 78.01, max_weight_kg = 79.01 WHERE id = band_ids[75];
      UPDATE weight_bands SET min_weight_kg = 79.01, max_weight_kg = 80.01 WHERE id = band_ids[76];
      UPDATE weight_bands SET min_weight_kg = 80.01, max_weight_kg = 81.01 WHERE id = band_ids[77];
      UPDATE weight_bands SET min_weight_kg = 81.01, max_weight_kg = 82.01 WHERE id = band_ids[78];
      UPDATE weight_bands SET min_weight_kg = 82.01, max_weight_kg = 83.01 WHERE id = band_ids[79];
      UPDATE weight_bands SET min_weight_kg = 83.01, max_weight_kg = 84.01 WHERE id = band_ids[80];
      UPDATE weight_bands SET min_weight_kg = 84.01, max_weight_kg = 85.01 WHERE id = band_ids[81];
      UPDATE weight_bands SET min_weight_kg = 85.01, max_weight_kg = 86.01 WHERE id = band_ids[82];
      UPDATE weight_bands SET min_weight_kg = 86.01, max_weight_kg = 87.01 WHERE id = band_ids[83];
      UPDATE weight_bands SET min_weight_kg = 87.01, max_weight_kg = 88.01 WHERE id = band_ids[84];
      UPDATE weight_bands SET min_weight_kg = 88.01, max_weight_kg = 89.01 WHERE id = band_ids[85];
      UPDATE weight_bands SET min_weight_kg = 89.01, max_weight_kg = 90.01 WHERE id = band_ids[86];
      UPDATE weight_bands SET min_weight_kg = 90.01, max_weight_kg = 91.01 WHERE id = band_ids[87];
      UPDATE weight_bands SET min_weight_kg = 91.01, max_weight_kg = 92.01 WHERE id = band_ids[88];
      UPDATE weight_bands SET min_weight_kg = 92.01, max_weight_kg = 93.01 WHERE id = band_ids[89];
      UPDATE weight_bands SET min_weight_kg = 93.01, max_weight_kg = 94.01 WHERE id = band_ids[90];
      UPDATE weight_bands SET min_weight_kg = 94.01, max_weight_kg = 95.01 WHERE id = band_ids[91];
      UPDATE weight_bands SET min_weight_kg = 95.01, max_weight_kg = 96.01 WHERE id = band_ids[92];
      UPDATE weight_bands SET min_weight_kg = 96.01, max_weight_kg = 97.01 WHERE id = band_ids[93];
      UPDATE weight_bands SET min_weight_kg = 97.01, max_weight_kg = 98.01 WHERE id = band_ids[94];
      UPDATE weight_bands SET min_weight_kg = 98.01, max_weight_kg = 99.01 WHERE id = band_ids[95];
    END IF;
  END LOOP;
END $$;

-- DPD Drop Off Next Day 5k Ins (DPD-DROP5KND): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD-DROP5KND'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- DPD Drop Off Two Day (DPD11-DROP): 4 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD11-DROP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 4 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 5.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[4];
    END IF;
  END LOOP;
END $$;

-- DPD Drop Off Next Day (DPD12-DROP): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'DPD12-DROP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- Evri 24 Non POD C2C (EVRI-24NPC2C): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-24NPC2C'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 2.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- Evri 24 Non POD Parcel (EVRI-24NPP): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-24NPP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri 24 Non POD Packet (EVRI-24NPPAK): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-24NPPAK'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri 24 POD C2C (EVRI-24PC2C): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-24PC2C'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 2.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- Evri 24 POD Parcel (EVRI-24PP): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-24PP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri 24 POD Packet (EVRI-24PPAK): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-24PPAK'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri 48 Non POD C2C (EVRI-48NPC2C): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48NPC2C'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 2.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- Evri 48 Non POD Parcel (EVRI-48NPP): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48NPP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri 48 Non POD Packet (EVRI-48NPPAK): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48NPPAK'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri 48 POD C2C (EVRI-48PC2C): 5 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48PC2C'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 5 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 2.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[5];
    END IF;
  END LOOP;
END $$;

-- Evri 48 POD Parcel (EVRI-48PP): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48PP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri 48 POD Packet (EVRI-48PPAK): 2 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'EVRI-48PPAK'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 2 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 15.01 WHERE id = band_ids[2];
    END IF;
  END LOOP;
END $$;

-- Evri International DDP (Evri International DDP): 28 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'Evri International DDP'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 28 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.251 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.251, max_weight_kg = 0.501 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 0.501, max_weight_kg = 0.751 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 0.751, max_weight_kg = 1.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 1.251 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 1.251, max_weight_kg = 1.501 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 1.501, max_weight_kg = 1.751 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 1.751, max_weight_kg = 2.01 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 2.51 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 2.51, max_weight_kg = 3.01 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 3.01, max_weight_kg = 3.51 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 3.501, max_weight_kg = 4.01 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 4.01, max_weight_kg = 4.51 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 4.51, max_weight_kg = 5.01 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 5.51 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 5.51, max_weight_kg = 6.01 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 6.01, max_weight_kg = 6.51 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 6.51, max_weight_kg = 7.01 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 7.01, max_weight_kg = 7.51 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 7.51, max_weight_kg = 8.01 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 8.01, max_weight_kg = 8.51 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 8.51, max_weight_kg = 9.01 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 9.01, max_weight_kg = 9.51 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 9.51, max_weight_kg = 10.01 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 25.01 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 30.01 WHERE id = band_ids[28];
    END IF;
  END LOOP;
END $$;

-- Evri International DDU (Evri International DDU): 28 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'Evri International DDU'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 28 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.251 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.251, max_weight_kg = 0.501 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 0.501, max_weight_kg = 0.751 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 0.751, max_weight_kg = 1.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 1.251 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 1.251, max_weight_kg = 1.501 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 1.501, max_weight_kg = 1.751 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 1.751, max_weight_kg = 2.01 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 2.51 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 2.51, max_weight_kg = 3.01 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 3.01, max_weight_kg = 3.51 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 3.501, max_weight_kg = 4.01 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 4.01, max_weight_kg = 4.51 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 4.51, max_weight_kg = 5.01 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 5.51 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 5.51, max_weight_kg = 6.01 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 6.01, max_weight_kg = 6.51 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 6.51, max_weight_kg = 7.01 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 7.01, max_weight_kg = 7.51 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 7.51, max_weight_kg = 8.01 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 8.01, max_weight_kg = 8.51 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 8.51, max_weight_kg = 9.01 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 9.01, max_weight_kg = 9.51 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 9.51, max_weight_kg = 10.01 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 25.01 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 30.01 WHERE id = band_ids[28];
    END IF;
  END LOOP;
END $$;

-- Testy Service 2 (Testy Service 2): 10 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'Testy Service 2'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 10 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
    END IF;
  END LOOP;
END $$;

-- UPS Standard UK (UPS-11): 15 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'UPS-11'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 15 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 25.01 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 30.01 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 30.01, max_weight_kg = 35.01 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 35.01, max_weight_kg = 40.01 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 40.01, max_weight_kg = 45.01 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 45.01, max_weight_kg = 50.01 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 50.01, max_weight_kg = 55.01 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 55.01, max_weight_kg = 60.01 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 60.01, max_weight_kg = 65.01 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 65.01, max_weight_kg = 70.01 WHERE id = band_ids[15];
    END IF;
  END LOOP;
END $$;

-- UPS Standard Europe (UPS-11EU): 50 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'UPS-11EU'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 50 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 2 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 3 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 4 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 5, max_weight_kg = 6 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 6, max_weight_kg = 7 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 7, max_weight_kg = 8 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 8, max_weight_kg = 9 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 9, max_weight_kg = 10 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 10, max_weight_kg = 11 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 11, max_weight_kg = 12 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 12, max_weight_kg = 13 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 13, max_weight_kg = 14 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 14, max_weight_kg = 15 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 15, max_weight_kg = 16 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 16, max_weight_kg = 17 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 17, max_weight_kg = 18 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 18, max_weight_kg = 19 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 19, max_weight_kg = 20 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 20, max_weight_kg = 21 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 21, max_weight_kg = 22 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 22, max_weight_kg = 23 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 23, max_weight_kg = 24 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 24, max_weight_kg = 25 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 25, max_weight_kg = 26 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 26, max_weight_kg = 27 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 27, max_weight_kg = 28 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 28, max_weight_kg = 29 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 29, max_weight_kg = 30 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 30, max_weight_kg = 31 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 31, max_weight_kg = 32 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 32, max_weight_kg = 33 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 33, max_weight_kg = 34 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 34, max_weight_kg = 35 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 35, max_weight_kg = 40 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 40, max_weight_kg = 45 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 45, max_weight_kg = 50 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 50, max_weight_kg = 55 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 55, max_weight_kg = 60 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 60, max_weight_kg = 65 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 65, max_weight_kg = 70 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 70, max_weight_kg = 80 WHERE id = band_ids[43];
      UPDATE weight_bands SET min_weight_kg = 80, max_weight_kg = 90 WHERE id = band_ids[44];
      UPDATE weight_bands SET min_weight_kg = 90, max_weight_kg = 100 WHERE id = band_ids[45];
      UPDATE weight_bands SET min_weight_kg = 100, max_weight_kg = 120 WHERE id = band_ids[46];
      UPDATE weight_bands SET min_weight_kg = 120, max_weight_kg = 140 WHERE id = band_ids[47];
      UPDATE weight_bands SET min_weight_kg = 140, max_weight_kg = 160 WHERE id = band_ids[48];
      UPDATE weight_bands SET min_weight_kg = 160, max_weight_kg = 180 WHERE id = band_ids[49];
      UPDATE weight_bands SET min_weight_kg = 180, max_weight_kg = 200 WHERE id = band_ids[50];
    END IF;
  END LOOP;
END $$;

-- UPS Worldwide Saver (UPS-65): 43 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'UPS-65'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 43 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 0.5 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 0.5, max_weight_kg = 1 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 1, max_weight_kg = 1.5 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 1.5, max_weight_kg = 2 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 2, max_weight_kg = 2.5 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 2.5, max_weight_kg = 3 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 3, max_weight_kg = 3.5 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 3.5, max_weight_kg = 4 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 4, max_weight_kg = 4.5 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 4.5, max_weight_kg = 5 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 5, max_weight_kg = 5.5 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 5.5, max_weight_kg = 6 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 6, max_weight_kg = 6.5 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 6.5, max_weight_kg = 7 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 7, max_weight_kg = 7.5 WHERE id = band_ids[15];
      UPDATE weight_bands SET min_weight_kg = 7.5, max_weight_kg = 8 WHERE id = band_ids[16];
      UPDATE weight_bands SET min_weight_kg = 8, max_weight_kg = 8.5 WHERE id = band_ids[17];
      UPDATE weight_bands SET min_weight_kg = 8.5, max_weight_kg = 9 WHERE id = band_ids[18];
      UPDATE weight_bands SET min_weight_kg = 9, max_weight_kg = 9.5 WHERE id = band_ids[19];
      UPDATE weight_bands SET min_weight_kg = 9.5, max_weight_kg = 10 WHERE id = band_ids[20];
      UPDATE weight_bands SET min_weight_kg = 10, max_weight_kg = 11 WHERE id = band_ids[21];
      UPDATE weight_bands SET min_weight_kg = 11, max_weight_kg = 12 WHERE id = band_ids[22];
      UPDATE weight_bands SET min_weight_kg = 12, max_weight_kg = 13 WHERE id = band_ids[23];
      UPDATE weight_bands SET min_weight_kg = 13, max_weight_kg = 14 WHERE id = band_ids[24];
      UPDATE weight_bands SET min_weight_kg = 14, max_weight_kg = 15 WHERE id = band_ids[25];
      UPDATE weight_bands SET min_weight_kg = 15, max_weight_kg = 16 WHERE id = band_ids[26];
      UPDATE weight_bands SET min_weight_kg = 16, max_weight_kg = 17 WHERE id = band_ids[27];
      UPDATE weight_bands SET min_weight_kg = 17, max_weight_kg = 18 WHERE id = band_ids[28];
      UPDATE weight_bands SET min_weight_kg = 18, max_weight_kg = 19 WHERE id = band_ids[29];
      UPDATE weight_bands SET min_weight_kg = 19, max_weight_kg = 20 WHERE id = band_ids[30];
      UPDATE weight_bands SET min_weight_kg = 20, max_weight_kg = 22 WHERE id = band_ids[31];
      UPDATE weight_bands SET min_weight_kg = 22, max_weight_kg = 24 WHERE id = band_ids[32];
      UPDATE weight_bands SET min_weight_kg = 24, max_weight_kg = 26 WHERE id = band_ids[33];
      UPDATE weight_bands SET min_weight_kg = 26, max_weight_kg = 28 WHERE id = band_ids[34];
      UPDATE weight_bands SET min_weight_kg = 28, max_weight_kg = 30 WHERE id = band_ids[35];
      UPDATE weight_bands SET min_weight_kg = 30, max_weight_kg = 35 WHERE id = band_ids[36];
      UPDATE weight_bands SET min_weight_kg = 35, max_weight_kg = 40 WHERE id = band_ids[37];
      UPDATE weight_bands SET min_weight_kg = 40, max_weight_kg = 45 WHERE id = band_ids[38];
      UPDATE weight_bands SET min_weight_kg = 45, max_weight_kg = 50 WHERE id = band_ids[39];
      UPDATE weight_bands SET min_weight_kg = 50, max_weight_kg = 55 WHERE id = band_ids[40];
      UPDATE weight_bands SET min_weight_kg = 55, max_weight_kg = 60 WHERE id = band_ids[41];
      UPDATE weight_bands SET min_weight_kg = 60, max_weight_kg = 65 WHERE id = band_ids[42];
      UPDATE weight_bands SET min_weight_kg = 65, max_weight_kg = 70 WHERE id = band_ids[43];
    END IF;
  END LOOP;
END $$;

-- UPS Express Saver (UPS-65UK): 7 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'UPS-65UK'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 7 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 25.01 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 30.01 WHERE id = band_ids[7];
    END IF;
  END LOOP;
END $$;

-- UPS Northern Ireland (UPS-NI): 15 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'UPS-NI'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 15 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 25.01 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 30.01 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 30.01, max_weight_kg = 35.01 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 35.01, max_weight_kg = 40.01 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 40.01, max_weight_kg = 45.01 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 45.01, max_weight_kg = 50.01 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 50.01, max_weight_kg = 55.01 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 55.01, max_weight_kg = 60.01 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 60.01, max_weight_kg = 65.01 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 65.01, max_weight_kg = 70.01 WHERE id = band_ids[15];
    END IF;
  END LOOP;
END $$;

-- UPS Standard Saturday (UPS11-SAT): 15 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'UPS11-SAT'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 15 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 2.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 10.01, max_weight_kg = 15.01 WHERE id = band_ids[4];
      UPDATE weight_bands SET min_weight_kg = 15.01, max_weight_kg = 20.01 WHERE id = band_ids[5];
      UPDATE weight_bands SET min_weight_kg = 20.01, max_weight_kg = 25.01 WHERE id = band_ids[6];
      UPDATE weight_bands SET min_weight_kg = 25.01, max_weight_kg = 30.01 WHERE id = band_ids[7];
      UPDATE weight_bands SET min_weight_kg = 30.01, max_weight_kg = 35.01 WHERE id = band_ids[8];
      UPDATE weight_bands SET min_weight_kg = 35.01, max_weight_kg = 40.01 WHERE id = band_ids[9];
      UPDATE weight_bands SET min_weight_kg = 40.01, max_weight_kg = 45.01 WHERE id = band_ids[10];
      UPDATE weight_bands SET min_weight_kg = 45.01, max_weight_kg = 50.01 WHERE id = band_ids[11];
      UPDATE weight_bands SET min_weight_kg = 50.01, max_weight_kg = 55.01 WHERE id = band_ids[12];
      UPDATE weight_bands SET min_weight_kg = 55.01, max_weight_kg = 60.01 WHERE id = band_ids[13];
      UPDATE weight_bands SET min_weight_kg = 60.01, max_weight_kg = 65.01 WHERE id = band_ids[14];
      UPDATE weight_bands SET min_weight_kg = 65.01, max_weight_kg = 70.01 WHERE id = band_ids[15];
    END IF;
  END LOOP;
END $$;

-- Yodel C2C Print in Store (YOD-C2CPS): 4 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'YOD-C2CPS'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 4 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 2.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[4];
    END IF;
  END LOOP;
END $$;

-- Yodel C2C (YODC2C): 4 bands
DO $$
DECLARE
  zone_rec RECORD;
  band_ids BIGINT[];
BEGIN
  FOR zone_rec IN
    SELECT z.id FROM zones z
    JOIN courier_services cs ON cs.id = z.courier_service_id
    WHERE cs.service_code = 'YODC2C'
  LOOP
    SELECT ARRAY_AGG(id ORDER BY min_weight_kg, max_weight_kg, id)
    INTO band_ids FROM weight_bands WHERE zone_id = zone_rec.id;
    IF band_ids IS NOT NULL AND ARRAY_LENGTH(band_ids, 1) = 4 THEN
      UPDATE weight_bands SET min_weight_kg = 0, max_weight_kg = 1.01 WHERE id = band_ids[1];
      UPDATE weight_bands SET min_weight_kg = 1.01, max_weight_kg = 2.01 WHERE id = band_ids[2];
      UPDATE weight_bands SET min_weight_kg = 2.01, max_weight_kg = 5.01 WHERE id = band_ids[3];
      UPDATE weight_bands SET min_weight_kg = 5.01, max_weight_kg = 10.01 WHERE id = band_ids[4];
    END IF;
  END LOOP;
END $$;
