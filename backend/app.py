from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import logging
import subprocess
import threading
import os
import uuid
import shutil
import eventlet
import pandas as pd
import requests
import tempfile

# db
import re
import numpy as np
import scipy.stats as stats
from concurrent.futures import ThreadPoolExecutor, as_completed, wait
from pipeline.script import (
    generate_mutations,
    process_mutation,
    generate_mutated_sequences,
)
import db_func


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", path="/socket.io")


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

"""Database handling"""


@app.route("/test-db")
def test_db():
    conn = db_func.connect_to_database()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500
    cursor = conn.cursor()
    cursor.execute("SELECT DATABASE();")
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(result)


def parse_rnadistance_result_safe(text):
    pattern = r"(?P<param>[fFhHcCwWP]):\s*(-?\d+\.?\d*)?"

    matches = re.findall(pattern, text)

    default_values = {
        "f": 0.0,
        "h": 0.0,
        "w": 0.0,
        "c": 0.0,
        "F": 0.0,
        "H": 0.0,
        "W": 0.0,
        "C": 0.0,
        "P": 0.0,
    }

    for param, value in matches:
        if value is not None:
            default_values[param] = float(value)

    return default_values


def extract_dot_bracket_and_energy(file_content):
    lines = file_content.splitlines()
    if len(lines) < 2:
        raise ValueError("Zawartość pliku musi zawierać co najmniej dwie linie.")

    dot_bracket_line = lines[1].strip()

    match = re.match(r"([\.()\[\]]+)\s*\(\s*(-?\d+\.\d+)\s*\)", dot_bracket_line)
    print(match)
    if match:
        dot_bracket_sequence = match.group(1)
        energy = float(match.group(2))
        return dot_bracket_sequence, energy
    else:
        raise ValueError("Nie udało się poprawnie wyodrębnić dot-bracket i energii.")


