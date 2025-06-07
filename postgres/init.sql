CREATE TABLE IF NOT EXISTS searchables (
    searchable_id SERIAL PRIMARY KEY,
    terminal_id INTEGER NOT NULL,
    searchable_data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS searchable_geo (
    searchable_id INTEGER NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    geohash TEXT NOT NULL,
    PRIMARY KEY (searchable_id),
    FOREIGN KEY (searchable_id) REFERENCES searchables(searchable_id) ON DELETE CASCADE
);

-- Index for geohash to improve search performance
CREATE INDEX IF NOT EXISTS idx_searchable_geo_geohash ON searchable_geo(geohash);

-- Index for coordinates to support direct lat/long queries
CREATE INDEX IF NOT EXISTS idx_searchable_geo_coords ON searchable_geo(latitude, longitude);

CREATE TABLE IF NOT EXISTS kv (
    type TEXT NOT NULL,
    pkey TEXT NOT NULL,
    fkey TEXT NOT NULL,
    data JSONB NOT NULL,
    PRIMARY KEY (type, pkey, fkey)
);
-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_type ON kv(type);


-- Index on pkey for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_pkey ON kv(pkey);

-- Index on fkey for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_fkey ON kv(fkey);


CREATE TABLE IF NOT EXISTS terminal (
    terminal_id SERIAL PRIMARY KEY,
    terminal_data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
    file_id SERIAL PRIMARY KEY,
    uri TEXT NOT NULL,
    metadata JSONB NOT NULL
);

-- Index on uri for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_uri ON files(uri);

CREATE TABLE IF NOT EXISTS purchases (
    purchase_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE
);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- Index on file_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_file_id ON purchases(file_id);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);

-- Updated invoice table with better structure
CREATE TABLE IF NOT EXISTS invoice (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    searchable_id INTEGER NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL CHECK (currency = 'usd'),
    type TEXT NOT NULL CHECK (type = 'stripe'),
    external_id TEXT NOT NULL UNIQUE, -- Stripe session ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on buyer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_buyer_id ON invoice(buyer_id);

-- Index on seller_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_seller_id ON invoice(seller_id);

-- Index on searchable_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_searchable_id ON invoice(searchable_id);

-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_type ON invoice(type);

-- Index on external_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_external_id ON invoice(external_id);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON invoice(created_at);

-- Updated payment table
CREATE TABLE IF NOT EXISTS payment (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL CHECK (currency = 'usd'),
    type TEXT NOT NULL CHECK (type = 'stripe'),
    external_id TEXT, -- External payment ID if available
    status TEXT NOT NULL CHECK (status IN ('pending', 'complete')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_invoice_id ON payment(invoice_id);

-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_type ON payment(type);

-- Index on status for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at);

-- Updated withdrawal table with currency field
CREATE TABLE IF NOT EXISTS withdrawal (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL CHECK (currency = 'usd'),
    type TEXT NOT NULL CHECK (type = 'bank_transfer'),
    external_id TEXT, -- Transaction ID
    status TEXT NOT NULL CHECK (status IN ('pending', 'complete')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_user_id ON withdrawal(user_id);

-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_type ON withdrawal(type);

-- Index on status for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal(status);

-- Index on currency for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_currency ON withdrawal(currency);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_withdrawal_created_at ON withdrawal(created_at);

-- Invoice notes table for communication between buyer and seller
CREATE TABLE IF NOT EXISTS invoice_note (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    buyer_seller TEXT NOT NULL, -- 'buyer' or 'seller'
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_note_invoice_id ON invoice_note(invoice_id);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_note_user_id ON invoice_note(user_id);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_invoice_note_created_at ON invoice_note(created_at);

-- Rating table for buyer/seller ratings
CREATE TABLE IF NOT EXISTS rating (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    rating DOUBLE PRECISION NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_rating_invoice_id ON rating(invoice_id);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_rating_user_id ON rating(user_id);

-- Index on rating for faster aggregations
CREATE INDEX IF NOT EXISTS idx_rating_rating ON rating(rating);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_rating_created_at ON rating(created_at);

