from flask import Flask, request, send_file
import logging
import os
import uuid
# db
import re
import mysql.connector


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
def extract_mut_or_wt_tree_svg_from_database(analysis_id, filename):
    conn = connect_to_database()
    if conn is None:
        return ({f"error while connecting to databse (table tree_result)\n"}), 500
    result = ""
    cursor = conn.cursor()
    if filename == 'tree_mut.svg':
        cursor.execute("""
                SELECT tree_mut_url 
                FROM tree_result 
                WHERE task_id = %s
            """, (analysis_id,))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if result:
            tree_mut_url = result[0]
            return tree_mut_url
        else:
            return ("No tree_mut.svg found for the given analysis_id."),404
    elif filename == 'tree_wt.svg':
        cursor.execute("""
                SELECT tree_wt_url 
                FROM tree_result 
                WHERE task_id = %s
            """, (analysis_id,))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if result:
            tree_wt_url = result[0]
            return tree_wt_url
        else:
            return ("No tree_wt.svg found for the given analysis_id."),404
    else: return ("No tree.svg found for the given analysis_id."), 404

def extract_mut_or_wt_dotbracket_svg_from_database(analysis_id, filename):
    conn = connect_to_database()
    if conn is None:
        return ({f"error while connecting to databse (table rna_plot_result)\n"}), 500
    result = ""
    cursor = conn.cursor()
    if filename == 'mut-dotbracket.svg':
        cursor.execute("""
                SELECT mutant_url 
                FROM rna_plot_result 
                WHERE task_id = %s
            """, (analysis_id,))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if result:
            mutant_url = result[0]
            return mutant_url
        else:
            return ("No mut-dotbracket.svg found for the given analysis_id."), 404
    elif filename == 'wt-dotbracket.svg':
        cursor.execute("""
                SELECT wild_type_url 
                FROM rna_plot_result 
                WHERE task_id = %s
            """, (analysis_id,))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if result:
            wild_type_url = result[0]
            return wild_type_url
        else:
            return ("No wt-dotbracket.svg found for the given analysis_id."), 404
    else: return ("No dotbracket.svg found for the given analysis_id."), 404

def read_from_table_rna_fold_result(analysis_id):
    conn = connect_to_database()
    if conn is None:
        return ({f"error while connecting to databse (files: mut-dotbarcket.txt wt_dotbracket.txt)\n"}), 500
    try: 
        cursor = conn.cursor()
        cursor.execute("SELECT wild_type_energy, mutant_energy FROM rna_fold_result WHERE task_id = %s", (analysis_id,))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        if result:
            wild_type_energy, mutant_energy = result
            return({
                'mutant_energy': mutant_energy,
                'wild_type_energy': wild_type_energy
            }), 200
        else:
            return ("files: mut-dotbarcket.txt wt_dotbracket.txt not found"), 404
    
    except Exception as e:
        return ({f"Error while fetching data: {e}"}), 500

def read_from_table_rna_pdist_result(analysis_id):
    conn = connect_to_database()
    if conn is None:
        return ({f"error while connecting to databse (file RNApdist_result.txt)\n"}), 500
    cursor = conn.cursor()
    cursor.execute("SELECT distance FROM rna_pdist_result WHERE task_id = %s", (analysis_id,))
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()

    if result:
        distance = result[0]
        return (distance), 201
    else:
        return ("file RNApdist_result.txt not found\n"), 404