def save_from_file_to_database(analysis_id):
    pipeline_dir = os.path.join(BASE_DIR, "pipeline", analysis_id)

    if not os.path.exists(pipeline_dir):
        return jsonify({"error": "Analysis not found"}), 404

    file_save_to_db_as_text = [
        "RNApdist-result.txt",
        "RNAdistance-result.txt",
        "RNAdistance-backtrack.txt",
        "mut-dotbracket.txt",
        "wt-dotbracket.txt",
    ]
    file_save_to_db_as_path = [
        "mut-dotbracket.svg",
        "wt-dotbracket.svg",
        "tree_mut.svg",
        "tree_wt.svg",
    ]
    file_RNApdsit_found = False
    file_RNAdistance_result_found = False
    file_RNAdistance_backtrack_found = False
    file_mut_dotbracket_found = False
    file_wt_dotbracket_found = False
    file_mut_dotbracket_svg_found = False
    file_wt_dotbracket_svg_found = False
    file_mut_tree_svg_found = False
    file_wt_tree_svg_found = False
    full_content = ""

    for filename in file_save_to_db_as_text:
        file_path = os.path.join(pipeline_dir, filename)
        if os.path.exists(file_path):
            with open(file_path, "r") as file:
                content = file.read()
                full_content += f"=== {filename} ===\n{content}\n\n"
                if filename == "RNApdist-result.txt":
                    file_RNApdsit_found = True
                    try:
                        with app.app_context():
                            db_func.save_to_table_rna_pdist_result(
                                analysis_id, float(content), "completed"
                            )
                    except ValueError:
                        with app.app_context():
                            db_func.save_to_table_rna_pdist_result(
                                analysis_id, 0, "error"
                            )
                elif filename == "RNAdistance-result.txt":
                    file_RNAdistance_result_found = True
                    params = parse_rnadistance_result_safe(content)
                    with app.app_context():
                        db_func.save_to_table_rna_distance_result(
                            analysis_id, params, "empty", "in_progress"
                        )
                elif filename == "RNAdistance-backtrack.txt":
                    file_RNAdistance_backtrack_found = True
                    with app.app_context():
                        db_func.save_to_table_rna_distance_result(
                            analysis_id, "empty", content, "completed"
                        )
                elif filename == "mut-dotbracket.txt":
                    file_mut_dotbracket_found = True
                    mutant_dot_bracket, mutant_energy = extract_dot_bracket_and_energy(
                        content
                    )
                    with app.app_context():
                        db_func.save_to_table_rna_fold_result(
                            analysis_id,
                            "empty",
                            mutant_dot_bracket,
                            0,
                            mutant_energy,
                            "in_progress",
                            1,
                        )
                elif filename == "wt-dotbracket.txt":
                    file_wt_dotbracket_found = True
                    wild_type_dot_bracket, wild_type_energy = (
                        extract_dot_bracket_and_energy(content)
                    )
                    with app.app_context():
                        db_func.save_to_table_rna_fold_result(
                            analysis_id,
                            wild_type_dot_bracket,
                            "empty",
                            wild_type_energy,
                            0,
                            "completed",
                            2,
                        )
                else:
                    logger.debug(f"{filename} not found")

        else:
            full_content += f"=== {filename} ===\nFile not found\n\n"

    if not file_RNApdsit_found:
        with app.app_context():
            db_func.save_to_table_rna_pdist_result(analysis_id, 0, "error")

    if not file_RNAdistance_result_found:
        with app.app_context():
            db_func.save_to_table_rna_distance_result(
                analysis_id, "empty", "empty", "error"
            )

    if not file_RNAdistance_backtrack_found:
        with app.app_context():
            db_func.save_to_table_rna_distance_result(
                analysis_id, "null", "empty", "error"
            )

    if not file_mut_dotbracket_found and not file_wt_dotbracket_found:
        with app.app_context():
            db_func.save_to_table_rna_fold_result(
                analysis_id, "empty", "empty", 0, 0, "error", 3
            )

    if not file_wt_dotbracket_found and file_mut_dotbracket_found:
        with app.app_context():
            db_func.save_to_table_rna_fold_result(
                analysis_id, "not_exists", "empty", 0, 0, "error", 4
            )

    for filename in file_save_to_db_as_path:
        file_path = os.path.join(pipeline_dir, filename)
        logger.debug(f"{file_path}")
        if os.path.exists(file_path):
            if filename == "mut-dotbracket.svg":
                file_mut_dotbracket_svg_found = True
                with app.app_context():
                    db_func.save_to_table_rna_plot_result(analysis_id, file_path, 1)
            elif filename == "wt-dotbracket.svg":
                file_wt_dotbracket_svg_found = True
                with app.app_context():
                    db_func.save_to_table_rna_plot_result(analysis_id, file_path, 2)
            elif filename == "tree_mut.svg":
                file_mut_tree_svg_found = True
                with app.app_context():
                    db_func.save_to_table_tree_result(analysis_id, file_path, 1)
            elif filename == "tree_wt.svg":
                file_wt_tree_svg_found = True
                with app.app_context():
                    db_func.save_to_table_tree_result(analysis_id, file_path, 2)
            else:
                logger.debug(f"{filename} not found")

    if not file_mut_dotbracket_svg_found and not file_wt_dotbracket_svg_found:
        with app.app_context():
            db_func.save_to_table_rna_plot_result(analysis_id, "empty", 4)

    if not file_wt_dotbracket_svg_found and file_mut_dotbracket_svg_found:
        with app.app_context():
            db_func.save_to_table_rna_plot_result(analysis_id, "empty", 3)

    if not file_mut_tree_svg_found and not file_wt_tree_svg_found:
        with app.app_context():
            db_func.save_to_table_tree_result(analysis_id, "empty", 4)

    if not file_wt_tree_svg_found and file_mut_tree_svg_found:
        with app.app_context():
            db_func.save_to_table_tree_result(analysis_id, "empty", 3)


"""Herlper functions for API"""

# helper functions for executing pipeline


def run_step(step_name, command, cwd, analysis_id):
    try:
        subprocess.run(command, cwd=cwd, check=True)

    except subprocess.CalledProcessError as e:
        logger.error(f"{step_name} failed: {e}")
        socketio.emit(
            "task_status",
            {
                "analysis_id": analysis_id,
                "status": "failed",
                "step": step_name,
                "error": str(e),
            },
            namespace="/single",
        )
        with app.app_context():
            db_func.update_table_pair(analysis_id, "error")
        return False
    return True


