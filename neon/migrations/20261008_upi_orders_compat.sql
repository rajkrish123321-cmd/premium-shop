DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE public.orders
      ALTER COLUMN razorpay_order_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE public.orders
      ALTER COLUMN razorpay_payment_id DROP NOT NULL;
  END IF;
END
$$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payee_vpa text NOT NULL DEFAULT '9507004532@ibl';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text;

UPDATE public.orders
SET payment_status = CASE
  WHEN status IN ('paid', 'awaiting_verification', 'failed', 'cancelled') THEN status
  ELSE 'pending'
END
WHERE payment_status IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET DEFAULT 'pending',
  ALTER COLUMN payment_status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS flagged_for_refund boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('pending', 'awaiting_verification', 'paid', 'failed', 'cancelled'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx
  ON public.orders (user_id, created_at DESC);