-- ===========================================
-- Migration: 006_product_images_bucket
-- Cria bucket de Storage e RLS para imagens de produto
-- ===========================================

-- 1) Bucket (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,                    -- leitura pública
  524288,                  -- 512KB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2) Policies: admin autenticado pode fazer upload/delete
-- As policies padrões do Storage são: SELECT público se bucket.public=true

-- INSERT: apenas admin (auth.uid() presente em admin_profiles com active=true)
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
CREATE POLICY "Admin upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- UPDATE
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
CREATE POLICY "Admin update product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- DELETE
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
CREATE POLICY "Admin delete product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

-- 3) Tabela de controle (já existe em 001; nada a fazer)
-- Apenas garantindo que a coluna path aceita URLs absolutas OU paths
DO $$ BEGIN
  -- nada
  NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT 'product-images bucket + RLS ok' AS result;