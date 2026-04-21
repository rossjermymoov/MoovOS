-- 010_seed_customers.sql
-- Seed 119 MOOV customer accounts from production export (April 2026)
-- Ordered by account number.

-- registered_address is superseded by structured address fields; make it nullable
ALTER TABLE customers ALTER COLUMN registered_address DROP NOT NULL;

INSERT INTO customers (
  account_number, business_name, primary_email, phone_number,
  address_line_1, address_line_2, city, county, postcode, country,
  company_reg_number, vat_number, company_type,
  billing_cycle, payment_terms_days,
  accounts_email, eori_number, ioss_number
) VALUES
  ('MOOV-0001', 'Seedball Limited', 'emily@seedball.co.uk', '2088025565', 'Joanna Cottage', 'Florentia Clothing Village', 'London', NULL, 'N4 1TD', 'United Kingdom', '10967666', 'GB279336268', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0004', 'I Luv Designer', 'saqib@iluvdesigner.com', '7885731147', '893 Carlisle Road', NULL, 'Bradford', NULL, 'BD8 8BY', 'United Kingdom', '14760620', 'GB455657362', 'limited_company', 'weekly', 7, 'saqib@iluvdesigner.com', NULL, NULL),
  ('MOOV-0007', 'Capatex Limited', 'neil.pike@capatex.com', '1159786111', '127 Northgate', 'New Basford', 'Nottingham', NULL, 'NG7 7FZ', 'United Kingdom', '03025039', 'GB648100065', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0008', 'Trident Pumps', 'pauldodd58@hotmail.com', '7778276692', '15 Hudson Avenue', NULL, 'Norwich', NULL, 'NR14 8GB', 'United Kingdom', '13595655', 'GB380403422', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0009', 'Tribal Society', 'jamesimorris43@gmail.com', '7812084672', '35 Aberdale Road', NULL, 'Liverpool', NULL, 'L13 5YE', 'United Kingdom', '11959669', 'GB382742773', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0010', 'Millvill Industrial Supplies Ltd', 'lee.revill@milvill.co.uk', '1142889884', 'Unit 23D Orgreave Crescent', NULL, 'Sheffield', NULL, 'S13 9NQ', 'United Kingdom', NULL, NULL, 'limited_company', 'weekly', 7, 'lee.revill@milvill.co.uk', NULL, NULL),
  ('MOOV-0012', 'Britalitez Ltd', 'admin@britalitez.com', '7940563313', 'Unit 713 C Street 3, Chapel Wood', 'Thorp Arch Estate', 'Wetherby', NULL, 'LS23 7FY', 'United Kingdom', '08728750', 'GB200982333', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0013', 'Code Nine UK Ltd', 'sales@codenineuk.com', '1773605844', 'Unit 6 Block 15', 'Amber Business Centre', 'Riddings', NULL, 'DE55 4BR', 'United Kingdom', '03842271', 'GB996379148', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0015', 'Green Footprint Services Ltd', 'mick@greenfootprintservices.co.uk', '01268330220', 'Bailin Dist Parl', 'Harvey Road', 'Basildon', NULL, 'SS13 1YY', 'United Kingdom', '10507147', 'GB268100126', 'limited_company', 'weekly', 7, 'mick@greenfootprintservices.co.uk', NULL, NULL),
  ('MOOV-0016', 'Norfolk Saw Services', 'kane@norfolksawservices.co.uk', '1603898695', 'Unit 7 Whiffler Road Ind Est', NULL, 'Norwich', NULL, 'NR3 2AW', 'United Kingdom', NULL, 'GB510968446', 'sole_trader', 'weekly', 7, 'kane@norfolksawservices.co.uk', NULL, NULL),
  ('MOOV-0017', 'Rilco Electrical Supplies', 'rotherinlights@aol.com', '1709378369', 'Unit 2 Hillside Court', 'Barbot Hall Ind Est', 'Rotherham', NULL, 'S61 4RP', 'United Kingdom', NULL, 'GB471355841', 'sole_trader', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0018', 'Passion Accessories Ltd', 'info@passionaccessories.com', '07799663609', 'Unit 5 Malbern Ind Est', 'Derby Street, Denton', 'Manchester', NULL, 'M34 3SD', 'United Kingdom', '08728750', 'GB200982333', 'limited_company', 'weekly', 7, 'info@passionaccessories.com', NULL, NULL),
  ('MOOV-0022', 'M and J Brothers Ltd', 'zhousaiqiong@hotmail.com', '1618343379', '38D Derby Street', NULL, 'Manchester', NULL, 'M8 8HN', 'United Kingdom', '09713354', 'GB225530924', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0023', 'Beacons and Lightbars', 'josh@beaconsandlightbars.co.uk', '1527576193', '5 The Croft', 'Buntsofrd Gate Business Park', 'Brosmgrove', NULL, 'B60 4JE', 'United Kingdom', '05325847', 'GB747984076', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0026', 'Pet & Grooming Supplies Ltd', 'info@bentleysdogfood.co.uk', '1206803905', 'Unit 11 Pond Barn Farms', 'Hall Road, Great Bromley', 'Colchester', NULL, 'CO7 7TP', 'United Kingdom', '06552614', 'GB937078105', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0028', 'The Hanger Store', 'petercurry@cdcuk.com', '1245253420', '18 Baynes Place', NULL, 'Chelmsford', NULL, 'CM1 2QX', 'United Kingdom', '03697978', 'GB731920450', 'limited_company', 'weekly', 7, 'petercurry@cdcuk.com', NULL, NULL),
  ('MOOV-0030', 'Greenplant UK Ltd', 'parts@greenplantuk.com', '1483235111', 'Unit 47 Coalbrookdale Road', 'Clayhill Light Industrial Park', 'Neston', NULL, 'CH64 3UG', 'United Kingdom', '05391204', 'GB88523589', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0031', 'Mobberley Cakes Ltd', 'sales@mobberleycakes.co.uk', '1925822577', 'Unit 1 Centre 21', 'Bridge Lane, Manchester Road', 'Woolston', NULL, 'WA1 4AW', 'United Kingdom', '3733731', '611746162', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0032', 'Ecom Group UK Limited', 'compwize@gmail.com', '7951994447', '15A Albion Mills', NULL, 'Bradford', NULL, 'BD10 9TQ', 'United Kingdom', '06174495', 'GB934887571', 'limited_company', 'weekly', 7, 'compwize@gmail.com', NULL, NULL),
  ('MOOV-0035', 'Aegean Sea', 'info@aegeansea.uk', '07584669133', 'Aegean Sea Ltd', 'Unit 19', 'Liverpool', NULL, 'L33 7SQ', 'United Kingdom', '053 63317', 'GB 860 3119 48', 'limited_company', 'weekly', 7, 'kevin@boori.co.uk', NULL, NULL),
  ('MOOV-0037', 'Natural Spa Supplies Ltd', 'mail@naturalspasuppies.co.uk', '1508486715', 'The Old Post Office', 'The Street', 'Norfolk', NULL, 'IP21 5TL', 'United Kingdom', '06237843', '168139878', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0040', 'Jane Scott Ceramics', 'muddyfingers@live.co.uk', '7813718853', 'Lancefield Studios, Lancefield Place', 'Pickwick, Corsham', 'Wiltshire', NULL, 'SN13 0HZ', 'United Kingdom', NULL, NULL, 'sole_trader', 'weekly', 7, 'mail@janescottceramics.com', NULL, NULL),
  ('MOOV-0043', 'Impoxer LTD T/A Makrom', 'info@makrom.co.uk', '7463115067', '130 Commercial Road', NULL, 'London', NULL, 'E1 1NL', 'United Kingdom', '03359505', '718435428', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0047', 'Reevo', 'sales@reevocollection.co.uk', '1618398181', '38c Derby Street', 'Cheetham Hill', 'Manchester', NULL, 'M8 8HN', 'United Kingdom', '07890017', 'GB129074415', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0053', 'Neil Test', 'neil.armstrong@cloud9fulfilment.co.uk', '11111111111111112', 'Unit 3', NULL, 'Sheffield', NULL, 'S9 3AJ', 'United Kingdom', NULL, NULL, 'limited_company', 'monthly', 30, NULL, NULL, NULL),
  ('MOOV-0054', 'Moov Parcel', 'service@moovparcel.co.uk', '11111111111111112', 'Unit 4 Kettlebridge Road', 'Parkway Link', 'Sheffield', NULL, 'S9 3AJ', 'United Kingdom', NULL, NULL, 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0058', 'CLIPHER LTD', 'sophie@clipher.com', '7423788998', '216 Victoria Road', 'Ruislip', 'Middlesex', NULL, 'HA4 0AP', 'United Kingdom', '12723365', '444885261', 'limited_company', 'weekly', 7, 'sophie@clipher.com', NULL, NULL),
  ('MOOV-0059', 'P&S Products & Refreshening Ltd', 'luke@refreshening.co.uk', '1507328338', 'Unit 1, Furze Farm Estate', 'Legbourne', 'Lincolnshire', NULL, 'LN11 8HB', 'United Kingdom', '07883578', '707705536', 'limited_company', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0061', 'Rifai UK Ltd', 'andrew.wilkinson@alrifai.com', '7565331784', '217 Brompton Rd', NULL, 'London', NULL, 'SW3 2EJ', 'United Kingdom', '15591079', '474 8818 40', 'partnership', 'weekly', 7, NULL, NULL, NULL),
  ('MOOV-0062', 'Giga Distributors', 'sales@gigadistributors.com', '7423119323', '13 Caffin Garden', NULL, 'Burgess Hill', NULL, 'RH15 0QZ', 'United Kingdom', 'OC429310', '415827588', 'partnership', 'weekly', 7, 'sales@gigadistributors.com', NULL, NULL),
  ('MOOV-0063', 'TKS NATURALS LTD', 'sales@tksnaturals.co.uk', '7896904441', '54 Junction Road', 'Edmonton', 'London', NULL, 'N97JU', 'United Kingdom', '10996718', '373709377', 'limited_company', 'weekly', 7, 'sales@tksnaturals.co.uk', NULL, NULL),
  ('MOOV-0068', 'Hairways (Hair & Beauty) Ltd Stanway', 'shopify2008.sales@gmail.com', '7869305588', 'Unit 20B, Westside Centre,', 'London Road,', 'Stanway, Colchester,', NULL, 'CO3 8PH', 'United Kingdom', '01889395', '427164947', 'limited_company', 'weekly', 7, 'accountspayable@hairwaysdirect.com', NULL, NULL),
  ('MOOV-0069', 'Soghaat Gifts & Fragrances Ltd.', 'info@soghaat.co.uk', '7375556823', 'Unit 6', 'Aspley Business Park', 'Huddersfield', NULL, 'HD1 6RX', 'United Kingdom', '15495547', 'GB00000000', 'limited_company', 'weekly', 7, 'accounts@soghaat.co.uk', NULL, NULL),
  ('MOOV-0071', 'Bentley Photographic', 'zoe@bentleyphoto.com', '7766056717', 'New Hall Barn', 'Manningtree', 'Essex', NULL, 'CO11 2NU', 'United Kingdom', '3800667', '368503536', 'limited_company', 'weekly', 7, 'accounts@bentleyphoto.com', NULL, NULL),
  ('MOOV-0072', 'Impact Particles', 'monikecampbell@hotmail.com', '7825887153', 'Unit 20 Pinfold', 'Industrial Estate', 'Bloxwich', NULL, 'WS3 3JS', 'United Kingdom', '14413969', '440157131', 'limited_company', 'weekly', 7, 'sales@impactparticles.co.uk', NULL, NULL),
  ('MOOV-0074', 'Major Brushes Ltd', 'support@majorbrushes.co.uk', '2920770835', 'Unit C2 & C3 Capital Point', 'Capital Business Park', 'Cardiff', NULL, 'CF3 2PY', 'United Kingdom', '03842481', '666524317', 'limited_company', 'weekly', 7, 'support@majorbrushes.co.uk', NULL, NULL),
  ('MOOV-0075', 'NECTR', 'jm@jamiemann.com', '111111111111111', '15-17 Middle Street', NULL, 'Brighton', NULL, 'BN1 1AL', 'United Kingdom', NULL, 'GB000000000', 'limited_company', 'weekly', 7, 'jm@jamiemann.com', NULL, NULL),
  ('MOOV-0076', 'Moreyeah Foods Ltd', 'bhumit@moreyeahfoods.com', '7377271157', '239 Rayners Lane Harrow', NULL, 'London', NULL, 'Ha29tx', 'United Kingdom', '15805574', NULL, 'limited_company', 'weekly', 7, 'bhumit@moreyeahfoods.com', NULL, NULL),
  ('MOOV-0079', 'Pex Ltd', 'george@pexltd.com', '1162861616', 'Unit 6', 'Ashville Way', 'Leicester', NULL, 'LE8 6NU', 'United Kingdom', '04797943', 'GB257314015', 'limited_company', 'weekly', 7, 'fiona@pexltd.com', NULL, NULL),
  ('MOOV-0081', 'Carnivore Cartel Ltd', 'info@carnivorecartel.co.uk', '01414284469', 'UNIT 19A CARFIN INDUSTRIAL ESTATE', NULL, 'MOTHERWELL', NULL, 'ML1 4UZ', 'United Kingdom', '14197634', '451677476', 'limited_company', 'weekly', 14, 'info@carnivorecartel.co.uk', NULL, NULL),
  ('MOOV-0083', 'E-Health Pharmacy Ltd', 'hello@thehealthpharmacy.co.uk', '7961474330', '5 Broadway Parade', 'North Harrow', 'Pinner,  North Harrow', NULL, 'HA2 7SY', 'United Kingdom', '08811952', '398602121', 'limited_company', 'weekly', 7, 'hello@thehealthpharmacy.co.uk', NULL, NULL),
  ('MOOV-0084', 'Techworknetwork LTD', 'exploregadgets.ebay@gmail.com', '7572044272', '11 Danes Road', 'POSITE PGR TIMBERS', 'London', NULL, 'RM7 0HL', 'United Kingdom', '14020781', NULL, 'limited_company', 'weekly', 7, 'exploregadgets.ebay@gmail.com', NULL, NULL),
  ('MOOV-0085', 'Matrix Seating Limited', 'sales@matrixseating.com', '7396716030', '4, Indus Road', NULL, 'Shaftesbury', NULL, 'SP7 8FU', 'United Kingdom', '04605777', '805749610', 'limited_company', 'weekly', 7, 'sales@matrixseating.com', NULL, NULL),
  ('MOOV-0088', 'TCS Express Worldwide', 'mhussain@tcsexpress.co.uk', '7899814443', '1000 Great West Road', NULL, 'Brentford', NULL, 'TW8 9DW', 'United Kingdom', '04919803', 'GB855945184', 'limited_company', 'weekly', 7, 'mhussain@tcsexpress.co.uk', NULL, NULL),
  ('MOOV-0090', 'Matt Test', 'mndunne@gmail.com', '1111111111', 'Testty mctest', NULL, 'Driffield', NULL, 'YO25 9DG', 'United Kingdom', NULL, 'GB12345678', 'limited_company', 'weekly', 7, 'mndunne@gmail.com', NULL, NULL),
  ('MOOV-0091', 'Pet Food Online LTD', 'rajaby@husse.co.uk', '2079983439', 'Unit One 180', 'Park Avenue', 'London', NULL, 'NW10 7XH', 'United Kingdom', '08011076', 'GB139314613', 'limited_company', 'weekly', 7, 'rajaby@husse.co.uk', NULL, NULL),
  ('MOOV-0093', 'Macchiato Bar Ltd', 'eli@macchiatobar.co.uk', '7966397889', 'Macchiato Bar, MALL 5', 'Brent Cross Shopping Centre', 'London', NULL, 'NW4 3FP', 'United Kingdom', '08048422', '139377873', 'limited_company', 'weekly', 7, 'eli@macchiatobar.co.uk', NULL, NULL),
  ('MOOV-0094', 'Soothe Limited t/a Luxury Skincare Brands', 'gpearce@luxuryskincarebrands.co.uk', '07973662942', 'Creation House,', 'Lilac Grove', 'Nottinghamshire,', NULL, 'NG9 1QX', 'United Kingdom', '08406702', 'GB345798941', 'limited_company', 'weekly', 7, 'accounts@soothe-therapies.com', NULL, NULL),
  ('MOOV-0097', 'Sam Scotts Limited', 'david@samscotts.co.uk', '7718757358', '14 Little Dockray', NULL, 'Penrith', NULL, 'CA11 7HL', 'United Kingdom', '4877745', 'GB330535391', 'limited_company', 'weekly', 7, 'sales@samscotts.co.uk', NULL, NULL),
  ('MOOV-0098', 'Crytec Limited', 'sales@crytec-power.co.uk', '1246863755', 'Crytec Power', 'CHESTERFIELD', 'DERBYSHIRE', NULL, 'S41 9RX', 'United Kingdom', '10482667', 'GB259735461', 'limited_company', 'weekly', 7, 'crytec.limited@gmail.com', NULL, NULL),
  ('MOOV-0099', 'Hairways (Hair & Beauty) Ltd Harlow', 'fresh@hairwaysdirect.com', '1206212242', 'Unit A1  St James Centre', 'St James Centre', 'Harlow', NULL, 'CM20 2SX', 'United Kingdom', '01889395', '427164947', 'limited_company', 'weekly', 7, 'accountspayable@hairwaysdirect.com', NULL, NULL),
  ('MOOV-0102', 'TMK Trading Ltd t/a Nexus Modelling Supplies', 'sales@nexusmodels.co.uk', '7977475014', '1 The Green', 'St. Peters Way', 'Northampton', NULL, 'NN1 1TD', 'United Kingdom', '05290172', 'GB904360745', 'limited_company', 'weekly', 7, 'sales@nexusmodels.co.uk', NULL, NULL),
  ('MOOV-0103', 'Brexons Workwear', 'becca.breheny@brexonsworkwear.co.uk', '01427810555', 'Unit 38 longwood Road', NULL, 'Gainsborough', NULL, 'DN21 1QB', 'United Kingdom', '14953972', 'GB444686464', 'limited_company', 'weekly', 7, 'carolshaw-browne@brexons.co.uk', NULL, NULL),
  ('MOOV-0104', 'Crystalnails4u Ltd', 'info@crystalnails4u.co.uk', '1245256426', '28 Courtney Court', NULL, 'Newcastle Upon Tyne', NULL, 'NE3 2UD', 'United Kingdom', NULL, 'GB00000000', 'sole_trader', 'weekly', 7, 'info@crystalnails4u.co.uk', NULL, NULL),
  ('MOOV-0105', 'Sing Ko', 'online@singkeefoods.co.uk', '7745506627', '30 CROSS STAMFORD STREET', NULL, 'Leeds', NULL, 'LS7 1BA', 'United Kingdom', '09479626', '214326247', 'limited_company', 'weekly', 7, 'accountspayables@singkeefoods.co.uk', NULL, NULL),
  ('MOOV-0106', 'Boori (Europe) LTD', 'kevin@boori.co.uk', '07584669133', 'Unit 2 Sterling Way', NULL, 'Reading', NULL, 'RG30 6HW', 'United Kingdom', '053 63317', 'GB 860 3119 48', 'limited_company', 'weekly', 7, 'kevin@boori.co.uk', NULL, NULL),
  ('MOOV-0108', 'Direct Auto Electrics Ltd', 'richard@directautoelectrics.co.uk', '7787406391', 'Unit 7 Silver Court Ind Est', 'Intercity Way, Pudsey', 'LEEDS', NULL, 'LS13 4LY', 'United Kingdom', '12283075', 'GB 404393807', 'limited_company', 'weekly', 7, 'richard@directautoelectrics.co.uk', NULL, NULL),
  ('MOOV-0109', 'W J Jones Ltd T/A Zoar''s Ark', 'hywel@zoarsark.co.uk', '1639642180', 'Bridge Street', NULL, 'Neath', NULL, 'SA11 1RP', 'United Kingdom', '00663124', '123 7639 68', 'limited_company', 'weekly', 7, 'christine@zoarsark.co.uk', NULL, NULL),
  ('MOOV-0110', 'Raycom Ltd', 'andy@raycom.co.uk', '7973432223', 'Raycom Ltd', 'Evesham', 'Worcestershire', NULL, 'WR114BY', 'United Kingdom', '7235496', 'GB 990 9966 45', 'limited_company', 'weekly', 7, 'accounts@raycom.co.uk', NULL, NULL),
  ('MOOV-0111', 'Empire Printing & Embroidery Ltd', 'andrew@empireclothing.uk', '1508470547', 'Unit 5, Game Meadow', NULL, 'Norwich', NULL, 'NR14 8PY', 'United Kingdom', '09697810', 'GB994759540', 'limited_company', 'weekly', 7, 'andrew@empireclothing.uk', NULL, NULL),
  ('MOOV-0112', 'VISION WAREHOUSE LTD', 'valji@visionuk.co.uk', '07949123790', 'UNIT 35 STADIUM BUSINESS CENTRE', 'NORTH END ROAD', 'WEMBLEY', NULL, 'HA9 0AT', 'United Kingdom', '5201769', '843723816', 'limited_company', 'fortnightly', 7, 'valji@visionuk.co.uk', NULL, NULL),
  ('MOOV-0113', 'BARRY CARTER MOTOR PRODUCTS', 'sales@barrycarter.co.uk', '07999250905', 'Unit 1', NULL, 'HARROGATE', NULL, 'HG1 4PT', 'United Kingdom', '02260042', '172206587', 'limited_company', 'weekly', 7, 'accounts@barrycarter.co.uk', NULL, NULL),
  ('MOOV-0114', 'Vint Street Ltd.', 'amy@vintstreet.com', '7456846669', 'Wyfordby Grang', 'Saxby Road', 'Melton', NULL, 'LE14 4SA', 'United Kingdom', NULL, NULL, 'limited_company', 'weekly', 7, 'will@vintstreet.com', NULL, NULL),
  ('MOOV-0115', 'Imagin Products Ltd', 'sair.legge@imagin-badges.co.uk', '7974180720', 'Unit 9 Midfield Drive', NULL, 'Kirkcaldy', NULL, 'KY1 3LW', 'United Kingdom', 'SC337583', '926 9086 88', 'limited_company', 'weekly', 7, 'sales@imagin-badges.co.uk', NULL, NULL),
  ('MOOV-0116', 'EZZTECH', 'info@ezztech.co.uk', '07737244699', 'UNIT 4C', 'UNIVERSAL BUILDING 37-49 DEVONSHIRE STREET', 'Manchester', NULL, 'M126JR', 'United Kingdom', '15529128', 'GB474508082', 'limited_company', 'weekly', 7, 'info@ezztech.co.uk', NULL, NULL),
  ('MOOV-0117', 'Tool Hub Ltd', 'admin@thetoolhub.co.uk', '1258446242', 'Unit D DORSET BUSINESS PARK', 'BLANDFORD FORUM', 'Dorset', NULL, 'DT11 9AS', 'United Kingdom', '08682750', '172081525', 'limited_company', 'weekly', 7, 'admin@thetoolhub.co.uk', NULL, NULL),
  ('MOOV-0118', 'Getplumb Reading Ltd', 'sales@getplumb.co.uk', '7483354221', '5 Trafford Road', NULL, 'READING', NULL, 'RG1 8JP', 'United Kingdom', '13074653', '369716745', 'limited_company', 'weekly', 7, 'accounts@getplumb.co.uk', NULL, NULL),
  ('MOOV-0119', '608 Group Ltd (304 Clothing)', 'mike@304clothing.com', '07746253845', '126 New John Street', NULL, 'Birmingham', NULL, 'B6 4LD', 'United Kingdom', '16420055', '495100009', 'limited_company', 'weekly', 14, 'tony@304clothing.com', NULL, NULL),
  ('MOOV-0120', 'Sky Chemicals (UK) Ltd', 'info@skychemicals.co.uk', '7958298495', 'Unit 1 Parkway Link', 'Kettlebridge Road', 'Sheffield', NULL, 'S9 3AJ', 'United Kingdom', '07209524', '991189184', 'limited_company', 'weekly', 7, 'info@skychemicals.co.uk', NULL, NULL),
  ('MOOV-0121', 'Wedcova Uk Ltd', 'info@wedcova.co.uk', '7979393139', 'Unit 1, Mahal Business Centre', '83 Nottingham Road', 'Leicester', NULL, 'LE5 4GH', 'United Kingdom', '12016415', 'GB390545485', 'limited_company', 'weekly', 7, 'info@wedcova.co.uk', NULL, NULL),
  ('MOOV-0122', 'Fosseway Parcels Ltd', 'mark@fossewayfreight.co.uk', '7717752227', 'Unit 50 Boston Rd', NULL, 'Leicester', NULL, 'LE4 1AA', 'United Kingdom', '07269813', '166678166', 'limited_company', 'weekly', 7, 'natasha@fossewayfreight.co.uk', NULL, NULL),
  ('MOOV-0123', 'GPG - Getpersonalisedgifts Limited', 'info@getpersonalisedgifts.com', '2033024146', '42-46 Fairfield Street', NULL, 'London', NULL, 'SW18 1DY', 'United Kingdom', '12701690', NULL, 'limited_company', 'weekly', 7, 'info@getpersonalisedgifts.com', NULL, NULL),
  ('MOOV-0124', 'Thirsty Soft Drinks', 'sabeeh@thirstydrinks.com', '7853177623', 'Highfields', 'Melbourne', 'Derbyshire', NULL, 'DE73 8DG', 'United Kingdom', '06135339', '06135339', 'limited_company', 'weekly', 7, 'sabeeh@thirstydrinks.com', NULL, NULL),
  ('MOOV-0125', 'Gifts2Impress', 'cameron@gifts2impress.co.uk', '1257474777', '2 The Loft', 'Culraven Court', 'Wigan', NULL, 'WN2 1LD', 'United Kingdom', '4241519', 'GB776331513', 'limited_company', 'weekly', 7, 'suplliers@gift2impress.co.uk', NULL, NULL),
  ('MOOV-0126', 'Xylo LTD', 'jason@xylouk.co.uk', '07714747777', 'R08 Regent Works Studio', 'Chatfield Place', 'Longton', NULL, 'ST3 1LZ', 'United Kingdom', '07323863', '442889261', 'limited_company', 'weekly', 7, 'carol@xylouk.co.uk', NULL, NULL),
  ('MOOV-0127', 'The Saddlery Shop Ltd', 'advice@thesaddleryshop.co.uk', '7545968240', 'Trelawne Farm', 'Chilla', 'Beaworthy', NULL, 'EX21 5XE', 'United Kingdom', '5063147', '624824832', 'limited_company', 'weekly', 7, 'advice@thesaddleryshop.co.uk', NULL, NULL),
  ('MOOV-0128', 'Organax Ltd', 'tahir@organax.co.uk', '7950666788', 'Kemp House', '152 City Road', 'London', NULL, 'EC1V 2NX', 'United Kingdom', NULL, NULL, 'limited_company', 'weekly', 7, 'tahir@organax.co.uk', NULL, NULL),
  ('MOOV-0129', 'Gra Telford LTD', 'josh@drgreens.co.uk', '7876737750', 'Unit 15', 'Telford', 'Shropshire', NULL, 'tf4 2ge', 'United Kingdom', '154858281000', '154858281', 'limited_company', 'weekly', 14, 'josh@drgreens.co.uk', NULL, NULL),
  ('MOOV-0130', 'The Wall Lighting Company Ltd', 'chris@thewalllightingcompany.co.uk', '7512698968', 'The Barrelage', 'Cranbrook', 'Kent', NULL, 'TN17 3AL', 'United Kingdom', '9262498', '199777713', 'limited_company', 'weekly', 7, 'louise@thewalllightingcompany.co.uk', NULL, NULL),
  ('MOOV-0131', 'Chilli Seating Ltd', 'david@chilliseating.co.uk', '7970005041', 'Unit B', 'Overhouse Farm', 'Staffordshire', NULL, 'B78 2EZ', 'United Kingdom', '15156549', '374228391', 'limited_company', 'weekly', 7, 'sally@chilliseating.co.uk', NULL, NULL),
  ('MOOV-0132', 'Deshi Delights Ltd', 'sarfraz@deshidelights.com', '7946894305', '214 Eastcote Avenue', 'West Molesey', 'Surrey', NULL, 'KT8 2EX', 'United Kingdom', '16639538', NULL, 'limited_company', 'weekly', 7, 'accounts@deshidelights.com', NULL, NULL),
  ('MOOV-0133', 'Bill''s Tool Store Ltd', 'chris@billstoolstore.com', '01415521286', '52-64 Bain Street', NULL, 'Glasgow', NULL, 'G40 2LD', 'United Kingdom', 'Chris Wilson', '259748112', 'limited_company', 'weekly', 7, 'accounts@billstoolstore.com', NULL, NULL),
  ('MOOV-0134', 'Jaycee Engineering T/A Jaycee Trophies', 'info@jayceetrophies.co.uk', '7918733842', 'Unit 2', 'Pywell Court', 'Corby', NULL, 'NN17 5WA', 'United Kingdom', '5294055', '463084842', 'limited_company', 'weekly', 7, 'accounts@jayceetrophies.co.uk', NULL, NULL),
  ('MOOV-0135', 'Arden Medical Limited', 'aw@arden-medical.com', '01789764142', 'Unit 2', 'Arden Road', 'Alcester', NULL, 'B49 6HN', 'United Kingdom', '3283816', 'GB779945448', 'limited_company', 'weekly', 7, 'dww@arden-medical.com', 'GB779945448000', NULL),
  ('MOOV-0136', 'ORIGINAL SOURCE LIMITED', 'tricia_keogh@hotmail.co.uk', '7881825340', 'DCM 2 SPINDLES', 'SHOPPING CENT  OLDHAM', 'OLDHAM', NULL, 'OL1 1HE', 'United Kingdom', '12065208', '12065208', 'limited_company', 'weekly', 7, 'marytrothwell@hotmail.com', 'GB334324721000', NULL),
  ('MOOV-0137', 'Ransom Publishing Ltd', 'sheryl@ransom.co.uk', '1730829091', 'Unit 7', 'Brocklands Farm', 'Petersfield', NULL, 'GU32 1JN', 'United Kingdom', '03041651', '663202854', 'limited_company', 'weekly', 7, 'accounts@ransom.co.uk', 'GB663202854000', NULL),
  ('MOOV-0138', 'Westcare Ltd', 'lee@westcare.co.uk', '1752695469', 'Unit 20 Forresters Business Park', '35 Estover Close', 'Plymouth', NULL, 'PL6 7PL', 'United Kingdom', '2680675', '557746008', 'partnership', 'weekly', 7, 'carla@westcare.co.uk', 'GB557746008000', NULL),
  ('MOOV-0139', 'Talpa office products ltd', 'lee@talpaproducts.co.uk', '1752695469', 'Unit 20', 'Forresters Business Park', 'Plymouth', NULL, 'PL6 7PL', 'United Kingdom', '04144577', '77107912E', 'limited_company', 'weekly', 7, 'carla@talpaproducts.co.uk', '771079126000', NULL),
  ('MOOV-0140', 'LED Smart Solutions Limited', 'info@brightexled.co.uk', '1618778898', '34 BRINDLEY ROAD', NULL, 'MANCHESTER', NULL, 'M16 9QH', 'United Kingdom', '11729994', '361954381', 'limited_company', 'weekly', 7, 'ledsmartsolutions@led-uk.com', NULL, NULL),
  ('MOOV-0141', 'JST Supplies LTD', 'jack@jstsupplies.co.uk', '7463245829', 'Unit 2', 'Portway Road', 'Oldbury', NULL, 'B69 2BP', 'United Kingdom', '14916366', 'GB447 3747 65', 'limited_company', 'weekly', 7, 'jack@jstsupplies.co.uk', 'GB447374765000', NULL),
  ('MOOV-0142', 'Moov Diana Demo', 'diana.volkova@moovparcel.co.uk', '1133224100', '14 King Street', NULL, 'Leeds', NULL, 'LS1 2HL', 'United Kingdom', NULL, NULL, 'limited_company', 'weekly', 7, 'diana.volkova@moovparcel.co.uk', NULL, NULL),
  ('MOOV-0143', 'OliArt Wood LTD', 'rutraolo@gmail.com', '7787787373', '46 Rawsthorne Avenue', NULL, 'Manchester', NULL, 'M18 7GB', 'United Kingdom', '14371935', NULL, 'limited_company', 'weekly', 7, 'rutraolo@gmail.com', NULL, NULL),
  ('MOOV-0144', 'Bessette LTD', 'vanessa@shopbessette.com', '07378573668', '10 Barley Mow Passage', NULL, 'London', NULL, 'W4 4PH', 'United Kingdom', '15468584', '471791369', 'limited_company', 'weekly', 7, 'vanessa@shopbessette.com', 'GB471791369000', NULL),
  ('MOOV-0145', 'CONTEXT PNEUMATIC SUPPLIES LIMITED', 'info@contextpneumatics.com', '1204380988', '247 Crompton Way', NULL, 'Bolton', NULL, 'BL2 2RX', 'United Kingdom', '06534924', 'GB933684792', 'limited_company', 'weekly', 7, 'accounts@contextpneumatics.com', 'GB933684792000', NULL),
  ('MOOV-0146', 'Bentley and Bo Interiors Ltd', 'mark@bentleyandbo.co.uk', '01543304856', 'Unit 43', 'Britannia Way', 'Lichfield', NULL, 'WS14 9UY', 'United Kingdom', '09602561', 'GB217553902', 'limited_company', 'weekly', 7, 'bernice@bentleyandbo.co.uk', 'GB217553902000', NULL),
  ('MOOV-0147', 'SME IT Solutions Limited', 'mark@smesolutions.co.uk', '1323648666', '16 Gildredge Road', NULL, 'Eastbourne', NULL, 'BN21 4RL', 'United Kingdom', '07968246', 'GB131292346', 'limited_company', 'weekly', 7, 'mark@smesolutions.co.uk', 'GB131292346000', NULL),
  ('MOOV-0149', 'Buffalo Systems Ltd', 'edward@buffalosystems.co.uk', '07792300812', 'Unit 3', 'The Old Dairy', 'Sheffield', NULL, 'S8 0XQ', 'United Kingdom', '02985774', 'GB616992310', 'limited_company', 'weekly', 7, 'accounts@buffalosystems.co.uk', 'GB616992310000', NULL),
  ('MOOV-0150', 'East London Packaging Supplies Ltd', 'peter@eastlondonpackaging.co.uk', '1268288688', '13 Repton Court', 'Repton Close', 'Basildon', NULL, 'SS13 1LN', 'United Kingdom', '02792180', 'GB888089946', 'limited_company', 'weekly', 7, 'peter@eastlondonpackaging.co.uk', 'GB888089946000', NULL),
  ('MOOV-0151', 'Metal Polishing Supplies Ltd', 'joe@metalpolishingsupplies.co.uk', '7738860126', '18 St. Leonards Close', NULL, 'Fareham', NULL, 'PO15 5ER', 'United Kingdom', '03827784', 'GB117614526', 'limited_company', 'weekly', 7, 'joe@metalpolishingsupplies.co.uk', 'GB117614526000', NULL),
  ('MOOV-0152', 'Spokz Ltd', 'info@spokz.co.uk', '1543399760', 'Unit B', 'Overhouse Farm', 'Tamworth', 'Staffordshire', 'B78 2EZ', 'United Kingdom', NULL, 'GB928376390', 'limited_company', 'weekly', 7, 'info@spokz.co.uk', 'GB928376390000', NULL),
  ('MOOV-0153', 'M. Criscuolo & Co Ltd', 'info@crisco.co.uk', '7764188675', 'Homestead Grange', 'Birchwood Lane', 'Caterham', NULL, 'CR3 5DQ', 'United Kingdom', '00253903', 'GB232314801', 'limited_company', 'weekly', 7, 'info@crisco.co.uk', 'GB232314801000', NULL),
  ('MOOV-0154', 'Kettles Pottery Supplies Ltd', 'ash@kettlespotterysupplies.com', '7425421825', '8B West Telferton', NULL, 'Edinburgh', NULL, 'EH7 6UL', 'United Kingdom', 'SC710634', 'GB395485248', 'limited_company', 'weekly', 7, 'ash@kettlespotterysupplies.com', 'GB395485248000', NULL),
  ('MOOV-0155', 'East Coast Creations Ltd', 'info@eastcoastcreations.co.uk', '01904236850', '321G Mayoral Way', 'Team Valley Trading Estate', 'Gateshead', NULL, 'NE11 0RT', 'United Kingdom', '12996272', NULL, 'limited_company', 'weekly', 7, 'info@eastcoastcreations.co.uk', NULL, NULL),
  ('MOOV-0156', 'ETA Solutions Limited', 'victoria@etasolutions.co.uk', '1282614780', '51-53 Churchill Way', NULL, 'Nelson', NULL, 'BB9 6RT', 'United Kingdom', '04481401', 'GB798035391', 'limited_company', 'weekly', 7, 'victoria@etasolutions.co.uk', 'GB798035391000', NULL),
  ('MOOV-0157', 'Security Trade Products Ltd', 'accounts@securitytradeproducts.co.uk', '1763848209', 'Unit 11, Valley Farm, 1 Station Road', 'Meldreth', 'Royston', NULL, 'SG8 6JP', 'United Kingdom', '10272587', 'GB251914609', 'limited_company', 'weekly', 7, 'accounts@securitytradeproducts.co.uk', 'GB251914609000', NULL),
  ('MOOV-0158', 'Sarratt Online Ltd', 'steve@toolforthejob.co.uk', '1296327775', 'Claydon House', '1 Edison Road', 'Aylesbury', NULL, 'HP19 8TE', 'United Kingdom', '11683434', 'GB310853529', 'limited_company', 'weekly', 7, 'rupert.potter@sarrattmanagement.com', 'GB310853529000', NULL),
  ('MOOV-0159', 'Agar Hygiene Ltd', 'office@agarhygiene.com', '1509263200', 'Unit V', 'Hockey Close', 'Loughborough', NULL, 'LE11 5GX', 'United Kingdom', '04464583', 'GB799744741', 'limited_company', 'weekly', 7, 'office@agarhygiene.com', 'GB799744741000', NULL),
  ('MOOV-0160', 'Lesser Spotted Images Ltd', 'domgreyer@hotmail.com', '7932086581', '42 Wood Road', NULL, 'Manchester', NULL, 'M16 8BL', 'United Kingdom', '06836045', 'GB974268284', 'limited_company', 'weekly', 7, 'domgreyer@hotmail.com', 'GB974268284000', NULL),
  ('MOOV-0161', 'Just Cable Ties', 'sales@justcableties.co.uk', '1233661589', 'Little Singleton Oast', 'Great Chart', 'Ashford', 'Kent', 'TN26 1JS', 'United Kingdom', NULL, 'GB164522222', 'sole_trader', 'weekly', 7, 'sales@justcableties.co.uk', 'GB164522222000', NULL),
  ('MOOV-0162', 'Southdown Abrasives & Ind Chemicals Ltd', 'will@saic-uk.co.uk', '01273463677', 'Unit 7, 85 Marlborough Rd', NULL, 'Lancing', NULL, 'BN15 8SJ', 'United Kingdom', '01273402', 'GB193978987', 'limited_company', 'weekly', 7, 'clare@saic-uk.co.uk', 'GB193978987000', NULL),
  ('MOOV-0163', 'HPSA Ltd', 'chris.thorpe@hpsa.co.uk', '1163193398', 'Unit 1a', 'Oswin Road', 'Leicester', 'Leicestershire', 'LE3 1HR', 'United Kingdom', '07030328', 'GB924743710', 'limited_company', 'weekly', 7, 'chris.thorpe@hpsa.co.uk', 'GB924743710000', NULL),
  ('MOOV-0164', 'PWS Leeds Ltd', 'roy@jetwashshop.co.uk', '1422374374', 'Unit 19, Woodman Works', 'South Lane, Elland', 'Halifax', NULL, 'HX5 0PA', 'United Kingdom', '05023532', 'GB829219903', 'limited_company', 'weekly', 7, 'sophie@jetwashshop.co.uk', 'GB829219903000', NULL),
  ('MOOV-0165', 'Total Insignia Ltd', 'dominic@totalinsignia.co.uk', '01254495300', 'The Gatehouse, Imperial Mill', 'Gorse Street', 'Blackburn', NULL, 'BB1 3EU', 'United Kingdom', '10359851', 'GB250214160', 'limited_company', 'weekly', 7, 'david@totalinsignia.co.uk', 'GB250214160000', NULL),
  ('MOOV-0166', 'The Wild Meat Company ltd', 'robert@wildmeat.co.uk', '7771887311', 'Pound Farm', 'Sweffling', 'Saxmundham', NULL, 'IP17 2BU', 'United Kingdom', '03910823', 'GB764939967', 'limited_company', 'weekly', 7, 'rebecca@wildmeat.co.uk', 'GB764939967000', NULL),
  ('MOOV-0167', 'Grace Test Account', 'baileygrace0@gmail.com', '11111111111', 'Cloud9 Fulfillment Ltd', 'Unit 3', 'Sheffield', NULL, 'S9 3AJ', 'United Kingdom', NULL, 'GB000000000', 'limited_company', 'weekly', 7, 'baileygrace0@gmail.com', 'GB000000000000', NULL),
  ('MOOV-0168', 'Bob AI', 'rob.downham@cloud9fulfilment.co.uk', '11111111111', 'Cloud9 Fulfillment Ltd', 'Unit 3', 'Sheffield', 'South Yorkshire', 'S9 3AJ', 'United Kingdom', NULL, 'GB000000000', 'limited_company', 'weekly', 7, 'rob.downham@cloud9fulfilment.co.uk', 'GB000000000000', NULL),
  ('MOOV-0169', 'Xplore Brands', 'jake@xplore-brands.com', '7383111113', 'Xplore Uk Distribution Ltd', '30-32 Albion Road', 'Loughborough', NULL, 'LE12 7RA', 'United Kingdom', NULL, 'GB444836964', 'limited_company', 'weekly', 7, 'invoice@xplore-brands.com', 'GB444836964000', NULL),
  ('MOOV-0170', 'Sherwood Wholesale Foods Ltd', 'gregg@sherwoodfoods.co.uk', '2886764758', 'Sherwood Foods Ltd', 'Charlwood Road', 'Crawley', NULL, 'RH11 0JY', 'United Kingdom', '06397244', 'GB926150439', 'limited_company', 'weekly', 7, 'accounts@sherwoodfoods.co.uk', 'GB926150439000', NULL),
  ('MOOV-0171', 'Jamie Ferments Ltd', 'info@jamieferments.com', '07749667207', '20 Phoebes Place', 'LONDON', 'London', NULL, 'SE6 2FA', 'United Kingdom', '16802662', 'GB506926971', 'limited_company', 'weekly', 7, 'info@jamieferments.com', 'GB506926971000', NULL)
ON CONFLICT (account_number) DO NOTHING;

-- Seed main contacts where we have a contact name

DO $$
DECLARE r RECORD;
BEGIN
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Saqib', 'saqib@iluvdesigner.com', '7885731147', true
    FROM customers WHERE account_number = 'MOOV-0004';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'James', 'jamesimorris43@gmail.com', '7812084672', true
    FROM customers WHERE account_number = 'MOOV-0009';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Lee', 'lee.revill@milvill.co.uk', '1142889884', true
    FROM customers WHERE account_number = 'MOOV-0010';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Steve', 'admin@britalitez.com', '7940563313', true
    FROM customers WHERE account_number = 'MOOV-0012';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Mick Mills', 'mick@greenfootprintservices.co.uk', '01268330220', true
    FROM customers WHERE account_number = 'MOOV-0015';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Kane', 'kane@norfolksawservices.co.uk', '1603898695', true
    FROM customers WHERE account_number = 'MOOV-0016';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'John', 'info@passionaccessories.com', '07799663609', true
    FROM customers WHERE account_number = 'MOOV-0018';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Josie', 'zhousaiqiong@hotmail.com', '1618343379', true
    FROM customers WHERE account_number = 'MOOV-0022';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Josh', 'josh@beaconsandlightbars.co.uk', '1527576193', true
    FROM customers WHERE account_number = 'MOOV-0023';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Toby Hazelton', 'info@bentleysdogfood.co.uk', '1206803905', true
    FROM customers WHERE account_number = 'MOOV-0026';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Peter Curry', 'petercurry@cdcuk.com', '1245253420', true
    FROM customers WHERE account_number = 'MOOV-0028';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Carl', 'parts@greenplantuk.com', '1483235111', true
    FROM customers WHERE account_number = 'MOOV-0030';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Richard Flint', 'sales@mobberleycakes.co.uk', '1925822577', true
    FROM customers WHERE account_number = 'MOOV-0031';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Hossam Saleh', 'compwize@gmail.com', '7951994447', true
    FROM customers WHERE account_number = 'MOOV-0032';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Holly Chen', 'info@aegeansea.uk', '07584669133', true
    FROM customers WHERE account_number = 'MOOV-0035';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Sally Mittuch', 'mail@naturalspasuppies.co.uk', '1508486715', true
    FROM customers WHERE account_number = 'MOOV-0037';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Ivan Cardy', 'muddyfingers@live.co.uk', '7813718853', true
    FROM customers WHERE account_number = 'MOOV-0040';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Ibrahim Doner', 'info@makrom.co.uk', '7463115067', true
    FROM customers WHERE account_number = 'MOOV-0043';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Phil Lui', 'sales@reevocollection.co.uk', '1618398181', true
    FROM customers WHERE account_number = 'MOOV-0047';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Neil', 'neil.armstrong@cloud9fulfilment.co.uk', '11111111111111112', true
    FROM customers WHERE account_number = 'MOOV-0053';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Kaleb', 'service@moovparcel.co.uk', '11111111111111112', true
    FROM customers WHERE account_number = 'MOOV-0054';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Sophie Jancso', 'sophie@clipher.com', '7423788998', true
    FROM customers WHERE account_number = 'MOOV-0058';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Luke Woodward', 'luke@refreshening.co.uk', '1507328338', true
    FROM customers WHERE account_number = 'MOOV-0059';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Andrew Wilkinson', 'andrew.wilkinson@alrifai.com', '7565331784', true
    FROM customers WHERE account_number = 'MOOV-0061';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Viswanath Surendranath', 'sales@gigadistributors.com', '7423119323', true
    FROM customers WHERE account_number = 'MOOV-0062';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Mahalingam Sayanthan', 'sales@tksnaturals.co.uk', '7896904441', true
    FROM customers WHERE account_number = 'MOOV-0063';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Chris Diaper', 'shopify2008.sales@gmail.com', '7869305588', true
    FROM customers WHERE account_number = 'MOOV-0068';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Muhammad Saleem', 'info@soghaat.co.uk', '7375556823', true
    FROM customers WHERE account_number = 'MOOV-0069';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Zoe Adams', 'zoe@bentleyphoto.com', '7766056717', true
    FROM customers WHERE account_number = 'MOOV-0071';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Monike Campbell', 'monikecampbell@hotmail.com', '7825887153', true
    FROM customers WHERE account_number = 'MOOV-0072';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Mark Wason', 'support@majorbrushes.co.uk', '2920770835', true
    FROM customers WHERE account_number = 'MOOV-0074';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Jamie Mann', 'jm@jamiemann.com', '111111111111111', true
    FROM customers WHERE account_number = 'MOOV-0075';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Bhumit Desai', 'bhumit@moreyeahfoods.com', '7377271157', true
    FROM customers WHERE account_number = 'MOOV-0076';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'George Norton', 'george@pexltd.com', '1162861616', true
    FROM customers WHERE account_number = 'MOOV-0079';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Carnivore Cartel Ltd', 'info@carnivorecartel.co.uk', '01414284469', true
    FROM customers WHERE account_number = 'MOOV-0081';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Rishi Parikh', 'hello@thehealthpharmacy.co.uk', '7961474330', true
    FROM customers WHERE account_number = 'MOOV-0083';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Muzaffar Patel', 'exploregadgets.ebay@gmail.com', '7572044272', true
    FROM customers WHERE account_number = 'MOOV-0084';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Tim Cousins', 'sales@matrixseating.com', '7396716030', true
    FROM customers WHERE account_number = 'MOOV-0085';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Majid Hussainn', 'mhussain@tcsexpress.co.uk', '7899814443', true
    FROM customers WHERE account_number = 'MOOV-0088';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Matthew Dunne', 'mndunne@gmail.com', '1111111111', true
    FROM customers WHERE account_number = 'MOOV-0090';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Majid Rajaby', 'rajaby@husse.co.uk', '2079983439', true
    FROM customers WHERE account_number = 'MOOV-0091';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'ELI MORDOCH', 'eli@macchiatobar.co.uk', '7966397889', true
    FROM customers WHERE account_number = 'MOOV-0093';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Gary Pearce', 'gpearce@luxuryskincarebrands.co.uk', '07973662942', true
    FROM customers WHERE account_number = 'MOOV-0094';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'DAVID JOHNSTON', 'david@samscotts.co.uk', '7718757358', true
    FROM customers WHERE account_number = 'MOOV-0097';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Matthew Cryans', 'sales@crytec-power.co.uk', '1246863755', true
    FROM customers WHERE account_number = 'MOOV-0098';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Chris Diaper', 'fresh@hairwaysdirect.com', '1206212242', true
    FROM customers WHERE account_number = 'MOOV-0099';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Paul Gosling', 'sales@nexusmodels.co.uk', '7977475014', true
    FROM customers WHERE account_number = 'MOOV-0102';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Becca Breheny', 'becca.breheny@brexonsworkwear.co.uk', '01427810555', true
    FROM customers WHERE account_number = 'MOOV-0103';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Anna', 'info@crystalnails4u.co.uk', '1245256426', true
    FROM customers WHERE account_number = 'MOOV-0104';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'DOMANIC WONG', 'online@singkeefoods.co.uk', '7745506627', true
    FROM customers WHERE account_number = 'MOOV-0105';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Kevin Power', 'kevin@boori.co.uk', '07584669133', true
    FROM customers WHERE account_number = 'MOOV-0106';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Richard Watkins', 'richard@directautoelectrics.co.uk', '7787406391', true
    FROM customers WHERE account_number = 'MOOV-0108';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Hywel Griffiths', 'hywel@zoarsark.co.uk', '1639642180', true
    FROM customers WHERE account_number = 'MOOV-0109';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Raycom', 'andy@raycom.co.uk', '7973432223', true
    FROM customers WHERE account_number = 'MOOV-0110';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Andrew Luckett', 'andrew@empireclothing.uk', '1508470547', true
    FROM customers WHERE account_number = 'MOOV-0111';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'VALJI', 'valji@visionuk.co.uk', '07949123790', true
    FROM customers WHERE account_number = 'MOOV-0112';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Debbie Kilvington', 'sales@barrycarter.co.uk', '07999250905', true
    FROM customers WHERE account_number = 'MOOV-0113';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Amy', 'amy@vintstreet.com', '7456846669', true
    FROM customers WHERE account_number = 'MOOV-0114';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Sarah Legge', 'sair.legge@imagin-badges.co.uk', '7974180720', true
    FROM customers WHERE account_number = 'MOOV-0115';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'AHMED EZZAT', 'info@ezztech.co.uk', '07737244699', true
    FROM customers WHERE account_number = 'MOOV-0116';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Philip Roy', 'admin@thetoolhub.co.uk', '1258446242', true
    FROM customers WHERE account_number = 'MOOV-0117';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Parambir s', 'sales@getplumb.co.uk', '7483354221', true
    FROM customers WHERE account_number = 'MOOV-0118';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Tony Di Ponio', 'mike@304clothing.com', '07746253845', true
    FROM customers WHERE account_number = 'MOOV-0119';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Paul Trennan', 'info@skychemicals.co.uk', '7958298495', true
    FROM customers WHERE account_number = 'MOOV-0120';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Chirag Rajesh', 'info@wedcova.co.uk', '7979393139', true
    FROM customers WHERE account_number = 'MOOV-0121';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Mark Boddice', 'mark@fossewayfreight.co.uk', '7717752227', true
    FROM customers WHERE account_number = 'MOOV-0122';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Imran Aslam', 'info@getpersonalisedgifts.com', '2033024146', true
    FROM customers WHERE account_number = 'MOOV-0123';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Sabeeh Rehman', 'sabeeh@thirstydrinks.com', '7853177623', true
    FROM customers WHERE account_number = 'MOOV-0124';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Cameron Atherton', 'cameron@gifts2impress.co.uk', '1257474777', true
    FROM customers WHERE account_number = 'MOOV-0125';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Jason Ridge', 'jason@xylouk.co.uk', '07714747777', true
    FROM customers WHERE account_number = 'MOOV-0126';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Lucy Nicholas', 'advice@thesaddleryshop.co.uk', '7545968240', true
    FROM customers WHERE account_number = 'MOOV-0127';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Tahir Shafi', 'tahir@organax.co.uk', '7950666788', true
    FROM customers WHERE account_number = 'MOOV-0128';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Josh Anderson', 'josh@drgreens.co.uk', '7876737750', true
    FROM customers WHERE account_number = 'MOOV-0129';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Chris Carlton', 'chris@thewalllightingcompany.co.uk', '7512698968', true
    FROM customers WHERE account_number = 'MOOV-0130';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'David Bradshaw', 'david@chilliseating.co.uk', '7970005041', true
    FROM customers WHERE account_number = 'MOOV-0131';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Sarfraz Ali', 'sarfraz@deshidelights.com', '7946894305', true
    FROM customers WHERE account_number = 'MOOV-0132';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Chris Wilson', 'chris@billstoolstore.com', '01415521286', true
    FROM customers WHERE account_number = 'MOOV-0133';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Matt Clark', 'info@jayceetrophies.co.uk', '7918733842', true
    FROM customers WHERE account_number = 'MOOV-0134';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Steven Wade', 'aw@arden-medical.com', '01789764142', true
    FROM customers WHERE account_number = 'MOOV-0135';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Dan Keogh', 'tricia_keogh@hotmail.co.uk', '7881825340', true
    FROM customers WHERE account_number = 'MOOV-0136';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Sheryl McCormick', 'sheryl@ransom.co.uk', '1730829091', true
    FROM customers WHERE account_number = 'MOOV-0137';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Leonie Dunning', 'lee@westcare.co.uk', '1752695469', true
    FROM customers WHERE account_number = 'MOOV-0138';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Leonie Dunning', 'lee@talpaproducts.co.uk', '1752695469', true
    FROM customers WHERE account_number = 'MOOV-0139';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Mohamed Hegazy', 'info@brightexled.co.uk', '1618778898', true
    FROM customers WHERE account_number = 'MOOV-0140';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Jack Turner', 'jack@jstsupplies.co.uk', '7463245829', true
    FROM customers WHERE account_number = 'MOOV-0141';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Diana Volkova', 'diana.volkova@moovparcel.co.uk', '1133224100', true
    FROM customers WHERE account_number = 'MOOV-0142';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Artur Olczak', 'rutraolo@gmail.com', '7787787373', true
    FROM customers WHERE account_number = 'MOOV-0143';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Vanessa Mace', 'vanessa@shopbessette.com', '07378573668', true
    FROM customers WHERE account_number = 'MOOV-0144';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'CHRIS MASINGIRI', 'info@contextpneumatics.com', '1204380988', true
    FROM customers WHERE account_number = 'MOOV-0145';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Mark Fursland', 'mark@bentleyandbo.co.uk', '01543304856', true
    FROM customers WHERE account_number = 'MOOV-0146';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Mark Bradshaw', 'mark@smesolutions.co.uk', '1323648666', true
    FROM customers WHERE account_number = 'MOOV-0147';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Edward Austin', 'edward@buffalosystems.co.uk', '07792300812', true
    FROM customers WHERE account_number = 'MOOV-0149';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Peter Fatt', 'peter@eastlondonpackaging.co.uk', '1268288688', true
    FROM customers WHERE account_number = 'MOOV-0150';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Joe Waggott', 'joe@metalpolishingsupplies.co.uk', '7738860126', true
    FROM customers WHERE account_number = 'MOOV-0151';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Steve Dent', 'info@spokz.co.uk', '1543399760', true
    FROM customers WHERE account_number = 'MOOV-0152';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'David Criscuolo', 'info@crisco.co.uk', '7764188675', true
    FROM customers WHERE account_number = 'MOOV-0153';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Ash Lim', 'ash@kettlespotterysupplies.com', '7425421825', true
    FROM customers WHERE account_number = 'MOOV-0154';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Liucija Taylor', 'info@eastcoastcreations.co.uk', '01904236850', true
    FROM customers WHERE account_number = 'MOOV-0155';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Victoria Yardley', 'victoria@etasolutions.co.uk', '1282614780', true
    FROM customers WHERE account_number = 'MOOV-0156';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Samantha Abbey', 'accounts@securitytradeproducts.co.uk', '1763848209', true
    FROM customers WHERE account_number = 'MOOV-0157';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Steve Potter', 'steve@toolforthejob.co.uk', '1296327775', true
    FROM customers WHERE account_number = 'MOOV-0158';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Michael Hardy', 'office@agarhygiene.com', '1509263200', true
    FROM customers WHERE account_number = 'MOOV-0159';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Dominic Greyer', 'domgreyer@hotmail.com', '7932086581', true
    FROM customers WHERE account_number = 'MOOV-0160';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Joe Oliver', 'sales@justcableties.co.uk', '1233661589', true
    FROM customers WHERE account_number = 'MOOV-0161';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'William Sessions', 'will@saic-uk.co.uk', '01273463677', true
    FROM customers WHERE account_number = 'MOOV-0162';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Chris Thorpe', 'chris.thorpe@hpsa.co.uk', '1163193398', true
    FROM customers WHERE account_number = 'MOOV-0163';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Roy Tams', 'roy@jetwashshop.co.uk', '1422374374', true
    FROM customers WHERE account_number = 'MOOV-0164';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Dom Hughes', 'dominic@totalinsignia.co.uk', '01254495300', true
    FROM customers WHERE account_number = 'MOOV-0165';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Robert Gooch', 'robert@wildmeat.co.uk', '7771887311', true
    FROM customers WHERE account_number = 'MOOV-0166';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Grace Bailey', 'baileygrace0@gmail.com', '11111111111', true
    FROM customers WHERE account_number = 'MOOV-0167';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Rob Downham', 'rob.downham@cloud9fulfilment.co.uk', '11111111111', true
    FROM customers WHERE account_number = 'MOOV-0168';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Jake Thompson', 'jake@xplore-brands.com', '7383111113', true
    FROM customers WHERE account_number = 'MOOV-0169';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Gregg Harrison', 'gregg@sherwoodfoods.co.uk', '2886764758', true
    FROM customers WHERE account_number = 'MOOV-0170';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, is_main_contact)
    SELECT id, 'Jamie Mockridge', 'info@jamieferments.com', '07749667207', true
    FROM customers WHERE account_number = 'MOOV-0171';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;