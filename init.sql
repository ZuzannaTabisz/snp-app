-- Create the database
CREATE DATABASE IF NOT EXISTS SNPsniper_database;
USE SNPsniper_database;

-- Create the single table
CREATE TABLE IF NOT EXISTS single (
    id CHAR(36) PRIMARY KEY,
    wild_type_sequence TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending'
);

-- Create the pair table
CREATE TABLE IF NOT EXISTS pair (
    id CHAR(36) PRIMARY KEY,
    wild_type_sequence TEXT NOT NULL,
    mutant_sequence TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending'
);

-- Create the rna_pdist_result table (depends on pair)
CREATE TABLE IF NOT EXISTS rna_pdist_result (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL,
    distance FLOAT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending',
    FOREIGN KEY (task_id) REFERENCES pair(id) ON DELETE CASCADE
);

-- Create the rna_fold_result table (depends on pair)
CREATE TABLE IF NOT EXISTS rna_fold_result (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL,
    wild_type_dot_bracket TEXT NOT NULL,
    mutant_dot_bracket TEXT NOT NULL,
    wild_type_energy FLOAT NOT NULL,
    mutant_energy FLOAT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending',
    FOREIGN KEY (task_id) REFERENCES pair(id) ON DELETE CASCADE
);

-- Create the rna_plot_result table (depends on pair)
CREATE TABLE IF NOT EXISTS rna_plot_result (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL,
    wild_type_url TEXT NOT NULL,
    mutant_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending',
    FOREIGN KEY (task_id) REFERENCES pair(id) ON DELETE CASCADE
);

-- Create the tree_result table (depends on pair)
CREATE TABLE IF NOT EXISTS tree_result (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL,
    tree_wt_url TEXT NOT NULL,
    tree_mut_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending',
    FOREIGN KEY (task_id) REFERENCES pair(id) ON DELETE CASCADE
);

-- Create the ma_distance_result table (depends on pair)
CREATE TABLE IF NOT EXISTS rna_distance_result (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL,
    distance_f FLOAT NOT NULL,
    distance_h FLOAT NOT NULL,
    distance_w FLOAT NOT NULL,
    distance_c FLOAT NOT NULL,
    distance_big_f FLOAT NOT NULL,
    distance_big_h FLOAT NOT NULL,
    distance_big_w FLOAT NOT NULL,
    distance_big_c FLOAT NOT NULL,
    distance_big_p FLOAT NOT NULL,
    backtrack_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending',
    FOREIGN KEY (task_id) REFERENCES pair(id) ON DELETE CASCADE
);
-- Create the top_10 table (depends on single and pair)
CREATE TABLE IF NOT EXISTS top_10 (
    id CHAR(36) PRIMARY KEY,
    wild_type_seq_id CHAR(36) NOT NULL,
    mutant_sequence TEXT NOT NULL,
    rank_snp ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'in_progress', 'completed', 'error') DEFAULT 'pending',
    FOREIGN KEY (wild_type_seq_id) REFERENCES single(id) ON DELETE CASCADE
);

DELIMITER $$

CREATE TRIGGER limit_top_10
BEFORE INSERT ON top_10
FOR EACH ROW
BEGIN
    -- Check how many records already exist for the given "wild_type_seq_id"
    IF (SELECT COUNT(*) FROM top_10 WHERE wild_type_seq_id = NEW.wild_type_seq_id) >= 10 THEN
        -- Throw an error if the limit has been reached
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Limit of 10 records for this wild_type_seq_id has been reached.';
    END IF;
END$$

DELIMITER ;