def run_pipeline(mutant_sequence, wild_sequence, analysis_id):
    with app.app_context():
        db_func.update_table_pair(analysis_id, "in_progress")

    analysis_dir = os.path.join(BASE_DIR, "pipeline", analysis_id)
    os.makedirs(analysis_dir, exist_ok=True)

    wt_file_path = os.path.join(analysis_dir, "wt.txt")
    mut_file_path = os.path.join(analysis_dir, "mut.txt")

    with open(wt_file_path, "w") as wt_file:
        wt_file.write(wild_sequence + "\n")
    with open(mut_file_path, "w") as mut_file:
        mut_file.write(mutant_sequence + "\n")

    steps = [
        ("01-RNApdist", ["bash", os.path.join(BASE_DIR, "pipeline", "01-RNApdist")]),
        ("02-RNAfold", ["bash", os.path.join(BASE_DIR, "pipeline", "02-RNAfold")]),
        (
            "03-RNAdistance",
            ["bash", os.path.join(BASE_DIR, "pipeline", "03-RNAdistance")],
        ),
        ("04-RNAplot", ["bash", os.path.join(BASE_DIR, "pipeline", "04-RNAplot")]),
        (
            "HITtree",
            ["python3", os.path.join(BASE_DIR, "pipeline", "tree.py"), analysis_dir],
        ),
    ]

    for step_name, command in steps:
        if not run_step(step_name, command, analysis_dir, analysis_id):
            return

    save_from_file_to_database(analysis_id)
    with app.app_context():
        db_func.update_table_pair(analysis_id, "completed")

    # socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis completed"}, broadcast=True, namespace="/pair")


# helper functions form dbSNP


def get_sequence(chromosome, start_pos, end_pos):
    """
    Fetch DNA sequence from Ensembl REST API for given genomic coordinates
    """
    base_url = "https://rest.ensembl.org/sequence/region/human"
    headers = {"Content-Type": "application/json"}
    region = f"{chromosome}:{start_pos}..{end_pos}"
    url = f"{base_url}/{region}"
    params = {"coord_system_version": "GRCh38"}

    logger.debug("Preparing to fetch sequence data")
    logger.debug(f"Request URL: {url}")
    logger.debug(f"Request headers: {headers}")
    logger.debug(f"Request params: {params}")

    try:
        logger.debug("Sending GET request to Ensembl API")
        response = requests.get(url, headers=headers, params=params)

        response.raise_for_status()
        logger.debug(f"Response Status Code: {response.status_code}")

        logger.debug("Parsing JSON response")
        response_json = response.json()
        logger.debug(f"Received JSON response: {response_json}")

        return response_json

    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {str(e)}")
        return {"error": str(e)}
    except ValueError as e:
        logger.error(f"Error decoding JSON response: {str(e)}")
        return {"error": "Invalid JSON response"}
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")
        return {"error": "Unexpected error"}


