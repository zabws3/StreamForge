
CREATE DATABASE IF NOT EXISTS streamforge
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE streamforge;

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT INTO services (name, status)
VALUES ('StreamForge', 'running')
ON DUPLICATE KEY UPDATE status = VALUES(status);


CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS videos (
    video_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_seconds INT NOT NULL,
    thumbnail_url VARCHAR(500),
    mpd_path VARCHAR(500) NOT NULL,
    category_id INT,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_video_duration
        CHECK (duration_seconds >= 0),

    CONSTRAINT fk_video_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE SET NULL,

    INDEX idx_videos_category (category_id),
    INDEX idx_videos_title (title),
    INDEX idx_videos_upload_date (upload_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS view_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    watch_position_seconds INT NOT NULL DEFAULT 0,
    last_watched TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_watch_position
        CHECK (watch_position_seconds >= 0),

    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_video
        FOREIGN KEY (video_id)
        REFERENCES videos(video_id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_video
        UNIQUE (user_id, video_id),

    INDEX idx_history_video (video_id),
    INDEX idx_history_last_watched (last_watched)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


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
    ('Animación', 'Películas y vídeos de animación')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);
