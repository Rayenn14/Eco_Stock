-- Supprimer l'ancienne table reviews si elle existe
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Table pour les avis sur les commerces
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    commerce_id uuid NOT NULL,
    note integer NOT NULL CHECK (note >= 1 AND note <= 5),
    commentaire text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT reviews_commerce_id_fkey FOREIGN KEY (commerce_id) REFERENCES public.commerces(id) ON DELETE CASCADE,
    CONSTRAINT reviews_unique_user_commerce UNIQUE (user_id, commerce_id)
);

-- Index pour optimiser les requetes
CREATE INDEX idx_reviews_commerce_id ON public.reviews(commerce_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

-- Trigger pour mettre a jour updated_at
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.reviews IS 'Avis des utilisateurs sur les commerces';
