--
-- PostgreSQL database dump
--

\restrict nZuKJiha6BVT8WMxRdacTkxDJNbAtdPLmTPghdRDUZQg2FVybvJsGsdFcJJF1Jg

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
-- Name: generate_numero_commande(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_numero_commande() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.numero_commande := 'CMD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('commandes_sequence')::TEXT, 6, '0');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_numero_commande() OWNER TO postgres;

--
-- Name: FUNCTION generate_numero_commande(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.generate_numero_commande() IS 'G‚nŠre automatiquement un num‚ro de commande au format CMD-YYYY-NNNNNN';


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
-- Name: commande_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commande_items (
    id integer CONSTRAINT lot_items_id_not_null NOT NULL,
    commande_id uuid CONSTRAINT lot_items_lot_id_not_null NOT NULL,
    product_id uuid CONSTRAINT lot_items_product_id_not_null NOT NULL,
    prix_unitaire numeric(10,2) CONSTRAINT lot_items_prix_unitaire_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantite integer DEFAULT 1 CONSTRAINT lot_items_quantite_not_null NOT NULL,
    CONSTRAINT lot_items_quantite_check CHECK ((quantite > 0))
);


ALTER TABLE public.commande_items OWNER TO postgres;

--
-- Name: COLUMN commande_items.quantite; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commande_items.quantite IS 'Quantit‚ de ce produit dans le lot (permet d''acheter plusieurs fois le mˆme produit)';


--
-- Name: commandes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commandes (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT lots_id_not_null NOT NULL,
    client_id uuid CONSTRAINT lots_client_id_not_null NOT NULL,
    vendeur_id uuid CONSTRAINT lots_vendeur_id_not_null NOT NULL,
    numero_commande character varying(50) CONSTRAINT lots_numero_lot_not_null NOT NULL,
    total numeric(10,2) CONSTRAINT lots_total_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    stripe_payment_intent_id character varying(255),
    stripe_payment_status character varying(50) DEFAULT 'pending'::character varying,
    paid_at timestamp without time zone,
    statut character varying(50) DEFAULT 'pending'::character varying,
    picked_up boolean DEFAULT false
);


ALTER TABLE public.commandes OWNER TO postgres;

--
-- Name: COLUMN commandes.stripe_payment_intent_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commandes.stripe_payment_intent_id IS 'ID du PaymentIntent Stripe pour cette commande';


--
-- Name: COLUMN commandes.stripe_payment_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commandes.stripe_payment_status IS 'Statut du paiement Stripe: pending, succeeded, failed, cancelled';


--
-- Name: COLUMN commandes.paid_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commandes.paid_at IS 'Date et heure du paiement r‚ussi';


--
-- Name: COLUMN commandes.statut; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commandes.statut IS 'Statut de la commande: pending, paid, completed, cancelled';


--
-- Name: COLUMN commandes.picked_up; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commandes.picked_up IS 'Indique si la commande a ‚t‚ r‚cup‚r‚e par le client';


--
-- Name: commandes_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.commandes_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.commandes_sequence OWNER TO postgres;

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

ALTER SEQUENCE public.lot_items_id_seq OWNED BY public.commande_items.id;


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
    stock integer DEFAULT 1,
    image_url text,
    dlc date,
    is_disponible boolean DEFAULT true,
    reserved_for_associations boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_lot boolean DEFAULT false,
    pickup_start_time time without time zone,
    pickup_end_time time without time zone,
    pickup_instructions text
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: TABLE products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.products IS 'Table des produits - Un produit peut ˆtre dans plusieurs lots (voir lot_items)';


--
-- Name: COLUMN products.stock; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.stock IS 'Stock disponible - D‚cr‚menter selon quantit‚ achet‚e, indisponible si = 0';


--
-- Name: COLUMN products.is_lot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.is_lot IS 'Indique si le produit est un panier surprise/lot (true) ou un produit normal (false)';


--
-- Name: COLUMN products.pickup_start_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.pickup_start_time IS 'Heure de d‚but pour r‚cup‚rer le produit (d‚finie par le vendeur, ex: 14:00)';


--
-- Name: COLUMN products.pickup_end_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.pickup_end_time IS 'Heure de fin pour r‚cup‚rer le produit (d‚finie par le vendeur, ex: 18:00)';


--
-- Name: COLUMN products.pickup_instructions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.pickup_instructions IS 'Instructions suppl‚mentaires pour le retrait (ex: "Entrer par la porte arriŠre")';


--
-- Name: recipe_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipe_categories (
    id integer NOT NULL,
    nom character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recipe_categories OWNER TO postgres;

--
-- Name: TABLE recipe_categories; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recipe_categories IS 'Cat‚gories pour classifier les recettes (v‚g‚tarien, vegan, etc.)';


--
-- Name: COLUMN recipe_categories.nom; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recipe_categories.nom IS 'Nom de la cat‚gorie';


--
-- Name: COLUMN recipe_categories.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recipe_categories.description IS 'Description de la cat‚gorie';


--
-- Name: recipe_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recipe_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipe_categories_id_seq OWNER TO postgres;

--
-- Name: recipe_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recipe_categories_id_seq OWNED BY public.recipe_categories.id;


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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category character varying(50),
    recipe_category_id integer
);


ALTER TABLE public.recipes OWNER TO postgres;

--
-- Name: COLUMN recipes.category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recipes.category IS 'Cat‚gorie de la recette: vegetarien, vegan, sans_gluten, bio, traditionnel';


--
-- Name: COLUMN recipes.recipe_category_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recipes.recipe_category_id IS 'ID de la cat‚gorie de recette';


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
-- Name: user_orders_with_pickup; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_orders_with_pickup AS
 SELECT c.id AS commande_id,
    c.numero_commande,
    c.total,
    c.statut,
    c.stripe_payment_status,
    c.paid_at,
    c.created_at,
    c.client_id,
    u_vendeur.nom AS vendeur_nom,
    u_vendeur.email AS vendeur_email,
    com.nom_commerce,
    com.adresse AS commerce_address,
    com.latitude AS commerce_latitude,
    com.longitude AS commerce_longitude,
    ci.product_id,
    p.nom AS product_name,
    p.image_url AS product_image,
    p.dlc AS product_dlc,
    ci.quantite,
    (ci.prix_unitaire * (ci.quantite)::numeric) AS line_total,
    p.pickup_start_time,
    p.pickup_end_time,
    p.pickup_instructions
   FROM ((((public.commandes c
     JOIN public.users u_vendeur ON ((c.vendeur_id = u_vendeur.id)))
     LEFT JOIN public.commerces com ON ((c.vendeur_id = com.vendeur_id)))
     JOIN public.commande_items ci ON ((c.id = ci.commande_id)))
     JOIN public.products p ON ((ci.product_id = p.id)))
  WHERE ((c.stripe_payment_status)::text = 'succeeded'::text)
  ORDER BY c.created_at DESC;


ALTER VIEW public.user_orders_with_pickup OWNER TO postgres;

--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: commande_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commande_items ALTER COLUMN id SET DEFAULT nextval('public.lot_items_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- Name: panier id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panier ALTER COLUMN id SET DEFAULT nextval('public.panier_id_seq'::regclass);


--
-- Name: product_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_items ALTER COLUMN id SET DEFAULT nextval('public.product_items_id_seq'::regclass);


--
-- Name: recipe_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_categories ALTER COLUMN id SET DEFAULT nextval('public.recipe_categories_id_seq'::regclass);


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
-- Data for Name: commande_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commande_items (id, commande_id, product_id, prix_unitaire, created_at, quantite) FROM stdin;
19	506e4cde-6c6b-4061-906f-bec96c4b2973	8361f83f-75b7-4896-b181-ef4424d9c61e	5.00	2025-12-30 18:06:36.073409	1
21	71e21ca6-65aa-4b22-a8dc-36c075850c69	7f5a7339-9206-475d-aafb-ad594ada8fb3	2.00	2025-12-30 21:44:22.847606	1
22	d057e39e-b57b-434e-9dc7-25f5bc2045d0	eb417052-e80f-4be6-872f-87a42bd0568b	2.00	2025-12-30 21:46:45.040953	1
23	9a71fb76-501a-4f93-bf65-62ca9c50b59c	93626e5f-a17e-408f-8bed-a93939f494fb	5.00	2025-12-30 22:13:09.862785	1
24	fdb96faf-0f34-41ea-88c4-0cf7e74e583e	78d6c003-1077-4655-966f-a95445cbc999	2.00	2025-12-30 22:22:43.893836	1
25	1afa89e9-a991-4bbb-98ad-3614e110f262	60eb81a8-798b-4f45-9257-789dff9a208b	5.00	2025-12-30 22:35:23.381832	1
26	73c91165-3c35-45dd-b154-2370d4eae189	2a53dfa8-0fe2-483a-98c7-c4455cb84c5a	5.00	2025-12-30 22:37:43.402736	1
27	dbe5ffa8-d8a5-49b6-a5de-dc791b1528d4	038d4bff-da38-4dd1-8cdf-a84a870a3e71	2.00	2025-12-30 22:44:21.846203	1
28	5847fa0b-bcd6-4743-99ae-cd42bca1268a	4ba3425f-75d6-4d26-b2ad-4f41a66551d9	5.00	2025-12-30 22:56:22.458291	1
29	e2b4e522-6afb-4086-a925-43bcf58fa130	aff13e97-a7f9-4915-b5cf-086b344cc37b	2.00	2025-12-31 00:05:30.446239	1
30	6ed7bd3a-115d-47a0-93f7-0b60f0472b16	4c8e1ee6-3542-4a66-87af-6047d3848db1	5.00	2025-12-31 00:10:01.641611	2
31	aa04a1dc-ceab-4068-99a4-9cddfd9021ee	969e77c9-6468-40bd-ad60-168a30155941	5.00	2025-12-31 00:19:03.646941	2
32	bb5052ea-208d-4ded-9acb-dd9bb606b9ee	f060c35e-a7e1-4ca7-9d5a-5bd9dd289c92	4.00	2025-12-31 00:24:10.773693	2
33	bf775b63-952c-4390-9780-b69d2682e5a4	969e77c9-6468-40bd-ad60-168a30155941	5.00	2025-12-31 00:33:19.606538	2
34	b809a4f3-ac13-4f4e-a52a-1b6936fdd51d	969e77c9-6468-40bd-ad60-168a30155941	5.00	2025-12-31 00:34:43.237821	2
35	ae439556-0894-49db-add1-663bcd9b4bb8	969e77c9-6468-40bd-ad60-168a30155941	5.00	2025-12-31 00:38:34.735202	1
\.


--
-- Data for Name: commandes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commandes (id, client_id, vendeur_id, numero_commande, total, created_at, updated_at, stripe_payment_intent_id, stripe_payment_status, paid_at, statut, picked_up) FROM stdin;
dbe5ffa8-d8a5-49b6-a5de-dc791b1528d4	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000009	2.00	2025-12-30 22:44:21.839367	2025-12-30 22:44:45.184265	pi_3SkAiI3AH8r0pLWd0WFktruL	succeeded	2025-12-30 22:44:45.184265	paid	f
d057e39e-b57b-434e-9dc7-25f5bc2045d0	e13bd400-8cc8-4ae4-a1f7-b99f8f884124	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000004	2.00	2025-12-30 21:46:45.036982	2025-12-30 21:47:02.835825	pi_3Sk9oX3AH8r0pLWd1pOSSuNM	succeeded	2025-12-30 21:47:02.835825	paid	f
9a71fb76-501a-4f93-bf65-62ca9c50b59c	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000005	5.00	2025-12-30 22:13:09.857412	2025-12-30 22:13:24.650036	pi_3SkAE63AH8r0pLWd1HklQhRZ	succeeded	2025-12-30 22:13:24.650036	paid	f
71e21ca6-65aa-4b22-a8dc-36c075850c69	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000003	2.00	2025-12-30 21:44:22.842447	2025-12-30 22:34:20.776003	pi_3Sk9mF3AH8r0pLWd01EQsKL1	succeeded	2025-12-30 21:44:44.983426	paid	t
506e4cde-6c6b-4061-906f-bec96c4b2973	e3488d05-9668-49dc-ac1b-8f57797c12e8	ebe0a9b0-2f93-469f-8cb5-bd21ec8e5c8a	CMD-2025-000001	5.00	2025-12-30 18:06:36.066765	2025-12-30 22:34:26.028542	pi_3Sk6NU3AH8r0pLWd0ZuxNcUn	succeeded	2025-12-30 18:06:54.742569	paid	t
fdb96faf-0f34-41ea-88c4-0cf7e74e583e	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000006	2.00	2025-12-30 22:22:43.887534	2025-12-30 22:34:34.565887	pi_3SkANM3AH8r0pLWd0VAgxZD2	succeeded	2025-12-30 22:22:58.698381	paid	f
1afa89e9-a991-4bbb-98ad-3614e110f262	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000007	5.00	2025-12-30 22:35:23.376181	2025-12-30 22:35:35.820498	pi_3SkAZc3AH8r0pLWd18X6CoBW	succeeded	2025-12-30 22:35:35.820498	paid	f
73c91165-3c35-45dd-b154-2370d4eae189	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000008	5.00	2025-12-30 22:37:43.395971	2025-12-30 22:37:56.514336	pi_3SkAbs3AH8r0pLWd14SJM52s	succeeded	2025-12-30 22:37:56.514336	paid	f
5847fa0b-bcd6-4743-99ae-cd42bca1268a	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000010	5.00	2025-12-30 22:56:22.454409	2025-12-30 22:56:35.118243	pi_3SkAtv3AH8r0pLWd0pzyOaeR	succeeded	2025-12-30 22:56:35.118243	paid	f
e2b4e522-6afb-4086-a925-43bcf58fa130	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000011	2.00	2025-12-31 00:05:30.443007	2025-12-31 00:05:46.516891	pi_3SkByp3AH8r0pLWd0Ioq0Lou	succeeded	2025-12-31 00:05:46.516891	paid	f
6ed7bd3a-115d-47a0-93f7-0b60f0472b16	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000012	10.00	2025-12-31 00:10:01.638518	2025-12-31 00:10:16.956193	pi_3SkC3C3AH8r0pLWd1a9M5jrZ	succeeded	2025-12-31 00:10:16.956193	paid	f
aa04a1dc-ceab-4068-99a4-9cddfd9021ee	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000013	10.00	2025-12-31 00:19:03.643955	2025-12-31 00:19:18.708345	pi_3SkCBw3AH8r0pLWd1aVDqddV	succeeded	2025-12-31 00:19:18.708345	paid	f
bb5052ea-208d-4ded-9acb-dd9bb606b9ee	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000014	8.00	2025-12-31 00:24:10.77049	2025-12-31 00:24:22.101357	pi_3SkCGt3AH8r0pLWd0DBfE8B5	succeeded	2025-12-31 00:24:22.101357	paid	f
bf775b63-952c-4390-9780-b69d2682e5a4	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000015	10.00	2025-12-31 00:33:19.603154	2025-12-31 00:33:20.025559	pi_3SkCPk3AH8r0pLWd0CRMGvMo	pending	\N	pending	f
b809a4f3-ac13-4f4e-a52a-1b6936fdd51d	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000016	10.00	2025-12-31 00:34:43.233826	2025-12-31 00:34:54.99623	pi_3SkCR63AH8r0pLWd0s6e00t0	succeeded	2025-12-31 00:34:54.99623	paid	f
ae439556-0894-49db-add1-663bcd9b4bb8	e3488d05-9668-49dc-ac1b-8f57797c12e8	e3488d05-9668-49dc-ac1b-8f57797c12e8	CMD-2025-000017	5.00	2025-12-31 00:38:34.731208	2025-12-31 00:38:47.916853	pi_3SkCUp3AH8r0pLWd1qT0l1uj	succeeded	2025-12-31 00:38:47.916853	paid	f
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
dee00591-ef06-440c-a650-30c1dfbd1daf	ebe0a9b0-2f93-469f-8cb5-bd21ec8e5c8a	La boutique	Place de Clichy, Quartier des Batignolles, 17th Arrondissement, Paris, Ile-de-France, Metropolitan France, 75017, France	2025-12-25 19:40:48.154762	2025-12-25 19:40:48.154762	48.88347760	2.32728990
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
158	champignon	2025-12-25 14:47:40.710057
174	fromage rape	2025-12-25 14:47:40.710057
180	boeuf hache	2025-12-25 14:47:40.710057
181	lardons	2025-12-25 14:47:40.710057
197	herbes de provence	2025-12-25 14:47:40.710057
207	bouillon cube	2025-12-25 14:47:40.710057
208	levure	2025-12-25 14:47:40.710057
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
7	7f5a7339-9206-475d-aafb-ad594ada8fb3	21	To	1	unite	2025-12-30 18:34:08.332154
8	eb417052-e80f-4be6-872f-87a42bd0568b	113	Lot sel et miel	1	unite	2025-12-30 18:35:23.766383
9	eb417052-e80f-4be6-872f-87a42bd0568b	98	Lot sel et miel	1	unite	2025-12-30 18:35:23.768142
10	93626e5f-a17e-408f-8bed-a93939f494fb	21	Tomate	1	unite	2025-12-30 22:12:49.4798
11	78d6c003-1077-4655-966f-a95445cbc999	21	Tomates	1	unite	2025-12-30 22:22:32.865712
12	60eb81a8-798b-4f45-9257-789dff9a208b	21	T	1	unite	2025-12-30 22:35:14.809744
13	2a53dfa8-0fe2-483a-98c7-c4455cb84c5a	68	Tomate	1	unite	2025-12-30 22:37:36.496389
14	038d4bff-da38-4dd1-8cdf-a84a870a3e71	21	To	1	unite	2025-12-30 22:44:14.451125
15	4ba3425f-75d6-4d26-b2ad-4f41a66551d9	21	Tomates	1	unite	2025-12-30 22:55:26.18572
19	aff13e97-a7f9-4915-b5cf-086b344cc37b	21	Toma	1	unite	2025-12-31 00:03:17.111525
20	4c8e1ee6-3542-4a66-87af-6047d3848db1	68	Test	1	unite	2025-12-31 00:09:47.825997
21	969e77c9-6468-40bd-ad60-168a30155941	68	Thon	1	unite	2025-12-31 00:18:51.74978
22	f060c35e-a7e1-4ca7-9d5a-5bd9dd289c92	68	T	1	unite	2025-12-31 00:24:01.044107
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, vendeur_id, category_id, nom, description, prix, prix_original, stock, image_url, dlc, is_disponible, reserved_for_associations, created_at, updated_at, is_lot, pickup_start_time, pickup_end_time, pickup_instructions) FROM stdin;
aff13e97-a7f9-4915-b5cf-086b344cc37b	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Toma	2	2.00	5.00	4	\N	2026-01-01	f	f	2025-12-31 00:03:17.109633	2025-12-31 00:05:46.522996	f	00:02:00	01:02:00	\N
969e77c9-6468-40bd-ad60-168a30155941	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Thon	1kg	5.00	10.00	0	\N	2026-01-01	f	f	2025-12-31 00:18:51.747885	2025-12-31 00:38:47.92193	f	00:18:00	01:18:00	\N
7f5a7339-9206-475d-aafb-ad594ada8fb3	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	To	2kg	2.00	5.00	0	\N	2025-12-31	f	f	2025-12-30 18:34:08.330377	2025-12-30 23:42:26.967383	f	18:33:00	19:33:00	\N
93626e5f-a17e-408f-8bed-a93939f494fb	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Tomate	2kg	5.00	10.00	0	\N	2025-12-31	f	f	2025-12-30 22:12:49.477653	2025-12-30 23:42:26.967383	f	22:12:00	23:12:00	\N
60eb81a8-798b-4f45-9257-789dff9a208b	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	T	2kg	5.00	10.00	0	\N	2025-12-31	f	f	2025-12-30 22:35:14.807328	2025-12-30 23:42:26.967383	f	22:34:00	23:34:00	\N
038d4bff-da38-4dd1-8cdf-a84a870a3e71	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	To	2kg	2.00	10.00	0	\N	2025-12-31	f	f	2025-12-30 22:44:14.4489	2025-12-30 23:42:26.967383	f	22:43:00	23:43:00	\N
4c8e1ee6-3542-4a66-87af-6047d3848db1	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Test	Test	5.00	10.00	3	\N	2026-01-01	t	f	2025-12-31 00:09:47.823804	2025-12-31 00:10:16.962185	f	00:09:00	01:09:00	\N
f060c35e-a7e1-4ca7-9d5a-5bd9dd289c92	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	T	Thon	4.00	5.00	5	\N	2026-01-01	f	f	2025-12-31 00:24:01.041782	2025-12-31 00:24:22.101357	f	00:23:00	01:23:00	\N
eb417052-e80f-4be6-872f-87a42bd0568b	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Lot sel et miel	2kg miel et 1kg de sel	2.00	5.00	0	\N	2025-12-31	f	f	2025-12-30 18:35:23.764641	2025-12-30 23:42:26.967383	t	18:33:00	19:33:00	\N
78d6c003-1077-4655-966f-a95445cbc999	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Tomates	2kg	2.00	5.00	0	\N	2025-12-31	f	f	2025-12-30 22:22:32.863705	2025-12-30 23:42:26.967383	f	22:22:00	23:22:00	\N
8361f83f-75b7-4896-b181-ef4424d9c61e	ebe0a9b0-2f93-469f-8cb5-bd21ec8e5c8a	\N	Riz	1kg de riz blanc	5.00	20.00	0	https://res.cloudinary.com/dzrlsqsz2/image/upload/v1766689155/ecostock/products/ejdshonf18gcyc1kv6ae.jpg	2026-01-02	f	f	2025-12-25 19:59:16.944086	2025-12-30 23:42:26.967383	f	\N	\N	\N
4ba3425f-75d6-4d26-b2ad-4f41a66551d9	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Tomates	2kg	5.00	10.00	0	\N	2025-12-31	f	f	2025-12-30 22:55:26.18355	2025-12-30 23:42:26.967383	f	22:54:00	23:54:00	\N
2a53dfa8-0fe2-483a-98c7-c4455cb84c5a	e3488d05-9668-49dc-ac1b-8f57797c12e8	\N	Tomate	2kg	5.00	10.00	0	\N	2025-12-31	f	f	2025-12-30 22:37:36.494372	2025-12-30 23:42:26.967383	f	22:37:00	23:37:00	\N
\.


--
-- Data for Name: recipe_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_categories (id, nom, description, created_at) FROM stdin;
1	vegetarien	Recettes sans viande ni poisson	2025-12-25 14:53:02.809796
2	vegan	Recettes sans produits d'origine animale	2025-12-25 14:53:02.809796
3	sans_gluten	Recettes sans gluten	2025-12-25 14:53:02.809796
4	bio	Recettes avec des produits bio	2025-12-25 14:53:02.809796
5	traditionnel	Recettes traditionnelles fran‡aises	2025-12-25 14:53:02.809796
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_ingredients (recipe_id, ingredient_id) FROM stdin;
1	21
1	24
1	25
1	26
1	27
1	28
1	93
1	112
1	113
1	197
2	52
2	92
2	112
2	113
2	174
2	181
3	23
3	25
3	47
3	52
3	112
3	113
4	21
4	29
4	30
4	46
4	93
4	112
4	113
4	136
4	137
5	55
5	75
5	92
5	112
5	113
5	181
6	5
6	25
6	50
6	60
6	93
6	107
6	112
6	113
6	197
7	22
7	23
7	24
7	25
7	27
7	112
7	113
7	207
8	24
8	25
8	50
8	55
8	74
8	112
8	113
8	158
8	207
9	22
9	23
9	24
9	25
9	27
9	33
9	52
9	74
9	114
9	115
9	116
10	50
10	92
10	103
10	104
10	112
10	113
11	1
11	50
11	97
12	5
12	21
12	24
12	29
12	81
12	93
12	104
12	112
12	113
13	50
13	77
13	92
13	97
14	5
14	19
14	21
14	26
14	29
14	78
14	93
14	112
14	113
15	22
15	24
15	25
15	77
15	107
15	110
15	112
15	113
15	158
15	180
15	207
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipes (id, title, instructions, image_name, created_at, category, recipe_category_id) FROM stdin;
7	Soupe de Legumes	Eplucher et couper tous les l‚gumes. Faire revenir oignon et ail. Ajouter carottes, pommes de terre, courgettes. Couvrir d'eau, ajouter bouillon cube. Cuire 30 min. Mixer si d‚sir‚. Saler, poivrer.	soupe.jpg	2025-12-25 14:47:40.736963	vegan	2
8	Risotto aux Champignons	Faire revenir oignon et ail. Ajouter le riz et nacrer. Verser progressivement du bouillon chaud en remuant. Ajouter champignons revenus, parmesan et beurre en fin de cuisson. Saler, poivrer.	risotto.jpg	2025-12-25 14:47:40.736963	vegetarien	1
9	Curry de Legumes	Faire revenir oignon et ail. Ajouter curry, cumin, paprika. Ajouter carottes, pommes de terre, courgettes, chou-fleur en morceaux. Verser lait de coco ou crŠme. Laisser mijoter 25 min. Servir avec du riz.	curry.jpg	2025-12-25 14:47:40.736963	vegan	2
10	Omelette aux Fines Herbes	Battre les oufs avec sel, poivre, persil et basilic hach‚s. Faire fondre le beurre dans une poˆle. Verser les oufs. Cuire … feu moyen en remuant l‚gŠrement. Plier en deux et servir.	omelette.jpg	2025-12-25 14:47:40.736963	vegetarien	1
11	Tarte aux Pommes	Etaler la pƒte dans un moule. Eplucher et couper les pommes en fines tranches. Disposer sur la pƒte. Saupoudrer de sucre. Cuire 30 min … 180øC. Badigeonner de beurre fondu en sortie de four.	tarte_pommes.jpg	2025-12-25 14:47:40.736963	vegetarien	1
12	Taboul‚ Libanais	Faire tremper la semoule dans de l'eau. Couper finement tomates, concombre, oignon. Hacher persil et menthe. M‚langer le tout avec huile d'olive, jus de citron, sel et poivre. Laisser reposer 1h au frais.	taboule.jpg	2025-12-25 14:47:40.736963	vegan	2
1	Ratatouille Provencale	Couper tous les l‚gumes en d‚s. Faire revenir l'oignon et l'ail dans l'huile d'olive. Ajouter les aubergines et courgettes, puis les poivrons et tomates. Assaisonner avec les herbes de Provence, sel et poivre. Laisser mijoter 30 minutes … feu doux.	ratatouille.jpg	2025-12-25 14:47:40.736963	vegetarien	1
2	Quiche Lorraine	Etaler la pƒte dans un moule. Faire revenir les lardons. Battre les oufs avec la crŠme fraŒche, sel et poivre. Ajouter les lardons et le fromage rƒp‚. Verser sur la pƒte. Cuire 35 min … 180øC.	quiche.jpg	2025-12-25 14:47:40.736963	traditionnel	5
3	Gratin Dauphinois	Eplucher et couper les pommes de terre en fines rondelles. Frotter le plat avec l'ail. Disposer les pommes de terre en couches. M‚langer lait et crŠme, saler, poivrer. Verser sur les pommes de terre. Cuire 1h … 180øC.	gratin.jpg	2025-12-25 14:47:40.736963	vegetarien	1
4	Salade Composee	Laver et couper la salade. Ajouter tomates, concombre, ma‹s en d‚s. Pr‚parer une vinaigrette avec huile d'olive, vinaigre, moutarde, sel et poivre. M‚langer le tout.	salade.jpg	2025-12-25 14:47:40.736963	vegetarien	1
5	Pates Carbonara	Cuire les pƒtes. Faire revenir les lardons. Battre les oufs avec le parmesan, sel et poivre. M‚langer pƒtes ‚goutt‚es, lardons et m‚lange oufs-fromage hors du feu. Servir imm‚diatement.	carbonara.jpg	2025-12-25 14:47:40.736963	traditionnel	5
6	Poulet Roti aux Herbes	Badigeonner le poulet d'huile d'olive et beurre. Assaisonner avec sel, poivre, thym et herbes de Provence. Ajouter ail et citron dans la cavit‚. Cuire 1h30 … 200øC en arrosant r‚guliŠrement.	poulet_roti.jpg	2025-12-25 14:47:40.736963	traditionnel	5
13	Gateau au Chocolat Fondant	Faire fondre chocolat et beurre. Battre oufs et sucre. M‚langer les deux pr‚parations. Ajouter la farine. Verser dans un moule beurr‚. Cuire 20 min … 180øC (le centre doit rester fondant).	gateau_chocolat.jpg	2025-12-25 14:47:40.736963	vegetarien	1
14	Salade de Quinoa	Cuire le quinoa. Couper tomates, concombre, avocat, poivron en d‚s. M‚langer avec le quinoa refroidi. Assaisonner avec huile d'olive, citron, sel, poivre et herbes fraŒches.	salade_quinoa.jpg	2025-12-25 14:47:40.736963	vegan	2
15	Boeuf Bourguignon	Couper le bouf en cubes. Faire revenir avec oignon, ail, carottes. Ajouter farine, vin rouge, bouillon, laurier, thym. Laisser mijoter 2h30 … feu doux. Ajouter champignons en fin de cuisson.	boeuf_bourguignon.jpg	2025-12-25 14:47:40.736963	traditionnel	5
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
ebe0a9b0-2f93-469f-8cb5-bd21ec8e5c8a	Vendeur2	V	vendeur2@gmail.com	$2a$10$278SVTjX2gdqqGtjx75v0eN1.3nUtUAeERh7t6fYial38qeJxK7Ee	vendeur	\N	\N	\N	\N	\N	\N	\N	t	2025-12-25 19:40:48.154762	2025-12-25 19:40:48.154762
e3488d05-9668-49dc-ac1b-8f57797c12e8	vendeur	Vendeur	vendeur@gmail.com	$2a$10$34trZ1svkCMHnWYr0SN5dujd/TwcKCzLBuMw/b2kbQkOQ8wY/huYm	vendeur	\N	\N	\N	\N	\N	https://res.cloudinary.com/dzrlsqsz2/image/upload/v1767109683/ecostock/profiles/profile_e3488d05-9668-49dc-ac1b-8f57797c12e8.png	\N	t	2025-12-23 20:52:28.633771	2025-12-30 16:48:04.371607
e13bd400-8cc8-4ae4-a1f7-b99f8f884124	Client	Client	client@gmail.com	$2a$10$6WVjVW0m7F23kPOR8gW6F.TczxpwrJTVgL7rfPDLHZCYMENqMesNC	client	\N	\N	\N	\N	\N	https://res.cloudinary.com/dzrlsqsz2/image/upload/v1767127597/ecostock/profiles/profile_e13bd400-8cc8-4ae4-a1f7-b99f8f884124.png	\N	t	2025-12-30 21:46:18.863644	2025-12-30 21:46:37.949495
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 25, true);


--
-- Name: commandes_sequence; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.commandes_sequence', 17, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, false);


--
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 208, true);


