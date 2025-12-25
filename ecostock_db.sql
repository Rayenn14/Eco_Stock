--
-- PostgreSQL database dump
--

\restrict PNcBZNcwSkN7PiPUu8kfXY2Q1qTWD8j6ziDpXxuK2nCDAbSU64mXN4JFzXAU0gJ

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: decrement_stock_on_lot_confirm(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.decrement_stock_on_lot_confirm() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    item RECORD;
    produit_stock INTEGER;
BEGIN
    -- V‚rifier si le statut passe … 'confirmee'
    IF NEW.statut = 'confirmee' AND (OLD.statut IS NULL OR OLD.statut != 'confirmee') THEN

        -- Pour chaque produit du lot
        FOR item IN
            SELECT product_id, COALESCE(quantite, 1) as quantite
            FROM lot_items
            WHERE lot_id = NEW.id
        LOOP
            -- V‚rifier le stock disponible
            SELECT stock INTO produit_stock
            FROM products
            WHERE id = item.product_id;

            -- Si stock insuffisant, bloquer
            IF produit_stock < item.quantite THEN
                RAISE EXCEPTION 'Stock insuffisant pour le produit % (demand‚: %, disponible: %)', 
                    item.product_id, item.quantite, produit_stock;
            END IF;

            -- D‚cr‚menter le stock selon la quantit‚
            UPDATE products
            SET stock = stock - item.quantite
            WHERE id = item.product_id;

        END LOOP;

        RAISE NOTICE 'Stock d‚cr‚ment‚ pour le lot %', NEW.numero_lot;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.decrement_stock_on_lot_confirm() OWNER TO postgres;

--
-- Name: FUNCTION decrement_stock_on_lot_confirm(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.decrement_stock_on_lot_confirm() IS 'D‚cr‚mente le stock de chaque produit (selon quantit‚) quand un lot est confirm‚';


--
-- Name: generate_numero_lot(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_numero_lot() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.numero_lot := 'LOT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('lots_sequence')::TEXT, 6, '0');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_numero_lot() OWNER TO postgres;

--
-- Name: restore_stock_on_lot_cancel(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.restore_stock_on_lot_cancel() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    item RECORD;
BEGIN
    -- V‚rifier si le statut passe … 'annulee' depuis 'confirmee'
    IF NEW.statut = 'annulee' AND OLD.statut = 'confirmee' THEN

        -- Pour chaque produit du lot, restaurer le stock selon la quantit‚
        FOR item IN
            SELECT product_id, COALESCE(quantite, 1) as quantite
            FROM lot_items
            WHERE lot_id = NEW.id
        LOOP
            UPDATE products
            SET stock = stock + item.quantite
            WHERE id = item.product_id;
        END LOOP;

        RAISE NOTICE 'Stock restaur‚ pour le lot annul‚ %', NEW.numero_lot;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.restore_stock_on_lot_cancel() OWNER TO postgres;

--
-- Name: FUNCTION restore_stock_on_lot_cancel(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.restore_stock_on_lot_cancel() IS 'Restaure le stock (selon quantit‚) si un lot confirm‚ est annul‚';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: commerces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commerces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendeur_id uuid NOT NULL,
    nom_commerce character varying(255) NOT NULL,
    adresse text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    latitude numeric(10,8),
    longitude numeric(11,8)
);


ALTER TABLE public.commerces OWNER TO postgres;

--
-- Name: TABLE commerces; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.commerces IS 'Informations des commerces des vendeurs';


--
-- Name: COLUMN commerces.vendeur_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commerces.vendeur_id IS 'ID du vendeur (r‚f‚rence vers users)';


--
-- Name: COLUMN commerces.nom_commerce; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commerces.nom_commerce IS 'Nom du commerce';


--
-- Name: COLUMN commerces.adresse; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commerces.adresse IS 'Adresse complŠte du commerce';


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredients (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ingredients OWNER TO postgres;

--
-- Name: ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredients_id_seq OWNER TO postgres;

--
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- Name: lot_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lot_items (
    id integer NOT NULL,
    lot_id uuid NOT NULL,
    product_id uuid NOT NULL,
    prix_unitaire numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantite integer DEFAULT 1 NOT NULL,
    CONSTRAINT lot_items_quantite_check CHECK ((quantite > 0))
);


ALTER TABLE public.lot_items OWNER TO postgres;

--
-- Name: COLUMN lot_items.quantite; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lot_items.quantite IS 'Quantit‚ de ce produit dans le lot (permet d''acheter plusieurs fois le mˆme produit)';


--
-- Name: lot_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lot_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lot_items_id_seq OWNER TO postgres;

--
-- Name: lot_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lot_items_id_seq OWNED BY public.lot_items.id;


--
-- Name: lots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    vendeur_id uuid NOT NULL,
    numero_lot character varying(50) NOT NULL,
    total numeric(10,2) NOT NULL,
    statut character varying(50) DEFAULT 'en_attente'::character varying,
    mode_recuperation character varying(50),
    adresse_livraison text,
    date_recuperation timestamp without time zone,
    message_client text,
    message_vendeur text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lots_mode_recuperation_check CHECK (((mode_recuperation)::text = ANY ((ARRAY['sur_place'::character varying, 'livraison'::character varying])::text[]))),
    CONSTRAINT lots_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'confirmee'::character varying, 'en_preparation'::character varying, 'prete'::character varying, 'livree'::character varying, 'annulee'::character varying])::text[])))
);