def search_clinical_tables(snp_id):
    """
    Search clinicaltables.nlm.nih.gov API for SNP information
    Args:
        snp_id (str): RS ID of the SNP (e.g., 'rs328')
    Returns:
        dict: Response from clinical tables API
    """
    base_url = "https://clinicaltables.nlm.nih.gov/api/snps/v3/search"
    params = {
        "terms": snp_id,
        "maxList": 1,
        "df": "rsNum,38.alleles,38.chr,38.pos",
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


"""API endpoints"""


@app.route("/api/analyze/pair", methods=["POST"])
def analyze_pair():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    mutant_sequence = data.get("mutantSequence")
    wild_sequence = data.get("wildSequence")
    analysis_id = data.get("analysisId")
    logger.debug("Analysis started with ID: {analysis_id}")
    logger.debug(f"Mutant sequence: {mutant_sequence}, Wild sequence: {wild_sequence}")

    if not wild_sequence or not mutant_sequence:
        return jsonify({"error": "Invalid input data"}), 400

    # analysis_id = str(uuid.uuid4())
    socketio.emit(
        "task_status",
        {"analysis_id": analysis_id, "status": "Analysis started"},
        broadcast=True,
        namespace="/pair",
    )

    with app.app_context():
        db_func.save_to_table_pair(
            analysis_id, wild_sequence, mutant_sequence, "pending"
        )

    # probably to delete threading
    # thread = threading.Thread(target=run_pipeline, args=(mutant_sequence, wild_sequence, analysis_id))
    # thread.start()
    # thread.join()
    run_pipeline(mutant_sequence, wild_sequence, analysis_id)

    # socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis completed"}, broadcast=True, namespace="/single")

    logger.debug(f"Analysis started with ID: {analysis_id}")
    return jsonify({"analysis_id": analysis_id}), 200


@app.route("/api/results/pair/<analysis_id>", methods=["GET"])
def read_from_databse(analysis_id):
    combined_content = ""
    pdist_result, _ = db_func.read_from_table_rna_pdist_result(analysis_id)
    fold_result, _ = db_func.read_from_table_rna_fold_result(analysis_id)
    distance_result, _ = db_func.read_from_table_rna_distance_result(analysis_id)

    combined_content += pdist_result
    combined_content += fold_result
    combined_content += distance_result

    sequences, _ = db_func.read_sequences_from_database_pair(analysis_id)
    if isinstance(sequences, tuple):
        return sequences

    return jsonify(
        {
            "content": combined_content,
            "wt_sequence": sequences.get("wild_type_sequence"),
            "mut_sequence": sequences.get("mutant_sequence"),
        }
    )


@app.route("/api/results/pair/<analysis_id>/rna-plot-mut", methods=["GET"])
def get_svg_mut(analysis_id):
    return get_svg_from_database(analysis_id, "mut-dotbracket.svg")


@app.route("/api/results/pair/<analysis_id>/rna-plot-wt", methods=["GET"])
def get_svg_wt(analysis_id):
    return get_svg_from_database(analysis_id, "wt-dotbracket.svg")


@app.route("/api/results/pair/<analysis_id>/hit-tree_wt", methods=["GET"])
def get_svg_hit_tree_wt(analysis_id):
    return get_svg_from_database(analysis_id, "tree_wt.svg")


@app.route("/api/results/pair/<analysis_id>/hit-tree_mut", methods=["GET"])
def get_svg_hit_tree_mut(analysis_id):
    return get_svg_from_database(analysis_id, "tree_mut.svg")


def get_svg_from_database(analysis_id, filename):
    if filename == "mut-dotbracket.svg" or filename == "wt-dotbracket.svg":
        svg_path = db_func.extract_mut_or_wt_dotbracket_svg_from_database(
            analysis_id, filename
        )

    if filename == "tree_wt.svg" or filename == "tree_mut.svg":
        svg_path = db_func.extract_mut_or_wt_tree_svg_from_database(
            analysis_id, filename
        )

    if not os.path.exists(svg_path):
        return jsonify({"error": "SVG file not found"}), 404

    return send_file(svg_path, mimetype="image/svg+xml")


def run_single(wild_sequence, analysis_id, script_directory, analysis_dir):
    results = []
    arr_pdist = []
    arr_distance = []

    total_mutations = (
        3 * (len(wild_sequence)) + len(wild_sequence) + 4 * (len(wild_sequence) + 1)
    )
    logger.info(f"Total mutations: {total_mutations}")
    logger.info(f"Length: {len(wild_sequence)}")
    processed_mutations = 0
    # lock = threading.Lock()

    try:
        with app.app_context():
            db_func.update_table_single(analysis_id, "in_progress")
            for rank in range(1, 11):
                db_func.update_table_top_10(
                    analysis_id, "empty", str(rank), "in_progress"
                )

        with ThreadPoolExecutor() as executor:
            futures = []
            for key, mutation in generate_mutations(wild_sequence):
                futures.append(
                    executor.submit(
                        process_mutation,
                        key,
                        mutation,
                        script_directory,
                        analysis_dir,
                        wild_sequence,
                    )
                )

            for future in as_completed(futures):
                result = future.result()
                # with lock:
                processed_mutations += 1
                progress = (processed_mutations / total_mutations) * 100
                socketio.emit(
                    "progress_update",
                    {"progress": f"{progress:.2f}"},
                    broadcast=True,
                    namespace="/single",
                )
                logger.info(f"Progress: {progress:.2f}%")

                if result:
                    results.append(result)
                    rnapdist_value = result["RNApdist"]
                    rnadistance_value = result["RNAdistance(f)"]

                    arr_pdist.append(
                        float(rnapdist_value)
                        if isinstance(rnapdist_value, float)
                        else np.nan
                    )
                    arr_distance.append(
                        float(rnadistance_value)
                        if isinstance(rnadistance_value, float)
                        else np.nan
                    )

            wait(futures)

        arr_pdist = np.array(arr_pdist)
        arr_distance = np.array(arr_distance)

        arr_pdist_z = stats.zscore(arr_pdist, nan_policy="omit")
        arr_distance_z = stats.zscore(arr_distance, nan_policy="omit")

        for i, result in enumerate(results):
            result["Z-score"] = (
                arr_pdist_z[i] + arr_distance_z[i]
                if not np.isnan(arr_pdist_z[i]) and not np.isnan(arr_distance_z[i])
                else np.nan
            )

        results_df = pd.DataFrame(results)
        results_df.insert(0, "no", range(1, len(results_df) + 1))  # no column
        output_csv_path = os.path.join(analysis_dir, "mutation_results.csv")
        results_df.to_csv(output_csv_path, index=False)

        ten_best = results_df.sort_values(by="Z-score", ascending=False).head(10)
        ten_best["no"] = range(
            1, 11
        )  # by deleting this ther should be the original numeration
        ten_best_csv_path = os.path.join(analysis_dir, "ten_best_results.csv")
        ten_best.to_csv(ten_best_csv_path, index=False)

        mutations = ten_best["Mutation"].tolist()
        mutated_sequences = generate_mutated_sequences(wild_sequence, mutations)
        with app.app_context():
            rank = 1
            for mutated_sequence in mutated_sequences:
                db_func.update_table_top_10(
                    analysis_id, mutated_sequence, rank, "completed"
                )
                rank += 1
        ten_best.to_csv("ten_best_results.csv", index=False)

        logger.info(f"Finished generating mutations and saving to {output_csv_path}.")

        with app.app_context():
            db_func.update_table_single(analysis_id, "completed")

        # socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis completed"}, broadcast=True, namespace=f'/{analysis_id}')

    except subprocess.CalledProcessError as e:
        logger.error(f"Error while running script: {e.stderr}")
        with app.app_context():
            db_func.update_table_single(analysis_id, "error")
            for rank in range(1, 11):
                db_func.update_table_top_10(analysis_id, "empty", str(rank), "error")
        socketio.emit(
            "task_status",
            {"analysis_id": analysis_id, "status": "Analysis failed"},
            broadcast=True,
            namespace="/pair",
        )


@app.route("/api/analyze/single", methods=["POST"])
def analyze_single():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    wild_sequence = data.get("wildSequence")
    analysis_id = data.get("analysisId")
    logger.debug("Analysis started with ID: {analysis_id}")
    logger.debug(f"Wild sequence: {wild_sequence}")

    if not wild_sequence:
        return jsonify({"error": "Invalid input data"}), 400

    # analysis_id = str(uuid.uuid4())
    socketio.emit(
        "task_status",
        {"analysis_id": analysis_id, "status": "Analysis started"},
        broadcast=True,
        namespace=f"/{analysis_id}",
    )

    # saving wt sequence and analysys id to db
    with app.app_context():
        db_func.save_to_table_single(analysis_id, wild_sequence, "pending")
        for rank in range(1, 11):
            id = str(uuid.uuid4())
            db_func.save_to_table_top_10(id, analysis_id, "empty", rank, "pending")

    analysis_dir = os.path.join(BASE_DIR, "pipeline", analysis_id)
    os.makedirs(analysis_dir, exist_ok=True)

    wt_file_path = os.path.join(analysis_dir, "wt.txt")
    with open(wt_file_path, "w") as wt_file:
        wt_file.write(wild_sequence + "\n")

    script_directory = os.path.join(BASE_DIR, "pipeline")

    os.makedirs(analysis_dir, exist_ok=True)
    os.chdir(analysis_dir)

    run_single(wild_sequence, analysis_id, script_directory, analysis_dir)

    return jsonify({"analysis_id": analysis_id}), 200


@app.route("/api/results/single/<analysis_id>", methods=["GET"])
def get_csv(analysis_id):
    logger.debug(f"In get csv")
    analysis_dir = os.path.join(BASE_DIR, "pipeline", analysis_id)
    csv_file_path = os.path.join(analysis_dir, "ten_best_results.csv")

    if not os.path.exists(csv_file_path):
        logger.debug("CSV not found")
        return jsonify({"error": "File not found"}), 404

    try:
        df = pd.read_csv(csv_file_path)
        csv_data = {
            "columns": list(df.columns),
            "rows": df.head(10).to_dict(orient="records"),
        }

        wild_sequence_result, _ = db_func.read_sequences_from_database_top_10(
            analysis_id
        )
        if isinstance(wild_sequence_result, tuple):
            return wild_sequence_result

        wild_sequence = wild_sequence_result.get("wild_type_sequence")
        mutant_sequences = wild_sequence_result.get("mutant_sequences")
        logger.debug(f"Wild sequence: {wild_sequence}")
        logger.debug(f"Mutant sequences: {mutant_sequences}")

        logger.debug(f"csv data: {csv_data}")
        return jsonify(
            {
                "analysis_id": analysis_id,
                "csv_data": csv_data,
                "wt_sequence": wild_sequence,
                "mutant_sequences": mutant_sequences,
            }
        )

    except Exception as e:
        logger.error(f"Error reading the file: {str(e)}")
        return jsonify({"error": f"Error reading the file: {str(e)}"}), 500


@app.route("/api/results/<analysis_id>/zip-download", methods=["GET"])
def download_results_zip(analysis_id):
    analysis_dir = os.path.join(BASE_DIR, "pipeline", analysis_id)
    zip_filename = f"{analysis_id}.zip"
    zip_path = os.path.join(analysis_dir, zip_filename)

    if not os.path.exists(analysis_dir):
        return jsonify({"error": "Analysis not found"}), 404

    # deleting unnecesary for user files
    for file_name in os.listdir(analysis_dir):
        if file_name.endswith(".ps") or file_name in ["tree_wt", "tree_mut"]:
            file_path = os.path.join(analysis_dir, file_name)
            if os.path.isfile(file_path):
                os.remove(file_path)

    # creating temp catalogue to avoid pasting zip into zip
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_zip_path = os.path.join(temp_dir, zip_filename)
        shutil.make_archive(temp_zip_path.replace(".zip", ""), "zip", analysis_dir)

        # moving zip into analysis dir
        shutil.move(temp_zip_path, zip_path)

    return send_file(zip_path, as_attachment=True)


@app.route("/api/dbsnp/<dbSnpId>", methods=["GET"])
def get_dbSNP(dbSnpId):
    result = search_clinical_tables(dbSnpId)
    if "error" in result:
        logger.debug(f"Error fetching SNP data")
        return jsonify(
            {"error": "Error fetching SNP data", "details": result["error"]}
        ), 500

    try:
        rs_num, alleles, chromosome, position = result[3][0]
    except (IndexError, KeyError):
        logger.debug(f"Invalid SNP data returned from API")
        return jsonify({"error": "Invalid SNP data returned from API"}), 404

    if rs_num != dbSnpId:
        logger.debug(f"SNP ID mismatch")
        return jsonify({"error": "SNP ID mismatch"}), 400

    alleles = alleles.split("/")
    if len(alleles) != 2 or any(len(allele) != 1 for allele in alleles):
        logger.debug(f"Invalid alleles data")
        return jsonify({"error": "Invalid alleles data"}), 400

    position = int(position)
    flank = 50

    seq_result = get_sequence(chromosome, position - flank + 1, position + flank + 1)
    if "error" in seq_result or "seq" not in seq_result:
        logger.debug(f"Error fetching sequence")
        return jsonify(
            {
                "error": "Error fetching sequence",
                "details": seq_result.get("error", "Unknown error"),
            }
        ), 500

    sequence = seq_result["seq"]
    if sequence[flank] != alleles[0]:
        logger.debug(
            "Reference allele mismatch: expected '%s', found '%s' at position %d in sequence '%s'",
            alleles[0],
            sequence[flank],
            flank,
            sequence,
        )
        return jsonify(
            {
                "error": "Reference allele mismatch",
                "expected": alleles[0],
                "found": sequence[flank],
            }
        ), 400

    mutant = list(sequence)
    mutant[flank] = alleles[1]
    mutant = "".join(mutant)

    logger.debug(f"Mutant sequence: {mutant}, Wild sequence: {sequence}")
    return jsonify(
        {
            "wildType": sequence,
            "mutantType": mutant,
        }
    )


@socketio.on("connect")
def handle_connect():
    logger.debug("Backend sent connect")
    emit("response", {"data": "Connected to WebSocket"})


if __name__ == "__main__":
    eventlet.monkey_patch()
    socketio.run(app, host="0.0.0.0", port=8080)