--
-- Name: lot_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lot_items_id_seq', 35, true);


--
-- Name: panier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.panier_id_seq', 1, false);


--
-- Name: product_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_items_id_seq', 22, true);


--
-- Name: recipe_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recipe_categories_id_seq', 5, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recipes_id_seq', 15, true);


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
-- Name: commande_items commande_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commande_items
    ADD CONSTRAINT commande_items_pkey PRIMARY KEY (id);


--
-- Name: commandes commandes_numero_commande_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT commandes_numero_commande_key UNIQUE (numero_commande);


--
-- Name: commandes commandes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT commandes_pkey PRIMARY KEY (id);


--
-- Name: commandes commandes_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT commandes_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


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
-- Name: recipe_categories recipe_categories_nom_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_categories
    ADD CONSTRAINT recipe_categories_nom_key UNIQUE (nom);


--
-- Name: recipe_categories recipe_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_categories
    ADD CONSTRAINT recipe_categories_pkey PRIMARY KEY (id);


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
-- Name: idx_commande_items_commande; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commande_items_commande ON public.commande_items USING btree (commande_id);


--
-- Name: idx_commande_items_commande_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commande_items_commande_product ON public.commande_items USING btree (commande_id, product_id);


--
-- Name: idx_commande_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commande_items_product ON public.commande_items USING btree (product_id);