def read_from_table_rna_distance_result(analysis_id):
    conn = connect_to_database()
    if conn is None:
        return ({f"error while connecting to databse (file RNAdistance-result.txt and RNAdistance-backtrack.txt )\n"}), 500
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
        distance_f, distance_h, distance_w, distance_c, 
        distance_big_f, distance_big_h, distance_big_w, 
        distance_big_c, distance_big_p, backtrack_data 
        FROM rna_distance_result WHERE task_id = %s
        """, (analysis_id,))
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    if result:
        (distance_f, distance_h, distance_w, distance_c,
        distance_big_f, distance_big_h, distance_big_w,
        distance_big_c, distance_big_p, backtrack_data) = result


        result = {
        "RNAdistance_result": {
            "f": distance_f,
            "h": distance_h,
            "w": distance_w,
            "c": distance_c,
            "F": distance_big_f,
            "H": distance_big_h,
            "W": distance_big_w,
            "C": distance_big_c,
            "P": distance_big_p
        },
        "RNAdistance_backtrack": backtrack_data
        }


        return (result), 201
    else:
        return ({f"file RNAdistance-result.txt and RNAdistance-backtrack.txt not found\n"}),404

def save_to_table_tree_result(analysis_id, file_path, scenerio):
    id = str(uuid.uuid4())
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()

    if scenerio == 1:
        cursor.execute(
            "INSERT INTO tree_result (id, task_id, tree_wt_url, tree_mut_url, created_at, processing_status) VALUES (%s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, 'empty', file_path, 'in_progress')
        )

    if scenerio == 2:
        cursor.execute(
        "SELECT COUNT(*) FROM tree_result WHERE task_id = %s",
        (analysis_id,)
        )
        row_exists = cursor.fetchone()[0] > 0

        if row_exists:
            cursor.execute(
                """
                UPDATE tree_result
                SET tree_wt_url = %s, processing_status = %s
                WHERE task_id = %s
                """,
                (file_path, 'completed', analysis_id)
            )
        else:
            cursor.execute(
                "INSERT INTO tree_result (id, task_id, tree_wt_url, tree_mut_url, created_at, processing_status) VALUES (%s, %s, %s, %s, NOW(), %s)",
                (id, analysis_id, file_path, 'empty', 'error')
            )
    if scenerio == 3:
        cursor.execute(
            """
            UPDATE tree_result
            SET processing_status = %s
            WHERE task_id = %s
            """,
            ('error', analysis_id)
        )
    if scenerio == 4:
        cursor.execute(
            "INSERT INTO tree_result (id, task_id, tree_wt_url, tree_mut_url, created_at, processing_status) VALUES (%s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, 'empty', 'empty', 'error')
        )
    
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Result added successfully!"}), 201

def save_to_table_rna_plot_result(analysis_id, file_path, scenerio):
    id = str(uuid.uuid4())
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()

    if scenerio == 1:
        cursor.execute(
            "INSERT INTO rna_plot_result (id, task_id, wild_type_url, mutant_url, created_at, processing_status) VALUES (%s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, 'empty', file_path, 'in_progress')
        )

    if scenerio == 2:
        cursor.execute(
        "SELECT COUNT(*) FROM rna_plot_result WHERE task_id = %s",
        (analysis_id,)
    )
        row_exists = cursor.fetchone()[0] > 0

        if row_exists:
            cursor.execute(
                """
                UPDATE rna_plot_result
                SET wild_type_url = %s, processing_status = %s
                WHERE task_id = %s
                """,
                (file_path, 'completed', analysis_id)
            )
        else:
            cursor.execute(
                "INSERT INTO rna_plot_result (id, task_id, wild_type_url, mutant_url, created_at, processing_status) VALUES (%s, %s, %s, %s, NOW(), %s)",
                (id, analysis_id, file_path, 'empty', 'error')
            )
    if scenerio == 3:
        cursor.execute(
            """
            UPDATE rna_plot_result
            SET processing_status = %s
            WHERE task_id = %s
            """,
            ('error', analysis_id)
        )
    if scenerio == 4:
        cursor.execute(
            "INSERT INTO rna_plot_result (id, task_id, wild_type_url, mutant_url, created_at, processing_status) VALUES (%s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, 'empty', 'empty', 'error')
        )
        
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Result added successfully!"}), 201

def save_to_table_rna_fold_result(analysis_id, wild_type_dot_bracket, mutant_dot_bracket, wild_type_energy, mutant_energy, processing_status, scenerio):
    id = str(uuid.uuid4())
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    

    if scenerio == 1:
        cursor.execute(
            "INSERT INTO rna_fold_result (id, task_id, wild_type_dot_bracket, mutant_dot_bracket, wild_type_energy, mutant_energy, created_at, processing_status) VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, wild_type_dot_bracket, mutant_dot_bracket, wild_type_energy, mutant_energy, processing_status)
        )
    if scenerio == 2:
        cursor.execute(
        "SELECT COUNT(*) FROM rna_fold_result WHERE task_id = %s",
        (analysis_id,)
    )
        row_exists = cursor.fetchone()[0] > 0

        if row_exists:
            cursor.execute(
                """
                UPDATE rna_fold_result
                SET wild_type_dot_bracket = %s, wild_type_energy = %s, processing_status = %s
                WHERE task_id = %s
                """,
                (wild_type_dot_bracket, wild_type_energy, processing_status, analysis_id)
            )
        else:
            cursor.execute(
                """
                INSERT INTO rna_fold_result (id, task_id, wild_type_dot_bracket, mutant_dot_bracket, wild_type_energy, mutant_energy, created_at, processing_status)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
                """,
                (id, analysis_id, wild_type_dot_bracket, 'empty', wild_type_energy, 0, 'error')
            )

    if scenerio == 3:
        cursor.execute(
            "INSERT INTO rna_fold_result (id, task_id, wild_type_dot_bracket, mutant_dot_bracket, wild_type_energy, mutant_energy, created_at, processing_status) VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, 'empty', 'empty', 0, 0, 'error')
        )
    if scenerio == 4:
        cursor.execute(
            """
            UPDATE rna_fold_result
            SET processing_status = %s
            WHERE task_id = %s
            """,
            ('error', analysis_id)
        )
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Result added successfully!"}), 201

def save_to_table_rna_distance_result(analysis_id, params, backtrack_data, processing_status):
    id = str(uuid.uuid4())
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    
    cursor = conn.cursor()

    if params == 'empty' and processing_status == 'error':
        cursor.execute(
            "INSERT INTO rna_distance_result (id, task_id, distance_f, distance_h, distance_w, distance_c, distance_big_f, distance_big_h, distance_big_w, distance_big_c, distance_big_p, backtrack_data, created_at, processing_status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, 0, 0, 0, 0, 0, 0, 0, 0, 0, backtrack_data,processing_status)
        )
    if params != 'empty' and processing_status == 'in_progress':
        cursor.execute(
            "INSERT INTO rna_distance_result (id, task_id, distance_f, distance_h, distance_w, distance_c, distance_big_f, distance_big_h, distance_big_w, distance_big_c, distance_big_p, backtrack_data, created_at, processing_status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)",
            (id, analysis_id, params['f'], params['h'], params['w'], params['c'], params['F'], params['H'], params['W'], params['C'], params['P'], backtrack_data,processing_status)
        )
    if params == 'empty' and backtrack_data != 'empty':
        cursor.execute(
            """
            UPDATE rna_distance_result
            SET backtrack_data = %s, processing_status = %s
            WHERE task_id = %s
            """,
            (backtrack_data, processing_status, analysis_id)
        )
    if params == 'null' and backtrack_data == 'empty':
        cursor.execute(
            """
            UPDATE rna_distance_result
            SET processing_status = %s
            WHERE task_id = %s
            """,
            (processing_status, analysis_id)
        )

    conn.commit()
    cursor.close()
    conn.close()
    return ({"message": "Result added successfully!"}), 201


def save_to_table_rna_pdist_result(analysis_id, distance, processing_status):
    id = str(uuid.uuid4())
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO rna_pdist_result (id, task_id, distance, created_at, processing_status) VALUES (%s, %s, %s, NOW(), %s)",
        (id, analysis_id, distance, processing_status)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Result added successfully!"}), 201


def update_table_top_10(analysis_id, mutant_sequence, rank_snp, processing_status):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    cursor.execute(
    """
    UPDATE top_10
    SET processing_status = CASE
            WHEN processing_status != 'completed' THEN %s
            ELSE processing_status
        END,
        mutant_sequence = CASE
            WHEN mutant_sequence = 'empty' THEN %s
            ELSE mutant_sequence
        END
    WHERE wild_type_seq_id = %s AND rank_snp = %s
    """,
    (processing_status, mutant_sequence, analysis_id, str(rank_snp))
)
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Status update successfully!"}), 201

def save_to_table_top_10(id, analysis_id, mutated_sequence, rank, processing_status):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO top_10 (id, wild_type_seq_id, mutant_sequence, rank_snp, created_at, processing_status) VALUES (%s, %s, %s, %s, NOW(), %s)",
        (id, analysis_id, mutated_sequence, rank, processing_status)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Result added successfully!"}), 201

def update_table_pair(analysis_id, processing_status):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    if processing_status != 'completed':
        cursor.execute(
                """
                UPDATE pair
                SET processing_status = %s
                WHERE id = %s
                """,
                (processing_status, analysis_id) 
            )
    if processing_status == 'completed':
        cursor.execute(
    """
    UPDATE pair
    SET processing_status = 
        CASE
            WHEN (
                -- Sprawdzenie, czy w każdej tabeli istnieje dokładnie jeden rekord powiązany
                (SELECT COUNT(*) FROM rna_pdist_result rpd WHERE rpd.task_id = pair.id) = 1
                AND
                (SELECT COUNT(*) FROM rna_distance_result rdr WHERE rdr.task_id = pair.id) = 1
                AND
                (SELECT COUNT(*) FROM rna_fold_result rfr WHERE rfr.task_id = pair.id) = 1
                AND
                (SELECT COUNT(*) FROM rna_plot_result rpr WHERE rpr.task_id = pair.id) = 1
                AND
                (SELECT COUNT(*) FROM tree_result tr WHERE tr.task_id = pair.id) = 1
                -- Sprawdzenie, czy rekordy mają status 'completed'
                AND
                (SELECT processing_status FROM rna_pdist_result rpd WHERE rpd.task_id = pair.id) = 'completed'
                AND
                (SELECT processing_status FROM rna_distance_result rdr WHERE rdr.task_id = pair.id) = 'completed'
                AND
                (SELECT processing_status FROM rna_fold_result rfr WHERE rfr.task_id = pair.id) = 'completed'
                AND
                (SELECT processing_status FROM rna_plot_result rpr WHERE rpr.task_id = pair.id) = 'completed'
                AND
                (SELECT processing_status FROM tree_result tr WHERE tr.task_id = pair.id) = 'completed'
            )
            THEN 'completed'
            ELSE 'error'
        END
    WHERE id = %s
    """,
    (analysis_id,)
)
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Status update successfully!"}), 201

def read_sequences_from_database_pair(analysis_id):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT wild_type_sequence, mutant_sequence 
        FROM pair 
        WHERE id = %s
    """, (analysis_id,))
    
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    if result:
        wild_type_sequence, mutant_sequence = result
        return ({
            "wild_type_sequence": wild_type_sequence,
            "mutant_sequence": mutant_sequence
        }), 201
    else:
        return ({"error": "No sequences found for the given analysis_id"}), 404

