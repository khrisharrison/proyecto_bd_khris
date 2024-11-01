CREATE TABLE boards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(256) NOT NULL
);

CREATE TABLE users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) UNIQUE NOT NULL
);

CREATE TABLE board_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    isAdmin BOOLEAN DEFAULT false,
    boardId UUID REFERENCES boards(id) ON DELETE CASCADE ON UPDATE CASCADE,
    userId UUID REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE list (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    boardId UUID REFERENCES boards(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE card (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo VARCHAR(256) NOT NULL,
    descripcion VARCHAR(256) NOT NULL,
    fecha_tope DATE NOT NULL,
    list_id UUID REFERENCES list(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE card_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_owner boolean NOT NULL DEFAULT false,
    FOREIGN KEY (card_id) REFERENCES public.card(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE
);