-- Up Migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE customer_category AS ENUM ('hospede', 'visitante', 'dayuse', 'passaporte');
CREATE TYPE booking_status AS ENUM ('pendente', 'pago', 'cancelado');

-- Hotels
CREATE TABLE hotels (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  city            TEXT NOT NULL DEFAULT 'Socorro, SP',
  address         TEXT,
  whatsapp_number TEXT NOT NULL,
  email           TEXT,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activities
CREATE TABLE activities (
  id              TEXT PRIMARY KEY,
  hotel_id        TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  duration_min    INTEGER NOT NULL CHECK (duration_min > 0),
  capacity        INTEGER NOT NULL CHECK (capacity > 0),
  active          BOOLEAN NOT NULL DEFAULT true,
  photo_url       TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  weekdays        SMALLINT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_hotel_id ON activities(hotel_id);

-- Activity time slots
CREATE TABLE activity_times (
  id              SERIAL PRIMARY KEY,
  activity_id     TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  time_of_day     TIME NOT NULL,
  UNIQUE (activity_id, time_of_day)
);
CREATE INDEX idx_activity_times_activity_id ON activity_times(activity_id);

-- Prices per category
CREATE TABLE activity_prices (
  activity_id     TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  category        customer_category NOT NULL,
  price_cents     INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  PRIMARY KEY (activity_id, category)
);

-- Admin users
CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'admin',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings / reservas
CREATE TABLE bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_code     TEXT NOT NULL UNIQUE,
  hotel_id         TEXT NOT NULL REFERENCES hotels(id),
  activity_id      TEXT NOT NULL REFERENCES activities(id),
  activity_name    TEXT NOT NULL,
  hotel_name       TEXT NOT NULL,
  category         customer_category NOT NULL,
  booking_date     DATE NOT NULL,
  booking_time     TIME NOT NULL,
  qty              INTEGER NOT NULL CHECK (qty > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  total_cents      INTEGER NOT NULL CHECK (total_cents >= 0),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT,
  status           booking_status NOT NULL DEFAULT 'pendente',
  used             BOOLEAN NOT NULL DEFAULT false,
  used_at          TIMESTAMPTZ,
  payment_ref      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_slot ON bookings(activity_id, booking_date, booking_time);
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_voucher_code ON bookings(voucher_code);

-- WhatsApp notification log
CREATE TABLE whatsapp_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
  to_number       TEXT NOT NULL,
  hotel_name      TEXT NOT NULL,
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'enviado',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment attempts / mock Pix charges
CREATE TABLE payment_charges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT NOT NULL DEFAULT 'mock',
  provider_ref      TEXT,
  amount_cents      INTEGER NOT NULL,
  pix_copy_paste    TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  cart_snapshot     JSONB NOT NULL,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_email    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at       TIMESTAMPTZ
);

-- Down Migration

DROP TABLE IF EXISTS payment_charges;
DROP TABLE IF EXISTS whatsapp_log;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS activity_prices;
DROP TABLE IF EXISTS activity_times;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS hotels;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS customer_category;
