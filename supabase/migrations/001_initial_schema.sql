-- RecipeVault Database Schema
-- Initial migration for the recipe repository application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM types
CREATE TYPE source_type AS ENUM ('manual', 'pdf', 'image', 'url', 'social');
CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard', 'expert');
CREATE TYPE parsing_status AS ENUM ('pending', 'parsing', 'parsed', 'review_needed', 'failed');
CREATE TYPE match_status AS ENUM ('matched', 'unmatched', 'user_confirmed', 'user_created');
CREATE TYPE unit_system AS ENUM ('metric', 'imperial');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    preferred_unit_system unit_system DEFAULT 'imperial',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cookbooks table
CREATE TABLE cookbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cookbooks_user_id ON cookbooks(user_id);

-- Foods table (local food database)
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = system/API food
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL, -- lowercase, trimmed for matching
    brand TEXT,
    source TEXT, -- 'usda', 'openfoodfacts', 'user'
    external_id TEXT, -- ID from external API
    serving_size DECIMAL,
    serving_unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source, external_id)
);

CREATE INDEX idx_foods_name_normalized ON foods(name_normalized);
CREATE INDEX idx_foods_user_id ON foods(user_id);

-- Food nutrients table
CREATE TABLE food_nutrients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    calories DECIMAL,
    protein_g DECIMAL,
    carbs_g DECIMAL,
    fat_g DECIMAL,
    fiber_g DECIMAL,
    sugar_g DECIMAL,
    sodium_mg DECIMAL,
    cholesterol_mg DECIMAL,
    saturated_fat_g DECIMAL,
    trans_fat_g DECIMAL,
    vitamin_a_iu DECIMAL,
    vitamin_c_mg DECIMAL,
    calcium_mg DECIMAL,
    iron_mg DECIMAL,
    potassium_mg DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_food_nutrients_food_id ON food_nutrients(food_id);

-- Recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cookbook_id UUID NOT NULL REFERENCES cookbooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    source_type source_type DEFAULT 'manual',
    source_url TEXT,
    servings INTEGER DEFAULT 4,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    total_time_minutes INTEGER,
    difficulty difficulty DEFAULT 'medium',
    raw_ingredients_text TEXT, -- Original free-form text
    raw_procedure_text TEXT, -- Original free-form text
    parsing_status parsing_status DEFAULT 'pending',
    parsing_error TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_cookbook_id ON recipes(cookbook_id);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_parsing_status ON recipes(parsing_status);

-- Recipe ingredients table (parsed ingredients)
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    quantity DECIMAL,
    unit TEXT,
    name TEXT NOT NULL, -- Parsed ingredient name
    preparation TEXT, -- 'diced', 'minced', etc.
    original_text TEXT, -- Original line from raw text
    match_status match_status DEFAULT 'unmatched',
    match_confidence DECIMAL, -- 0-1 confidence score
    match_candidates JSONB DEFAULT '[]'::jsonb, -- Array of potential matches
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_food_id ON recipe_ingredients(food_id);

-- Recipe steps table (parsed procedure)
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    duration_minutes INTEGER,
    duration_label TEXT, -- 'until golden brown', 'for 20 minutes'
    temperature_f INTEGER,
    original_text TEXT, -- Original text for this step
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE UNIQUE INDEX idx_recipe_steps_recipe_step ON recipe_steps(recipe_id, step_number);

