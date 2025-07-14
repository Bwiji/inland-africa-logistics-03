-- Create reserve fuel tank table for tracking tank levels and refills
CREATE TABLE reserve_fuel_tank (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    current_level numeric NOT NULL DEFAULT 0,
    capacity numeric NOT NULL DEFAULT 30000,
    last_refill_date date,
    last_refill_amount numeric,
    cost_per_liter numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create refill history table
CREATE TABLE tank_refill_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tank_id uuid REFERENCES reserve_fuel_tank(id) NOT NULL,
    refill_amount numeric NOT NULL,
    cost_per_liter numeric NOT NULL,
    total_cost numeric NOT NULL,
    refill_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- Insert initial reserve tank record
INSERT INTO reserve_fuel_tank (current_level, capacity, last_refill_date, last_refill_amount, cost_per_liter)
VALUES (15000, 30000, '2024-07-08', 10000, 165);

-- Enable RLS
ALTER TABLE reserve_fuel_tank ENABLE ROW LEVEL SECURITY;
ALTER TABLE tank_refill_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users" ON reserve_fuel_tank
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON reserve_fuel_tank
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users" ON tank_refill_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON tank_refill_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update tank level after refill
CREATE OR REPLACE FUNCTION update_tank_level_after_refill()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reserve_fuel_tank 
    SET 
        current_level = current_level + NEW.refill_amount,
        last_refill_date = NEW.refill_date,
        last_refill_amount = NEW.refill_amount,
        cost_per_liter = NEW.cost_per_liter,
        updated_at = NOW()
    WHERE id = NEW.tank_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_tank_level
    AFTER INSERT ON tank_refill_history
    FOR EACH ROW
    EXECUTE FUNCTION update_tank_level_after_refill();

-- Create function to decrease tank level after fuel dispensing
CREATE OR REPLACE FUNCTION decrease_tank_level_after_dispensing()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrease tank level if fuel station is "Company Reserve Tank"
    IF NEW.fuel_station = 'Company Reserve Tank' THEN
        UPDATE reserve_fuel_tank 
        SET 
            current_level = current_level - NEW.liters,
            updated_at = NOW()
        WHERE id = (SELECT id FROM reserve_fuel_tank LIMIT 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for fuel dispensing
CREATE TRIGGER trigger_decrease_tank_level
    AFTER INSERT ON fuel_records
    FOR EACH ROW
    EXECUTE FUNCTION decrease_tank_level_after_dispensing();