SET session_replication_role = replica;

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '57b20005-0401-468c-b99b-a01079f52f24', '{"action":"user_confirmation_requested","actor_id":"399361f7-2d4f-4def-b622-20cae4df60f9","actor_username":"two@mail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-10 10:44:58.172435+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ea74e2f8-2cbf-433b-951c-eaafd7a68560', '{"action":"user_confirmation_requested","actor_id":"893ca295-5d83-4a69-b774-ab45aa91003c","actor_username":"ll@beans.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-16 04:21:21.969775+00', ''),
	('00000000-0000-0000-0000-000000000000', '8631585e-573d-455e-b5f5-e822c7ce4bf0', '{"action":"user_confirmation_requested","actor_id":"893ca295-5d83-4a69-b774-ab45aa91003c","actor_username":"ll@beans.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-16 05:24:26.632821+00', ''),
	('00000000-0000-0000-0000-000000000000', '02d7216c-180f-4dce-9314-191879b274d1', '{"action":"user_confirmation_requested","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-06-17 04:12:45.874474+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e030febf-2978-4e6c-b90e-087a8e9158a9', '{"action":"user_signedup","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"team"}', '2025-06-17 04:13:48.944378+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b03ae8a-6d60-4e37-8a3e-b16f73f02524', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-17 04:40:48.693947+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0ad1f60-babb-4742-a970-0a3fab914c96', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-17 05:43:50.334742+00', ''),
	('00000000-0000-0000-0000-000000000000', '87c3e216-f714-474c-83dd-d777bd25a1a2', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-17 05:43:50.335592+00', ''),
	('00000000-0000-0000-0000-000000000000', '93280728-c47d-4df3-b3c3-a40f0a48cc70', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-17 06:54:34.550024+00', ''),
	('00000000-0000-0000-0000-000000000000', '600dd099-cbfa-4b27-b58f-4b740abdb750', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-17 06:54:34.553532+00', ''),
	('00000000-0000-0000-0000-000000000000', '5e48cd68-b277-423d-9985-ed8c74729eb7', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-18 04:46:37.854158+00', ''),
	('00000000-0000-0000-0000-000000000000', '810d45a9-288a-4c85-90fc-2478006c6ab8', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-06-18 04:46:37.862326+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b1d94b4a-4a32-42c8-af4c-b99393910726', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-06-18 04:47:30.019803+00', ''),
	('00000000-0000-0000-0000-000000000000', '7aae83ae-9d1a-4ec0-9dac-998877476f3f', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 02:58:35.607984+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bffe6597-e9b8-44a4-86aa-44200d56f60e', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 02:58:35.612369+00', ''),
	('00000000-0000-0000-0000-000000000000', '34ed76b1-3907-496f-9edd-e8b7f51e63dc', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-08 02:58:37.616546+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c5bb82e0-c73b-409e-863b-b266caae5563', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 05:35:07.522644+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b2da5704-a3d3-4047-b021-60df914635e1', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-08 05:35:07.52345+00', ''),
	('00000000-0000-0000-0000-000000000000', '241d78ed-0eef-44de-80fd-323dc6b9ba44', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-08 05:35:09.734299+00', ''),
	('00000000-0000-0000-0000-000000000000', '9edf070b-ecbf-4c03-ac99-6c4777df3577', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-08 06:47:38.967779+00', ''),
	('00000000-0000-0000-0000-000000000000', '546be49d-735d-41c3-bda0-b1ddc65b097d', '{"action":"user_repeated_signup","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-08 07:09:55.996195+00', ''),
	('00000000-0000-0000-0000-000000000000', '6912e0db-451e-4476-b217-1fd4b5dca87a', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-08 07:17:46.449328+00', ''),
	('00000000-0000-0000-0000-000000000000', '215a7d1b-5569-4021-b5a9-0927f78d89ca', '{"action":"user_repeated_signup","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-08 07:18:17.719129+00', ''),
	('00000000-0000-0000-0000-000000000000', '9169b3b8-4545-4725-b196-32ba490483a9', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 19:16:12.488517+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ca7fb514-c3a8-4f0f-a473-9f6073074f75', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 19:16:12.501467+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e880b6a4-04ae-4992-8d40-81ae6528b7cc', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-12 19:21:54.975255+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c3a3c01a-c1b9-4072-aeca-c1a6981e2924', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-12 19:45:21.279708+00', ''),
	('00000000-0000-0000-0000-000000000000', '580bfddc-af31-4cd4-b1f6-76238392aecb', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-12 20:39:11.834771+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e6c4b1d5-55d1-45ec-893c-eb7ff968217a', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-12 20:42:21.647445+00', ''),
	('00000000-0000-0000-0000-000000000000', '787336da-e042-4771-9691-db4fbb7039a6', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-12 21:26:35.845303+00', ''),
	('00000000-0000-0000-0000-000000000000', '44de023f-9dfa-42f5-8308-ef50295c6868', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 23:28:50.455359+00', ''),
	('00000000-0000-0000-0000-000000000000', '4a91e2fd-0ef0-46ec-8690-3e06da515ca6', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-12 23:28:50.457085+00', ''),
	('00000000-0000-0000-0000-000000000000', '93101288-3f21-49d8-9f27-cb720b818502', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-13 02:49:23.320729+00', ''),
	('00000000-0000-0000-0000-000000000000', '5e779d85-dbbd-4d3a-a177-0e056c510159', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-13 03:04:17.727677+00', ''),
	('00000000-0000-0000-0000-000000000000', 'df3f9b92-cd22-4e1a-b24d-c5b27c6b2bf7', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-13 03:24:14.886078+00', ''),
	('00000000-0000-0000-0000-000000000000', '7700411b-6925-4c05-95b4-3ace73a7603f', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 04:03:05.665953+00', ''),
	('00000000-0000-0000-0000-000000000000', '5fddaaf6-ef6f-433a-8169-bca1bba40a28', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 04:03:05.666734+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ffbd570-2398-497b-917d-0e59d2754a16', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 04:41:21.580818+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b83e0d99-385f-4bd3-b1b5-1c1208c5fba1', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 04:41:21.581613+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cedc8890-7ab2-402e-82ad-0af7bf5f90f3', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-13 04:41:32.260506+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b13219bc-9789-4410-8427-8b078d4f794a', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 05:01:15.580836+00', ''),
	('00000000-0000-0000-0000-000000000000', '6ef464fd-9af5-40dd-801a-857a5d5ee783', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-13 05:01:15.581614+00', ''),
	('00000000-0000-0000-0000-000000000000', '73117eb9-bf78-4bb1-bbad-24b70673ee40', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-13 05:16:44.911431+00', ''),
	('00000000-0000-0000-0000-000000000000', '49dcb6ff-c252-4e19-b285-1c98273aff13', '{"action":"user_recovery_requested","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-07-22 04:32:46.91464+00', ''),
	('00000000-0000-0000-0000-000000000000', '39e96bb8-13ae-4e13-b7e3-f6e2126ed54b', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-22 04:36:55.3642+00', ''),
	('00000000-0000-0000-0000-000000000000', '4a418310-bbc9-4629-85bc-80ef90cbb1d2', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 04:37:24.765476+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cdbc0b7e-3aae-4c7e-8f91-67163c433dda', '{"action":"user_recovery_requested","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-07-22 05:00:41.948684+00', ''),
	('00000000-0000-0000-0000-000000000000', '93a08383-5c01-4c7b-8ff1-83aa6380062a', '{"action":"user_recovery_requested","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-07-22 05:02:49.201114+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9caf742-428f-424f-a8f2-ac6587d97412', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-22 05:03:34.288068+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd7b297e3-e250-4ba9-929e-8c9ce318576e', '{"action":"user_recovery_requested","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-07-22 05:12:09.090531+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ffef0401-db07-470f-b311-5091c4540e3d', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-22 05:12:45.439883+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc8489c1-ceac-4db7-b49c-1700f95421e2', '{"action":"user_recovery_requested","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user"}', '2025-07-22 05:15:19.019836+00', ''),
	('00000000-0000-0000-0000-000000000000', '7db8af7a-3331-4f42-b124-ef4c8c500943', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-22 05:15:50.708776+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd6f3f5ff-718f-4d84-91b6-7e5beee2c0fd', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 05:16:30.711147+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fac9f529-e121-4779-ac5b-d3d05dfa224a', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 05:16:52.664967+00', ''),
	('00000000-0000-0000-0000-000000000000', '632de427-d3a3-4bd8-97cb-89df253c4366', '{"action":"user_repeated_signup","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-22 05:26:55.750691+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd5b47c02-c41a-475f-8e85-e160fca15b44', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 06:15:07.738624+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f7d6012-b284-4807-97a7-4510fe068a3b', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 06:15:07.739475+00', ''),
	('00000000-0000-0000-0000-000000000000', '332de7ac-d062-4363-b333-fa02d9e9d634', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 06:37:14.298233+00', ''),
	('00000000-0000-0000-0000-000000000000', '2f3f677a-6825-4e7b-9a44-582bd1f80540', '{"action":"user_repeated_signup","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-22 06:44:36.59601+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bf432979-f756-4483-9e5e-3401fdcf48c8', '{"action":"user_repeated_signup","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-22 07:09:39.05739+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ea0a2860-0c57-47d6-8963-b760541c2fa7', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 07:21:55.77243+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bb2fe972-4ed3-4495-a282-092172e3c5ca', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 07:22:24.564985+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b79aa3d8-7d18-49b8-9a3c-b62e16490cdd', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 07:22:24.565561+00', ''),
	('00000000-0000-0000-0000-000000000000', '4f5cf961-e636-45d7-82da-bd94770a1ff9', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 07:22:36.671973+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2d5962a-59e4-413a-bb8e-13bc8cbbddd8', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 07:23:12.813579+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b908ae00-aa14-479e-83b3-8c47dcf14091', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 07:23:42.234543+00', ''),
	('00000000-0000-0000-0000-000000000000', '919de22f-6d2b-466c-8028-ed4fb78dc4e3', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 07:24:26.806008+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f7ca5fd4-2d40-4d2c-ba54-4c51e68ebb2e', '{"action":"login","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-22 07:45:14.860159+00', ''),
	('00000000-0000-0000-0000-000000000000', '40695b00-a96d-446b-b5a1-1c777c980901', '{"action":"token_refreshed","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-23 04:57:34.444364+00', ''),
	('00000000-0000-0000-0000-000000000000', '099c0321-6417-4ca5-a8cf-3fdfb16a3e65', '{"action":"token_revoked","actor_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-23 04:57:34.451258+00', ''),
	('00000000-0000-0000-0000-000000000000', '335cb1e5-b6ee-4447-98e9-855803111d84', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"ll@beans.com","user_id":"893ca295-5d83-4a69-b774-ab45aa91003c","user_phone":""}}', '2025-07-23 05:00:47.509431+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4a5190a-b972-480e-9c26-79c78242a6ea', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"dmstest49@gmail.com","user_id":"2110356c-d7eb-4225-b957-803ccfdcdd5b","user_phone":""}}', '2025-07-23 05:00:47.532741+00', ''),
	('00000000-0000-0000-0000-000000000000', '7229046a-b924-42ae-8d1a-f7e9696de948', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"two@mail.com","user_id":"399361f7-2d4f-4def-b622-20cae4df60f9","user_phone":""}}', '2025-07-23 05:00:47.545664+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dee2b38a-4088-474c-9be9-5fbdf75403e7', '{"action":"user_confirmation_requested","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-03 10:42:42.905197+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c2bc799f-fdb9-4b51-823b-167cf2348008', '{"action":"user_signedup","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-03 10:45:08.448931+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f08c9cb1-2158-43eb-8f9f-f701a782a1d7', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-03 11:55:52.048273+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f16c6fd-7248-42dd-8ee7-e17ad4c57531', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-03 11:55:52.050536+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b84d66b4-6c95-427e-ba30-847a7cf28667', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-03 12:47:33.151743+00', ''),
	('00000000-0000-0000-0000-000000000000', '2319c8d2-d499-49a7-a583-1a04495c3448', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-05 02:45:52.836325+00', ''),
	('00000000-0000-0000-0000-000000000000', '8cb07b6a-405e-4c62-b592-5ce9c2648db6', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-05 02:45:52.852359+00', ''),
	('00000000-0000-0000-0000-000000000000', '85f27624-6726-41e9-a19d-3550ef66cb45', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-05 05:50:58.228545+00', ''),
	('00000000-0000-0000-0000-000000000000', '44b18cff-bb23-4d07-81c1-50e6fbd7a5a9', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-05 05:50:58.230014+00', ''),
	('00000000-0000-0000-0000-000000000000', '98232dc1-59cb-4448-890b-41b6d015cf0a', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-05 09:14:38.681942+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd8691854-c13c-4461-888b-679939e69ad8', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-05 09:14:38.687447+00', ''),
	('00000000-0000-0000-0000-000000000000', '8b5d5005-d615-4265-b3c9-295db6c5cb98', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-18 07:41:37.125094+00', ''),
	('00000000-0000-0000-0000-000000000000', '780e2528-a67a-4d4a-a69b-e9f190a29178', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-18 07:41:37.131245+00', ''),
	('00000000-0000-0000-0000-000000000000', '4fb5f1dc-9a56-4d8e-970d-2e28b6b2a6a2', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-18 07:41:55.278338+00', ''),
	('00000000-0000-0000-0000-000000000000', '123209db-3762-461b-b804-d89370664537', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-18 07:42:11.164738+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd4d26756-c356-49f9-9ec3-8235abbd2b53', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-01 19:20:09.21+00', ''),
	('00000000-0000-0000-0000-000000000000', 'afb00bf4-08b1-43b0-934f-5d7fbdfe77f8', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-01 20:10:16.476943+00', ''),
	('00000000-0000-0000-0000-000000000000', '1ea929aa-f559-4967-a16b-3ba7045ec154', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-01 20:10:31.87173+00', ''),
	('00000000-0000-0000-0000-000000000000', '0950eec1-7a6c-4ae4-8a42-f80c75e7ec5f', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-01 20:22:35.756926+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c24bc13-bd65-4cc1-b60e-b7bf9255de3f', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-01 20:23:01.527465+00', ''),
	('00000000-0000-0000-0000-000000000000', '175a467f-8b9b-40ab-9a25-e8c0658dfcc5', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 03:27:25.261168+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd638ca51-5029-4f33-a8a7-378abe883464', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 03:27:25.287345+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ec4e483-b725-4931-9d8e-99b4099c3673', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 05:27:55.68427+00', ''),
	('00000000-0000-0000-0000-000000000000', '821f603e-0034-4d01-b8bd-2675d3caaee5', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 05:27:55.701696+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a35096e1-4fa4-4f86-a3cf-7f1f64e236a7', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 05:54:21.18703+00', ''),
	('00000000-0000-0000-0000-000000000000', '2883c239-87ff-4c3f-970d-25c5a818ddd9', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 05:54:21.190183+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc1f03de-e351-466a-b12f-30c4be55cfb3', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-02 06:03:30.424532+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a85f5dda-dadd-4e06-bdee-7926a5e06e45', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 07:01:31.307115+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a580a805-fc40-4f32-a293-8d5a6557a6ff', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 07:01:31.317412+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd182a561-009e-4674-b80c-a6d9bcf60c3f', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 08:03:00.335013+00', ''),
	('00000000-0000-0000-0000-000000000000', '4015e384-40fa-41bf-9910-f641785f0700', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 08:03:00.346949+00', ''),
	('00000000-0000-0000-0000-000000000000', '98826753-e8c4-488c-b896-cbb22d50c953', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-02 08:54:20.04203+00', ''),
	('00000000-0000-0000-0000-000000000000', '773f5d23-d33e-42bc-ab9a-406a1f9e6914', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 10:21:38.428407+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b308233-34ad-403e-a21f-8dc9b2fb50a0', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 10:21:38.442089+00', ''),
	('00000000-0000-0000-0000-000000000000', '061f39ad-3c51-4138-840a-8163df5b3fa3', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 11:28:11.571281+00', ''),
	('00000000-0000-0000-0000-000000000000', '9f3c7f40-919b-49ce-8250-3b3f0746362f', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 11:28:11.582507+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f71e02eb-95e7-46b2-a467-7b37e471ee33', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 15:37:52.670965+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b43a8767-52a2-47f1-92ff-9736ddc68766', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 15:37:52.692644+00', ''),
	('00000000-0000-0000-0000-000000000000', '43c6d53c-8254-4043-9278-bdae8854ad7e', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 16:46:46.408309+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4862048-c867-46ae-abb1-741e2ac975ec', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 16:46:46.414852+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ce8f3f9-8d2e-4c4a-965f-e111f2241614', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 20:01:21.884378+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f66b4b0-93da-4dd3-b580-0777919dda8d', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-02 20:01:21.902395+00', ''),
	('00000000-0000-0000-0000-000000000000', '9f1da524-b071-46ac-839c-82603bf567de', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 00:01:41.670946+00', ''),
	('00000000-0000-0000-0000-000000000000', '6134e87b-023a-4819-a6dc-9825d3f3dd3f', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 00:01:41.684488+00', ''),
	('00000000-0000-0000-0000-000000000000', '0c36af72-5919-4d8e-b0ea-822b44510201', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 04:45:22.294476+00', ''),
	('00000000-0000-0000-0000-000000000000', '2092b1ba-3f87-4eff-9878-5e36d7ca7604', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 04:45:22.313405+00', ''),
	('00000000-0000-0000-0000-000000000000', '88391e2d-5793-471c-ac6f-165c35ee064d', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 06:00:01.851045+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c88cc88e-a7a6-4819-98e5-dc0b7ef0777f', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-03 06:00:01.858127+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e7c98f96-a70c-4ad1-8105-ed18bcaab27d', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 02:41:08.06692+00', ''),
	('00000000-0000-0000-0000-000000000000', '6cd8bbc1-7356-4c57-bbb6-109c1966681f', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 02:41:08.078948+00', ''),
	('00000000-0000-0000-0000-000000000000', '2b13d8be-d76b-401a-b896-2a4358607cb8', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 03:40:03.678784+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fbcd4a2f-8939-4d7b-9a33-d1b17b75e600', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 03:40:03.696541+00', ''),
	('00000000-0000-0000-0000-000000000000', '2924f2ac-d6ca-4df4-852d-e848d28af3a4', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 04:38:56.326838+00', ''),
	('00000000-0000-0000-0000-000000000000', '56bbd644-31fd-4466-bc00-1fc29f2eeb4e', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-05 04:38:56.344109+00', ''),
	('00000000-0000-0000-0000-000000000000', '3d4c238e-444a-4035-bd27-9111d103afef', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 03:01:23.056537+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b85e0671-e0ee-4679-babc-8cbcc411d7da', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 03:01:23.077049+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e215b7a-297f-4dbd-995b-ab90732139cc', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 03:59:40.473607+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4e80e4e-8a5c-46f4-8371-b7ac942df48b', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 03:59:40.481328+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b25ebc2-b08d-4f2e-ad66-e75eb211e6cf', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 04:17:53.264963+00', ''),
	('00000000-0000-0000-0000-000000000000', '9e57fa71-c944-44da-a999-8d7f9cf68b4d', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 05:16:14.071155+00', ''),
	('00000000-0000-0000-0000-000000000000', '78a07ffb-4b9e-49c1-9b03-43fe82de054c', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 05:16:14.082543+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af41e472-506a-4d1e-92d1-ea3f508544a3', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 06:14:19.490638+00', ''),
	('00000000-0000-0000-0000-000000000000', '34db5311-0415-47d2-bf31-7794e7ce795a', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 06:14:19.515809+00', ''),
	('00000000-0000-0000-0000-000000000000', '32434030-037e-4a80-8b0b-d42e2896676b', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 08:19:23.068683+00', ''),
	('00000000-0000-0000-0000-000000000000', '3fc9ecf6-deec-4f78-b89a-8f09c68e2a47', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 08:19:23.077756+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ede241a-1a51-4def-a552-15998038cdd0', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 08:22:27.134328+00', ''),
	('00000000-0000-0000-0000-000000000000', '29b24439-4131-47c2-a0e4-170347c1d97e', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 09:20:30.679952+00', ''),
	('00000000-0000-0000-0000-000000000000', '29a5a572-348d-44ea-8469-36e49417849e', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 09:20:30.6898+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0011c7c-1bfd-4660-9063-7854b4588e39', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 09:22:33.455347+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ac517dd5-c79e-47b8-a69c-c1f3718b5e96', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 09:39:51.817331+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b6f5037-0272-4996-8a85-43256d9df167', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 09:52:14.788726+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb144625-2345-46a5-ad7b-762a52eff089', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 10:19:41.570906+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ef0109e-80de-48b6-ba74-28b9c49c9e11', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 18:51:43.457503+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f802c0f0-0b37-49c4-a7c0-55ad7b324583', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 18:51:43.480375+00', ''),
	('00000000-0000-0000-0000-000000000000', '8764e086-d58f-45a9-a9cf-b360d7d0b68d', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 19:56:47.173015+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e32cbbdb-756d-4a85-940a-c064cfd8cae6', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 19:56:47.179652+00', ''),
	('00000000-0000-0000-0000-000000000000', '8a749b90-ee7d-4d9e-bcdd-a8c2d0400432', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 19:58:34.417547+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ac2325d0-d4d7-4bab-ad0b-46cc47a0f8f4', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 20:57:05.403617+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f744f4c6-ed4a-42b5-be24-b9d2b2c0a5d9', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 20:57:05.412631+00', ''),
	('00000000-0000-0000-0000-000000000000', '4cb31edb-0705-48dc-83ad-a1de3a7193c9', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 21:04:02.526997+00', ''),
	('00000000-0000-0000-0000-000000000000', '553796de-a3ad-4cc8-8d49-51f09c19c7a4', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 21:53:27.236705+00', ''),
	('00000000-0000-0000-0000-000000000000', '3219e270-a4a6-424d-93a7-b585e222ac94', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 22:51:54.202585+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fd45d7dc-0705-41e6-9794-ae6a2232ee33', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 22:51:54.212149+00', ''),
	('00000000-0000-0000-0000-000000000000', '2eb8dbb2-148b-41cf-bfea-dfdb49b3cbc4', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 04:40:08.801651+00', ''),
	('00000000-0000-0000-0000-000000000000', '5ce8f249-47e8-4efa-a6ef-a976f17634a0', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 04:40:08.817433+00', ''),
	('00000000-0000-0000-0000-000000000000', '15df664a-8cfb-4757-a344-b1ea9dc43311', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 05:43:27.897007+00', ''),
	('00000000-0000-0000-0000-000000000000', '64e85a05-954f-45ad-a3ed-c7f3a42cf0b4', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 05:43:27.903557+00', ''),
	('00000000-0000-0000-0000-000000000000', '1c83b1e0-3051-48f9-b42d-41dcfad71524', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-12 06:05:52.415446+00', ''),
	('00000000-0000-0000-0000-000000000000', '600bdbd2-8998-450a-8233-3b8d8df907b8', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 02:43:46.055296+00', ''),
	('00000000-0000-0000-0000-000000000000', 'be200a9a-f9d3-4596-9bc7-ce8e20b8273e', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 02:43:46.085702+00', ''),
	('00000000-0000-0000-0000-000000000000', 'be2de37d-0847-4253-92b4-27e3777eb39f', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 03:42:13.768873+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f15aa763-6e65-4928-939b-53b75f2eb7c2', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 03:42:13.783047+00', ''),
	('00000000-0000-0000-0000-000000000000', '2f7ebf1b-44f5-4016-8100-8da4e5866965', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-15 03:45:24.82767+00', ''),
	('00000000-0000-0000-0000-000000000000', '49a069e9-0d64-40d9-87b2-fe53bf54e2c0', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 04:43:45.792359+00', ''),
	('00000000-0000-0000-0000-000000000000', '83824ad2-3b43-4b37-ae13-7242a18080b5', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 04:43:45.802843+00', ''),
	('00000000-0000-0000-0000-000000000000', '31c22d4f-e52f-4537-828c-afafbf28de27', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 05:41:52.056002+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b8cf9cb1-d363-4a16-809a-0ce3b91a8d6a', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 05:41:52.065171+00', ''),
	('00000000-0000-0000-0000-000000000000', '60ca9f3d-f547-4333-a8d8-0aa14c8a67e0', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 06:40:22.007648+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cff05bb7-431a-421e-8c8c-e40009e2ead5', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 06:40:22.02397+00', ''),
	('00000000-0000-0000-0000-000000000000', '82e9ce2b-922e-4b58-828e-ee63aefc2038', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 07:38:39.842086+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f2829624-3b45-4baa-b865-b3edc50d766f', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-15 07:38:39.852107+00', ''),
	('00000000-0000-0000-0000-000000000000', '4153b7a9-932b-441d-be28-11fe8e67c54a', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 01:56:29.733122+00', ''),
	('00000000-0000-0000-0000-000000000000', '1e9907bb-edac-41a5-832c-10a746773d4d', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 01:56:29.75871+00', ''),
	('00000000-0000-0000-0000-000000000000', 'edbdeaaf-ebde-4aa1-a90d-079adaf0ae8c', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 00:34:01.046697+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af701d72-ee08-42f3-8184-0dbc5daa9764', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 00:34:01.069374+00', ''),
	('00000000-0000-0000-0000-000000000000', '5469dc88-3066-43dc-8f61-fecbe47d0930', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 03:22:49.658645+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd4560307-0849-46ff-8311-136b8dd2baa7', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 03:22:49.688391+00', ''),
	('00000000-0000-0000-0000-000000000000', '844aa228-b22d-496d-a3c7-7b5bd1d90041', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-26 03:23:05.322585+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c41a07ee-2186-422e-90e4-57ac5c6787e5', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-26 03:45:44.04386+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f04a84b-844d-4685-9eff-3f01978ac0ee', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 05:00:09.269996+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dbefdb90-8875-42e2-8084-9e94ac78f5af', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 05:00:09.278668+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fd359a81-1692-4005-8e29-b454310db72b', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 06:46:25.675641+00', ''),
	('00000000-0000-0000-0000-000000000000', '66840cc1-692f-4965-ad5a-5ee46cf1a343', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 06:46:25.690022+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b6e5a801-8851-478d-bd0d-9fc9b2023629', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 15:54:39.615761+00', ''),
	('00000000-0000-0000-0000-000000000000', '5fe8958b-5036-49c8-84d3-86d354f93d05', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 15:54:39.624731+00', ''),
	('00000000-0000-0000-0000-000000000000', '262aba74-ffaf-4708-9e67-c5bdf319fbe7', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 18:15:50.593149+00', ''),
	('00000000-0000-0000-0000-000000000000', '5b9d502a-5f00-4058-896d-8b6042169357', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 18:15:50.607057+00', ''),
	('00000000-0000-0000-0000-000000000000', '09cda5a0-4b9c-4b1e-a8db-839c62caed77', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 19:14:28.212362+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf834a5b-dbe2-4904-a893-6951b6c38449', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 19:14:28.224422+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f314d8b-3f43-42ed-9fc0-1cc2977b57a2', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 21:42:51.649963+00', ''),
	('00000000-0000-0000-0000-000000000000', '4332a209-8d4a-478c-934a-caf4f67888cc', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 21:42:51.66237+00', ''),
	('00000000-0000-0000-0000-000000000000', '247a6ca4-6e2c-45b5-b4db-e3bdbd0bf07f', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 22:49:23.028255+00', ''),
	('00000000-0000-0000-0000-000000000000', '0c5756aa-2e4b-4594-a8ed-98e8b7714d68', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 22:49:23.036039+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abcaff43-b7b6-4b6f-b66d-636f4a355115', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 23:48:09.66818+00', ''),
	('00000000-0000-0000-0000-000000000000', '97fd2086-dc00-4c24-8a87-3dfa3b292bd9', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-26 23:48:09.679248+00', ''),
	('00000000-0000-0000-0000-000000000000', '2997428f-285c-4f6c-bc56-bdf2548071a4', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 06:40:01.501389+00', ''),
	('00000000-0000-0000-0000-000000000000', '00409e0e-aa94-4d27-a98f-f1132f3c90e8', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 06:40:01.526025+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b2a66195-7d68-4926-9ce4-6a07e1edb20b', '{"action":"login","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-29 06:46:51.887822+00', ''),
	('00000000-0000-0000-0000-000000000000', '7bed86ca-bf18-435a-b63e-a04ba5b57193', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 07:45:09.98343+00', ''),
	('00000000-0000-0000-0000-000000000000', '8eb60edf-12fa-4ab2-9eef-02a180fdbece', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 07:45:10.000827+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ffd59993-8191-4b9d-aad9-b73b2f08eb13', '{"action":"token_refreshed","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 08:43:16.000946+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e6748fe3-a7bd-4863-8f25-ef5d5757685b', '{"action":"token_revoked","actor_id":"15480116-8c78-4a75-af8c-2c70795333a6","actor_username":"dmstest49@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 08:43:16.015268+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '15480116-8c78-4a75-af8c-2c70795333a6', 'authenticated', 'authenticated', 'dmstest49@gmail.com', '$2a$10$aRZEGW26iOFbsxzqkpz9U.40ws55yL.PZUouak5F1N0gkg6QAxoGe', '2025-08-03 10:45:08.449835+00', NULL, '', '2025-08-03 10:42:42.914741+00', '', NULL, '', '', NULL, '2025-09-29 06:46:51.901916+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "15480116-8c78-4a75-af8c-2c70795333a6", "role": "fan", "email": "dmstest49@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-08-03 10:42:42.851076+00', '2025-09-29 08:43:16.03862+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('15480116-8c78-4a75-af8c-2c70795333a6', '15480116-8c78-4a75-af8c-2c70795333a6', '{"sub": "15480116-8c78-4a75-af8c-2c70795333a6", "role": "fan", "email": "dmstest49@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-08-03 10:42:42.896277+00', '2025-08-03 10:42:42.896352+00', '2025-08-03 10:42:42.896352+00', '86136293-7962-47d1-863c-37a5af4cafe9');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('716eaff6-f25e-4fdc-bf63-4759c6018bcf', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-08-03 10:45:08.458497+00', '2025-08-03 11:55:52.062494+00', NULL, 'aal1', NULL, '2025-08-03 11:55:52.062424', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('070cedf1-2a03-4fd7-98df-1672c20ffd66', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-29 06:46:51.902618+00', '2025-09-29 08:43:16.046778+00', NULL, 'aal1', NULL, '2025-09-29 08:43:16.046696', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('2b3e2067-01d3-4e83-9f3a-16e4ab3297a7', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 04:17:53.281065+00', '2025-09-09 08:19:23.102733+00', NULL, 'aal1', NULL, '2025-09-09 08:19:23.102657', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('6cb6a5dc-4c84-4520-bf9d-ef186a8aa30b', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-08-03 12:47:33.161904+00', '2025-08-18 07:41:37.148635+00', NULL, 'aal1', NULL, '2025-08-18 07:41:37.148546', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('46d05755-fc2c-4f4c-b7f9-7188135f6b05', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-08-18 07:41:55.286175+00', '2025-08-18 07:41:55.286175+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('797dcf94-b84b-483c-a781-8a604595a91b', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-08-18 07:42:11.165477+00', '2025-08-18 07:42:11.165477+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('af0b63bb-6ba0-4b16-93c0-92b87e365173', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-01 19:20:09.234602+00', '2025-09-01 19:20:09.234602+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('a300cacd-bdb4-475d-998b-f2267d80a947', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-01 20:10:16.490222+00', '2025-09-01 20:10:16.490222+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('74a8aab1-ea8a-4e0e-9e1b-e274f873ded6', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-01 20:22:35.760509+00', '2025-09-01 20:22:35.760509+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('25259000-9dc9-4ddc-9f18-f7fb0dcd8f3e', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-01 20:10:31.872462+00', '2025-09-02 05:27:55.742435+00', NULL, 'aal1', NULL, '2025-09-02 05:27:55.741083', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('5db77847-7d00-4b07-96b5-48f8b06bf83d', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-01 20:23:01.528223+00', '2025-09-02 05:54:21.201205+00', NULL, 'aal1', NULL, '2025-09-02 05:54:21.201132', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('946d5946-9140-4aee-8c6d-64433f77938f', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 08:22:27.144355+00', '2025-09-09 09:20:30.724833+00', NULL, 'aal1', NULL, '2025-09-09 09:20:30.724189', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('a235306a-d568-4c9a-b76a-69efae7151bd', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-02 06:03:30.440068+00', '2025-09-02 08:03:00.382473+00', NULL, 'aal1', NULL, '2025-09-02 08:03:00.381684', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('1d24f705-1b94-4c1b-9443-4e8a716b48cc', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 09:22:33.465199+00', '2025-09-09 09:22:33.465199+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('68e2f1ec-970b-49ed-92d7-02ac04950f89', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 09:39:51.81844+00', '2025-09-09 09:39:51.81844+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('565de63f-015a-4d8f-82ce-0ed757ae680e', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 09:52:14.795597+00', '2025-09-09 09:52:14.795597+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('7ccd5649-5aa0-42e7-a8b1-669d4fa72984', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 10:19:41.576095+00', '2025-09-09 19:56:47.201251+00', NULL, 'aal1', NULL, '2025-09-09 19:56:47.200541', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('77d6500a-73e8-46a2-a953-2f5581d38b4d', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 19:58:34.422162+00', '2025-09-09 20:57:05.446397+00', NULL, 'aal1', NULL, '2025-09-09 20:57:05.446318', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('d3440a5f-83c4-4c18-9837-987025261394', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 21:04:02.534375+00', '2025-09-09 21:04:02.534375+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('d48b5ca9-434e-48c3-967f-0deb0a9dd6ed', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-02 08:54:20.056548+00', '2025-09-09 03:59:40.500054+00', NULL, 'aal1', NULL, '2025-09-09 03:59:40.49997', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('9387c246-0552-4125-af6e-ff326fa5bd6e', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 21:53:27.252502+00', '2025-09-12 05:43:27.936575+00', NULL, 'aal1', NULL, '2025-09-12 05:43:27.935357', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('e064030e-44ad-4cbf-890d-33c1acdc9ca2', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-12 06:05:52.42998+00', '2025-09-15 03:42:13.813459+00', NULL, 'aal1', NULL, '2025-09-15 03:42:13.812057', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('92df3524-a149-4b74-8721-d0423e2ea231', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-15 03:45:24.834527+00', '2025-09-26 03:22:49.742276+00', NULL, 'aal1', NULL, '2025-09-26 03:22:49.741604', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('8e2d2803-c529-4615-82a1-49028b78446c', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 03:23:05.327493+00', '2025-09-26 03:23:05.327493+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '73.3.138.163', NULL),
	('45ff1fd2-302c-4966-ae18-6518f013c5b1', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 03:45:44.048727+00', '2025-09-29 06:40:01.583001+00', NULL, 'aal1', NULL, '2025-09-29 06:40:01.58292', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '73.3.138.163', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('716eaff6-f25e-4fdc-bf63-4759c6018bcf', '2025-08-03 10:45:08.478931+00', '2025-08-03 10:45:08.478931+00', 'otp', 'f1b8f018-3dcf-4d25-974c-bd34788451c0'),
	('6cb6a5dc-4c84-4520-bf9d-ef186a8aa30b', '2025-08-03 12:47:33.170844+00', '2025-08-03 12:47:33.170844+00', 'password', '68da27e3-1580-4c90-b619-972aebafc001'),
	('46d05755-fc2c-4f4c-b7f9-7188135f6b05', '2025-08-18 07:41:55.29453+00', '2025-08-18 07:41:55.29453+00', 'password', 'fee64ce6-47b4-4d23-bb39-1a81b14ac653'),
	('797dcf94-b84b-483c-a781-8a604595a91b', '2025-08-18 07:42:11.167323+00', '2025-08-18 07:42:11.167323+00', 'password', '48f21f83-0459-4035-8c92-875548a039b1'),
	('af0b63bb-6ba0-4b16-93c0-92b87e365173', '2025-09-01 19:20:09.280862+00', '2025-09-01 19:20:09.280862+00', 'password', '7ada15bb-3fe9-46fa-b22f-b8b0a04a2e29'),
	('a300cacd-bdb4-475d-998b-f2267d80a947', '2025-09-01 20:10:16.511948+00', '2025-09-01 20:10:16.511948+00', 'password', 'aa21cc0e-41f9-4a3b-9273-bf4a6ca84d22'),
	('25259000-9dc9-4ddc-9f18-f7fb0dcd8f3e', '2025-09-01 20:10:31.875579+00', '2025-09-01 20:10:31.875579+00', 'password', 'a97a103b-f983-4338-bdbb-7c2e2a77a89b'),
	('74a8aab1-ea8a-4e0e-9e1b-e274f873ded6', '2025-09-01 20:22:35.767479+00', '2025-09-01 20:22:35.767479+00', 'password', 'e8885893-0dff-46ee-a58e-63f27f4ee858'),
	('5db77847-7d00-4b07-96b5-48f8b06bf83d', '2025-09-01 20:23:01.530081+00', '2025-09-01 20:23:01.530081+00', 'password', 'ff8206cc-94fd-4f0a-b078-5ace65da8a5a'),
	('a235306a-d568-4c9a-b76a-69efae7151bd', '2025-09-02 06:03:30.462453+00', '2025-09-02 06:03:30.462453+00', 'password', 'f41763f0-f87d-4fc7-b4eb-d37583b3cdb5'),
	('d48b5ca9-434e-48c3-967f-0deb0a9dd6ed', '2025-09-02 08:54:20.087825+00', '2025-09-02 08:54:20.087825+00', 'password', '8e95d654-3857-4a51-9cac-f60ad5b96586'),
	('2b3e2067-01d3-4e83-9f3a-16e4ab3297a7', '2025-09-09 04:17:53.307153+00', '2025-09-09 04:17:53.307153+00', 'password', '6de0ba22-43c7-4d09-9fbc-ce2113ad91d9'),
	('946d5946-9140-4aee-8c6d-64433f77938f', '2025-09-09 08:22:27.162775+00', '2025-09-09 08:22:27.162775+00', 'password', '2d24fbc0-c6fa-48cb-8228-df62422c9fc4'),
	('1d24f705-1b94-4c1b-9443-4e8a716b48cc', '2025-09-09 09:22:33.480122+00', '2025-09-09 09:22:33.480122+00', 'password', 'bec72722-1bcd-49d8-8ee5-6ed3e3b17f85'),
	('68e2f1ec-970b-49ed-92d7-02ac04950f89', '2025-09-09 09:39:51.822814+00', '2025-09-09 09:39:51.822814+00', 'password', '6dff11ed-5ab7-4222-8f77-f0f065c758d4'),
	('565de63f-015a-4d8f-82ce-0ed757ae680e', '2025-09-09 09:52:14.801525+00', '2025-09-09 09:52:14.801525+00', 'password', '1c445fb1-6aaa-4aa2-8272-03f36c1319f9'),
	('7ccd5649-5aa0-42e7-a8b1-669d4fa72984', '2025-09-09 10:19:41.592717+00', '2025-09-09 10:19:41.592717+00', 'password', 'f29ab704-bec2-4f7e-8532-46553ddbb310'),
	('77d6500a-73e8-46a2-a953-2f5581d38b4d', '2025-09-09 19:58:34.43213+00', '2025-09-09 19:58:34.43213+00', 'password', '708a10a7-9e73-4b5b-9b6a-887e819db31e'),
	('d3440a5f-83c4-4c18-9837-987025261394', '2025-09-09 21:04:02.552051+00', '2025-09-09 21:04:02.552051+00', 'password', '9923b78f-9490-4c17-b38d-a90ded566fac'),
	('9387c246-0552-4125-af6e-ff326fa5bd6e', '2025-09-09 21:53:27.276771+00', '2025-09-09 21:53:27.276771+00', 'password', '3e75da09-392b-4bc3-9313-6029eab81148'),
	('e064030e-44ad-4cbf-890d-33c1acdc9ca2', '2025-09-12 06:05:52.450447+00', '2025-09-12 06:05:52.450447+00', 'password', 'ef97e491-f184-49fa-9aec-1c24d10a18bd'),
	('92df3524-a149-4b74-8721-d0423e2ea231', '2025-09-15 03:45:24.849682+00', '2025-09-15 03:45:24.849682+00', 'password', 'a4cc0917-51c0-4089-94e6-4cf884ab0619'),
	('8e2d2803-c529-4615-82a1-49028b78446c', '2025-09-26 03:23:05.341835+00', '2025-09-26 03:23:05.341835+00', 'password', '4c34895a-a69b-431a-8736-77a7a12f636c'),
	('45ff1fd2-302c-4966-ae18-6518f013c5b1', '2025-09-26 03:45:44.064099+00', '2025-09-26 03:45:44.064099+00', 'password', 'e187e208-dddf-4b73-b0fd-0c029e689891'),
	('070cedf1-2a03-4fd7-98df-1672c20ffd66', '2025-09-29 06:46:51.94018+00', '2025-09-29 06:46:51.94018+00', 'password', 'fc0a4e12-e2fd-4db9-977f-9603c4634f2a');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 50, 'ywopha53ny6q', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-08-05 09:14:38.693936+00', '2025-08-18 07:41:37.131833+00', '7lrp2jc4qyfl', '6cb6a5dc-4c84-4520-bf9d-ef186a8aa30b'),
	('00000000-0000-0000-0000-000000000000', 51, 'qbrpne7tsyoi', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-08-18 07:41:37.137571+00', '2025-08-18 07:41:37.137571+00', 'ywopha53ny6q', '6cb6a5dc-4c84-4520-bf9d-ef186a8aa30b'),
	('00000000-0000-0000-0000-000000000000', 52, 'whimy7l33qcc', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-08-18 07:41:55.293291+00', '2025-08-18 07:41:55.293291+00', NULL, '46d05755-fc2c-4f4c-b7f9-7188135f6b05'),
	('00000000-0000-0000-0000-000000000000', 53, 'rnfrcii3gg7h', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-08-18 07:42:11.166135+00', '2025-08-18 07:42:11.166135+00', NULL, '797dcf94-b84b-483c-a781-8a604595a91b'),
	('00000000-0000-0000-0000-000000000000', 54, '3xmsz3xwtm2e', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-01 19:20:09.252259+00', '2025-09-01 19:20:09.252259+00', NULL, 'af0b63bb-6ba0-4b16-93c0-92b87e365173'),
	('00000000-0000-0000-0000-000000000000', 55, 'aymta7dguonk', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-01 20:10:16.499162+00', '2025-09-01 20:10:16.499162+00', NULL, 'a300cacd-bdb4-475d-998b-f2267d80a947'),
	('00000000-0000-0000-0000-000000000000', 57, 'spdpwhpua3lb', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-01 20:22:35.762953+00', '2025-09-01 20:22:35.762953+00', NULL, '74a8aab1-ea8a-4e0e-9e1b-e274f873ded6'),
	('00000000-0000-0000-0000-000000000000', 56, '5uk6xaaymmgc', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-01 20:10:31.874415+00', '2025-09-02 03:27:25.289739+00', NULL, '25259000-9dc9-4ddc-9f18-f7fb0dcd8f3e'),
	('00000000-0000-0000-0000-000000000000', 59, 'kc5b346vcf2q', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 03:27:25.311381+00', '2025-09-02 05:27:55.702934+00', '5uk6xaaymmgc', '25259000-9dc9-4ddc-9f18-f7fb0dcd8f3e'),
	('00000000-0000-0000-0000-000000000000', 60, 'gkcbijmu5ttw', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-02 05:27:55.721396+00', '2025-09-02 05:27:55.721396+00', 'kc5b346vcf2q', '25259000-9dc9-4ddc-9f18-f7fb0dcd8f3e'),
	('00000000-0000-0000-0000-000000000000', 58, '2tlxretyzqoj', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-01 20:23:01.528934+00', '2025-09-02 05:54:21.193006+00', NULL, '5db77847-7d00-4b07-96b5-48f8b06bf83d'),
	('00000000-0000-0000-0000-000000000000', 61, 'qh3dhoojhk22', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-02 05:54:21.195664+00', '2025-09-02 05:54:21.195664+00', '2tlxretyzqoj', '5db77847-7d00-4b07-96b5-48f8b06bf83d'),
	('00000000-0000-0000-0000-000000000000', 62, 'tvsam2c5t4on', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 06:03:30.450879+00', '2025-09-02 07:01:31.318575+00', NULL, 'a235306a-d568-4c9a-b76a-69efae7151bd'),
	('00000000-0000-0000-0000-000000000000', 63, 'fdgzpihopmu4', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 07:01:31.333622+00', '2025-09-02 08:03:00.347697+00', 'tvsam2c5t4on', 'a235306a-d568-4c9a-b76a-69efae7151bd'),
	('00000000-0000-0000-0000-000000000000', 64, 'umimxpqvoaci', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-02 08:03:00.360444+00', '2025-09-02 08:03:00.360444+00', 'fdgzpihopmu4', 'a235306a-d568-4c9a-b76a-69efae7151bd'),
	('00000000-0000-0000-0000-000000000000', 65, 'zqs57fnesv7l', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 08:54:20.070745+00', '2025-09-02 10:21:38.444455+00', NULL, 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 66, 't3yq3ymy3gl4', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 10:21:38.466065+00', '2025-09-02 11:28:11.583052+00', 'zqs57fnesv7l', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 67, 'jpfaomjtvvsc', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 11:28:11.597332+00', '2025-09-02 15:37:52.693835+00', 't3yq3ymy3gl4', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 68, 'uugbq5ruskym', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 15:37:52.710397+00', '2025-09-02 16:46:46.417331+00', 'jpfaomjtvvsc', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 69, 'a57i3lwtop3m', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 16:46:46.427746+00', '2025-09-02 20:01:21.90427+00', 'uugbq5ruskym', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 70, 'hqiyijbwulxj', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-02 20:01:21.92634+00', '2025-09-03 00:01:41.686307+00', 'a57i3lwtop3m', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 71, 'vog3lpv6rphy', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-03 00:01:41.698528+00', '2025-09-03 04:45:22.314631+00', 'hqiyijbwulxj', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 72, 'lp2kopidek7x', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-03 04:45:22.334087+00', '2025-09-03 06:00:01.860031+00', 'vog3lpv6rphy', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 73, 'mcsn6cik6qs2', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-03 06:00:01.870593+00', '2025-09-05 02:41:08.079481+00', 'lp2kopidek7x', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 74, 'gjtx5o7jin36', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-05 02:41:08.093235+00', '2025-09-05 03:40:03.69982+00', 'mcsn6cik6qs2', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 75, '6fp5fdfydbzm', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-05 03:40:03.715231+00', '2025-09-05 04:38:56.347388+00', 'gjtx5o7jin36', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 76, '27jflk3cmtk3', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-05 04:38:56.359541+00', '2025-09-09 03:01:23.0783+00', '6fp5fdfydbzm', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 77, 'msl4a4bzs6gw', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 03:01:23.100167+00', '2025-09-09 03:59:40.483658+00', '27jflk3cmtk3', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 78, 'xsknskdrfpwm', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 03:59:40.491458+00', '2025-09-09 03:59:40.491458+00', 'msl4a4bzs6gw', 'd48b5ca9-434e-48c3-967f-0deb0a9dd6ed'),
	('00000000-0000-0000-0000-000000000000', 45, 'p6d2j7rgqgsq', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-08-03 10:45:08.468565+00', '2025-08-03 11:55:52.051028+00', NULL, '716eaff6-f25e-4fdc-bf63-4759c6018bcf'),
	('00000000-0000-0000-0000-000000000000', 46, 'mbm75illzxtt', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-08-03 11:55:52.058738+00', '2025-08-03 11:55:52.058738+00', 'p6d2j7rgqgsq', '716eaff6-f25e-4fdc-bf63-4759c6018bcf'),
	('00000000-0000-0000-0000-000000000000', 79, 'bxo5jgm3gfaf', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 04:17:53.289709+00', '2025-09-09 05:16:14.083782+00', NULL, '2b3e2067-01d3-4e83-9f3a-16e4ab3297a7'),
	('00000000-0000-0000-0000-000000000000', 47, 'uynsu4wcpcma', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-08-03 12:47:33.167315+00', '2025-08-05 02:45:52.852964+00', NULL, '6cb6a5dc-4c84-4520-bf9d-ef186a8aa30b'),
	('00000000-0000-0000-0000-000000000000', 48, 'assnxbrvnxyz', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-08-05 02:45:52.875935+00', '2025-08-05 05:50:58.230558+00', 'uynsu4wcpcma', '6cb6a5dc-4c84-4520-bf9d-ef186a8aa30b'),
	('00000000-0000-0000-0000-000000000000', 80, 'yenbxc424xr4', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 05:16:14.098685+00', '2025-09-09 06:14:19.516481+00', 'bxo5jgm3gfaf', '2b3e2067-01d3-4e83-9f3a-16e4ab3297a7'),
	('00000000-0000-0000-0000-000000000000', 49, '7lrp2jc4qyfl', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-08-05 05:50:58.233199+00', '2025-08-05 09:14:38.687995+00', 'assnxbrvnxyz', '6cb6a5dc-4c84-4520-bf9d-ef186a8aa30b'),
	('00000000-0000-0000-0000-000000000000', 81, 'k2qwywb7dcrh', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 06:14:19.547269+00', '2025-09-09 08:19:23.079602+00', 'yenbxc424xr4', '2b3e2067-01d3-4e83-9f3a-16e4ab3297a7'),
	('00000000-0000-0000-0000-000000000000', 82, 'rqxbm5yfid6r', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 08:19:23.086592+00', '2025-09-09 08:19:23.086592+00', 'k2qwywb7dcrh', '2b3e2067-01d3-4e83-9f3a-16e4ab3297a7'),
	('00000000-0000-0000-0000-000000000000', 83, '6dkvuiegugnl', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 08:22:27.152925+00', '2025-09-09 09:20:30.692788+00', NULL, '946d5946-9140-4aee-8c6d-64433f77938f'),
	('00000000-0000-0000-0000-000000000000', 84, 'aq3oyks64z2a', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 09:20:30.70586+00', '2025-09-09 09:20:30.70586+00', '6dkvuiegugnl', '946d5946-9140-4aee-8c6d-64433f77938f'),
	('00000000-0000-0000-0000-000000000000', 85, 'ecdzlswh4kkq', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 09:22:33.473781+00', '2025-09-09 09:22:33.473781+00', NULL, '1d24f705-1b94-4c1b-9443-4e8a716b48cc'),
	('00000000-0000-0000-0000-000000000000', 86, 'esv6vgaeds4r', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 09:39:51.819544+00', '2025-09-09 09:39:51.819544+00', NULL, '68e2f1ec-970b-49ed-92d7-02ac04950f89'),
	('00000000-0000-0000-0000-000000000000', 87, 'zvfl6bleeca4', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 09:52:14.796781+00', '2025-09-09 09:52:14.796781+00', NULL, '565de63f-015a-4d8f-82ce-0ed757ae680e'),
	('00000000-0000-0000-0000-000000000000', 88, 'mvf3lfj2uhgf', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 10:19:41.581032+00', '2025-09-09 18:51:43.482267+00', NULL, '7ccd5649-5aa0-42e7-a8b1-669d4fa72984'),
	('00000000-0000-0000-0000-000000000000', 89, 'aaczacttmed6', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 18:51:43.505391+00', '2025-09-09 19:56:47.180822+00', 'mvf3lfj2uhgf', '7ccd5649-5aa0-42e7-a8b1-669d4fa72984'),
	('00000000-0000-0000-0000-000000000000', 90, 'jyl5jsvsrvmg', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 19:56:47.188849+00', '2025-09-09 19:56:47.188849+00', 'aaczacttmed6', '7ccd5649-5aa0-42e7-a8b1-669d4fa72984'),
	('00000000-0000-0000-0000-000000000000', 91, 'cwpsqc3hwkzz', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 19:58:34.427522+00', '2025-09-09 20:57:05.416292+00', NULL, '77d6500a-73e8-46a2-a953-2f5581d38b4d'),
	('00000000-0000-0000-0000-000000000000', 92, 'nju6kljf5whq', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 20:57:05.430446+00', '2025-09-09 20:57:05.430446+00', 'cwpsqc3hwkzz', '77d6500a-73e8-46a2-a953-2f5581d38b4d'),
	('00000000-0000-0000-0000-000000000000', 93, 'b2loci6jhatd', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-09 21:04:02.541887+00', '2025-09-09 21:04:02.541887+00', NULL, 'd3440a5f-83c4-4c18-9837-987025261394'),
	('00000000-0000-0000-0000-000000000000', 94, 'lwiqq4h4nqua', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 21:53:27.260993+00', '2025-09-09 22:51:54.215286+00', NULL, '9387c246-0552-4125-af6e-ff326fa5bd6e'),
	('00000000-0000-0000-0000-000000000000', 95, 'ayv4cpvqcxpc', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-09 22:51:54.229211+00', '2025-09-12 04:40:08.818831+00', 'lwiqq4h4nqua', '9387c246-0552-4125-af6e-ff326fa5bd6e'),
	('00000000-0000-0000-0000-000000000000', 96, '5qotkrcysdgp', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-12 04:40:08.83757+00', '2025-09-12 05:43:27.91117+00', 'ayv4cpvqcxpc', '9387c246-0552-4125-af6e-ff326fa5bd6e'),
	('00000000-0000-0000-0000-000000000000', 97, 'aokxfuiwhku6', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-12 05:43:27.923979+00', '2025-09-12 05:43:27.923979+00', '5qotkrcysdgp', '9387c246-0552-4125-af6e-ff326fa5bd6e'),
	('00000000-0000-0000-0000-000000000000', 98, 'uhsto5kcxnuk', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-12 06:05:52.439484+00', '2025-09-15 02:43:46.089234+00', NULL, 'e064030e-44ad-4cbf-890d-33c1acdc9ca2'),
	('00000000-0000-0000-0000-000000000000', 99, '5zpkq3f3z7j7', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-15 02:43:46.121559+00', '2025-09-15 03:42:13.784291+00', 'uhsto5kcxnuk', 'e064030e-44ad-4cbf-890d-33c1acdc9ca2'),
	('00000000-0000-0000-0000-000000000000', 100, 'svngrj3feosx', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-15 03:42:13.797476+00', '2025-09-15 03:42:13.797476+00', '5zpkq3f3z7j7', 'e064030e-44ad-4cbf-890d-33c1acdc9ca2'),
	('00000000-0000-0000-0000-000000000000', 101, 'l5p5g4bvskcm', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-15 03:45:24.844208+00', '2025-09-15 04:43:45.804197+00', NULL, '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 102, 'vjnpwqcku2m4', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-15 04:43:45.814451+00', '2025-09-15 05:41:52.065779+00', 'l5p5g4bvskcm', '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 103, 'jxrbiyh65slx', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-15 05:41:52.074699+00', '2025-09-15 06:40:22.025428+00', 'vjnpwqcku2m4', '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 104, 'nvk7pubywq4w', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-15 06:40:22.041584+00', '2025-09-15 07:38:39.852749+00', 'jxrbiyh65slx', '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 105, '4i7ojzob2hjn', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-15 07:38:39.865894+00', '2025-09-16 01:56:29.759914+00', 'nvk7pubywq4w', '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 106, 't2ccfgigtxik', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-16 01:56:29.788863+00', '2025-09-17 00:34:01.071166+00', '4i7ojzob2hjn', '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 107, '4dprsdsvdjvo', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-17 00:34:01.098211+00', '2025-09-26 03:22:49.690259+00', 't2ccfgigtxik', '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 108, 'okvdwx7uuj72', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-26 03:22:49.723525+00', '2025-09-26 03:22:49.723525+00', '4dprsdsvdjvo', '92df3524-a149-4b74-8721-d0423e2ea231'),
	('00000000-0000-0000-0000-000000000000', 109, 'ldi7zl7dz5vn', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-26 03:23:05.335945+00', '2025-09-26 03:23:05.335945+00', NULL, '8e2d2803-c529-4615-82a1-49028b78446c'),
	('00000000-0000-0000-0000-000000000000', 110, 'jsekgdn4qv7b', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 03:45:44.052857+00', '2025-09-26 05:00:09.281129+00', NULL, '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 111, 'fsspntrdq4zk', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 05:00:09.291919+00', '2025-09-26 06:46:25.691903+00', 'jsekgdn4qv7b', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 112, 'fg3ssuqqe4uu', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 06:46:25.70474+00', '2025-09-26 15:54:39.626511+00', 'fsspntrdq4zk', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 113, 'h7xgzw4shgnn', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 15:54:39.635944+00', '2025-09-26 18:15:50.608965+00', 'fg3ssuqqe4uu', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 114, 'orcilu6xulsa', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 18:15:50.624334+00', '2025-09-26 19:14:28.228013+00', 'h7xgzw4shgnn', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 115, 's6r442jewc5l', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 19:14:28.243492+00', '2025-09-26 21:42:51.663696+00', 'orcilu6xulsa', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 116, '7yak6nzxphvn', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 21:42:51.676386+00', '2025-09-26 22:49:23.036611+00', 's6r442jewc5l', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 117, 'in3zaod6ktz5', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 22:49:23.049408+00', '2025-09-26 23:48:09.679826+00', '7yak6nzxphvn', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 118, 'a63gkfgxw6zt', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-26 23:48:09.692109+00', '2025-09-29 06:40:01.531045+00', 'in3zaod6ktz5', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 119, 'exdwznb4knq5', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-29 06:40:01.558541+00', '2025-09-29 06:40:01.558541+00', 'a63gkfgxw6zt', '45ff1fd2-302c-4966-ae18-6518f013c5b1'),
	('00000000-0000-0000-0000-000000000000', 120, 'pgtzckxwnrzi', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-29 06:46:51.916634+00', '2025-09-29 07:45:10.001379+00', NULL, '070cedf1-2a03-4fd7-98df-1672c20ffd66'),
	('00000000-0000-0000-0000-000000000000', 121, 'm5hal3inxpsh', '15480116-8c78-4a75-af8c-2c70795333a6', true, '2025-09-29 07:45:10.021356+00', '2025-09-29 08:43:16.015851+00', 'pgtzckxwnrzi', '070cedf1-2a03-4fd7-98df-1672c20ffd66'),
	('00000000-0000-0000-0000-000000000000', 122, 'nvi5h5eo3gkn', '15480116-8c78-4a75-af8c-2c70795333a6', false, '2025-09-29 08:43:16.031471+00', '2025-09-29 08:43:16.031471+00', 'm5hal3inxpsh', '070cedf1-2a03-4fd7-98df-1672c20ffd66');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: artist_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."artist_profiles" ("id", "user_id", "artist_name", "bio", "banner_url", "social_links", "verification_status", "record_label", "publisher", "bsl_enabled", "bsl_tier", "upload_preferences", "created_at", "updated_at", "stage_name") VALUES
	('03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', '15480116-8c78-4a75-af8c-2c70795333a6', 'dmstest49', 'Artist profile created for existing user', NULL, '{}', 'pending', NULL, NULL, false, NULL, '{}', '2025-09-26 18:41:35.45366', '2025-09-26 18:41:35.45366', NULL);


--
-- Data for Name: albums; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: artists; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."artists" ("id", "user_id", "artist_name", "bio", "banner_url", "social_links", "verification_status", "created_at", "updated_at") VALUES
	('4cd0c1d4-c5e1-4099-a01e-c37c38ca9b38', '15480116-8c78-4a75-af8c-2c70795333a6', 'dmstest49', 'New artist on Buckets', NULL, '{}', 'pending', '2025-09-02 06:11:02.854194', '2025-09-02 06:11:02.854194');


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."content_items" ("id", "artist_id", "title", "description", "content_type", "file_path", "file_size_bytes", "duration_seconds", "unlock_date", "milestone_condition", "is_premium", "metadata", "created_at", "updated_at", "scheduled_unlock_job_id", "auto_unlock_enabled", "audio_checksum", "processing_status", "file_type", "duration_ms", "waveform_peaks", "album_id", "album_name", "track_number", "availability_scope", "availability_regions", "license_type", "isrc", "is_published") VALUES
	('53d9b374-f9c1-4a39-b8ba-06c6fc75eaed', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'icytwat-x-project-pat-type-beat---too-late_TK16233741.mp3', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757451025627-icytwat_x_project_pat_type_beat___too_late_TK16233741_mp3.mp3', NULL, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "icytwat-x-project-pat-type-beat---too-late_TK16233741.mp3.mp3"}', '2025-09-09 20:50:26.164056', '2025-09-26 18:52:11.736344', NULL, true, '1b5bc0117772aa439ed7dd26828bd32fcc054b5ad486fd1fd640abe7f40d34e2', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('5b44e599-7f56-4944-8cf7-4fed915d5f32', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'icytwat-x-project-pat-type-beat---too-late_TK16233741.mp3 (1)', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757451689028-icytwat_x_project_pat_type_beat___too_late_TK16233741_mp3__1_.mp3', NULL, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "icytwat-x-project-pat-type-beat---too-late_TK16233741.mp3 (1).mp3"}', '2025-09-09 21:01:29.680911', '2025-09-26 18:52:11.736344', NULL, true, '1b5bc0117772aa439ed7dd26828bd32fcc054b5ad486fd1fd640abe7f40d34e2', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('144205f0-05c7-4306-9f11-1168efe248ab', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'asap-rocky-type-beat---hiphop_TK16240132.mp3', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757452165989-asap_rocky_type_beat___hiphop_TK16240132_mp3.mp3', NULL, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "asap-rocky-type-beat---hiphop_TK16240132.mp3.mp3"}', '2025-09-09 21:09:26.510752', '2025-09-26 18:52:11.736344', NULL, true, 'e6305dfafd57d530577535f8eb7e0b051541c89772662e97a3085f3b5b4ab9c4', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('e194d2ec-3828-4d40-ac32-065544187b4c', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'Better than ever Snipp (prod.5D Lo$)', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757453946821-Better_than_ever_Snipp__prod_5D_Lo__.mp3', NULL, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "Better than ever Snipp (prod.5D Lo$).mp3"}', '2025-09-09 21:39:08.451742', '2025-09-26 18:52:11.736344', NULL, true, 'c3e14e1ef524c71d32e915476105e99c215f7e1c8ee40eec9599a453c625bd52', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('688cf8bb-56c4-4fab-bc9f-70a5ace31d65', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'HEART @RAFALSOUND 150BPM G#M', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757459659129-HEART__RAFALSOUND_150BPM_G_M.mp3', 4095999, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "HEART @RAFALSOUND 150BPM G#M.mp3"}', '2025-09-09 23:14:21.0616', '2025-09-26 18:52:11.736344', NULL, true, '7873c79bc3101cb526e63c0d298e01c2c94d85f6a9e3e94e44e4d0340643a5a7', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('b94c86a5-8260-4a11-bacc-3871f0c2a383', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'WAIT STEMS 6-RAFAL Tag', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757456927691-WAIT_STEMS_6_RAFAL_Tag.mp3', NULL, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "WAIT STEMS 6-RAFAL Tag.mp3"}', '2025-09-09 22:28:48.104679', '2025-09-26 18:52:11.736344', NULL, true, '17575f22e68a88d1827523bc462c45c1e26ec3135cbf6286ae98fced36b58648', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('7e90abaf-2a7e-47d2-949c-2948ada36de9', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'HEART @RAFALSOUND 150BPM G#M', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757457071051-HEART__RAFALSOUND_150BPM_G_M.mp3', NULL, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "HEART @RAFALSOUND 150BPM G#M.mp3"}', '2025-09-09 22:31:11.449525', '2025-09-26 18:52:11.736344', NULL, true, '7873c79bc3101cb526e63c0d298e01c2c94d85f6a9e3e94e44e4d0340643a5a7', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('b53e200a-2370-4c06-bc2a-fbe3cf76acff', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'HEART @RAFALSOUND 150BPM G#M', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757457165923-HEART__RAFALSOUND_150BPM_G_M.mp3', NULL, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "HEART @RAFALSOUND 150BPM G#M.mp3"}', '2025-09-09 22:32:46.503388', '2025-09-26 18:52:11.736344', NULL, true, '7873c79bc3101cb526e63c0d298e01c2c94d85f6a9e3e94e44e4d0340643a5a7', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('19bdf6db-55d0-4e42-a13c-096a23557792', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'WAIT @RAFALSOUND @CHOPROD 130BPM', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1757458578852-WAIT__RAFALSOUND__CHOPROD_130BPM.mp3', 4726072, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "WAIT @RAFALSOUND @CHOPROD 130BPM.mp3"}', '2025-09-09 22:56:21.221835', '2025-09-26 18:52:11.736344', NULL, true, 'be70d9ab0cb46f696d66dcf4d47a03fb563522dd1d4c080194258244558957c1', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('d1a7cbf2-272b-471a-96e4-c2e6688cf285', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'Test Upload Fixed', NULL, 'audio', 'test-upload-fixed.mp3', NULL, NULL, NULL, NULL, false, '{}', '2025-09-26 18:52:43.780379', '2025-09-26 18:52:43.780379', NULL, true, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, false),
	('7ecb1baa-ea72-43fa-b948-205802372d2e', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', '[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1758912853199-_FREE__WESTSIDE_GUNN_X_THE_ALCHEMIST_TYPE_BEAT____YOU_DON_T_HAVE_TO_.wav', 22954232, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/wav", "collaborators": [], "original_filename": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂.wav"}', '2025-09-26 18:54:20.282438', '2025-09-26 18:54:20.282438', NULL, true, '60245b6331d6d624f95f9f2f97ca943f68b9de71d138336fb3cacac9077d5f11', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, true),
	('a08a394d-0b37-43c4-a92d-4d9120e722cb', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'WAIT STEMS 6-RAFAL Tag', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1758914900481-WAIT_STEMS_6_RAFAL_Tag.mp3', 4726072, NULL, NULL, NULL, false, '{"tags": [], "genre": "Hip-Hop", "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "WAIT STEMS 6-RAFAL Tag.mp3"}', '2025-09-26 19:28:24.53687', '2025-09-26 19:28:24.53687', NULL, true, '17575f22e68a88d1827523bc462c45c1e26ec3135cbf6286ae98fced36b58648', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, true),
	('9b9d13cf-9991-4e3b-80e3-6ca53db6f68b', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'WAIT STEMS 5-TRAP', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1758914904694-WAIT_STEMS_5_TRAP.mp3', 4726072, NULL, NULL, NULL, false, '{"tags": [], "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "WAIT STEMS 5-TRAP.mp3"}', '2025-09-26 19:28:27.667292', '2025-09-26 19:28:27.667292', NULL, true, '5f8d4c02061314c86ec6a85b85c3680b736887861aaf13cabc28105309bc560e', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, true),
	('b6d90d64-44cf-4371-8236-5885fb815d8a', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'WAIT STEMS 4-808 2 {C} [ hacked my instagram ]', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1758914907741-WAIT_STEMS_4_808_2__C____hacked_my_instagram__.mp3', 4726072, NULL, NULL, NULL, false, '{"tags": [], "genre": "R&B", "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "WAIT STEMS 4-808 2 {C} [ hacked my instagram ].mp3"}', '2025-09-26 19:28:29.960733', '2025-09-26 19:28:29.960733', NULL, true, '906b8ec48f92cc12800f60043ed6fa18ae3cb3894eed04db0c719918de73261e', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, true),
	('6a91ea7d-1e2e-46a2-90c4-8ec5fb7a1902', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'WAIT STEMS 3-wait loop 128 bpm [choprod]', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1758914910117-WAIT_STEMS_3_wait_loop_128_bpm__choprod_.mp3', 4726072, NULL, NULL, NULL, false, '{"tags": [], "genre": "Folk", "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "WAIT STEMS 3-wait loop 128 bpm [choprod].mp3"}', '2025-09-26 19:28:32.691649', '2025-09-26 19:28:32.691649', NULL, true, 'a0b4485a09262ee730490f017b80b65608acc7c7cd7261092d9ab830e5ab3088', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, true),
	('4587d9e3-3fe1-42cc-924f-8f8555053c6d', '03dc374c-5f9b-4386-b9b6-32cafd4c5ecf', 'WAIT STEMS 2-Surge XT', NULL, 'audio', '15480116-8c78-4a75-af8c-2c70795333a6/1758914912889-WAIT_STEMS_2_Surge_XT.mp3', 4726072, NULL, NULL, NULL, false, '{"tags": [], "genre": "Pop", "credits": [], "mime_type": "audio/mpeg", "collaborators": [], "original_filename": "WAIT STEMS 2-Surge XT.mp3"}', '2025-09-26 19:28:41.833314', '2025-09-26 19:28:41.833314', NULL, true, 'ae46db27a800f77800e3e36664f6ba36938be660074cbc4cdc3bd8229f469863', 'queued', NULL, NULL, NULL, NULL, NULL, NULL, 'worldwide', NULL, 'all_rights_reserved', NULL, true);


--
-- Data for Name: audio_features; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audio_processing_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."audio_processing_jobs" ("id", "content_id", "job_type", "status", "provider", "attempts", "max_attempts", "error_message", "result", "created_at", "updated_at", "scheduled_at", "started_at", "completed_at") VALUES
	('a8f0a0b6-a55c-4bfe-b353-7074935befe0', '144205f0-05c7-4306-9f11-1168efe248ab', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 21:09:26.622429', '2025-09-09 21:09:26.622429', '2025-09-09 21:09:26.622429', NULL, NULL),
	('aafd5dc9-1bfb-4e58-af43-644ffeb83f6a', '144205f0-05c7-4306-9f11-1168efe248ab', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 21:09:26.622429', '2025-09-09 21:09:26.622429', '2025-09-09 21:09:26.622429', NULL, NULL),
	('65195f27-4b20-4713-9fa2-0781ff59ed28', 'e194d2ec-3828-4d40-ac32-065544187b4c', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 21:39:08.779822', '2025-09-09 21:39:08.779822', '2025-09-09 21:39:08.779822', NULL, NULL),
	('54d48e4c-2cfe-4f10-bb8d-91379fc69b8d', 'e194d2ec-3828-4d40-ac32-065544187b4c', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 21:39:08.779822', '2025-09-09 21:39:08.779822', '2025-09-09 21:39:08.779822', NULL, NULL),
	('18a43ef8-0e12-47d9-a39a-e0b0a1d62157', 'b94c86a5-8260-4a11-bacc-3871f0c2a383', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:28:48.322969', '2025-09-09 22:28:48.322969', '2025-09-09 22:28:48.322969', NULL, NULL),
	('a07a1d3a-e2cb-4ee1-a724-d662701e5e36', 'b94c86a5-8260-4a11-bacc-3871f0c2a383', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:28:48.322969', '2025-09-09 22:28:48.322969', '2025-09-09 22:28:48.322969', NULL, NULL),
	('e79b4030-c478-4f47-a3b9-a5f45c89072f', '7e90abaf-2a7e-47d2-949c-2948ada36de9', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:31:11.566153', '2025-09-09 22:31:11.566153', '2025-09-09 22:31:11.566153', NULL, NULL),
	('f0563b1f-5633-47e7-9d7e-cac258816728', '7e90abaf-2a7e-47d2-949c-2948ada36de9', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:31:11.566153', '2025-09-09 22:31:11.566153', '2025-09-09 22:31:11.566153', NULL, NULL),
	('e4de7e59-142f-4a22-906b-d997c766175f', 'b53e200a-2370-4c06-bc2a-fbe3cf76acff', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:32:46.737293', '2025-09-09 22:32:46.737293', '2025-09-09 22:32:46.737293', NULL, NULL),
	('a63a0758-f459-455d-a7a7-a2c2470f3370', 'b53e200a-2370-4c06-bc2a-fbe3cf76acff', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:32:46.737293', '2025-09-09 22:32:46.737293', '2025-09-09 22:32:46.737293', NULL, NULL),
	('e6af3ace-3efa-4f5e-89eb-5a9c8091f778', '19bdf6db-55d0-4e42-a13c-096a23557792', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:56:21.385658', '2025-09-09 22:56:21.385658', '2025-09-09 22:56:21.385658', NULL, NULL),
	('6888b25d-28e6-4dd9-b7fa-5dcd1eb6dad4', '19bdf6db-55d0-4e42-a13c-096a23557792', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 22:56:21.385658', '2025-09-09 22:56:21.385658', '2025-09-09 22:56:21.385658', NULL, NULL),
	('e2b7451b-1aab-426a-badb-90392066ed65', '688cf8bb-56c4-4fab-bc9f-70a5ace31d65', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 23:14:21.319021', '2025-09-09 23:14:21.319021', '2025-09-09 23:14:21.319021', NULL, NULL),
	('ee0b9164-385b-49de-a879-196f66e33709', '688cf8bb-56c4-4fab-bc9f-70a5ace31d65', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-09 23:14:21.319021', '2025-09-09 23:14:21.319021', '2025-09-09 23:14:21.319021', NULL, NULL),
	('8eb248e8-808b-4748-aa68-1450bc019e71', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 18:54:20.420893', '2025-09-26 18:54:20.420893', '2025-09-26 18:54:20.420893', NULL, NULL),
	('b067131b-e056-46db-8668-4bf7cdc0d385', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 18:54:20.420893', '2025-09-26 18:54:20.420893', '2025-09-26 18:54:20.420893', NULL, NULL),
	('72075493-f18d-48c8-9210-5ba1165501a6', 'a08a394d-0b37-43c4-a92d-4d9120e722cb', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:24.722039', '2025-09-26 19:28:24.722039', '2025-09-26 19:28:24.722039', NULL, NULL),
	('4d51032b-c9ed-42c7-a33e-fcf9e06a8a48', 'a08a394d-0b37-43c4-a92d-4d9120e722cb', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:24.722039', '2025-09-26 19:28:24.722039', '2025-09-26 19:28:24.722039', NULL, NULL),
	('fda430e9-4074-429f-b91a-2cb40eedbdf3', '9b9d13cf-9991-4e3b-80e3-6ca53db6f68b', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:27.778857', '2025-09-26 19:28:27.778857', '2025-09-26 19:28:27.778857', NULL, NULL),
	('bd68f541-e6b8-409b-8d2a-8b55e2bdd744', '9b9d13cf-9991-4e3b-80e3-6ca53db6f68b', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:27.778857', '2025-09-26 19:28:27.778857', '2025-09-26 19:28:27.778857', NULL, NULL),
	('7fc63bcf-ccae-45ea-aeda-b7bdf388e674', 'b6d90d64-44cf-4371-8236-5885fb815d8a', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:30.127056', '2025-09-26 19:28:30.127056', '2025-09-26 19:28:30.127056', NULL, NULL),
	('386a9d15-6cf8-426e-b947-060254bed9ee', 'b6d90d64-44cf-4371-8236-5885fb815d8a', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:30.127056', '2025-09-26 19:28:30.127056', '2025-09-26 19:28:30.127056', NULL, NULL),
	('796df149-bd27-46fd-be20-d81ac8d713fe', '6a91ea7d-1e2e-46a2-90c4-8ec5fb7a1902', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:32.838236', '2025-09-26 19:28:32.838236', '2025-09-26 19:28:32.838236', NULL, NULL),
	('d23d5795-262a-4770-8dc6-982ac6461226', '6a91ea7d-1e2e-46a2-90c4-8ec5fb7a1902', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:32.838236', '2025-09-26 19:28:32.838236', '2025-09-26 19:28:32.838236', NULL, NULL),
	('49ab38c5-fe06-4f23-8167-c2e5018f1f79', '4587d9e3-3fe1-42cc-924f-8f8555053c6d', 'audio_features', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:41.943249', '2025-09-26 19:28:41.943249', '2025-09-26 19:28:41.943249', NULL, NULL),
	('6fcceb2a-96f5-4cfb-bbec-4fa5966c6b06', '4587d9e3-3fe1-42cc-924f-8f8555053c6d', 'mood_analysis', 'queued', NULL, 0, 3, NULL, NULL, '2025-09-26 19:28:41.943249', '2025-09-26 19:28:41.943249', '2025-09-26 19:28:41.943249', NULL, NULL);


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: campaign_placements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: content_search_index; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."events" ("id", "title", "description", "start_date", "end_date", "shareable_code", "max_votes_per_participant", "allow_multiple_votes", "host_user_id", "status", "mediaid_integration_enabled", "privacy_mode", "created_at", "updated_at", "location") VALUES
	('ac3f19d9-1177-4f6b-8fc9-3344d832a7aa', 'BOTB2025', 'BOTB 2025', '2025-09-27 18:00:00+00', '2025-09-27 21:00:00+00', 'JA7N8J', 5, false, '15480116-8c78-4a75-af8c-2c70795333a6', 'published', true, 'balanced', '2025-09-26 22:02:09.763827+00', '2025-09-29 09:23:15.326+00', NULL),
	('84d22b91-d2a8-420a-914a-498aedf1bbac', 'BOTB 2025', '', '2025-09-27 09:00:00+00', '2025-09-27 17:00:00+00', '05C0HY', 5, false, '15480116-8c78-4a75-af8c-2c70795333a6', 'published', true, 'balanced', '2025-09-26 22:12:54.051933+00', '2025-09-29 09:23:15.326+00', NULL),
	('b3045112-5b30-4440-96b1-df5bb30d6e40', 'BOTB', 'ACCESS', '2025-09-27 09:00:00+00', '2025-09-27 17:00:00+00', 'EK9862', 5, false, '15480116-8c78-4a75-af8c-2c70795333a6', 'published', true, 'balanced', '2025-09-26 22:38:04.169599+00', '2025-09-29 09:23:15.326+00', NULL),
	('7ca4414b-bdb7-4726-ac77-ebe2979cfcc6', 'BOTB', '', '2025-09-27 09:00:00+00', '2025-09-27 17:00:00+00', 'AIX3D1', 5, false, '15480116-8c78-4a75-af8c-2c70795333a6', 'published', true, 'balanced', '2025-09-26 23:02:39.010948+00', '2025-09-29 09:23:15.326+00', '125 BOTB DRIVE'),
	('bedf8963-e49b-4425-a07c-183bf27d9638', 'BOTB', '', '2025-09-27 09:00:00+00', '2025-09-27 17:00:00+00', 'IQX54K', 5, false, '15480116-8c78-4a75-af8c-2c70795333a6', 'published', true, 'balanced', '2025-09-27 00:23:16.577949+00', '2025-09-29 09:23:15.326+00', '224656 NorthField drr');


--
-- Data for Name: event_artist_prospects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_artist_prospects" ("id", "event_id", "artist_name", "email", "phone", "instagram_handle", "spotify_url", "apple_music_url", "bio", "stage_name", "performance_notes", "contact_status", "registration_token", "registration_completed_at", "host_notes", "tags", "priority", "vote_count", "final_placement", "last_contacted_at", "contact_method", "migrated_to_user_id", "migration_completed_at", "created_at", "updated_at", "profile_image_url") VALUES
	('fe4a53a9-dee5-4720-a0d4-3af3d6055baa', '7ca4414b-bdb7-4726-ac77-ebe2979cfcc6', 'JIMMO', 'JIMMO@mail.com', NULL, '@JIMMO', NULL, NULL, NULL, NULL, NULL, 'invited', 'reg_91tthLJwdYAb3IhSQaxpux4Bd8RgnyW7SGtY1TyDcMMZ', NULL, 'Added via dashboard on 9/26/2025', NULL, 5, 0, NULL, NULL, NULL, NULL, NULL, '2025-09-26 23:04:48.934299+00', '2025-09-26 23:04:48.934299+00', NULL),
	('954297b4-4659-46c8-9c87-e8ea27bc01ed', 'bedf8963-e49b-4425-a07c-183bf27d9638', 'JIMMO', 'Jimmo@mail.com', NULL, '@JIMMO', NULL, NULL, NULL, NULL, NULL, 'invited', 'reg_6BmCeSs8UdMpxBGGDljJ4DBIxIlDTWC6TsmqlxfratwZ', NULL, 'Added via dashboard on 9/29/2025', NULL, 5, 0, NULL, NULL, NULL, NULL, NULL, '2025-09-29 09:28:25.078968+00', '2025-09-29 09:28:25.078968+00', NULL);


--
-- Data for Name: event_artists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_audience_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_audience_members" ("id", "event_id", "name", "email", "phone", "registration_token", "registered_at", "updated_at", "created_at", "profile_image_url") VALUES
	('244937da-aba3-4eec-acc6-ee1124eb9f2c', '7ca4414b-bdb7-4726-ac77-ebe2979cfcc6', 'Sam Kim', 'Samkim@mail.com', '+19798882224', 'aud_33h63p4w1w6o3w461l3n5o326o4b2k15463mr36e', '2025-09-26 23:25:04.33+00', '2025-09-26 23:25:04.468393+00', '2025-09-26 23:25:04.468393+00', NULL),
	('5a329bcf-869d-4bfe-a1cc-4338ad402211', 'bedf8963-e49b-4425-a07c-183bf27d9638', 'Sam Kim', 'Samkim@mail.com', '+13034449292', 'aud_1j122s4z2d2m6z1t631384yo1822334q4w545a3n', '2025-09-27 00:31:06.107+00', '2025-09-27 00:31:06.474003+00', '2025-09-27 00:31:06.474003+00', 'https://iutnwgvzwyupsuguxnls.supabase.co/storage/v1/object/public/public-assets/profile-photos/audience_new_92j8qqxz7lk.jpg');


--
-- Data for Name: media_ids; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."media_ids" ("id", "user_uuid", "interests", "genre_preferences", "content_flags", "location_code", "profile_embedding", "privacy_settings", "created_at", "updated_at", "role", "version", "is_active") VALUES
	('9b4324d1-009b-4cf9-b9fd-a77b985315ed', '15480116-8c78-4a75-af8c-2c70795333a6', '{"🎵 Discovering new music","🎧 High-quality audio","🔥 Underground scenes"}', '{}', '{}', '', NULL, '{"data_sharing": true, "audio_capture": false, "location_access": false, "anonymous_logging": true, "marketing_communications": false}', '2025-09-01 19:55:51.558', '2025-09-01 19:55:52.244282', 'fan', 1, true),
	('16899249-79f4-400b-8fef-eaaae7476d3a', '15480116-8c78-4a75-af8c-2c70795333a6', '{"🎵 Discovering new music","🔥 Underground scenes","📱 Exclusive content","🎬 Behind-the-scenes access"}', '{}', '{}', '', NULL, '{"data_sharing": true, "audio_capture": false, "location_access": false, "anonymous_logging": true, "marketing_communications": false}', '2025-09-01 19:59:37.317', '2025-09-01 19:59:37.612771', 'artist', 1, true);


--
-- Data for Name: event_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_votes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lyrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: media_engagement_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."media_engagement_log" ("id", "user_id", "content_id", "event_type", "session_id", "user_agent", "ip_address", "is_anonymous", "metadata", "timestamp") VALUES
	('e0dfa4e4-ff74-4e8b-97c3-225c64b4c5f6', '15480116-8c78-4a75-af8c-2c70795333a6', NULL, 'mediaid_setup_completed', NULL, NULL, NULL, true, '{"role": "fan", "privacy_level": 3, "interests_count": 4}', '2025-08-03 10:45:25.488765'),
	('644d0202-6db4-413e-8137-f79dd52c16d6', '15480116-8c78-4a75-af8c-2c70795333a6', NULL, 'mediaid_setup_completed', NULL, NULL, NULL, true, '{"privacy_level": 2, "selected_role": "fan", "interests_count": 4}', '2025-08-03 10:46:07.671656'),
	('c27ade66-7546-475f-a4a0-60361fd4e102', '15480116-8c78-4a75-af8c-2c70795333a6', NULL, 'mediaid_setup_completed', NULL, NULL, NULL, true, '{"privacy_level": 2, "selected_role": "artist", "interests_count": 4}', '2025-08-18 07:43:01.059972'),
	('9dd0c352-ce71-4ebf-ad7f-76b146a39188', '15480116-8c78-4a75-af8c-2c70795333a6', NULL, 'mediaid_setup_completed', NULL, NULL, NULL, true, '{"privacy_level": 2, "selected_role": "fan", "interests_count": 3}', '2025-09-01 19:55:52.644999'),
	('c598f343-8ebe-44db-9146-6ac665e0f85c', '15480116-8c78-4a75-af8c-2c70795333a6', NULL, 'mediaid_setup_completed', NULL, NULL, NULL, true, '{"privacy_level": 2, "selected_role": "artist", "interests_count": 3}', '2025-09-01 19:56:15.872217'),
	('a4c1d23f-6a37-4ae0-8e4b-b784374fb881', '15480116-8c78-4a75-af8c-2c70795333a6', NULL, 'mediaid_setup_completed', NULL, NULL, NULL, true, '{"privacy_level": 2, "selected_role": "artist", "interests_count": 4}', '2025-09-01 19:59:37.851424'),
	('38ac36ca-3519-4776-8167-5de39d9bd109', '15480116-8c78-4a75-af8c-2c70795333a6', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'track_play', NULL, NULL, NULL, false, '{"context": "global_player", "provider": "buckets", "play_count": 1, "session_id": "session_1758913291571_55cvpau2p", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 112, "explicit_content": false}', '2025-09-26 19:03:24.136'),
	('3a985079-076b-4b83-832c-b4aae3266b47', '15480116-8c78-4a75-af8c-2c70795333a6', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'track_play', NULL, NULL, NULL, false, '{"context": "global_player", "provider": "buckets", "play_count": 1, "session_id": "session_1758913291571_55cvpau2p", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 113, "explicit_content": false}', '2025-09-26 19:03:25.208'),
	('000355de-aa6f-46b5-b139-0ae4a4b05fd8', '15480116-8c78-4a75-af8c-2c70795333a6', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'track_play', NULL, NULL, NULL, false, '{"context": "global_player", "provider": "buckets", "play_count": 1, "session_id": "session_1758913291571_55cvpau2p", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 15, "explicit_content": false}', '2025-09-26 19:03:41.457'),
	('fe499863-60b7-4fd8-96d6-37881fc6eeaf', '15480116-8c78-4a75-af8c-2c70795333a6', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'track_play', NULL, NULL, NULL, false, '{"context": "discovery_page", "provider": "buckets", "play_count": 1, "session_id": "session_1758913772877_4xc89g3ew", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 0, "explicit_content": false}', '2025-09-26 19:09:32.878'),
	('ab3df4fa-ad1f-48b4-af6f-c3d6d2d5f858', '15480116-8c78-4a75-af8c-2c70795333a6', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'track_play', NULL, NULL, NULL, false, '{"context": "global_player", "provider": "buckets", "play_count": 1, "session_id": "session_1758913772877_4xc89g3ew", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 11, "explicit_content": false}', '2025-09-26 19:09:44.309'),
	('f14fd368-2ef6-4dae-9ad2-126c452c1abf', '15480116-8c78-4a75-af8c-2c70795333a6', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'track_play', NULL, NULL, NULL, false, '{"context": "global_player", "provider": "buckets", "play_count": 1, "session_id": "session_1758913772877_4xc89g3ew", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 12, "explicit_content": false}', '2025-09-26 19:09:45.077'),
	('b4fa9107-baa2-4a43-a715-7b895dfce630', '15480116-8c78-4a75-af8c-2c70795333a6', '4587d9e3-3fe1-42cc-924f-8f8555053c6d', 'track_play', NULL, NULL, NULL, false, '{"context": "global_player", "provider": "buckets", "play_count": 1, "session_id": "session_1758914984065_thsz77x0z", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "WAIT STEMS 2-Surge XT", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 7, "explicit_content": false}', '2025-09-26 19:29:51.716'),
	('d45ddecf-62bc-4a0b-9c30-a45629486a2e', '15480116-8c78-4a75-af8c-2c70795333a6', 'b6d90d64-44cf-4371-8236-5885fb815d8a', 'track_play', NULL, NULL, NULL, false, '{"context": "discovery_page", "provider": "buckets", "play_count": 1, "session_id": "session_1758915010335_5tuaxr090", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "WAIT STEMS 4-808 2 {C} [ hacked my instagram ]", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 0, "explicit_content": false}', '2025-09-26 19:30:43.667'),
	('7c5eec44-7498-46c3-856b-1423afea0ad5', '15480116-8c78-4a75-af8c-2c70795333a6', '9b9d13cf-9991-4e3b-80e3-6ca53db6f68b', 'track_play', NULL, NULL, NULL, false, '{"context": "discovery_page", "provider": "buckets", "play_count": 1, "session_id": null, "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "WAIT STEMS 5-TRAP", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 0, "explicit_content": false}', '2025-09-29 06:54:53.822'),
	('ca8bb9dc-1523-4b8b-ba8f-6ee86bc3e72a', '15480116-8c78-4a75-af8c-2c70795333a6', 'a08a394d-0b37-43c4-a92d-4d9120e722cb', 'track_play', NULL, NULL, NULL, false, '{"context": "discovery_page", "provider": "buckets", "play_count": 1, "session_id": null, "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "WAIT STEMS 6-RAFAL Tag", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 0, "explicit_content": false}', '2025-09-29 06:56:26.699'),
	('33884622-b258-4650-9c75-72bf28afbc34', '15480116-8c78-4a75-af8c-2c70795333a6', '7ecb1baa-ea72-43fa-b948-205802372d2e', 'track_play', NULL, NULL, NULL, false, '{"context": "discovery_page", "provider": "buckets", "play_count": 1, "session_id": "session_1759129739331_w1kehuwqs", "device_name": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "device_type": "web", "content_type": "music", "content_title": "[FREE] WESTSIDE GUNN X THE ALCHEMIST TYPE BEAT - ＂YOU DON''T HAVE TO＂", "content_artist": "dmstest49", "total_duration": null, "duration_seconds": 0, "explicit_content": false}', '2025-09-29 07:09:00.551');


--
-- Data for Name: mood_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "display_name", "avatar_url", "role", "email_verified", "onboarding_completed", "created_at", "updated_at") VALUES
	('15480116-8c78-4a75-af8c-2c70795333a6', 'dmstest49', NULL, 'artist', false, true, '2025-08-03 10:42:42.850068', '2025-09-01 19:59:37.738619');


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('media-uploads', 'media-uploads', NULL, '2025-07-13 01:23:04.363388+00', '2025-07-13 01:23:04.363388+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('temp-uploads', 'temp-uploads', NULL, '2025-08-03 10:00:35.731823+00', '2025-08-03 10:00:35.731823+00', false, false, 104857600, '{audio/*,video/*,image/*}', NULL, 'STANDARD'),
	('global-music-content', 'global-music-content', NULL, '2025-09-09 10:22:07.11151+00', '2025-09-09 10:22:07.11151+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('artist-content', 'artist-content', NULL, '2025-07-13 01:26:51.108955+00', '2025-07-13 01:26:51.108955+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('public-assets', 'public-assets', NULL, '2025-07-13 01:27:16.792972+00', '2025-07-13 01:27:16.792972+00', true, false, 52428800, NULL, NULL, 'STANDARD'),
	('lyrics-documents', 'lyrics-documents', NULL, '2025-09-09 08:18:19.962802+00', '2025-09-09 08:18:19.962802+00', false, false, 10485760, '{text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document}', NULL, 'STANDARD'),
	('profile-avatars', 'profile-avatars', NULL, '2025-07-13 01:23:27.503472+00', '2025-07-13 01:23:27.503472+00', true, false, 10485760, NULL, NULL, 'STANDARD'),
	('brand-assets', 'brand-assets', NULL, '2025-07-13 01:26:59.55902+00', '2025-07-13 01:26:59.55902+00', true, false, 52428800, NULL, NULL, 'STANDARD'),
	('visual-clips', 'visual-clips', NULL, '2025-09-09 08:18:19.962802+00', '2025-09-09 08:18:19.962802+00', true, false, 52428800, '{video/mp4,video/quicktime,video/webm,video/avi}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('74f32b9a-dd88-492f-8667-8aa229a69f87', 'public-assets', 'profile-photos/audience_new_92j8qqxz7lk.jpg', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-27 00:30:36.963586+00', '2025-09-27 00:30:36.963586+00', '2025-09-27 00:30:36.963586+00', '{"eTag": "\"5dbd63c3b3cfbca84861f370e3b3413c\"", "size": 3673, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-27T00:30:37.000Z", "contentLength": 3673, "httpStatusCode": 200}', '81705f47-1537-4466-b557-38d2e675a193', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('65d8e61c-c892-44d7-b287-f248d97826e5', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757452732324-falling_apart_travis_scott_x_don_toliver_buy_2_get_2_6353670.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 21:18:52.656877+00', '2025-09-09 21:18:52.656877+00', '2025-09-09 21:18:52.656877+00', '{"eTag": "\"1441a7909c087dbbe7ce59881b9df8b9\"", "size": 15, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T21:18:53.000Z", "contentLength": 15, "httpStatusCode": 200}', 'c4fcb5c6-ef4a-498e-a583-cf801ed9628a', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('890816f0-190d-411e-8630-e587c1d0cff7', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757453946821-Better_than_ever_Snipp__prod_5D_Lo__.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 21:39:07.909389+00', '2025-09-09 21:39:07.909389+00', '2025-09-09 21:39:07.909389+00', '{"eTag": "\"1441a7909c087dbbe7ce59881b9df8b9\"", "size": 15, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T21:39:08.000Z", "contentLength": 15, "httpStatusCode": 200}', '397a25f9-b6c7-4f88-9ea3-3cbad53b0efd', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('081a322e-5dff-4fb5-b21e-9d04e13048df', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757453982009-Better_than_ever_Snipp__prod_5D_Lo__.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 21:39:42.63145+00', '2025-09-09 21:39:42.63145+00', '2025-09-09 21:39:42.63145+00', '{"eTag": "\"1441a7909c087dbbe7ce59881b9df8b9\"", "size": 15, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T21:39:43.000Z", "contentLength": 15, "httpStatusCode": 200}', '46a1d0e5-5345-491b-a0e7-aab2d75eab2b', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('4f087170-d4c3-4bd1-bb62-82234c360aee', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757456927691-WAIT_STEMS_6_RAFAL_Tag.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 22:28:47.94468+00', '2025-09-09 22:28:47.94468+00', '2025-09-09 22:28:47.94468+00', '{"eTag": "\"1441a7909c087dbbe7ce59881b9df8b9\"", "size": 15, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T22:28:48.000Z", "contentLength": 15, "httpStatusCode": 200}', '32edd9d9-b8c2-4625-9424-21aec867db3b', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('5e6759fb-6b93-48f9-ac57-f883255e0c1a', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757457071051-HEART__RAFALSOUND_150BPM_G_M.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 22:31:11.311392+00', '2025-09-09 22:31:11.311392+00', '2025-09-09 22:31:11.311392+00', '{"eTag": "\"1441a7909c087dbbe7ce59881b9df8b9\"", "size": 15, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T22:31:12.000Z", "contentLength": 15, "httpStatusCode": 200}', 'db983f73-bad7-477c-94ce-9f7d3ffb114c', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('3632c1ae-5c1d-40f0-bb39-c3ab168b4fb3', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757457165923-HEART__RAFALSOUND_150BPM_G_M.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 22:32:46.242064+00', '2025-09-09 22:32:46.242064+00', '2025-09-09 22:32:46.242064+00', '{"eTag": "\"1441a7909c087dbbe7ce59881b9df8b9\"", "size": 15, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T22:32:47.000Z", "contentLength": 15, "httpStatusCode": 200}', '334ecba5-cfe4-4581-b8bd-ca220ac5e16f', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('faa72694-788d-48da-80ad-07ad596cdfd1', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757458578852-WAIT__RAFALSOUND__CHOPROD_130BPM.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 22:56:21.040314+00', '2025-09-09 22:56:21.040314+00', '2025-09-09 22:56:21.040314+00', '{"eTag": "\"4c4b6ad2892793a7cba8407245de1541\"", "size": 4726072, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T22:56:21.000Z", "contentLength": 4726072, "httpStatusCode": 200}', '407d1a8f-8b9a-4e35-8329-379487568c8f', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('9c183afa-0fe1-4d92-b8ad-b499f8fb8fa7', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/visual_1757459644858_Mariah Carey - Fantasy (Instrumental).mp4', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 23:14:06.922699+00', '2025-09-09 23:14:06.922699+00', '2025-09-09 23:14:06.922699+00', '{"eTag": "\"e51a2f2fec9734bb18c3be88b8cc4de2\"", "size": 3047424, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T23:14:07.000Z", "contentLength": 3047424, "httpStatusCode": 200}', '10f1a722-5334-42e9-bb18-a69cdafe62ce', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('5828690a-98a1-48cc-88ac-4d685ba273d4', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1757459659129-HEART__RAFALSOUND_150BPM_G_M.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-09 23:14:20.906304+00', '2025-09-09 23:14:20.906304+00', '2025-09-09 23:14:20.906304+00', '{"eTag": "\"645d6c68ce95e507bbb25e3ab2085b85\"", "size": 4095999, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-09T23:14:21.000Z", "contentLength": 4095999, "httpStatusCode": 200}', '0e03239d-204d-4617-8b2e-7e61837b9ac6', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('d2767ba4-9bd3-4cd8-af10-19a50f752d52', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758858655795-_FREE__Lil_Yachty_x_Cash_Cobain_Type_Beat__Everytime_U_Call_.wav', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 03:51:05.741126+00', '2025-09-26 03:51:05.741126+00', '2025-09-26 03:51:05.741126+00', '{"eTag": "\"9cfa96260bf5a7fe7ddae809b93681f0-7\"", "size": 31568216, "mimetype": "audio/wav", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T03:51:05.000Z", "contentLength": 31568216, "httpStatusCode": 200}', '80fe6919-e986-486c-b126-42c3a214f92d', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('949954cf-7e46-4650-aa10-4f5653e15864', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758865505562-_FREE__Lil_Yachty_x_Cash_Cobain_Type_Beat__Everytime_U_Call_.wav', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 05:45:13.345398+00', '2025-09-26 05:45:13.345398+00', '2025-09-26 05:45:13.345398+00', '{"eTag": "\"9cfa96260bf5a7fe7ddae809b93681f0-7\"", "size": 31568216, "mimetype": "audio/wav", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T05:45:13.000Z", "contentLength": 31568216, "httpStatusCode": 200}', 'e8d84c72-c2e9-4a06-a2df-4d0f0a68b2b1', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('dd1af5a1-5f7c-4f9f-9287-744e40e296b8', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758911224837-_FREE__Lil_Yachty_x_Veeze_Type_Beat__Juice_.wav', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 18:27:14.166943+00', '2025-09-26 18:27:14.166943+00', '2025-09-26 18:27:14.166943+00', '{"eTag": "\"3ee6a8e453dd5c0704bdb19b73b2fb07-7\"", "size": 32782982, "mimetype": "audio/wav", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T18:27:14.000Z", "contentLength": 32782982, "httpStatusCode": 200}', '898076fc-136b-4666-8094-e5014eebfe68', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('e10132a3-799d-4d12-9f17-fd989559f8a2', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758911697447-_FREE__Lil_Yachty_x_Cash_Cobain_Type_Beat__Everytime_U_Call_.wav', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 18:35:06.589376+00', '2025-09-26 18:35:06.589376+00', '2025-09-26 18:35:06.589376+00', '{"eTag": "\"9cfa96260bf5a7fe7ddae809b93681f0-7\"", "size": 31568216, "mimetype": "audio/wav", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T18:35:06.000Z", "contentLength": 31568216, "httpStatusCode": 200}', '9ca4caf9-7f37-4022-a95c-49561ec3c80a', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('5b550fd3-6305-4403-9e64-a20bb2e15afd', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758912853199-_FREE__WESTSIDE_GUNN_X_THE_ALCHEMIST_TYPE_BEAT____YOU_DON_T_HAVE_TO_.wav', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 18:54:20.153546+00', '2025-09-26 18:54:20.153546+00', '2025-09-26 18:54:20.153546+00', '{"eTag": "\"4aef0213a8b4543be7bf4ceb88869395-5\"", "size": 22954232, "mimetype": "audio/wav", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T18:54:20.000Z", "contentLength": 22954232, "httpStatusCode": 200}', '3d5276f8-f3fa-4949-acea-e917517f914f', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('d2064b77-a61a-49f8-b26a-0964acc30c30', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758914900481-WAIT_STEMS_6_RAFAL_Tag.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 19:28:24.276575+00', '2025-09-26 19:28:24.276575+00', '2025-09-26 19:28:24.276575+00', '{"eTag": "\"320e172873b39260fb9aae860283e3da\"", "size": 4726072, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T19:28:25.000Z", "contentLength": 4726072, "httpStatusCode": 200}', '3bcdb4ab-957a-4440-b30d-a407db5441ba', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('9af96b18-b9a0-4f39-b03d-ef888770458d', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758914904694-WAIT_STEMS_5_TRAP.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 19:28:27.483601+00', '2025-09-26 19:28:27.483601+00', '2025-09-26 19:28:27.483601+00', '{"eTag": "\"49c8315c2b82492eb2975924f9438e3f\"", "size": 4726072, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T19:28:28.000Z", "contentLength": 4726072, "httpStatusCode": 200}', '568606d4-16bf-4535-b181-4fe1757295db', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('43b0cec4-5b16-4798-880f-beaf066516d3', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758914907741-WAIT_STEMS_4_808_2__C____hacked_my_instagram__.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 19:28:29.846889+00', '2025-09-26 19:28:29.846889+00', '2025-09-26 19:28:29.846889+00', '{"eTag": "\"eca646511ed55db4da310c10406a06b4\"", "size": 4726072, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T19:28:30.000Z", "contentLength": 4726072, "httpStatusCode": 200}', 'd101fa72-5209-4f2d-acba-47b0014bbe53', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('b0eef4ba-5758-4a26-ae2e-b5c27a0142a8', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758914910117-WAIT_STEMS_3_wait_loop_128_bpm__choprod_.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 19:28:32.316694+00', '2025-09-26 19:28:32.316694+00', '2025-09-26 19:28:32.316694+00', '{"eTag": "\"d42c664dd28938bbaaf0006adbfe105e\"", "size": 4726072, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T19:28:33.000Z", "contentLength": 4726072, "httpStatusCode": 200}', '53ecfe30-fd64-4f74-a32d-a25892ec6a9d', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2),
	('678924ee-15b7-4ac8-9321-b2646b267e36', 'artist-content', '15480116-8c78-4a75-af8c-2c70795333a6/1758914912889-WAIT_STEMS_2_Surge_XT.mp3', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-26 19:28:40.857007+00', '2025-09-26 19:28:40.857007+00', '2025-09-26 19:28:40.857007+00', '{"eTag": "\"9f19fda127a480ca1108cf0c776741bd\"", "size": 4726072, "mimetype": "audio/mpeg", "cacheControl": "max-age=3600", "lastModified": "2025-09-26T19:28:41.000Z", "contentLength": 4726072, "httpStatusCode": 200}', 'b60158f2-1369-4845-b275-701b9e059b05', '15480116-8c78-4a75-af8c-2c70795333a6', '{}', 2);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
	('artist-content', '15480116-8c78-4a75-af8c-2c70795333a6', '2025-09-02 06:11:03.500767+00', '2025-09-02 06:11:03.500767+00'),
	('public-assets', 'profile-photos', '2025-09-27 00:30:36.963586+00', '2025-09-27 00:30:36.963586+00');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 122, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
