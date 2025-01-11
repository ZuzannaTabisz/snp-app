from flask import Flask, request, jsonify, send_file
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
import numpy as np
import scipy.stats as stats
from pipeline.script import generate_mutations, process_mutation
from concurrent.futures import ThreadPoolExecutor, as_completed, wait
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", path="/socket.io")

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))



def run_step(step_name, command, cwd, analysis_id):
    try:
        subprocess.run(command, cwd=cwd, check=True)
        socketio.emit('task_status', {'analysis_id': analysis_id, 'status': 'Analysis started', 'step': step_name}, broadcast=True, namespace=f'/{analysis_id}')
    except subprocess.CalledProcessError as e:
        logger.error(f"{step_name} failed: {e}")
        socketio.emit('task_status', {'analysis_id': analysis_id, 'status': 'failed', 'step': step_name, 'error': str(e)}, broadcast=True, namespace=f'/{analysis_id}')
        return False
    return True



def run_pipeline(mutant_sequence, wild_sequence, analysis_id):
    analysis_dir = os.path.join(BASE_DIR, 'pipeline', analysis_id)
    os.makedirs(analysis_dir, exist_ok=True)
    
    wt_file_path = os.path.join(analysis_dir, 'wt.txt')
    mut_file_path = os.path.join(analysis_dir, 'mut.txt')

    with open(wt_file_path, 'w') as wt_file:
        wt_file.write(wild_sequence + '\n')
    with open(mut_file_path, 'w') as mut_file:
        mut_file.write(mutant_sequence + '\n')

    
    socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis started"}, broadcast=True, namespace=f'/{analysis_id}')

    steps = [
        ("01-RNApdist", ['bash', os.path.join(BASE_DIR, 'pipeline', '01-RNApdist')]),
        ("02-RNAfold", ['bash', os.path.join(BASE_DIR, 'pipeline', '02-RNAfold')]),
        ("03-RNAdistance", ['bash', os.path.join(BASE_DIR, 'pipeline', '03-RNAdistance')]),
        ("04-RNAplot", ['bash', os.path.join(BASE_DIR, 'pipeline', '04-RNAplot')]),
        ("HITtree", ['python3', os.path.join(BASE_DIR, 'pipeline', 'tree.py'), analysis_dir])
        
    ]

    for step_name, command in steps:
        if not run_step(step_name, command, analysis_dir, analysis_id):
            return

    socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis completed"}, broadcast=True, namespace=f'/{analysis_id}')



@app.route('/api/analyze/pair', methods=['POST'])
def analyze_pair():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    mutant_sequence = data.get('mutantSequence')
    wild_sequence = data.get('wildSequence')
    logger.debug(f"Mutant sequence: {mutant_sequence}, Wild sequence: {wild_sequence}")
    
    if not wild_sequence or not mutant_sequence:
        return jsonify({'error': 'Invalid input data'}), 400

    analysis_id = str(uuid.uuid4())
    socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis started"}, broadcast=True, namespace=f'/{analysis_id}')
    
    threading.Thread(target=run_pipeline, args=(mutant_sequence, wild_sequence, analysis_id)).start()
    
    return jsonify({"analysis_id": analysis_id}), 200



@app.route('/api/results/pair/<analysis_id>', methods=['GET'])
def get_combined_text(analysis_id):
    analysis_dir = os.path.join(BASE_DIR, 'pipeline', analysis_id)

    if not os.path.exists(analysis_dir):
        return jsonify({'error': 'Analysis not found'}), 404

    filenames = [
        'RNApdist-result.txt',
        'RNAdistance-result.txt',
        'RNAdistance-backtrack.txt'
    ]

    combined_content = ""
    for filename in filenames:
        file_path = os.path.join(analysis_dir, filename)
        if os.path.exists(file_path):
            with open(file_path, 'r') as file:
                combined_content += f"=== {filename} ===\n{file.read()}\n\n"
        else:
            combined_content += f"=== {filename} ===\nFile not found\n\n"

    return jsonify({'content': combined_content})



@app.route('/api/results/pair/<analysis_id>/rna-plot-mut', methods=['GET'])
def get_svg_mut(analysis_id):
    return get_svg(analysis_id, 'mut-dotbracket.svg')

@app.route('/api/results/pair/<analysis_id>/rna-plot-wt', methods=['GET'])
def get_svg_wt(analysis_id):
    return get_svg(analysis_id, 'wt-dotbracket.svg')

@app.route('/api/results/pair/<analysis_id>/hit-tree_wt', methods=['GET'])
def get_svg_hit_tree_wt(analysis_id):
    return get_svg(analysis_id, 'tree_wt.svg')