-- Recipe media table (images, videos)
CREATE TABLE recipe_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_id UUID REFERENCES recipe_steps(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL, -- 'image', 'video'
    url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_media_recipe_id ON recipe_media(recipe_id);

-- Recipe nutrition cache table
CREATE TABLE recipe_nutrition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    per_serving BOOLEAN DEFAULT true,
    calories DECIMAL,
    protein_g DECIMAL,
    carbs_g DECIMAL,
    fat_g DECIMAL,
    fiber_g DECIMAL,
    sugar_g DECIMAL,
    sodium_mg DECIMAL,
    is_complete BOOLEAN DEFAULT false, -- False if any ingredients unmatched
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_recipe_nutrition_recipe_id ON recipe_nutrition(recipe_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cookbooks_updated_at BEFORE UPDATE ON cookbooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_nutrients_updated_at BEFORE UPDATE ON food_nutrients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_steps_updated_at BEFORE UPDATE ON recipe_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_nutrition_updated_at BEFORE UPDATE ON recipe_nutrition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate recipe nutrition
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition(recipe_uuid UUID)
RETURNS void AS $$
DECLARE
    recipe_servings INTEGER;
    total_calories DECIMAL := 0;
    total_protein DECIMAL := 0;
    total_carbs DECIMAL := 0;
    total_fat DECIMAL := 0;
    total_fiber DECIMAL := 0;
    total_sugar DECIMAL := 0;
    total_sodium DECIMAL := 0;
    all_matched BOOLEAN := true;
BEGIN
    -- Get recipe servings
    SELECT servings INTO recipe_servings FROM recipes WHERE id = recipe_uuid;

    -- Calculate totals from matched ingredients
    SELECT
        COALESCE(SUM(fn.calories * ri.quantity), 0),
        COALESCE(SUM(fn.protein_g * ri.quantity), 0),
        COALESCE(SUM(fn.carbs_g * ri.quantity), 0),
        COALESCE(SUM(fn.fat_g * ri.quantity), 0),
        COALESCE(SUM(fn.fiber_g * ri.quantity), 0),
        COALESCE(SUM(fn.sugar_g * ri.quantity), 0),
        COALESCE(SUM(fn.sodium_mg * ri.quantity), 0),
        NOT EXISTS (
            SELECT 1 FROM recipe_ingredients
            WHERE recipe_id = recipe_uuid
            AND match_status IN ('unmatched')
        )
    INTO
        total_calories, total_protein, total_carbs, total_fat,
        total_fiber, total_sugar, total_sodium, all_matched
    FROM recipe_ingredients ri
    JOIN food_nutrients fn ON fn.food_id = ri.food_id
    WHERE ri.recipe_id = recipe_uuid
    AND ri.match_status IN ('matched', 'user_confirmed', 'user_created');

    -- Upsert nutrition data (per serving)
    INSERT INTO recipe_nutrition (
        recipe_id, per_serving, calories, protein_g, carbs_g, fat_g,
        fiber_g, sugar_g, sodium_mg, is_complete, calculated_at
    ) VALUES (
        recipe_uuid, true,
        total_calories / COALESCE(recipe_servings, 1),
        total_protein / COALESCE(recipe_servings, 1),
        total_carbs / COALESCE(recipe_servings, 1),
        total_fat / COALESCE(recipe_servings, 1),
        total_fiber / COALESCE(recipe_servings, 1),
        total_sugar / COALESCE(recipe_servings, 1),
        total_sodium / COALESCE(recipe_servings, 1),
        all_matched, NOW()
    )
    ON CONFLICT (recipe_id) DO UPDATE SET
        calories = EXCLUDED.calories,
        protein_g = EXCLUDED.protein_g,
        carbs_g = EXCLUDED.carbs_g,
        fat_g = EXCLUDED.fat_g,
        fiber_g = EXCLUDED.fiber_g,
        sugar_g = EXCLUDED.sugar_g,
        sodium_mg = EXCLUDED.sodium_mg,
        is_complete = EXCLUDED.is_complete,
        calculated_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_nutrition ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Cookbooks policies
CREATE POLICY "Users can view own cookbooks" ON cookbooks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public cookbooks" ON cookbooks
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own cookbooks" ON cookbooks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookbooks" ON cookbooks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cookbooks" ON cookbooks
    FOR DELETE USING (auth.uid() = user_id);

-- Foods policies
CREATE POLICY "Users can view all foods" ON foods
    FOR SELECT USING (true); -- Public access for searching

CREATE POLICY "Users can insert own foods" ON foods
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own foods" ON foods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own foods" ON foods
    FOR DELETE USING (auth.uid() = user_id);

-- Food nutrients policies
CREATE POLICY "Users can view all food nutrients" ON food_nutrients
    FOR SELECT USING (true);

CREATE POLICY "Users can manage food nutrients for own foods" ON food_nutrients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM foods
            WHERE foods.id = food_nutrients.food_id
            AND (foods.user_id = auth.uid() OR foods.user_id IS NULL)
        )
    );

-- Recipes policies
CREATE POLICY "Users can view own recipes" ON recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public recipes" ON recipes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe ingredients policies
CREATE POLICY "Users can view recipe ingredients" ON recipe_ingredients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_ingredients.recipe_id
            AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
        )
    );

CREATE POLICY "Users can manage own recipe ingredients" ON recipe_ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe steps policies
CREATE POLICY "Users can view recipe steps" ON recipe_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_steps.recipe_id
            AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
        )
    );

CREATE POLICY "Users can manage own recipe steps" ON recipe_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_steps.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe media policies
CREATE POLICY "Users can view recipe media" ON recipe_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_media.recipe_id
            AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
        )
    );

CREATE POLICY "Users can manage own recipe media" ON recipe_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_media.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe nutrition policies
CREATE POLICY "Users can view recipe nutrition" ON recipe_nutrition
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_nutrition.recipe_id
            AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
        )
    );

CREATE POLICY "Users can manage own recipe nutrition" ON recipe_nutrition
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_nutrition.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
