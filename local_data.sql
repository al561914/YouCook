--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: cookbooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.cookbooks DISABLE TRIGGER ALL;

COPY public.cookbooks (id, user_id, name, description, cover_image_url, is_public, created_at, updated_at) FROM stdin;
70361fb3-e033-41b3-a2c5-7fd1a56a8996	62a66677-62ee-428f-894d-4db2dd3ed6de	Finish First	Chase Banks recipes	\N	f	2025-12-26 03:01:18.576739+00	2025-12-26 03:01:18.576739+00
306cd9b6-b13a-486f-a6ac-e49a378570eb	62a66677-62ee-428f-894d-4db2dd3ed6de	Mesa Sana	\N	\N	f	2025-12-26 04:00:58.522964+00	2025-12-26 04:00:58.522964+00
\.


ALTER TABLE public.cookbooks ENABLE TRIGGER ALL;

--
-- Data for Name: foods; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.foods DISABLE TRIGGER ALL;

COPY public.foods (id, user_id, name, name_normalized, brand, source, external_id, serving_size, serving_unit, created_at, updated_at, original_source, serving_description) FROM stdin;
6d2b63d6-1436-4580-9e2f-32a5268435a3	62a66677-62ee-428f-894d-4db2dd3ed6de	Total 0% Milkfat	total 0% milkfat	FAGE	openfoodfacts	0689544080008	150	g	2026-01-02 05:08:16.49153+00	2026-01-02 05:08:16.49153+00	\N	1 container (150 g)
\.


ALTER TABLE public.foods ENABLE TRIGGER ALL;

--
-- Data for Name: food_nutrients; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.food_nutrients DISABLE TRIGGER ALL;

COPY public.food_nutrients (id, food_id, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, cholesterol_mg, saturated_fat_g, trans_fat_g, vitamin_a_iu, vitamin_c_mg, calcium_mg, iron_mg, potassium_mg, created_at, updated_at) FROM stdin;
b7ded3bc-e49f-43f5-a977-0238daf30f1d	6d2b63d6-1436-4580-9e2f-32a5268435a3	80	16	5	\N	\N	5	55	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 05:08:16.510043+00	2026-01-02 05:08:16.510043+00
\.


ALTER TABLE public.food_nutrients ENABLE TRIGGER ALL;

--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recipes DISABLE TRIGGER ALL;