def save_to_table_pair(analysis_id, wild_sequence, mutant_sequence, processing_status):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO pair (id, wild_type_sequence, mutant_sequence, created_at, processing_status) VALUES (%s, %s, %s, NOW(), %s)",
        (analysis_id,wild_sequence,mutant_sequence, processing_status)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Result added successfully!"}), 201

def update_table_single(analysis_id, processing_status):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    cursor.execute(
            """
            UPDATE single
            SET processing_status = %s
            WHERE id = %s
            """,
            (processing_status, analysis_id) 
        )
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Status update successfully!"}), 201

def save_to_table_single(analysis_id, wild_sequence, processing_status):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO single (id, wild_type_sequence, created_at, processing_status) VALUES (%s, %s, NOW(), %s)",
        (analysis_id,wild_sequence,processing_status)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return ({"message": "Result added successfully!"}), 201

# Konfiguracja połączenia z bazą danych
db_config = {
    'host': os.getenv('MYSQL_HOST', 'http://localhost:8081'),
    'host': os.getenv('MYSQL_HOST', 'mysql'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'qwas'),
    'database': os.getenv('MYSQL_DATABASE', 'SNPsniper_database')
}
# Funkcja do uzyskania połączenia z bazą danych
def connect_to_database():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None
    
def read_sequence_from_database_single(analysis_id):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT wild_type_sequence 
        FROM single 
        WHERE id = %s
    """, (analysis_id,))
    
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    if result:
        wild_type_sequence = result[0]
        return ({
            "wild_type_sequence": wild_type_sequence
        }),201
    else:
        return ({"error": "No wild type sequence found for the given analysis ID"}), 404

def read_sequences_from_database_top_10(analysis_id):
    conn = connect_to_database()
    if conn is None:
        return ({"error": "Failed to connect to the database"}), 500
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.wild_type_sequence, t.rank_snp, t.mutant_sequence 
        FROM top_10 t
        JOIN single s ON t.wild_type_seq_id = s.id
        WHERE t.wild_type_seq_id = %s
    """, (analysis_id,))
    
    results = cursor.fetchall()
    conn.commit()
    cursor.close()
    conn.close()
    
    if results:
        wild_type_sequence = results[0][0]
        mutant_sequences = {result[1]: result[2] for result in results}
        return ({
            "wild_type_sequence": wild_type_sequence,
            "mutant_sequences": mutant_sequences
        }), 201
    else:
        return ({"error": "No sequences found for the given analysis ID"}), 404