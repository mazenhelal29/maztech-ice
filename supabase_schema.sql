-- =============================================
-- ICE CREAM FACTORY ERP - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ USERS ============
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ RAW MATERIALS ============
CREATE TABLE IF NOT EXISTS public.raw_materials (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  unit           TEXT NOT NULL DEFAULT 'كجم',
  quantity       NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit  NUMERIC NOT NULL DEFAULT 0,
  min_quantity   NUMERIC NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  selling_price  NUMERIC NOT NULL DEFAULT 0,
  quantity       NUMERIC NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============ RECIPES ============
CREATE TABLE IF NOT EXISTS public.recipes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE TABLE IF NOT EXISTS public.recipe_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id        UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  raw_material_id  UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity         NUMERIC NOT NULL DEFAULT 0
);

-- ============ PRODUCTIONS ============
CREATE TABLE IF NOT EXISTS public.productions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id),
  quantity    NUMERIC NOT NULL,
  total_cost  NUMERIC NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS public.customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SALES ============
CREATE TABLE IF NOT EXISTS public.sales (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID REFERENCES public.customers(id),
  total        NUMERIC NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id     UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id),
  quantity    NUMERIC NOT NULL,
  price       NUMERIC NOT NULL
);

-- ============ EXPENSES ============
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  amount      NUMERIC NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_raw_materials_quantity ON public.raw_materials(quantity);
CREATE INDEX IF NOT EXISTS idx_productions_product_id ON public.productions(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe_id ON public.recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);

-- ============ RLS POLICIES ============
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses      ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write all tables
CREATE POLICY "authenticated_all" ON public.users         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.raw_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.products      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.recipes       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.recipe_items  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.productions   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.customers     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.sales         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.sale_items    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.expenses      FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.raw_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- ============ TRIGGER: Auto-create user profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RPC: Handle Production (Atomic) ============
CREATE OR REPLACE FUNCTION public.handle_production(
  p_product_id UUID,
  p_quantity NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_total_cost NUMERIC := 0;
  v_item RECORD;
  v_recipe_id UUID;
  v_material_qty NUMERIC;
BEGIN
  -- 1. Get recipe
  SELECT id INTO v_recipe_id FROM public.recipes WHERE product_id = p_product_id;
  IF v_recipe_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'لا توجد وصفة لهذا المنتج');
  END IF;

  -- 2. Check and deduct materials, calculate cost
  FOR v_item IN (SELECT raw_material_id, quantity FROM public.recipe_items WHERE recipe_id = v_recipe_id) LOOP
    SELECT quantity INTO v_material_qty FROM public.raw_materials WHERE id = v_item.raw_material_id;
    IF v_material_qty < (v_item.quantity * p_quantity) THEN
       RETURN json_build_object('success', false, 'error', 'المخزون غير كافٍ لواحدة أو أكثر من المواد الخام');
    END IF;
    
    -- Update material qty
    UPDATE public.raw_materials 
    SET quantity = quantity - (v_item.quantity * p_quantity)
    WHERE id = v_item.raw_material_id;

    -- Add to total cost
    v_total_cost := v_total_cost + (v_item.quantity * p_quantity * (SELECT cost_per_unit FROM public.raw_materials WHERE id = v_item.raw_material_id));
  END LOOP;

  -- 3. Increase product qty
  UPDATE public.products SET quantity = quantity + p_quantity WHERE id = p_product_id;

  -- 4. Record production
  INSERT INTO public.productions (product_id, quantity, total_cost)
  VALUES (p_product_id, p_quantity, v_total_cost);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ============ RPC: Handle Sale (Atomic) ============
CREATE OR REPLACE FUNCTION public.handle_sale(
  p_customer_id UUID,
  p_items JSONB
) RETURNS JSON AS $$
DECLARE
  v_sale_id UUID;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_prod_qty NUMERIC;
BEGIN
  -- 1. Check stock for all items and calc total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT quantity INTO v_prod_qty FROM public.products WHERE id = (v_item->>'product_id')::UUID;
    IF v_prod_qty < (v_item->>'quantity')::NUMERIC THEN
      RETURN json_build_object('success', false, 'error', 'المخزون غير كافٍ للمنتج: ' || (SELECT name FROM public.products WHERE id = (v_item->>'product_id')::UUID));
    END IF;
    v_total := v_total + ((v_item->>'quantity')::NUMERIC * (v_item->>'price')::NUMERIC);
  END LOOP;

  -- 2. Create Sale
  INSERT INTO public.sales (customer_id, total)
  VALUES (p_customer_id, v_total)
  RETURNING id INTO v_sale_id;

  -- 3. Create Sale Items and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.sale_items (sale_id, product_id, quantity, price)
    VALUES (v_sale_id, (v_item->>'product_id')::UUID, (v_item->>'quantity')::NUMERIC, (v_item->>'price')::NUMERIC);

    UPDATE public.products 
    SET quantity = quantity - (v_item->>'quantity')::NUMERIC 
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  RETURN json_build_object('success', true, 'sale_id', v_sale_id);
END;
$$ LANGUAGE plpgsql;
