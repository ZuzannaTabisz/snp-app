import pandas as pd
import subprocess
import os
import logging
import shutil
import tempfile

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def generate_mutations(sequence):
    if 'T' in sequence:
        nucleotides = ['A', 'C', 'G', 'T']
    else:
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

    # Insertions
    for i in range(len(sequence) + 1):
        for nucleotide in nucleotides:
            mutated_sequence = sequence[:i] + nucleotide + sequence[i:]
            key = f"-_{i+1}_{nucleotide}"
            yield key, mutated_sequence

def run_command(command, cwd=None):
    result = subprocess.run(command, capture_output=True, text=True, shell=True, cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {command}\nError: {result.stderr.strip()}")
    return result.stdout.strip()

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

def process_mutation(key, mutation, script_directory, sequences_directory,wild_sequence):
    try:
        logger.debug(f"Processing mutation: {key}")

        
        with tempfile.TemporaryDirectory(dir=sequences_directory) as mutation_dir:
            
            wt_filename = os.path.join(mutation_dir, "wt.txt")
            with open(wt_filename, 'w') as f:
                f.write(wild_sequence + '\n')
            logger.debug(f"Written wt to {wt_filename}")

            
            mut_filename = os.path.join(mutation_dir, "mut.txt")
            with open(mut_filename, 'w') as f:
                f.write(mutation + '\n')
            logger.debug(f"Written mutation to {mut_filename}")

            
            try:
                command = f'bash {os.path.join(script_directory, "01-RNApdist")}'
                run_command(command, cwd=mutation_dir)
            except RuntimeError as e:
                logger.error(f"Error during RNApdist: {e}")
                rnapdist_output = "Error during RNApdist"

            rnapdist_result_path = os.path.join(mutation_dir, "RNApdist-result.txt")
            if os.path.exists(rnapdist_result_path):
                with open(rnapdist_result_path) as f:
                    rnapdist_output = f.read().strip()
                logger.debug(f"RNApdist result read from {rnapdist_result_path}: {rnapdist_output}")
            else:
                rnapdist_output = "Error: RNApdist-result.txt not found"
                logger.error(rnapdist_output)

            
            try:
                command = f'bash {os.path.join(script_directory, "02-RNAfold")}'
                run_command(command, cwd=mutation_dir)
                logger.debug("RNAfold command executed successfully")
            except RuntimeError as e:
                logger.error(f"Error during RNAfold: {e}")

            
            try:
                command = f'bash {os.path.join(script_directory, "03-RNAdistance")}'
                run_command(command, cwd=mutation_dir)
                logger.debug("RNAdistance command executed successfully")
            except RuntimeError as e:
                logger.error(f"Error during RNAdistance: {e}")

            rnadistance_result_path = os.path.join(mutation_dir, "RNAdistance-result.txt")
            if os.path.exists(rnadistance_result_path):
                with open(rnadistance_result_path) as f:
                    rnadistance_output = f.read().strip().split()
                logger.debug(f"RNAdistance result read from {rnadistance_result_path}: {rnadistance_output}")
            else:
                rnadistance_output = ["Error", "RNAdistance-result.txt not found"]
                logger.error(rnadistance_output)

            return {
                
                'Mutation': key,
                'RNApdist': float(rnapdist_output) if rnapdist_output.replace('.', '', 1).replace('e-', '', 1).isdigit() else "Error",
                'RNAdistance(f)': float(rnadistance_output[1]) if len(rnadistance_output) > 1 and rnadistance_output[1].replace('.', '', 1).replace('e-', '', 1).isdigit() else "Error",
                'Z-score': None
            }

    except Exception as e:
        logger.error(f"Error processing mutation {key}: {e}")
        return {
            'Mutation': key,
            'RNApdist': "Error",
            'RNAdistance(f)': "Error",
            'Z-score': None
        }
