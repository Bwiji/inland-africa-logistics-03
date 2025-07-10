-- Add fuel reserve tank tracking table
CREATE TABLE IF NOT EXISTS fuel_reserve_tank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  current_level DECIMAL(10,2) NOT NULL DEFAULT 0, -- Current fuel level in liters
  capacity DECIMAL(10,2) NOT NULL DEFAULT 30000, -- Tank capacity (30,000L)
  last_refill_date TIMESTAMP WITH TIME ZONE,
  last_refill_amount DECIMAL(10,2),
  cost_per_liter DECIMAL(10,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add compliance tracking table for NTSA, Insurance, and TGL licenses
CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  compliance_type VARCHAR(50) NOT NULL, -- 'NTSA', 'Insurance', 'TGL'
  license_number VARCHAR(100),
  renewal_date DATE NOT NULL,
  expiry_date DATE NOT NULL, -- Calculated as renewal_date + 1 year
  cost DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'expiring_soon'
  notes TEXT,
  document_url TEXT, -- For storing compliance document images/PDFs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance fuel_records table with additional tracking fields
ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS odometer_reading INTEGER,
ADD COLUMN IF NOT EXISTS fuel_efficiency DECIMAL(6,2), -- km per liter
ADD COLUMN IF NOT EXISTS station_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS attendant_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);

-- Add maintenance items table for detailed tracking
CREATE TABLE IF NOT EXISTS maintenance_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_id UUID NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  item_category VARCHAR(100), -- 'Engine', 'Brakes', 'Tires', 'Electrical', etc.
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  supplier VARCHAR(200),
  part_number VARCHAR(100),
  warranty_period_months INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add fuel consumption summary table for better reporting
CREATE TABLE IF NOT EXISTS fuel_consumption_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_fuel_consumed DECIMAL(10,2) NOT NULL, -- liters
  total_cost DECIMAL(10,2) NOT NULL,
  distance_covered INTEGER, -- kilometers
  average_efficiency DECIMAL(6,2), -- km per liter
  number_of_refills INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(truck_id, summary_date)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_compliance_records_truck_id ON compliance_records(truck_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_type ON compliance_records(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_records_expiry ON compliance_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_items_maintenance_id ON maintenance_items(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_truck_date ON fuel_consumption_summary(truck_id, summary_date);

-- Add triggers to automatically calculate expiry dates and status
CREATE OR REPLACE FUNCTION update_compliance_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate expiry date as renewal date + 1 year
  NEW.expiry_date = NEW.renewal_date + INTERVAL '1 year';
  
  -- Update status based on expiry date
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status = 'expired';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.status = 'expiring_soon';
  ELSE
    NEW.status = 'active';
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_expiry
  BEFORE INSERT OR UPDATE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION update_compliance_expiry();

-- Add trigger to update maintenance cost when items are added/updated
CREATE OR REPLACE FUNCTION update_maintenance_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the maintenance record's total cost
  UPDATE maintenance 
  SET cost = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM maintenance_items 
    WHERE maintenance_id = COALESCE(NEW.maintenance_id, OLD.maintenance_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.maintenance_id, OLD.maintenance_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_cost_insert
  AFTER INSERT ON maintenance_items
  FOR EACH ROW EXECUTE FUNCTION update_maintenance_total_cost();

CREATE TRIGGER trigger_update_maintenance_cost_update
  AFTER UPDATE ON maintenance_items
  FOR EACH ROW EXECUTE FUNCTION update_maintenance_total_cost();

CREATE TRIGGER trigger_update_maintenance_cost_delete
  AFTER DELETE ON maintenance_items
  FOR EACH ROW EXECUTE FUNCTION update_maintenance_total_cost();

-- Add RLS policies
ALTER TABLE fuel_reserve_tank ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_consumption_summary ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and modify all records
CREATE POLICY "Enable read access for authenticated users" ON fuel_reserve_tank
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON fuel_reserve_tank
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON fuel_reserve_tank
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON compliance_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON compliance_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON compliance_records
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON compliance_records
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON maintenance_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON maintenance_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON maintenance_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON maintenance_items
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON fuel_consumption_summary
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON fuel_consumption_summary
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON fuel_consumption_summary
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert initial fuel reserve tank record
INSERT INTO fuel_reserve_tank (current_level, capacity, cost_per_liter) 
VALUES (15000, 30000, 165.00) -- Starting with half tank, KSh 165 per liter
ON CONFLICT DO NOTHING;

-- Add some sample compliance records for existing trucks (if any)
INSERT INTO compliance_records (truck_id, compliance_type, license_number, renewal_date, cost)
SELECT 
  t.id,
  'NTSA',
  'NTSA' || LPAD(EXTRACT(YEAR FROM NOW())::TEXT, 4, '0') || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
  CURRENT_DATE - INTERVAL '6 months',
  25000
FROM trucks t
ON CONFLICT DO NOTHING;

INSERT INTO compliance_records (truck_id, compliance_type, license_number, renewal_date, cost)
SELECT 
  t.id,
  'Insurance',
  'INS' || LPAD(EXTRACT(YEAR FROM NOW())::TEXT, 4, '0') || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
  CURRENT_DATE - INTERVAL '3 months',
  45000
FROM trucks t
ON CONFLICT DO NOTHING;

INSERT INTO compliance_records (truck_id, compliance_type, license_number, renewal_date, cost)
SELECT 
  t.id,
  'TGL',
  'TGL' || LPAD(EXTRACT(YEAR FROM NOW())::TEXT, 4, '0') || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
  CURRENT_DATE - INTERVAL '8 months',
  15000
FROM trucks t
ON CONFLICT DO NOTHING;