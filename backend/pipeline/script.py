import argparse
import pandas as pd
import subprocess
import os
import sys
import logging
import numpy as np
import scipy.stats as stats
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
sys.path.append(parent_dir)
from app import app, update_table_single, update_table_top_10

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def generate_mutations(sequence):
    nucleotides = ['A', 'C', 'G', 'U']

    
    for i in range(len(sequence)):
        for nucleotide in nucleotides:
            if nucleotide != sequence[i]:
                mutated_sequence = sequence[:i] + nucleotide + sequence[i+1:]
                key = f"{sequence[i]}_{i+1}_{nucleotide}"
                yield key, mutated_sequence

    
    for i in range(len(sequence)):
        mutated_sequence = sequence[:i] + sequence[i+1:]
        key = f"{sequence[i]}_{i+1}_-"
        yield key, mutated_sequence

    #insertions    
    for i in range(len(sequence) + 1):
        for nucleotide in nucleotides:
            mutated_sequence = sequence[:i] + nucleotide + sequence[i:]
            key = f"-_{i+1}_{nucleotide}"
            yield key, mutated_sequence

def run_command(command):
    result = subprocess.run(command, capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {command}\nError: {result.stderr.strip()}")
    return result.stdout.strip()

def log_generated_files(directory, log_file="generated_files.log"):
    with open(log_file, "a") as log:
        log.write(f"Files generated in {directory}:\n")
        for root, _, files in os.walk(directory):
            for file in files:
                log.write(f"{os.path.join(root, file)}\n")
        log.write("\n")

def process_mutation(key, mutation, script_directory, sequences_directory):
    try:
        
        with open("mut.txt", 'w') as f:
            f.write(mutation + '\n')

        
        try:
            command = f'bash {os.path.join(script_directory,"pipeline", "01-RNApdist")}'
            rnapdist_output = run_command(command)
        except RuntimeError as e:
            print(e)
            rnapdist_output = "Error during RNApdist"

        rnapdist_result_path = "RNApdist-result.txt"
        if os.path.exists(rnapdist_result_path):
            with open(rnapdist_result_path) as f:
                rnapdist_output = f.read().strip()

        
        try:
            command = f'bash {os.path.join(script_directory,"pipeline", "02-RNAfold")}'
            run_command(command)
        except RuntimeError as e:
            print(e)

        
        log_generated_files(sequences_directory)

        
        try:
            command = f'bash {os.path.join(script_directory,"pipeline", "03-RNAdistance")}'
            run_command(command)
        except RuntimeError as e:
            print(e)

        rnadistance_result_path = os.path.join(sequences_directory, "RNAdistance-result.txt")
        if os.path.exists(rnadistance_result_path):
            with open(rnadistance_result_path) as f:
                rnadistance_output = f.read().strip().split()
        else:
            rnadistance_output = ["Error", "RNAdistance-result.txt not found."]

        return {
            'Mutation': key,
            'RNApdist': rnapdist_output,
            'RNAdistance(f)': rnadistance_output[1] if len(rnadistance_output) > 1 else "Error",
            'Z-score': None
        }

    except Exception as e:
        print(f"Error processing mutation {key}: {e}")
        return None
    
def generate_mutated_sequences(wild_sequence, mutations):
    """
    Generuje listę zmutowanych sekwencji na podstawie sekwencji dzikiej i listy mutacji.

    Args:
    - wild_sequence (str): Sekwencja dzika (oryginalna).
    - mutations (list of str): Lista mutacji w formacie "X_n_Y", gdzie:
        - X to nukleotyd w pozycji `n` (lub "-" dla insercji),
        - n to indeks (1-indeksowany),
        - Y to nukleotyd docelowy (lub "-" dla delecji).

    Returns:
    - list of str: Lista zmutowanych sekwencji.
    """
    mutated_sequences = []

    for mutation in mutations:
        parts = mutation.split('_')
        if len(parts) != 3:
            raise ValueError(f"Nieprawidłowy format mutacji: {mutation}")

        original, position, change = parts
        position = int(position) - 1 

        if original == "-" and change in "ACGUT":  # Insercja
            mutated_sequence = wild_sequence[:position] + change + wild_sequence[position:]
        elif change == "-":  # Delecja
            mutated_sequence = wild_sequence[:position] + wild_sequence[position + 1:]
        elif original in "ACGUT" and change in "ACGUT":  # Substytucja
            mutated_sequence = wild_sequence[:position] + change + wild_sequence[position + 1:]
        else:
            raise ValueError(f"Nieprawidłowa mutacja: {mutation}")

        mutated_sequences.append(mutated_sequence)

    return mutated_sequences

def main():

    parser = argparse.ArgumentParser(description="Script to process RNA mutations and analyze results.")
    parser.add_argument("path", help="Path to the directory containing sequence files.")
    parser.add_argument("analysis_id", help="Unique ID for the analysis.")
    args = parser.parse_args()

    analysis_id = args.analysis_id
    sequences_directory = args.path
    script_directory = os.getcwd()
    os.chdir(sequences_directory)


    with open("wt.txt", 'r') as f:
        original_sequence = f.readline().strip()
        with app.app_context():  
            update_table_single(analysis_id, 'in_progress')
            for rank in range(1, 11):   
                update_table_top_10(analysis_id, 'empty', str(rank), 'in_progress')
    mutations = generate_mutations(original_sequence)
    

    results = []
    arr_pdist = []
    arr_distance = []

    
    with ThreadPoolExecutor() as executor:
        future_to_mutation = {
            executor.submit(process_mutation, key, mutation, script_directory, sequences_directory): (key, mutation)
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
            ten_best = pd.concat([ten_best, pd.DataFrame([new_row])], ignore_index=True)

    ten_best = ten_best.sort_values(by='Z-score', ascending=False).head(10)
    mutations = ten_best['Mutation'].tolist()
    mutated_sequences = generate_mutated_sequences(original_sequence, mutations)
    with app.app_context():
        rank = 1
        for mutated_sequence in mutated_sequences: 
            update_table_top_10(analysis_id, mutated_sequence, rank, 'completed')
            rank += 1
    ten_best.to_csv("ten_best_results.csv", index=False)

    results_df = pd.DataFrame(results)
    output_csv_path = os.path.join(sequences_directory, "mutation_results.csv")
    results_df.to_csv(output_csv_path, index=False)
    print(f"Zakończono generowanie mutacji i zapis wyników do {output_csv_path}.")

if __name__ == "__main__":
    main()
