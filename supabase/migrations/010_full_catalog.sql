-- ============================================================
-- MOMMEE BEE — Full Product Catalog (70 SKUs)
-- INSERT or UPDATE all products with correct names, prices, stock
-- Paste this in Supabase SQL Editor and Run
-- ============================================================

insert into products (code, name, category, unit, cost, price_detal, price_mayor, stock, min_stock, status) values

  -- NURSING COVERS
  ('NURSINGC-BEI',    'Nursing Cover Beige',          'Accessories', 'Piece', 14.80, 50.00, 50.00,  40, 0, 'Active'),
  ('NURSINGC-TERR',   'Nursing Cover Brown',          'Accessories', 'Piece', 14.80, 50.00, 50.00,  47, 0, 'Active'),
  ('NURSINGC-GR',     'Pañalera Gray',                'Accessories', 'Piece', 14.80, 50.00, 50.00,  46, 0, 'Active'),

  -- DIAPER BAGS
  ('DIAPER-BEAR',     'Pañalera Snuggle Bear',        'Accessories', 'Piece',  8.04, 38.00, 38.00,   5, 0, 'Active'),
  ('DIAPER-TULIP',    'Pañalera Olivia',              'Accessories', 'Piece',  8.04, 38.00, 38.00,  10, 0, 'Active'),
  ('DIAPER-DINO',     'Pañalera Oliver',              'Accessories', 'Piece',  8.04, 38.00, 38.00,  19, 0, 'Active'),
  ('DIAPER-CHER',     'Pañalera Cherry Bliss',        'Accessories', 'Piece',  8.04, 38.00, 38.00,  16, 0, 'Active'),

  -- SMALL BAGS
  ('SMALL-BABEAR',    'Small Bag Snuggle Bear',       'Accessories', 'Piece',  5.04, 25.00, 25.00,   5, 0, 'Active'),
  ('SMALL-BATULIP',   'Small Bag Olivia',             'Accessories', 'Piece',  5.04, 25.00, 25.00,  12, 0, 'Active'),
  ('SMALL-BADINO',    'Small Bag Oliver',             'Accessories', 'Piece',  5.04, 25.00, 25.00,  11, 0, 'Active'),
  ('SMALL-BACHERRY',  'Small Bag Cherry Bliss',       'Accessories', 'Piece',  5.04, 25.00, 25.00,  19, 0, 'Active'),

  -- BASKETS
  ('BASKET-BEAR',     'Basket Snuggle Bear',          'Accessories', 'Piece',  5.04, 25.00, 25.00,   2, 0, 'Active'),
  ('BASKET-TULIP',    'Basket Olivia',                'Accessories', 'Piece',  5.04, 25.00, 25.00,   5, 0, 'Active'),
  ('BASKET-DINO',     'Basket Oliver',                'Accessories', 'Piece',  5.04, 25.00, 25.00,   3, 0, 'Active'),
  ('BASKET-CHERRY',   'Basket Cherry Bliss',          'Accessories', 'Piece',  5.04, 25.00, 25.00,   2, 0, 'Active'),

  -- DUFFLE BAGS
  ('DUFFLE-BEAR',     'Duffle Bag Snuggle Bear',      'Accessories', 'Piece',  8.54, 50.00, 50.00,   6, 0, 'Active'),
  ('DUFFLE-TULIP',    'Duffle Bag Olivia',            'Accessories', 'Piece',  8.54, 50.00, 50.00,   4, 0, 'Active'),
  ('DUFFLE-DINO',     'Duffle Bag Oliver',            'Accessories', 'Piece',  8.54, 50.00, 50.00,   6, 0, 'Active'),
  ('DUFFLE-CHERRY',   'Duffle Bag Cherry Bliss',      'Accessories', 'Piece',  8.54, 50.00, 50.00,   6, 0, 'Active'),

  -- JOURNAL
  ('JOURNAL-BEE',     'Journal Bee Your Project',     'Accessories', 'Piece',  8.27, 35.00, 35.00, 250, 0, 'Active'),

  -- BELT BAGS
  ('BELTBAG-BLUE',    'Belt Bag Blue',                'Accessories', 'Piece',  8.00, 15.00, 15.00,   6, 0, 'Active'),
  ('BELTBAG-BLACK',   'Belt Bag Black',               'Accessories', 'Piece',  8.00, 15.00, 15.00,  11, 0, 'Active'),
  ('BELTBAG-BEIGE',   'Belt Bag Beige',               'Accessories', 'Piece',  8.00, 15.00, 15.00,   9, 0, 'Active'),
  ('BELTBAG-GRAY',    'Belt Bag Gray',                'Accessories', 'Piece',  8.00, 15.00, 15.00,  14, 0, 'Active'),
  ('BELTBAG-GREEN',   'Belt Bag Green',               'Accessories', 'Piece',  8.00, 15.00, 15.00,   6, 0, 'Active'),

  -- LEGGINS
  ('LEGGINS-BEI S',   'Leggins Beige S',              'Clothing',    'Piece',  8.60, 35.00, 35.00,  14, 0, 'Active'),
  ('LEGGINS-BEI M',   'Leggins Beige M',              'Clothing',    'Piece',  8.60, 35.00, 35.00,  10, 0, 'Active'),
  ('LEGGINS-BEI L',   'Leggins Beige L',              'Clothing',    'Piece',  8.60, 35.00, 35.00,   3, 0, 'Active'),
  ('LEGGINS-BROWN S', 'Leggins Brown S',              'Clothing',    'Piece',  8.60, 35.00, 35.00,  12, 0, 'Active'),
  ('LEGGINS-BROWN M', 'Leggins Brown M',              'Clothing',    'Piece',  8.60, 35.00, 35.00,   7, 0, 'Active'),
  ('LEGGINS-BROWN L', 'Leggins Brown L',              'Clothing',    'Piece',  8.60, 35.00, 35.00,   1, 0, 'Active'),
  ('LEGGINS-BLACK S', 'Leggins Black S',              'Clothing',    'Piece',  8.60, 35.00, 35.00,   6, 0, 'Active'),
  ('LEGGINS-BLACK M', 'Leggins Black M',              'Clothing',    'Piece',  8.60, 35.00, 35.00,   7, 0, 'Active'),
  ('LEGGINS-BLACK L', 'Leggins Black L',              'Clothing',    'Piece',  8.60, 35.00, 35.00,   2, 0, 'Active'),

  -- SHORTS
  ('SHORTS-BEIGE S',  'Shorts Beige S',               'Clothing',    'Piece',  6.69, 20.00, 20.00,   9, 0, 'Active'),
  ('SHORTS-BEIGE M',  'Shorts Beige M',               'Clothing',    'Piece',  6.69, 20.00, 20.00,   8, 0, 'Active'),
  ('SHORTS-BEIGE L',  'Shorts Beige L',               'Clothing',    'Piece',  6.69, 20.00, 20.00,   4, 0, 'Active'),
  ('SHORTS-BLACK S',  'Shorts Black S',               'Clothing',    'Piece',  6.69, 20.00, 20.00,   7, 0, 'Active'),
  ('SHORTS-BLACK M',  'Shorts Black M',               'Clothing',    'Piece',  6.69, 20.00, 20.00,   9, 0, 'Active'),
  ('SHORTS-BLACK L',  'Shorts Black L',               'Clothing',    'Piece',  6.69, 20.00, 20.00,   3, 0, 'Active'),
  ('SHORTS-GRAY S',   'Shorts Gray S',                'Clothing',    'Piece',  6.69, 20.00, 20.00,   8, 0, 'Active'),
  ('SHORTS-GRAY M',   'Shorts Gray M',                'Clothing',    'Piece',  6.69, 20.00, 20.00,  10, 0, 'Active'),
  ('SHORTS-GRAY L',   'Shorts Gray L',                'Clothing',    'Piece',  6.69, 20.00, 20.00,   4, 0, 'Active'),

  -- BODYSUITS
  ('ONESIE-RED S',    'Bodysuit Red S',               'Clothing',    'Piece', 10.69, 30.00, 30.00,   4, 0, 'Active'),
  ('ONESIE-RED M',    'Bodysuit Red M',               'Clothing',    'Piece', 10.69, 30.00, 30.00,   2, 0, 'Active'),
  ('ONESIE-BLACK S',  'Bodysuit Black S',             'Clothing',    'Piece', 10.69, 30.00, 30.00,   6, 0, 'Active'),
  ('ONESIE-BLACK M',  'Bodysuit Black M',             'Clothing',    'Piece', 10.69, 30.00, 30.00,   3, 0, 'Active'),
  ('ONESIE-COCOA S',  'Bodysuit Cocoa S',             'Clothing',    'Piece', 10.69, 30.00, 30.00,   1, 0, 'Active'),
  ('ONESIE-COCOA M',  'Bodysuit Cocoa M',             'Clothing',    'Piece', 10.69, 30.00, 30.00,   1, 0, 'Active'),

  -- LONG SLEEVE BRAS
  ('LONGBRA-BLACK S', 'Long Sleeve Bra Black S',      'Clothing',    'Piece',  6.89, 25.00, 25.00,  12, 0, 'Active'),
  ('LONGBRA-BLACK M', 'Long Sleeve Bra Black M',      'Clothing',    'Piece',  6.89, 25.00, 25.00,   9, 0, 'Active'),
  ('LONGBRA-BLACK L', 'Long Sleeve Bra Black L',      'Clothing',    'Piece',  6.89, 25.00, 25.00,   3, 0, 'Active'),
  ('LONGBRA-WHITE S', 'Long Sleeve Bra White S',      'Clothing',    'Piece',  6.89, 25.00, 25.00,   7, 0, 'Active'),
  ('LONGBRA-WHITE M', 'Long Sleeve Bra White M',      'Clothing',    'Piece',  6.89, 25.00, 25.00,  10, 0, 'Active'),
  ('LONGBRA-WHITE L', 'Long Sleeve Bra White L',      'Clothing',    'Piece',  6.89, 25.00, 25.00,   4, 0, 'Active'),
  ('LONGBRA-BROWN S', 'Long Sleeve Bra Brown S',      'Clothing',    'Piece',  6.89, 25.00, 25.00,   6, 0, 'Active'),
  ('LONGBRA-BROWN M', 'Long Sleeve Bra Brown M',      'Clothing',    'Piece',  6.89, 25.00, 25.00,   7, 0, 'Active'),
  ('LONGBRA-BROWN L', 'Long Sleeve Bra Brown L',      'Clothing',    'Piece',  6.89, 25.00, 25.00,   3, 0, 'Active'),

  -- SPORTS BRAS
  ('SPORTBRA-BLACK S','Sports Bra Black S',           'Clothing',    'Piece',  7.00, 25.00, 25.00,  15, 0, 'Active'),
  ('SPORTBRA-BLACK M','Sports Bra Black M',           'Clothing',    'Piece',  7.00, 25.00, 25.00,   4, 0, 'Active'),
  ('SPORTBRA-BLACK L','Sports Bra Black L',           'Clothing',    'Piece',  7.00, 25.00, 25.00,   1, 0, 'Active'),
  ('SPORTBRA-BROWN S','Sports Bra Brown S',           'Clothing',    'Piece',  7.00, 25.00, 25.00,   7, 0, 'Active'),
  ('SPORTBRA-BROWN M','Sports Bra Brown M',           'Clothing',    'Piece',  7.00, 25.00, 25.00,   5, 0, 'Active'),
  ('SPORTBRA-BROWN L','Sports Bra Brown L',           'Clothing',    'Piece',  7.00, 25.00, 25.00,   2, 0, 'Active'),

  -- JACKETS
  ('JACKET BLACK S',  'Jacket Black S',               'Clothing',    'Piece',  7.00, 25.00, 25.00,   6, 0, 'Active'),
  ('JACKET BLACK M',  'Jacket Black M',               'Clothing',    'Piece',  7.00, 25.00, 25.00,   2, 0, 'Active'),
  ('JACKET BLACK L',  'Jacket Black L',               'Clothing',    'Piece',  7.00, 25.00, 25.00,   2, 0, 'Active'),
  ('JACKET BROWN S',  'Jacket Brown S',               'Clothing',    'Piece',  7.00, 25.00, 25.00,   4, 0, 'Active'),
  ('JACKET BROWN M',  'Jacket Brown M',               'Clothing',    'Piece',  7.00, 25.00, 25.00,   5, 0, 'Active'),
  ('JACKET BROWN L',  'Jacket Brown L',               'Clothing',    'Piece',  7.00, 25.00, 25.00,   6, 0, 'Active')

on conflict (code) do update set
  name        = excluded.name,
  category    = excluded.category,
  cost        = excluded.cost,
  price_detal = excluded.price_detal,
  price_mayor = excluded.price_mayor,
  stock       = excluded.stock,
  status      = excluded.status;