--
-- Name: idx_commandes_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commandes_client ON public.commandes USING btree (client_id);


--
-- Name: idx_commandes_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commandes_date ON public.commandes USING btree (created_at);


--
-- Name: idx_commandes_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commandes_numero ON public.commandes USING btree (numero_commande);


--
-- Name: idx_commandes_vendeur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commandes_vendeur ON public.commandes USING btree (vendeur_id);


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
-- Name: commandes generate_commandes_numero; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_commandes_numero BEFORE INSERT ON public.commandes FOR EACH ROW WHEN ((new.numero_commande IS NULL)) EXECUTE FUNCTION public.generate_numero_commande();


--
-- Name: commandes update_commandes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON public.commandes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commerces update_commerces_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_commerces_updated_at BEFORE UPDATE ON public.commerces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commande_items commande_items_commande_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commande_items
    ADD CONSTRAINT commande_items_commande_id_fkey FOREIGN KEY (commande_id) REFERENCES public.commandes(id) ON DELETE CASCADE;


--
-- Name: commande_items commande_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commande_items
    ADD CONSTRAINT commande_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: commandes commandes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT commandes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commandes commandes_vendeur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT commandes_vendeur_id_fkey FOREIGN KEY (vendeur_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: recipes fk_recipes_recipe_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT fk_recipes_recipe_category FOREIGN KEY (recipe_category_id) REFERENCES public.recipe_categories(id) ON DELETE SET NULL;


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

\unrestrict nZuKJiha6BVT8WMxRdacTkxDJNbAtdPLmTPghdRDUZQg2FVybvJsGsdFcJJF1Jg

