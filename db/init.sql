CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL
);

INSERT INTO services (name, status)
VALUES ('StreamForge', 'running');


CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);


CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE INDEX idx_categories_name ON categories(name);


CREATE TABLE IF NOT EXISTS videos (
    video_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_seconds INT NOT NULL,
    thumbnail_url VARCHAR(500),
    mpd_path VARCHAR(500) NOT NULL,
    category_id INT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_video_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_videos_category ON videos(category_id);
CREATE INDEX idx_videos_title ON videos(title);
CREATE INDEX idx_videos_upload_date ON videos(upload_date);


CREATE TABLE IF NOT EXISTS view_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    watch_position_seconds INT DEFAULT 0,
    last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_video
        FOREIGN KEY (video_id)
        REFERENCES videos(video_id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_video
        UNIQUE (user_id, video_id)
);

CREATE INDEX idx_history_user ON view_history(user_id);
CREATE INDEX idx_history_video ON view_history(video_id);
CREATE INDEX idx_history_last_watched ON view_history(last_watched);


INSERT INTO categories (name, description)
VALUES
    ('Acción', 'Películas y vídeos de acción'),
    ('Comedia', 'Películas y vídeos de comedia'),
    ('Drama', 'Películas y vídeos dramáticos'),
    ('Ciencia ficción', 'Películas y vídeos de ciencia ficción'),
    ('Fantasía', 'Películas y vídeos de fantasía'),
    ('Terror', 'Películas y vídeos de terror'),
    ('Thriller', 'Películas y vídeos de suspense'),
    ('Romance', 'Películas y vídeos románticos'),
    ('Documental', 'Documentales'),
    ('Animación', 'Películas y vídeos de animación');