@app.route('/api/results/pair/<analysis_id>/hit-tree_mut', methods=['GET'])
def get_svg_hit_tree_mut(analysis_id):
    return get_svg(analysis_id, 'tree_mut.svg')

def get_svg(analysis_id, filename):
    analysis_dir = os.path.join(BASE_DIR, 'pipeline', analysis_id)
    svg_path = os.path.join(analysis_dir, filename)

    if not os.path.exists(svg_path):
        return jsonify({'error': 'SVG file not found'}), 404

    return send_file(svg_path, mimetype='image/svg+xml')



@app.route('/api/analyze/single', methods=['POST'])
def analyze_single():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    wild_sequence = data.get('wildSequence')
    logger.debug(f"Wild sequence: {wild_sequence}")
    
    if not wild_sequence:
        return jsonify({'error': 'Invalid input data'}), 400

    analysis_id = str(uuid.uuid4())
    socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis started"}, broadcast=True, namespace=f'/{analysis_id}')
    analysis_dir = os.path.join(BASE_DIR, 'pipeline', analysis_id)
    os.makedirs(analysis_dir, exist_ok=True)

    wt_file_path = os.path.join(analysis_dir, 'wt.txt')
    with open(wt_file_path, 'w') as wt_file:
        wt_file.write(wild_sequence + '\n')


    socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis started"}, broadcast=True, namespace=f'/{analysis_id}')


    script_dir = BASE_DIR
    mutations = generate_mutations(wild_sequence)

    results = []
    arr_pdist = []
    arr_distance = []

    try:
        with ThreadPoolExecutor() as executor:
            logger.debug("Threadpool")
            future_to_mutation = {
                executor.submit(process_mutation, key, mutation, script_dir, analysis_dir): (key, mutation)
                for key, mutation in mutations
            }

            for future in as_completed(future_to_mutation):
                result = future.result()
                if result:
                    results.append(result)
                    rnapdist_value = result['RNApdist']
                    rnadistance_value = result['RNAdistance(f)']

                    arr_pdist.append(float(rnapdist_value) if rnapdist_value.replace('.', '', 1).isdigit() else np.nan)
                    arr_distance.append(float(rnadistance_value) if rnadistance_value.replace('.', '', 1).isdigit() else np.nan)
        
        logger.debug("Before Z-score")
        arr_pdist = np.array(arr_pdist)
        arr_distance = np.array(arr_distance)

        arr_pdist = stats.zscore(arr_pdist, nan_policy='omit')
        arr_distance = stats.zscore(arr_distance, nan_policy='omit')

        
        ten_best = pd.DataFrame(columns=['no', 'Mutation', 'RNApdist', 'RNAdistance(f)', 'Z-score'])
        for elem in range(len(arr_distance)):
            if not np.isnan(arr_distance[elem]) and not np.isnan(arr_pdist[elem]):
                score = arr_distance[elem] + arr_pdist[elem]
                new_row = {
                    'no': elem + 1,
                    'Mutation': results[elem]['Mutation'],
                    'RNApdist': arr_pdist[elem],
                    'RNAdistance(f)': arr_distance[elem],
                    'Z-score': score
                }
                #to counnter the warning about dataframe concat
                #new_row_df = pd.DataFrame([new_row])
                #new_row_df = new_row_df.dropna(axis=1, how='all')
                #ten_best = pd.concat([ten_best, new_row_df], ignore_index=True)
                ten_best = pd.concat([ten_best, pd.DataFrame([new_row])], ignore_index=True)

        
        ten_best = ten_best.sort_values(by='Z-score', ascending=False).head(10)
        ten_best.to_csv("ten_best_results.csv", index=False)



        results_df = pd.DataFrame(results)
        output_csv_path = os.path.join(analysis_dir, "mutation_results.csv")
        results_df.to_csv(output_csv_path, index=False)
    except:
        logger.debug("Exception")
    logger.debug(f"Zakończono generowanie mutacji i zapis wyników do {output_csv_path}.")

    time.sleep(4)
    socketio.emit('task_status', {'analysis_id': analysis_id, 'status': "Analysis completed"}, broadcast=True, namespace=f'/{analysis_id}')


    return jsonify({"analysis_id": analysis_id}), 200


@app.route('/api/results/single/<analysis_id>', methods=['GET'])
def get_csv_preview(analysis_id):
    logger.debug(f"In get csv")
    analysis_dir = os.path.join(BASE_DIR, 'pipeline', analysis_id)
    csv_file_path = os.path.join(analysis_dir, 'ten_best_results.csv')

    if not os.path.exists(csv_file_path):
        logger.debug("CSV not found")
        return jsonify({'error': 'File not found'}), 404

    try:
        df = pd.read_csv(csv_file_path)
        preview_data = {
            "columns": list(df.columns),
            "rows": df.head(10).to_dict(orient='records')
        }
        logger.debug(f"Preview data: {preview_data}")
        return jsonify(preview_data)

    except Exception as e:
        logger.error(f"Error reading the file: {str(e)}")
        return jsonify({'error': f'Error reading the file: {str(e)}'}), 500


