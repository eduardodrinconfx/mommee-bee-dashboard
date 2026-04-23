-- ============================================================
-- MOMMEE BEE — Stock Update (real inventory counts)
-- Paste this in Supabase SQL Editor and Run
-- ============================================================

update products set stock = 200 where code = 'NURSINGC-BEI';
update products set stock = 50  where code = 'NURSINGC-BRO';
update products set stock = 50  where code = 'NURSINGC-GR';

update products set stock = 5   where code = 'DIAPER-BEAR';
update products set stock = 10  where code = 'DIAPER-TULIP';
update products set stock = 19  where code = 'DIAPER-DINO';
update products set stock = 16  where code = 'DIAPER-CHER';

update products set stock = 5   where code = 'SMALL-BABEAR';
update products set stock = 12  where code = 'SMALL-BATULIP';
update products set stock = 11  where code = 'SMALL-BADINO';
update products set stock = 19  where code = 'SMALL-BACHERRY';

update products set stock = 2   where code = 'BASKET-BEAR';
update products set stock = 5   where code = 'BASKET-TULIP';
update products set stock = 3   where code = 'BASKET-DINO';
update products set stock = 2   where code = 'BASKET-CHERRY';

update products set stock = 6   where code = 'DUFFLE-BEAR';
update products set stock = 4   where code = 'DUFFLE-TULIP';
update products set stock = 6   where code = 'DUFFLE-DINO';
update products set stock = 6   where code = 'DUFFLE-CHERRY';

update products set stock = 250 where code = 'JOURNAL-BEE';

update products set stock = 6   where code = 'BELTBAG-BLUE';
update products set stock = 11  where code = 'BELTBAG-BLACK';
update products set stock = 9   where code = 'BELTBAG-BEIGE';
update products set stock = 14  where code = 'BELTBAG-GRAY';
update products set stock = 6   where code = 'BELTBAG-GREEN';

update products set stock = 24  where code = 'LEGGINS-BEI';
update products set stock = 24  where code = 'LEGGINS-BROWN';
update products set stock = 24  where code = 'LEGGINS-BLACK';

update products set stock = 24  where code = 'SHORTS-BEIGE';
update products set stock = 24  where code = 'SHORTS-BLACK';
update products set stock = 24  where code = 'SHORTS-GRAY';

update products set stock = 9   where code = 'ONESIE-RED';
update products set stock = 9   where code = 'ONESIE-BLACK';
update products set stock = 9   where code = 'ONESIE-COCOA';

update products set stock = 23  where code = 'LONGBRA-BLACK';
update products set stock = 23  where code = 'LONGBRA-WHITE';
update products set stock = 23  where code = 'LONGBRA-BROWN';

update products set stock = 23  where code = 'SPORTBRA-BLACK';
update products set stock = 23  where code = 'SPORTBRA-BROWN';
