CREATE DATABASE IF NOT EXISTS snp;
USE snp;

CREATE TABLE IF NOT EXISTS analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    normalSequence VARCHAR(255),
    wildSequence VARCHAR(255),
    result VARCHAR(255)
);