ALTER TABLE public.lots OWNER TO postgres;

--
-- Name: COLUMN lots.mode_recuperation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lots.mode_recuperation IS 'Mode de r‚cup‚ration: sur_place ou livraison';


--
-- Name: COLUMN lots.adresse_livraison; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lots.adresse_livraison IS 'Adresse de livraison si mode_recuperation = livraison';


--
-- Name: COLUMN lots.message_vendeur; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lots.message_vendeur IS 'Message du vendeur au client concernant la commande';


--
-- Name: lots_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lots_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lots_sequence OWNER TO postgres;

--
-- Name: panier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.panier (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantite integer DEFAULT 1 NOT NULL,
    CONSTRAINT panier_quantite_check CHECK ((quantite > 0))
);


ALTER TABLE public.panier OWNER TO postgres;

--
-- Name: COLUMN panier.quantite; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.panier.quantite IS 'Quantit‚ du produit dans le panier (minimum 1)';


--
-- Name: panier_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.panier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.panier_id_seq OWNER TO postgres;

--
-- Name: panier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.panier_id_seq OWNED BY public.panier.id;


--
-- Name: product_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_items (
    id integer NOT NULL,
    product_id uuid NOT NULL,
    ingredient_id integer,
    nom character varying(255) NOT NULL,
    quantite integer DEFAULT 1 NOT NULL,
    unite character varying(20) DEFAULT 'unitÃ©'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_items OWNER TO postgres;

--
-- Name: product_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_items_id_seq OWNER TO postgres;

--
-- Name: product_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_items_id_seq OWNED BY public.product_items.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendeur_id uuid NOT NULL,
    category_id integer,
    nom character varying(255) NOT NULL,
    description text,
    prix numeric(10,2) NOT NULL,
    prix_original numeric(10,2),
    stock integer DEFAULT 0,
    image_url text,
    dlc date,
    is_disponible boolean DEFAULT true,
    reserved_for_associations boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_lot boolean DEFAULT false
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: TABLE products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.products IS 'Table des produits - Un produit peut ˆtre dans plusieurs lots (voir lot_items)';


--
-- Name: COLUMN products.is_lot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.is_lot IS 'Indique si le produit est un panier surprise/lot (true) ou un produit normal (false)';


--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipe_ingredients (
    recipe_id integer NOT NULL,
    ingredient_id integer NOT NULL
);


ALTER TABLE public.recipe_ingredients OWNER TO postgres;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipes (
    id integer NOT NULL,
    title text NOT NULL,
    instructions text,
    image_name text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recipes OWNER TO postgres;

--
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipes_id_seq OWNER TO postgres;

--
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendeur_id uuid NOT NULL,
    client_id uuid NOT NULL,
    note integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_note_check CHECK (((note >= 1) AND (note <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prenom character varying(100) NOT NULL,
    nom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    user_type character varying(20) NOT NULL,
    nom_association character varying(255),
    telephone character varying(20),
    adresse text,
    ville character varying(100),
    code_postal character varying(10),
    photo_profil text,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['vendeur'::character varying, 'client'::character varying, 'association'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- Name: lot_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot_items ALTER COLUMN id SET DEFAULT nextval('public.lot_items_id_seq'::regclass);


--
-- Name: panier id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panier ALTER COLUMN id SET DEFAULT nextval('public.panier_id_seq'::regclass);


--
-- Name: product_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_items ALTER COLUMN id SET DEFAULT nextval('public.product_items_id_seq'::regclass);


--
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, nom, description, created_at) FROM stdin;
1	Fruits & LÃ©gumes	Fruits et lÃ©gumes frais	2025-12-22 23:00:38.674473
2	Boulangerie	Pain et viennoiseries	2025-12-22 23:00:38.674473
3	Produits laitiers	Lait, fromage, yaourts	2025-12-22 23:00:38.674473
4	Viande & Poisson	Viandes et poissons frais	2025-12-22 23:00:38.674473
5	Ã‰picerie	Produits secs et conserves	2025-12-22 23:00:38.674473
6	Boissons	Boissons diverses	2025-12-22 23:00:38.674473
7	Snacks	GÃ¢teaux et collations	2025-12-22 23:00:38.674473
8	Bio	Produits biologiques	2025-12-22 23:00:38.674473
9	SurgelÃ©s	Produits surgelÃ©s	2025-12-22 23:00:38.674473
10	Autres	Autres produits	2025-12-22 23:00:38.674473
\.


--
-- Data for Name: commerces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commerces (id, vendeur_id, nom_commerce, adresse, created_at, updated_at, latitude, longitude) FROM stdin;
1a25b353-c1a2-467a-9f36-7a4fce843ee2	04ab8455-3e8c-427d-8238-2a82231d3171	À	A	2025-12-23 08:56:08.936281	2025-12-23 08:56:08.936281	\N	\N
8e7d8170-1b78-45c8-87f8-d0d9be8c81eb	c3f47217-db30-45a7-8c0e-b65ada599c17	B	17, Rue Henri Barbusse, Quartier du Val-de-Grâce, 5th Arrondissement, Paris, Ile-de-France, Metropolitan France, 75005, France	2025-12-23 09:11:47.373077	2025-12-23 09:11:47.373077	48.84234840	2.33927200
ec28970b-0e6c-44fb-8b86-7a56b87f1edc	c30ca161-9e65-43f3-82af-291b064e4951	À	À	2025-12-23 09:23:10.602341	2025-12-23 09:23:10.602341	\N	\N
51f5f66f-5c7b-4b6c-8238-fed5614ec65e	38b47b74-fc97-4c0c-9c59-b3855aa7c147	À	Ligne 17, Mail Jeanne Fontaine, Le Blanc-Mesnil, Le Raincy, Seine-Saint-Denis, Ile-de-France, Metropolitan France, 93150, France	2025-12-23 09:33:43.388729	2025-12-23 09:33:43.388729	48.96596330	2.45425580
80ae4bd1-4be9-4d06-b8ee-f2f86c5c7c35	11111111-1111-1111-1111-111111111111	La Boutique Fraiche	15 Rue de la Paix, 75001 Paris, France	2025-12-23 14:55:33.375225	2025-12-23 14:55:33.375225	48.86980000	2.33080000
a0b15d85-0726-4dba-a6ea-3672273e46ad	22222222-2222-2222-2222-222222222222	Epicerie du Coin	45 Avenue des Champs-Elysees, 75008 Paris, France	2025-12-23 14:55:33.375225	2025-12-23 14:55:33.375225	48.87040000	2.30730000
08215606-682d-41c3-aa47-164da70e24f5	33333333-3333-3333-3333-333333333333	Bio Market	28 Boulevard Saint-Germain, 75005 Paris, France	2025-12-23 14:55:33.375225	2025-12-23 14:55:33.375225	48.85100000	2.35040000
8ab2d480-2cdb-422f-ac66-620b8a2e2878	1e5a51ee-0db3-4d60-b5d7-7e2846489b5d	Na	Hana, 17, Rue du Quatre Septembre, Quartier Gaillon, 2nd Arrondissement, Paris, Ile-de-France, Metropolitan France, 75002, France	2025-12-23 19:53:49.704479	2025-12-23 19:54:12.175223	48.86942340	2.33660510
ef7acb81-78d2-414c-bbb5-3886133391e8	feab953f-26ef-43cc-8e94-39388427a623	Na	17, Rue du 4 Septembre, Cité Billion, Faubourg Saint-Jean, Saint-Quentin, Aisne, Hauts-de-France, Metropolitan France, 02100, France	2025-12-23 19:58:03.617954	2025-12-23 19:58:03.617954	\N	\N
70e33730-4464-4f94-b2b3-f13464464e4e	e3488d05-9668-49dc-ac1b-8f57797c12e8	Bioz	Mori Venice Bar, 2, Rue du Quatre Septembre, Quartier Vivienne, 2nd Arrondissement, Paris, Ile-de-France, Metropolitan France, 75002, France	2025-12-23 20:52:28.633771	2025-12-23 20:52:28.633771	48.86907290	2.33999050
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, name, created_at) FROM stdin;
1	pomme	2025-12-23 20:47:53.165213
2	poire	2025-12-23 20:47:53.165213
3	banane	2025-12-23 20:47:53.165213
4	orange	2025-12-23 20:47:53.165213
5	citron	2025-12-23 20:47:53.165213
6	fraise	2025-12-23 20:47:53.165213
7	framboise	2025-12-23 20:47:53.165213
8	myrtille	2025-12-23 20:47:53.165213
9	cerise	2025-12-23 20:47:53.165213
10	peche	2025-12-23 20:47:53.165213
11	abricot	2025-12-23 20:47:53.165213
12	prune	2025-12-23 20:47:53.165213
13	raisin	2025-12-23 20:47:53.165213
14	pasteque	2025-12-23 20:47:53.165213
15	melon	2025-12-23 20:47:53.165213
16	kiwi	2025-12-23 20:47:53.165213
17	ananas	2025-12-23 20:47:53.165213
18	mangue	2025-12-23 20:47:53.165213
19	avocat	2025-12-23 20:47:53.165213
20	noix de coco	2025-12-23 20:47:53.165213
21	tomate	2025-12-23 20:47:53.165213
22	carotte	2025-12-23 20:47:53.165213
23	pomme de terre	2025-12-23 20:47:53.165213
24	oignon	2025-12-23 20:47:53.165213
25	ail	2025-12-23 20:47:53.165213
26	poivron	2025-12-23 20:47:53.165213
27	courgette	2025-12-23 20:47:53.165213
28	aubergine	2025-12-23 20:47:53.165213
29	concombre	2025-12-23 20:47:53.165213
30	salade	2025-12-23 20:47:53.165213
31	laitue	2025-12-23 20:47:53.165213
32	chou	2025-12-23 20:47:53.165213
33	chou-fleur	2025-12-23 20:47:53.165213
34	brocoli	2025-12-23 20:47:53.165213
35	epinard	2025-12-23 20:47:53.165213
36	haricot vert	2025-12-23 20:47:53.165213
37	petit pois	2025-12-23 20:47:53.165213
38	radis	2025-12-23 20:47:53.165213
39	navet	2025-12-23 20:47:53.165213
40	poireau	2025-12-23 20:47:53.165213
41	celeri	2025-12-23 20:47:53.165213
42	fenouil	2025-12-23 20:47:53.165213
43	betterave	2025-12-23 20:47:53.165213
44	courge	2025-12-23 20:47:53.165213
45	potiron	2025-12-23 20:47:53.165213
46	mais	2025-12-23 20:47:53.165213
47	lait	2025-12-23 20:47:53.165213
48	yaourt	2025-12-23 20:47:53.165213
49	fromage	2025-12-23 20:47:53.165213
50	beurre	2025-12-23 20:47:53.165213
51	creme	2025-12-23 20:47:53.165213
52	creme fraiche	2025-12-23 20:47:53.165213
53	fromage blanc	2025-12-23 20:47:53.165213
54	mozzarella	2025-12-23 20:47:53.165213
55	parmesan	2025-12-23 20:47:53.165213
56	comte	2025-12-23 20:47:53.165213
57	camembert	2025-12-23 20:47:53.165213
58	roquefort	2025-12-23 20:47:53.165213
59	chevre	2025-12-23 20:47:53.165213
60	poulet	2025-12-23 20:47:53.165213
61	boeuf	2025-12-23 20:47:53.165213
62	porc	2025-12-23 20:47:53.165213
63	agneau	2025-12-23 20:47:53.165213
64	veau	2025-12-23 20:47:53.165213
65	dinde	2025-12-23 20:47:53.165213
66	canard	2025-12-23 20:47:53.165213
67	saumon	2025-12-23 20:47:53.165213
68	thon	2025-12-23 20:47:53.165213
69	cabillaud	2025-12-23 20:47:53.165213
70	truite	2025-12-23 20:47:53.165213
71	crevette	2025-12-23 20:47:53.165213
72	moule	2025-12-23 20:47:53.165213
73	huitre	2025-12-23 20:47:53.165213
74	riz	2025-12-23 20:47:53.165213
75	pates	2025-12-23 20:47:53.165213
76	pain	2025-12-23 20:47:53.165213
77	farine	2025-12-23 20:47:53.165213
78	quinoa	2025-12-23 20:47:53.165213
79	boulgour	2025-12-23 20:47:53.165213
80	couscous	2025-12-23 20:47:53.165213
81	semoule	2025-12-23 20:47:53.165213
82	avoine	2025-12-23 20:47:53.165213
83	ble	2025-12-23 20:47:53.165213
84	orge	2025-12-23 20:47:53.165213
85	sarrasin	2025-12-23 20:47:53.165213
86	lentille	2025-12-23 20:47:53.165213
87	pois chiche	2025-12-23 20:47:53.165213
88	haricot blanc	2025-12-23 20:47:53.165213
89	haricot rouge	2025-12-23 20:47:53.165213
90	feve	2025-12-23 20:47:53.165213
91	soja	2025-12-23 20:47:53.165213
92	oeuf	2025-12-23 20:47:53.165213
93	huile olive	2025-12-23 20:47:53.165213
94	huile tournesol	2025-12-23 20:47:53.165213
95	huile colza	2025-12-23 20:47:53.165213
96	margarine	2025-12-23 20:47:53.165213
97	sucre	2025-12-23 20:47:53.165213
98	miel	2025-12-23 20:47:53.165213
99	confiture	2025-12-23 20:47:53.165213
100	chocolat	2025-12-23 20:47:53.165213
101	cacao	2025-12-23 20:47:53.165213
102	sirop erable	2025-12-23 20:47:53.165213
103	basilic	2025-12-23 20:47:53.165213
104	persil	2025-12-23 20:47:53.165213
105	coriandre	2025-12-23 20:47:53.165213
106	menthe	2025-12-23 20:47:53.165213
107	thym	2025-12-23 20:47:53.165213
108	romarin	2025-12-23 20:47:53.165213
109	origan	2025-12-23 20:47:53.165213
110	laurier	2025-12-23 20:47:53.165213
111	cannelle	2025-12-23 20:47:53.165213
112	poivre	2025-12-23 20:47:53.165213
113	sel	2025-12-23 20:47:53.165213
114	curry	2025-12-23 20:47:53.165213
115	paprika	2025-12-23 20:47:53.165213
116	cumin	2025-12-23 20:47:53.165213
117	muscade	2025-12-23 20:47:53.165213
118	gingembre	2025-12-23 20:47:53.165213
119	curcuma	2025-12-23 20:47:53.165213
120	amande	2025-12-23 20:47:53.165213
121	noix	2025-12-23 20:47:53.165213
122	noisette	2025-12-23 20:47:53.165213
123	pistache	2025-12-23 20:47:53.165213
124	cacahuete	2025-12-23 20:47:53.165213
125	noix de cajou	2025-12-23 20:47:53.165213
126	graine de courge	2025-12-23 20:47:53.165213
127	graine de tournesol	2025-12-23 20:47:53.165213
128	graine de lin	2025-12-23 20:47:53.165213
129	graine de chia	2025-12-23 20:47:53.165213
130	eau	2025-12-23 20:47:53.165213
131	the	2025-12-23 20:47:53.165213
132	cafe	2025-12-23 20:47:53.165213
133	jus orange	2025-12-23 20:47:53.165213
134	jus pomme	2025-12-23 20:47:53.165213
135	jus raisin	2025-12-23 20:47:53.165213
136	vinaigre	2025-12-23 20:47:53.165213
137	moutarde	2025-12-23 20:47:53.165213
138	ketchup	2025-12-23 20:47:53.165213
139	mayonnaise	2025-12-23 20:47:53.165213
140	sauce soja	2025-12-23 20:47:53.165213
141	soupe	2025-12-23 20:47:53.165213
142	bouillon	2025-12-23 20:47:53.165213
143	conserve	2025-12-23 20:47:53.165213
144	sauce tomate	2025-12-23 20:47:53.165213
145	pate pizza	2025-12-23 20:47:53.165213
146	pate feuilletee	2025-12-23 20:47:53.165213
147	pate brisee	2025-12-23 20:47:53.165213
\.


--
-- Data for Name: lot_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lot_items (id, lot_id, product_id, prix_unitaire, created_at, quantite) FROM stdin;
\.


--
-- Data for Name: lots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lots (id, client_id, vendeur_id, numero_lot, total, statut, mode_recuperation, adresse_livraison, date_recuperation, message_client, message_vendeur, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: panier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.panier (id, user_id, product_id, created_at, quantite) FROM stdin;
\.


--
-- Data for Name: product_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_items (id, product_id, ingredient_id, nom, quantite, unite, created_at) FROM stdin;
4	1cd41925-4167-4772-850e-006b42f57868	21	T	1	unite	2025-12-25 03:22:30.636599
5	d022293b-3297-4b80-ac44-1aa50ffdfbc9	76	Lot	1	unite	2025-12-25 12:46:03.828938
6	d022293b-3297-4b80-ac44-1aa50ffdfbc9	60	Lot	1	unite	2025-12-25 12:46:03.831049
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, vendeur_id, category_id, nom, description, prix, prix_original, stock, image_url, dlc, is_disponible, reserved_for_associations, created_at, updated_at, is_lot) FROM stdin;
1cd41925-4167-4772-850e-006b42f57868	e3488d05-9668-49dc-ac1b-8f57797c12e8	5	T	\N	5.00	10.00	2	https://res.cloudinary.com/dzrlsqsz2/image/upload/v1766629349/ecostock/products/ktimkvjnkj8x0h0ypigv.jpg	2025-12-26	t	f	2025-12-25 03:22:30.603656	2025-12-25 03:22:30.603656	f
d022293b-3297-4b80-ac44-1aa50ffdfbc9	e3488d05-9668-49dc-ac1b-8f57797c12e8	6	Lot	\N	10.00	15.00	5	https://res.cloudinary.com/dzrlsqsz2/image/upload/v1766663162/ecostock/products/gh18jjzxc5ncowiiopsw.jpg	2025-12-26	t	f	2025-12-25 12:46:03.82571	2025-12-25 12:46:03.82571	t
54e9feb6-cf67-4c03-9d57-b0506a80484d	e3488d05-9668-49dc-ac1b-8f57797c12e8	8	Thon	\N	1000.00	2000.00	5	\N	2025-12-26	t	f	2025-12-25 13:29:23.322941	2025-12-25 13:29:23.322941	f
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_ingredients (recipe_id, ingredient_id) FROM stdin;
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipes (id, title, instructions, image_name, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, vendeur_id, client_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, prenom, nom, email, password, user_type, nom_association, telephone, adresse, ville, code_postal, photo_profil, description, is_active, created_at, updated_at) FROM stdin;
b7b283e0-02c8-4924-9cd4-ac371212970e	a	À	a@gmail.com	$2a$10$43Hrg1pDrYc3jtFz4ArxTOa9UEpZZUC.iH.kN3Vj3bhe.mU78Pj3q	client	\N	\N	\N	\N	\N	\N	\N	t	2025-12-22 23:01:26.830087	2025-12-22 23:01:26.830087
04ab8455-3e8c-427d-8238-2a82231d3171	a	À	aaaa@gmail.com	$2a$10$RybWti68Q5gVqpr4alOQn.dh9JiqaIKLmrP2GrLpBjrvFaG4LyTei	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 08:56:08.936281	2025-12-23 08:56:08.936281
c3f47217-db30-45a7-8c0e-b65ada599c17	b	B	b@gmail.com	$2a$10$ZKwY1DCd96sHEetFhfjM8.JDfEkhT0XJslfaZIax4xaCzC2QcYNPa	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 09:11:47.373077	2025-12-23 09:11:47.373077
c30ca161-9e65-43f3-82af-291b064e4951	a	A	aaaaa@gmail.com	$2a$10$9UuPopKHRVDOcGl61IOcwe0HlWN711baWA/C3MvOuQJwr6irZoDRa	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 09:23:10.602341	2025-12-23 09:23:10.602341
38b47b74-fc97-4c0c-9c59-b3855aa7c147	a	À	q@gmail.com	$2a$10$ORf3wAciNBUd1BAMo3Eo9uDwIjhftCngpXB2hm7ds6mzx4q3jPkzm	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 09:33:43.388729	2025-12-23 09:33:43.388729
11111111-1111-1111-1111-111111111111	Pierre	Martin	pierre.martin@boutique.fr	$2a$10$abcdefghijklmnopqrstuvwxyz123456	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 14:55:33.374518	2025-12-23 14:55:33.374518
22222222-2222-2222-2222-222222222222	Marie	Dubois	marie.dubois@epicerie.fr	$2a$10$abcdefghijklmnopqrstuvwxyz123456	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 14:55:33.374518	2025-12-23 14:55:33.374518
33333333-3333-3333-3333-333333333333	Jean	Bernard	jean.bernard@bio.fr	$2a$10$abcdefghijklmnopqrstuvwxyz123456	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 14:55:33.374518	2025-12-23 14:55:33.374518
32f1dc11-6101-4b50-9423-b8b45ae2c4c2	a	A	x@gmail.com	$2a$10$KRwj8VRQXhozY9CsLW1jHOsjCvewTu3/yDrwKCuVv4IxTWEydBuyW	client	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 19:25:50.927266	2025-12-23 19:25:50.927266
1e5a51ee-0db3-4d60-b5d7-7e2846489b5d	nouveau	A	mail@gmail.com	$2a$10$nslmBt0rPjCMuaTTkoqe4.ZLD2KYQCCiGxSxCqmDPpcS6EtY9.eBu	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 19:53:49.704479	2025-12-23 19:54:12.170132
feab953f-26ef-43cc-8e94-39388427a623	nouveau	À	aa@gmail.com	$2a$10$pK8goxw.pjCP8UxaS/qWHe8XJUTBJsh2zm1Egkuk6oZX5HaLLXoai	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-22 23:57:21.26449	2025-12-23 19:58:03.614591
e3488d05-9668-49dc-ac1b-8f57797c12e8	vendeur	Vendeur	vendeur@gmail.com	$2a$10$34trZ1svkCMHnWYr0SN5dujd/TwcKCzLBuMw/b2kbQkOQ8wY/huYm	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23 20:52:28.633771	2025-12-23 20:52:28.633771
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 25, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, false);


--
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 147, true);


--
-- Name: lot_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lot_items_id_seq', 1, false);


--
-- Name: lots_sequence; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lots_sequence', 1, false);


--
-- Name: panier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.panier_id_seq', 1, false);


--
-- Name: product_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_items_id_seq', 6, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recipes_id_seq', 1, false);


--
-- Name: categories categories_nom_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_nom_key UNIQUE (nom);


--
-- Name: categories categories_nom_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_nom_unique UNIQUE (nom);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: commerces commerces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commerces
    ADD CONSTRAINT commerces_pkey PRIMARY KEY (id);


--
-- Name: commerces commerces_vendeur_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commerces
    ADD CONSTRAINT commerces_vendeur_id_key UNIQUE (vendeur_id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: ingredients ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_name_key UNIQUE (name);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: lot_items lot_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot_items
    ADD CONSTRAINT lot_items_pkey PRIMARY KEY (id);


--
-- Name: lots lots_numero_lot_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_numero_lot_key UNIQUE (numero_lot);


--
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- Name: panier panier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panier
    ADD CONSTRAINT panier_pkey PRIMARY KEY (id);


--
-- Name: panier panier_unique_user_product; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panier
    ADD CONSTRAINT panier_unique_user_product UNIQUE (user_id, product_id);


--
-- Name: CONSTRAINT panier_unique_user_product ON panier; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT panier_unique_user_product ON public.panier IS 'Un utilisateur ne peut avoir qu''une seule ligne par produit dans son panier';


--
-- Name: panier panier_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panier
    ADD CONSTRAINT panier_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: product_items product_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_items
    ADD CONSTRAINT product_items_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (recipe_id, ingredient_id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_unique_client_vendeur; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_unique_client_vendeur UNIQUE (client_id, vendeur_id);


--
-- Name: CONSTRAINT reviews_unique_client_vendeur ON reviews; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT reviews_unique_client_vendeur ON public.reviews IS 'Un client ne peut noter qu''une seule fois un vendeur';


--
-- Name: reviews reviews_vendeur_id_client_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_vendeur_id_client_id_key UNIQUE (vendeur_id, client_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_commerces_vendeur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commerces_vendeur ON public.commerces USING btree (vendeur_id);


--
-- Name: idx_favorites_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorites_product ON public.favorites USING btree (product_id);


--
-- Name: idx_favorites_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);


--
-- Name: idx_ingredients_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ingredients_name ON public.ingredients USING btree (name);


--
-- Name: idx_lot_items_lot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lot_items_lot ON public.lot_items USING btree (lot_id);


--
-- Name: idx_lot_items_lot_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lot_items_lot_product ON public.lot_items USING btree (lot_id, product_id);


--
-- Name: idx_lot_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lot_items_product ON public.lot_items USING btree (product_id);


--
-- Name: idx_lots_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lots_client ON public.lots USING btree (client_id);


--
-- Name: idx_lots_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lots_date ON public.lots USING btree (created_at);


--
-- Name: idx_lots_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lots_numero ON public.lots USING btree (numero_lot);


--
-- Name: idx_lots_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lots_statut ON public.lots USING btree (statut);


--
-- Name: idx_lots_vendeur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lots_vendeur ON public.lots USING btree (vendeur_id);


--
-- Name: idx_panier_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_panier_product ON public.panier USING btree (product_id);


--
-- Name: idx_panier_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_panier_user ON public.panier USING btree (user_id);


--
-- Name: idx_product_items_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_items_ingredient ON public.product_items USING btree (ingredient_id);


--
-- Name: idx_product_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_items_product ON public.product_items USING btree (product_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_disponible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_disponible ON public.products USING btree (is_disponible);


--
-- Name: idx_products_prix; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_prix ON public.products USING btree (prix);


--
-- Name: idx_products_reserved_associations; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_reserved_associations ON public.products USING btree (reserved_for_associations);


--
-- Name: idx_products_vendeur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_vendeur ON public.products USING btree (vendeur_id);


--
-- Name: idx_recipe_ingredients_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recipe_ingredients_ingredient ON public.recipe_ingredients USING btree (ingredient_id);


--
-- Name: idx_recipe_ingredients_recipe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients USING btree (recipe_id);


--
-- Name: idx_reviews_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_client ON public.reviews USING btree (client_id);


--
-- Name: idx_reviews_note; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_note ON public.reviews USING btree (note);


--
-- Name: idx_reviews_vendeur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_vendeur ON public.reviews USING btree (vendeur_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_type ON public.users USING btree (user_type);


--
-- Name: idx_users_ville; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_ville ON public.users USING btree (ville);


--
-- Name: lots generate_lots_numero; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_lots_numero BEFORE INSERT ON public.lots FOR EACH ROW WHEN ((new.numero_lot IS NULL)) EXECUTE FUNCTION public.generate_numero_lot();


--
-- Name: lots trigger_decrement_stock_on_lot_confirm; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_decrement_stock_on_lot_confirm BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_lot_confirm();


--
-- Name: lots trigger_restore_stock_on_lot_cancel; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_restore_stock_on_lot_cancel BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_lot_cancel();


--
-- Name: commerces update_commerces_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_commerces_updated_at BEFORE UPDATE ON public.commerces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lots update_lots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: favorites favorites_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commerces fk_commerces_vendeur; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commerces
    ADD CONSTRAINT fk_commerces_vendeur FOREIGN KEY (vendeur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lot_items lot_items_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot_items
    ADD CONSTRAINT lot_items_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;


--
-- Name: lot_items lot_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot_items
    ADD CONSTRAINT lot_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: lots lots_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lots lots_vendeur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_vendeur_id_fkey FOREIGN KEY (vendeur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: panier panier_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panier
    ADD CONSTRAINT panier_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: panier panier_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panier
    ADD CONSTRAINT panier_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: product_items product_items_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_items
    ADD CONSTRAINT product_items_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE SET NULL;


--
-- Name: product_items product_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_items
    ADD CONSTRAINT product_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_vendeur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_vendeur_id_fkey FOREIGN KEY (vendeur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_vendeur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_vendeur_id_fkey FOREIGN KEY (vendeur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PNcBZNcwSkN7PiPUu8kfXY2Q1qTWD8j6ziDpXxuK2nCDAbSU64mXN4JFzXAU0gJ