COPY public.recipes (id, cookbook_id, user_id, title, description, source_type, source_url, servings, prep_time_minutes, cook_time_minutes, total_time_minutes, difficulty, raw_ingredients_text, raw_procedure_text, parsing_status, parsing_error, cover_image_url, is_public, created_at, updated_at, import_metadata) FROM stdin;
be204fcf-8437-4cf2-8a43-bbc6ec64c512	70361fb3-e033-41b3-a2c5-7fd1a56a8996	62a66677-62ee-428f-894d-4db2dd3ed6de	Almond Butter Power Muffins	\N	manual	\N	6	10	15	\N	easy	1 Banana - med 8"\n2 1/2 cup Bob's red mill bend quick oats\n2 table spoon Almond Butter\n1 scoop Designs for Health - PurePea\n1 large Egg, white, raw\n1 tea spoon Vanilla extract\n0.5 tea spoon Cinnamon\n1 0.5 teaspoon Leavening agents, baking soda\n1 table spoon Chocolate Chips - SunSpire Carob Chips	1. Preheat oven to 350 degrees F\n2. Smash the banana and grid up the oats into almost flour\n3. Mix everything in a large bowl except the chocolate chips add those in after everything is well mixed\n4. Spray muffin tin with non stick cooking spray\n5. Fill the muffin tin and cook for 12-15 min or until done	parsed	\N	\N	f	2025-12-26 03:08:45.863495+00	2025-12-26 03:09:14.395448+00	\N
502f8201-6063-4a06-8fcc-9f950359b6af	70361fb3-e033-41b3-a2c5-7fd1a56a8996	62a66677-62ee-428f-894d-4db2dd3ed6de	All Natural Chicken Salad	\N	manual	\N	8	20	\N	\N	easy	0.5 cup chopped Celery, raw\n24 ounce(s) Chicken Breast / White Meat\n30 grape(s) Grapes, red or green, raw\n30 almonds\n0.5 teaspoon Sea Salt\n0.5 teaspoon Spices, onion powder\n0.5 teaspoon Spices, pepper, black\n0.5 teaspoon Spices, pepper, red or cayenne\n8 ounce(s) Yogurt Greek 0%	Cook chicken then dice, chop up nuts/grapes and mix all together	parsed	\N	\N	f	2025-12-26 03:20:52.262298+00	2025-12-26 03:21:02.675851+00	\N
750fa7ac-c2ca-403d-8883-f375e63e8fa5	70361fb3-e033-41b3-a2c5-7fd1a56a8996	62a66677-62ee-428f-894d-4db2dd3ed6de	Lime Cilantro Bison Tacos	\N	manual	\N	4	20	15	\N	medium	2 avocados\n16 ounce(s) Bison lean cooked\n0.5 1/4 cup Cilantro\n0.5 table spoon Coconut Oil (Nature's Way)\n1 each jalapenos\n8 1 leaf, large Lettuce, butterhead, raw\n2 1 fl oz Lime juice, raw\n0.5 1 cup, chopped Onions, raw\n0.5 table spoon Pepper - black, ground\n0.5 tea spoon Sea Salt\n0.5 1 cup Soup, chicken broth, low sodium, canned\n2 small Tomato - sm. w/peel, 2.5" diam.	1. Wash and chop onion, jalapeno, cilantro and tomatoes.\n2. Season bison with sea salt and freshly ground black pepper.\n3. Heat a large nonstick skillet over medium-high heat. When hot, add coconut oil to pan.\n4. Sauté bison until lightly browned, about 4 minutes. Remove bison from pan and place in a bowl.\n5. Add onion and jalapeno to hot pan, and sauté until tender.\n6. Add broth and tomatoes, and reduce heat to low. Simmer two more minutes, scraping pan sides and bottom to loosen any browned bits.\n7. Return bison and juices to pan. Stir in lime juice and simmer until bison is fully cooked.\n8. Top with fresh cilantro and avocado, and wrap with butter lettuce leaves to serve.	parsed	\N	\N	f	2025-12-26 03:27:50.217891+00	2025-12-26 03:28:22.660016+00	\N
619abcba-1e26-4bfc-8bbb-4df264de2891	70361fb3-e033-41b3-a2c5-7fd1a56a8996	62a66677-62ee-428f-894d-4db2dd3ed6de	Turkey Meatloaf Muffins	\N	manual	\N	16	25	35	\N	medium	3 large Egg, white, raw\n1/4 cup Oats, Steel Cut - Gluten Free Bob's Red Mill\n1 cup, chopped Onions, raw\n0.5 table spoon Pepper - black, ground\n0.25 1 tablespoon Spices, cumin seed\n2 tablespoon Spices, garlic powder\n0.5 1 tablespoon Spices, pepper, red or cayenne\n32 ounce(s) Turkey, ground, extra lean	1. Preheat Oven to 375\n2. Spray muffin pan with PAM\n3. Mix all ingrediants together in a large bowl\n4. Roll mixture in a raquet ball size and place in pan\n5. Bake for 30 minutes and check, cook 5-10 minutes longer if needed\n6. Makes 16 servings	parsed	\N	\N	f	2025-12-26 03:34:45.346005+00	2025-12-26 03:34:57.801244+00	\N
a74db00d-813d-46ae-b507-0a9092ee0b73	306cd9b6-b13a-486f-a6ac-e49a378570eb	62a66677-62ee-428f-894d-4db2dd3ed6de	Lomo de Cerdo con Salsa de Ciruela	Mesa Sana - Roasted pork loin with plum sauce	manual	\N	1	30	40	\N	hard	800 g de lomo de cerdo\nSal y pimienta\n3 cdas de romero fresco picado\n\nPara la salsa:\n1 bote de 360 ml de salsa de ciruela de @gavillamx\n1 chile chipotle de lata, desvenado y sin semillas\n1/2 taza de caldo de pollo o res\n1 cda de aceite de oliva\nRamitas de romero para decorar	1. Precalienta el horno a 180 - 190°C. (La temperatura baja ayuda que no se seque)\n2. Sal-pimienta el lomo de cerdo y cubre con romero fresco picado\n3. Prepara la salsa licuando la salsa de ciruela con 1 chile chipotle y el caldo de res o pollo\n4. En un sartén, agrega el aceite y sella el lomo de cerdo de 1-2 minutos por lado\n5. Pasa el lomo a un refractario y vierte la salsa encima. Hornea durante 40 minutos o hasta que la temperatura interna llegue a 63°C. (Esto se llama para que no se seque)\n6. Saca el lomo del pyrex y déjalo reposar durante 10 mins antes de rebanar\n7. Rebana el lomo y baña con la salsa caliente\n8. Decora con las ramitas de romero y sirve	parsed	\N	\N	f	2025-12-26 04:10:15.51494+00	2025-12-26 04:10:30.717985+00	\N
22ff31ee-4456-48b1-ae21-97e9f435524f	70361fb3-e033-41b3-a2c5-7fd1a56a8996	62a66677-62ee-428f-894d-4db2dd3ed6de	Lean Ground Turkey Lettuce Wraps	Paleo DR ground turkey lettuce wraps	manual	\N	4	\N	\N	\N	medium	1 avocado\n3 tea spoon Bragg's Liquid Amino's\n1 cup, chopped Carrots, raw\n1 cup, chopped Celery, raw\n6 leaf, large Lettuce, iceberg, raw\n1 cup, pieces or slices Mushrooms, raw\n4 tea spoon San-J Glazing and Dipping Sauce Szechuan\n1 tablespoon Spices, garlic powder\n1 tablespoon Spices, onion powder\n20 ounce(s) Turkey, ground, extra lean	1. Brown turkey breast with Szechuan seasoning and half of the garlic and onion powder.\n2. When almost brown, add vegetables and stir-fry until crisp tender; adding the rest of the garlic and onion powder and the soy sauce.\n3. Combine all with avocado and serve with in lettuce leaves.	parsed	\N	\N	f	2025-12-26 04:18:02.342087+00	2025-12-26 04:18:14.837246+00	\N
\.


ALTER TABLE public.recipes ENABLE TRIGGER ALL;

--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recipe_ingredients DISABLE TRIGGER ALL;

COPY public.recipe_ingredients (id, recipe_id, food_id, order_index, quantity, unit, name, preparation, original_text, match_status, match_confidence, match_candidates, created_at, updated_at) FROM stdin;
4b6c51b0-46ee-4c30-88ee-a857eae162a3	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	0	1	\N	banana	med 8"	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
899fa6b3-ad97-464b-8db7-db70a9d5fb95	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	1	2.5	cup	Bob's red mill bend quick oats	\N	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
80ad7f0a-44a4-4489-8537-b552a97f9517	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	2	2	tbsp	almond butter	\N	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
4fcabc8a-0052-478e-8d35-5106fa9e4ba5	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	3	1	scoop	Designs for Health - PurePea	\N	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
82c4a116-5c96-49bb-801e-fc1ebf315ac3	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	4	1	\N	egg white	raw, large	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
8152eb9e-5b70-465f-83f6-c526d69b491d	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	5	1	tsp	vanilla extract	\N	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
51a4aa3b-723e-4b06-8de7-f3847c5f49ca	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	6	0.5	tsp	cinnamon	\N	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
acd2bac1-319e-4879-ab53-e8714d97a5f7	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	7	1.5	tsp	baking soda	\N	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
aac53112-e512-4cbd-ac65-d274ae30db14	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	8	1	tbsp	SunSpire Carob Chips	\N	\N	unmatched	\N	[]	2025-12-26 03:09:14.385839+00	2025-12-26 03:09:14.385839+00
22555844-3657-4c52-b6fd-96681aef66f4	502f8201-6063-4a06-8fcc-9f950359b6af	\N	0	0.5	cup	Celery	chopped	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
a7ccc437-a36a-4b5f-a768-8b63e61809aa	502f8201-6063-4a06-8fcc-9f950359b6af	\N	1	24	oz	Chicken Breast	\N	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
7bef9a53-f4d9-4880-ade5-577b37ebb1b5	502f8201-6063-4a06-8fcc-9f950359b6af	\N	2	30	grape	Grapes	raw	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
59ea3f24-c633-4d5f-8856-c4febbf36668	502f8201-6063-4a06-8fcc-9f950359b6af	\N	3	30	\N	Almonds	\N	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
36e7d20c-bce8-4e70-ac1a-b198fedba31d	502f8201-6063-4a06-8fcc-9f950359b6af	\N	4	0.5	tsp	Sea Salt	\N	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
12fb6175-02b6-4845-9ac4-5a231acb1434	502f8201-6063-4a06-8fcc-9f950359b6af	\N	5	0.5	tsp	Onion Powder	\N	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
cf5d77c0-4ce8-4c18-ac6e-4ad99e88ea14	502f8201-6063-4a06-8fcc-9f950359b6af	\N	6	0.5	tsp	Black Pepper	\N	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
f148dd0c-9b8c-45cf-b458-a96143165a6d	502f8201-6063-4a06-8fcc-9f950359b6af	\N	7	0.5	tsp	Cayenne Pepper	\N	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
5a8697ec-22c0-4e78-bc31-9bc333c25e3f	502f8201-6063-4a06-8fcc-9f950359b6af	\N	8	8	oz	Greek Yogurt	\N	\N	unmatched	\N	[]	2025-12-26 03:21:02.663095+00	2025-12-26 03:21:02.663095+00
c198c2a5-0148-40b5-b166-dd9f9aabd770	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	0	2	\N	avocados	\N	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
84ac79f5-a0f8-409e-889a-1752447f4a3e	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	1	16	oz	bison	lean, cooked	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
1dd965ba-1293-4cd2-abf1-f845bad52a9b	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	2	0.25	cup	cilantro	\N	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
eeea9633-a43c-4f4c-9b63-4ef301bb1b3c	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	3	0.5	tbsp	coconut oil	Nature's Way	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
4a27d222-8a0a-44bc-87f7-e9c786ca4c64	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	4	1	each	jalapenos	\N	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
e337eb6f-bdaf-4707-9dd5-88d55f168ca4	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	5	1	leaf	lettuce	butterhead, raw, large	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
cf140a84-f389-43b5-8cf6-cc9e64e98272	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	6	2	fl oz	lime juice	raw	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
c0e291e5-f452-428d-8430-4bd51b79e5ac	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	7	0.5	cup	onions	raw, chopped	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
61bb1ba5-a01b-46d3-8905-d9abd04a93ce	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	8	0.5	tbsp	black pepper	ground	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
b3da1fec-27fc-41dd-88bc-e53819cea4af	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	9	0.5	tsp	sea salt	\N	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
85871cd5-fd45-4ea4-b1b8-adcbaf7e3695	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	10	0.5	cup	chicken broth	low sodium, canned	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
447e9d50-4095-4646-b430-b8b682311956	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	11	2	\N	tomatoes	small, with peel, 2.5" diameter	\N	unmatched	\N	[]	2025-12-26 03:28:22.650471+00	2025-12-26 03:28:22.650471+00
1355ef40-7207-4905-ae17-36b65b2dd06b	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	0	3	\N	egg white	raw	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
925d7b47-75ae-4301-94cc-a5a0ecaac57e	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	1	0.25	cup	oats, steel cut	gluten free	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
dcc7635a-e4fa-450b-b34d-fd5fe47693fd	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	2	1	cup	onions	chopped	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
43d99fb4-4a80-4488-8904-4c3dedaedf5d	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	3	0.5	tbsp	black pepper	ground	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
f8055987-ac1d-47f3-b101-b366fab64ffb	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	4	0.25	tbsp	cumin seed	\N	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
3c29c308-1f67-42fe-bb78-a45acfe4b4a1	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	5	2	tbsp	garlic powder	\N	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
334391f7-90d9-404e-aa44-d7c17208ec45	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	6	0.5	tbsp	red pepper	\N	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
8d7dfa7d-bbc0-4d66-8e3b-ab19f2ee6d85	619abcba-1e26-4bfc-8bbb-4df264de2891	\N	7	32	oz	ground turkey	extra lean	\N	unmatched	\N	[]	2025-12-26 03:34:57.775864+00	2025-12-26 03:34:57.775864+00
15bd0835-88d0-49e8-99cd-9b9578d3b27d	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	0	800	g	lomo de cerdo	\N	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
63506334-34f5-4747-a2a5-e9b1ce840891	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	1	\N	\N	sal	\N	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
890f412b-1eb8-432d-a191-858e2bdf5430	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	2	\N	\N	pimienta	\N	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
f4405584-5212-4f36-ab2d-e1d1a0f5116c	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	3	3	cdas	romero fresco	picado	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
f14f49bb-36d2-4608-90ee-2be039bee86e	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	4	360	ml	salsa de ciruela	\N	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
261f1d5c-b824-4d85-946d-a94ca3e75fc5	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	5	1	\N	chile chipotle	desvenado y sin semillas	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
e75c294f-080c-4451-ba30-8808be975372	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	6	0.5	taza	caldo de pollo o res	\N	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
e9c57b25-d815-4378-866a-d9e1645851cd	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	7	1	cda	aceite de oliva	\N	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
2b12d9a5-7b77-4b94-8d56-8eecfdc316ac	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	8	\N	\N	romero	ramitas para decorar	\N	unmatched	\N	[]	2025-12-26 04:10:30.704703+00	2025-12-26 04:10:30.704703+00
77f5df29-552e-4bdf-a6c9-c2e2ad1fc71c	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	0	1	\N	avocado	\N	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
ba040e75-62fd-4293-aa04-5cf518c62a39	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	1	3	tsp	Bragg's Liquid Amino's	\N	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
b499b2aa-5e06-4edc-afc6-1983db4e7142	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	2	1	cup	carrots	chopped	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
2a32293b-d578-41f2-bc20-1104fb4c4d9c	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	3	1	cup	celery	chopped	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
bd494d10-f3e7-4f52-86d5-4ae1ecec3ff3	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	4	6	leaf	lettuce	large, iceberg	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
14faf708-fc0c-435d-8f22-730c5f2206b2	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	5	1	cup	mushrooms	pieces or slices	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
f297e9de-6441-42fa-b24b-e109403f20c2	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	6	4	tsp	San-J Glazing and Dipping Sauce Szechuan	\N	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
ad60aa13-eb61-489e-9654-97fc1622e7c8	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	7	1	tbsp	garlic powder	\N	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
e3c7c8b5-cf34-4549-98e3-7cf1a2a9ebe4	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	8	1	tbsp	onion powder	\N	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
3715b718-25fc-4489-95ea-ddefbbbec9c0	22ff31ee-4456-48b1-ae21-97e9f435524f	\N	9	20	oz	turkey	ground, extra lean	\N	unmatched	\N	[]	2025-12-26 04:18:14.82641+00	2025-12-26 04:18:14.82641+00
\.


ALTER TABLE public.recipe_ingredients ENABLE TRIGGER ALL;

--
-- Data for Name: recipe_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recipe_steps DISABLE TRIGGER ALL;

COPY public.recipe_steps (id, recipe_id, step_number, instruction, duration_minutes, duration_label, temperature_f, original_text, created_at, updated_at) FROM stdin;
397efb90-f04f-4f96-aa75-9afbb2605fad	be204fcf-8437-4cf2-8a43-bbc6ec64c512	1	Preheat oven to 350 degrees F	\N	\N	\N	\N	2025-12-26 03:09:14.391195+00	2025-12-26 03:09:14.391195+00
ba3cd389-19b1-4b54-b1d2-fd2c22448b3b	be204fcf-8437-4cf2-8a43-bbc6ec64c512	2	Smash the banana and grid up the oats into almost flour	\N	\N	\N	\N	2025-12-26 03:09:14.391195+00	2025-12-26 03:09:14.391195+00
5cca6db8-0174-4608-aaa5-8c91c422d1d0	be204fcf-8437-4cf2-8a43-bbc6ec64c512	3	Mix everything in a large bowl except the chocolate chips add those in after everything is well mixed	\N	\N	\N	\N	2025-12-26 03:09:14.391195+00	2025-12-26 03:09:14.391195+00
733732ad-bdd0-48f8-b1d3-73f884b612d1	be204fcf-8437-4cf2-8a43-bbc6ec64c512	4	Spray muffin tin with non stick cooking spray	\N	\N	\N	\N	2025-12-26 03:09:14.391195+00	2025-12-26 03:09:14.391195+00
326006e7-5544-4092-aea3-c72880959f17	be204fcf-8437-4cf2-8a43-bbc6ec64c512	5	Fill the muffin tin and cook for 12-15 min or until done	15	\N	\N	\N	2025-12-26 03:09:14.391195+00	2025-12-26 03:09:14.391195+00
468ad9b1-2de6-45ac-802a-bc7384cf5a26	502f8201-6063-4a06-8fcc-9f950359b6af	1	Cook chicken	\N	\N	\N	\N	2025-12-26 03:21:02.670679+00	2025-12-26 03:21:02.670679+00
b1fcfc7a-0b95-4126-aaa2-9e614cd9e6dd	502f8201-6063-4a06-8fcc-9f950359b6af	2	Dice chicken	\N	\N	\N	\N	2025-12-26 03:21:02.670679+00	2025-12-26 03:21:02.670679+00
b0ec0a62-9baf-4e8f-92f7-d7df9a62d211	502f8201-6063-4a06-8fcc-9f950359b6af	3	Chop up nuts and grapes	\N	\N	\N	\N	2025-12-26 03:21:02.670679+00	2025-12-26 03:21:02.670679+00
0ed641df-19eb-4ce2-aeb0-9435122e0f2d	502f8201-6063-4a06-8fcc-9f950359b6af	4	Mix all together	\N	\N	\N	\N	2025-12-26 03:21:02.670679+00	2025-12-26 03:21:02.670679+00
30dd6719-5bae-4d87-809b-9557859f9401	750fa7ac-c2ca-403d-8883-f375e63e8fa5	1	Wash and chop onion, jalapeno, cilantro and tomatoes.	\N	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
9f2f7a75-ef78-44b2-8a1d-1f36c618499d	750fa7ac-c2ca-403d-8883-f375e63e8fa5	2	Season bison with sea salt and freshly ground black pepper.	\N	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
181a9616-52c2-43ed-948f-74937231fd8c	750fa7ac-c2ca-403d-8883-f375e63e8fa5	3	Heat a large nonstick skillet over medium-high heat. When hot, add coconut oil to pan.	\N	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
da5e87db-349d-44a9-b22a-21abd7f13884	750fa7ac-c2ca-403d-8883-f375e63e8fa5	4	Sauté bison until lightly browned, about 4 minutes. Remove bison from pan and place in a bowl.	4	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
d22ffe03-9596-453e-87b4-69a2f631001e	750fa7ac-c2ca-403d-8883-f375e63e8fa5	5	Add onion and jalapeno to hot pan, and sauté until tender.	\N	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
baff6b58-7cde-44b7-ac75-2a5da77f245d	750fa7ac-c2ca-403d-8883-f375e63e8fa5	6	Add broth and tomatoes, and reduce heat to low. Simmer two more minutes, scraping pan sides and bottom to loosen any browned bits.	2	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
7dfe35e6-4649-4f69-b5fc-bac583d70d40	750fa7ac-c2ca-403d-8883-f375e63e8fa5	7	Return bison and juices to pan. Stir in lime juice and simmer until bison is fully cooked.	\N	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
dfc01688-d828-46dd-b4e5-e85635be8e10	750fa7ac-c2ca-403d-8883-f375e63e8fa5	8	Top with fresh cilantro and avocado, and wrap with butter lettuce leaves to serve.	\N	\N	\N	\N	2025-12-26 03:28:22.655765+00	2025-12-26 03:28:22.655765+00
0bf46ca1-0940-4921-9b20-9c5d0c300c99	619abcba-1e26-4bfc-8bbb-4df264de2891	1	Preheat Oven to 375	\N	\N	\N	\N	2025-12-26 03:34:57.790256+00	2025-12-26 03:34:57.790256+00
63e11b4e-303e-46a7-88a2-b842c5815219	619abcba-1e26-4bfc-8bbb-4df264de2891	2	Spray muffin pan with PAM	\N	\N	\N	\N	2025-12-26 03:34:57.790256+00	2025-12-26 03:34:57.790256+00
97744102-fc39-4962-bfdb-a39fc1b0b681	619abcba-1e26-4bfc-8bbb-4df264de2891	3	Mix all ingrediants together in a large bowl	\N	\N	\N	\N	2025-12-26 03:34:57.790256+00	2025-12-26 03:34:57.790256+00
78966844-d760-4861-ad77-da9472972f18	619abcba-1e26-4bfc-8bbb-4df264de2891	4	Roll mixture in a raquet ball size and place in pan	\N	\N	\N	\N	2025-12-26 03:34:57.790256+00	2025-12-26 03:34:57.790256+00
6022850a-439c-4272-a602-e3e4c450b716	619abcba-1e26-4bfc-8bbb-4df264de2891	5	Bake for 30 minutes and check, cook 5-10 minutes longer if needed	40	\N	\N	\N	2025-12-26 03:34:57.790256+00	2025-12-26 03:34:57.790256+00
ed693bd8-c9d7-4c6f-9037-4f14b5705c07	619abcba-1e26-4bfc-8bbb-4df264de2891	6	Makes 16 servings	\N	\N	\N	\N	2025-12-26 03:34:57.790256+00	2025-12-26 03:34:57.790256+00
06203cb2-626a-45b3-a816-a800345204da	a74db00d-813d-46ae-b507-0a9092ee0b73	1	Precalienta el horno a 180 - 190°C. (La temperatura baja ayuda que no se seque)	\N	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
4fcc242a-896e-458d-8a17-fbf1744534ff	a74db00d-813d-46ae-b507-0a9092ee0b73	2	Sal-pimienta el lomo de cerdo y cubre con romero fresco picado	\N	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
1f5bb06c-14b7-42d6-b31e-00a810efbc7c	a74db00d-813d-46ae-b507-0a9092ee0b73	3	Prepara la salsa licuando la salsa de ciruela con 1 chile chipotle y el caldo de res o pollo	\N	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
5b00d1b4-f81a-4eb8-83f9-60219432a60f	a74db00d-813d-46ae-b507-0a9092ee0b73	4	En un sartén, agrega el aceite y sella el lomo de cerdo de 1-2 minutos por lado	2	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
b59459c9-017e-462d-94ba-53c430bf67b3	a74db00d-813d-46ae-b507-0a9092ee0b73	5	Pasa el lomo a un refractario y vierte la salsa encima. Hornea durante 40 minutos o hasta que la temperatura interna llegue a 63°C. (Esto se llama para que no se seque)	40	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
0396d481-7b10-4ad6-b54e-ab6b90bddf58	a74db00d-813d-46ae-b507-0a9092ee0b73	6	Saca el lomo del pyrex y déjalo reposar durante 10 mins antes de rebanar	10	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
b26a0bbb-60f2-431b-b48d-232922d0feee	a74db00d-813d-46ae-b507-0a9092ee0b73	7	Rebana el lomo y baña con la salsa caliente	\N	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
41e07649-e3c1-45af-b023-91004ac36dd5	a74db00d-813d-46ae-b507-0a9092ee0b73	8	Decora con las ramitas de romero y sirve	\N	\N	\N	\N	2025-12-26 04:10:30.711913+00	2025-12-26 04:10:30.711913+00
5923738e-ae44-4c87-9f25-b9d2df71d88a	22ff31ee-4456-48b1-ae21-97e9f435524f	1	Brown turkey breast with Szechuan seasoning and half of the garlic and onion powder.	\N	\N	\N	\N	2025-12-26 04:18:14.831984+00	2025-12-26 04:18:14.831984+00
15acfed8-3994-46a0-91fd-48d9875b9b6d	22ff31ee-4456-48b1-ae21-97e9f435524f	2	When almost brown, add vegetables and stir-fry until crisp tender; adding the rest of the garlic and onion powder and the soy sauce.	\N	\N	\N	\N	2025-12-26 04:18:14.831984+00	2025-12-26 04:18:14.831984+00
0c258df1-ea22-4657-9baf-b604250fd859	22ff31ee-4456-48b1-ae21-97e9f435524f	3	Combine all with avocado and serve with in lettuce leaves.	\N	\N	\N	\N	2025-12-26 04:18:14.831984+00	2025-12-26 04:18:14.831984+00
\.


ALTER TABLE public.recipe_steps ENABLE TRIGGER ALL;

--
-- Data for Name: recipe_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recipe_media DISABLE TRIGGER ALL;

COPY public.recipe_media (id, recipe_id, step_id, media_type, url, caption, order_index, created_at) FROM stdin;
9e42161f-42e5-4bb8-b2db-59accc9174ea	be204fcf-8437-4cf2-8a43-bbc6ec64c512	\N	image	http://127.0.0.1:54321/storage/v1/object/public/recipe-media/62a66677-62ee-428f-894d-4db2dd3ed6de/be204fcf-8437-4cf2-8a43-bbc6ec64c512/1766718538145-nlz94g.png	\N	0	2025-12-26 03:08:58.273525+00
a4678b4c-949e-4d04-bb2f-06f8a3ee37d0	502f8201-6063-4a06-8fcc-9f950359b6af	\N	image	http://127.0.0.1:54321/storage/v1/object/public/recipe-media/62a66677-62ee-428f-894d-4db2dd3ed6de/502f8201-6063-4a06-8fcc-9f950359b6af/1766719286266-ka2i5b.jpg	\N	0	2025-12-26 03:21:26.337181+00
9613b683-9d30-45d5-b713-6633cc3477cd	750fa7ac-c2ca-403d-8883-f375e63e8fa5	\N	image	http://127.0.0.1:54321/storage/v1/object/public/recipe-media/62a66677-62ee-428f-894d-4db2dd3ed6de/750fa7ac-c2ca-403d-8883-f375e63e8fa5/1766719876385-0y2o8k.jpg	\N	0	2025-12-26 03:31:16.471402+00
acd6a49a-f3f5-4453-ab4c-1073bc910c4d	a74db00d-813d-46ae-b507-0a9092ee0b73	\N	image	http://127.0.0.1:54321/storage/v1/object/public/recipe-media/62a66677-62ee-428f-894d-4db2dd3ed6de/a74db00d-813d-46ae-b507-0a9092ee0b73/1766722319266-ag6v9.jpg	\N	0	2025-12-26 04:11:59.399283+00
\.


ALTER TABLE public.recipe_media ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