@app.route('/api/results/<analysis_id>/zip-download', methods=['GET'])
def download_results_zip(analysis_id):
    analysis_dir = os.path.join(BASE_DIR, 'pipeline', analysis_id)
    zip_path = os.path.join(analysis_dir, f"{analysis_id}.zip")

    if not os.path.exists(analysis_dir):
        return jsonify({'error': 'Analysis not found'}), 404

    shutil.make_archive(zip_path.replace(".zip", ""), 'zip', analysis_dir)
    return send_file(zip_path, as_attachment=True)


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

def check_internet_connection(url="http://www.google.com", verify=False):
    logger.debug(f"Checking internet connection to {url}")
    
    try:
        logger.debug(f"Sending GET request to {url} with SSL verification set to {verify}")
        response = requests.get(url, timeout=5, verify=verify)
        

        if response.status_code == 200:
            logger.debug(f"Connection successful. Status code: {response.status_code}")
            return True
        else:
            logger.warning(f"Connection failed. Status code: {response.status_code}")
            return False
    except requests.ConnectionError as e:
        logger.error(f"Connection error: {str(e)}")
        return False
    except requests.exceptions.Timeout as e:
        logger.error(f"Timeout error: {str(e)}")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"General request exception: {str(e)}")
        return False
#https://stackoverflow.com/questions/23013220/max-retries-exceeded-with-url-in-requests
def search_clinical_tables(snp_id):
    logger.debug("Checking internet connection")
    
    if not check_internet_connection():
        logger.error("No internet connection available.")


    base_url = "https://clinicaltables.nlm.nih.gov/api/snps/v3/search"
    params = {
        "terms": snp_id,
        "maxList": 1,
        "df": "rsNum,38.alleles,38.chr,38.pos",
    }

    logger.debug(f"Starting search for SNP ID: {snp_id}")
    logger.debug(f"Request URL: {base_url}")
    logger.debug(f"Request parameters: {params}")
    
    try:

        session = requests.Session()
    

        logger.debug("Sending GET request to Clinical Tables API")
        
        response = session.get(base_url, params=params, timeout=10)

        logger.debug("Sending GET request to Clinical Tables API")
        response = requests.get(base_url, params=params, timeout = 10)
        response.raise_for_status()
        
        logger.debug(f"Response Status Code: {response.status_code}")
        
        
        response.raise_for_status()
        logger.debug("Response received successfully, parsing JSON")
        
        
        response_json = response.json()
        logger.debug(f"Received JSON response: {response_json}")
        
        if not response_json or not isinstance(response_json, list) or len(response_json) < 4:
            logger.warning(f"Unexpected response structure: {response_json}")
            return {"error": "Unexpected response structure"}
        
        logger.debug(f"Successfully retrieved SNP data for {snp_id}.")
        return response_json
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {str(e)}")
        return {"error": "Request failed"}
    except ValueError as e:
        logger.error(f"JSON decoding error: {str(e)}")
        return {"error": "Invalid JSON response"}
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")
        return {"error": "Unexpected error"}

@app.route('/api/dbsnp/<dbSnpId>', methods=['GET'])
def get_dbSNP(dbSnpId):
    
    result = search_clinical_tables(dbSnpId)
    if "error" in result:
        logger.debug(f"Error fetching SNP data")
        return jsonify({"error": "Error fetching SNP data", "details": result["error"]}), 500

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
        return jsonify({"error": "Error fetching sequence", "details": seq_result.get("error", "Unknown error")}), 500

    sequence = seq_result["seq"]
    if sequence[flank] != alleles[0]:
        logger.debug(
        "Reference allele mismatch: expected '%s', found '%s' at position %d in sequence '%s'",
        alleles[0],
        sequence[flank],
        flank,
        sequence
        )
        return jsonify({"error": "Reference allele mismatch", 
                        "expected": alleles[0], 
                        "found": sequence[flank]}), 400

    mutant = list(sequence)
    mutant[flank] = alleles[1]
    mutant = "".join(mutant)


    logger.debug(f"Mutant sequence: {mutant}, Wild sequence: {sequence}")
    return jsonify({
        "wildType": sequence,
        "mutantType": mutant,
    })



@socketio.on('connect')
def handle_connect():
    logger.debug("Backend sent connect")
    emit('response', {'data': 'Connected to WebSocket'})

if __name__ == '__main__':
    eventlet.monkey_patch()
    socketio.run(app, host='0.0.0.0', port=8080)