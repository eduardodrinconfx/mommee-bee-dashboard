-- ============================================================
-- MOMMEE BEE — Product Catalog (39 SKUs)
-- Paste this in Supabase SQL Editor and Run
-- ============================================================

insert into products (code, name, category, unit, cost, price_detal, price_mayor, stock, min_stock, status) values
  -- Nursing Covers
  ('NURSINGC-BEI',   'Nursing Cover Beige',       'Accessories', 'Piece', 14.80, 35.00, 35.00, 0, 0, 'Active'),
  ('NURSINGC-BRO',   'Nursing Cover Brown',        'Accessories', 'Piece', 14.80, 35.00, 35.00, 0, 0, 'Active'),
  ('NURSINGC-GR',    'Pañalera Gray',              'Accessories', 'Piece', 14.80, 35.00, 35.00, 0, 0, 'Active'),

  -- Diaper Bags
  ('DIAPER-BEAR',    'Pañalera Snuggle Bear',      'Accessories', 'Piece',  8.04, 35.00, 35.00, 0, 0, 'Active'),
  ('DIAPER-TULIP',   'Pañalera Olivia',            'Accessories', 'Piece',  8.04, 35.00, 35.00, 0, 0, 'Active'),
  ('DIAPER-DINO',    'Pañalera Oliver',            'Accessories', 'Piece',  8.04, 35.00, 35.00, 0, 0, 'Active'),
  ('DIAPER-CHER',    'Pañalera Cherry Bliss',      'Accessories', 'Piece',  8.04, 35.00, 35.00, 0, 0, 'Active'),

  -- Small Bags
  ('SMALL-BABEAR',   'Small Bag Snuggle Bear',     'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),
  ('SMALL-BATULIP',  'Small Bag Olivia',           'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),
  ('SMALL-BADINO',   'Small Bag Oliver',           'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),
  ('SMALL-BACHERRY', 'Small Bag Cherry Bliss',     'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),

  -- Baskets
  ('BASKET-BEAR',    'Basket Snuggle Bear',        'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),
  ('BASKET-TULIP',   'Basket Olivia',              'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),
  ('BASKET-DINO',    'Basket Oliver',              'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),
  ('BASKET-CHERRY',  'Basket Cherry Bliss',        'Accessories', 'Piece',  5.04, 20.00, 20.00, 0, 0, 'Active'),

  -- Duffle Bags
  ('DUFFLE-BEAR',    'Duffle Bag Snuggle Bear',    'Accessories', 'Piece',  8.54, 40.00, 40.00, 0, 0, 'Active'),
  ('DUFFLE-TULIP',   'Duffle Bag Olivia',          'Accessories', 'Piece',  8.54, 40.00, 40.00, 0, 0, 'Active'),
  ('DUFFLE-DINO',    'Duffle Bag Oliver',          'Accessories', 'Piece',  8.54, 40.00, 40.00, 0, 0, 'Active'),
  ('DUFFLE-CHERRY',  'Duffle Bag Cherry Bliss',    'Accessories', 'Piece',  8.54, 40.00, 40.00, 0, 0, 'Active'),

  -- Journal
  ('JOURNAL-BEE',    'Journal Bee Your Project',   'Accessories', 'Piece',  8.27, 25.00, 25.00, 0, 0, 'Active'),

  -- Belt Bags
  ('BELTBAG-BLUE',   'Belt Bag Blue',              'Accessories', 'Piece',  8.00, 15.00, 15.00, 0, 0, 'Active'),
  ('BELTBAG-BLACK',  'Belt Bag Black',             'Accessories', 'Piece',  8.00, 15.00, 15.00, 0, 0, 'Active'),
  ('BELTBAG-BEIGE',  'Belt Bag Beige',             'Accessories', 'Piece',  8.00, 15.00, 15.00, 0, 0, 'Active'),
  ('BELTBAG-GRAY',   'Belt Bag Gray',              'Accessories', 'Piece',  8.00, 15.00, 15.00, 0, 0, 'Active'),
  ('BELTBAG-GREEN',  'Belt Bag Green',             'Accessories', 'Piece',  8.00, 15.00, 15.00, 0, 0, 'Active'),

  -- Leggins
  ('LEGGINS-BEI',    'Leggins Beige',              'Clothing',    'Piece',  8.60, 35.00, 35.00, 0, 0, 'Active'),
  ('LEGGINS-BROWN',  'Leggins Brown',              'Clothing',    'Piece',  8.60, 35.00, 35.00, 0, 0, 'Active'),
  ('LEGGINS-BLACK',  'Leggins Black',              'Clothing',    'Piece',  8.60, 35.00, 35.00, 0, 0, 'Active'),

  -- Shorts
  ('SHORTS-BEIGE',   'Shorts Beige',               'Clothing',    'Piece',  6.69, 25.00, 25.00, 0, 0, 'Active'),
  ('SHORTS-BLACK',   'Shorts Black',               'Clothing',    'Piece',  6.69, 25.00, 25.00, 0, 0, 'Active'),
  ('SHORTS-GRAY',    'Shorts Gray',                'Clothing',    'Piece',  6.69, 25.00, 25.00, 0, 0, 'Active'),

  -- Bodysuits
  ('ONESIE-RED',     'Bodysuit Red',               'Clothing',    'Piece', 10.69, 45.00, 45.00, 0, 0, 'Active'),
  ('ONESIE-BLACK',   'Bodysuit Black',             'Clothing',    'Piece', 10.69, 45.00, 45.00, 0, 0, 'Active'),
  ('ONESIE-COCOA',   'Bodysuit Cocoa',             'Clothing',    'Piece', 10.69, 45.00, 45.00, 0, 0, 'Active'),

  -- Long Sleeve Bras
  ('LONGBRA-BLACK',  'Long Sleeve Bra Black',      'Clothing',    'Piece',  6.89, 25.00, 25.00, 0, 0, 'Active'),
  ('LONGBRA-WHITE',  'Long Sleeve Bra White',      'Clothing',    'Piece',  6.89, 25.00, 25.00, 0, 0, 'Active'),
  ('LONGBRA-BROWN',  'Long Sleeve Bra Brown',      'Clothing',    'Piece',  6.89, 25.00, 25.00, 0, 0, 'Active'),

  -- Sports Bras
  ('SPORTBRA-BLACK', 'Sports Bra Black',           'Clothing',    'Piece',  7.00, 25.00, 25.00, 0, 0, 'Active'),
  ('SPORTBRA-BROWN', 'Sports Bra Brown',           'Clothing',    'Piece',  7.00, 25.00, 25.00, 0, 0, 'Active')

on conflict (code) do nothing;
