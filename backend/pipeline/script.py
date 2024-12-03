import argparse
import pandas as pd
import subprocess
import os
import numpy as np
import scipy.stats as stats


def generate_mutations(sequence):
    mutations = []
    nucleotides = ['A', 'C', 'G', 'U']
    for i in range(len(sequence)):
        for nucleotide in nucleotides:
            if nucleotide != sequence[i]:
                mutated_sequence = sequence[:i] + nucleotide + sequence[i+1:]
                mutations.append(mutated_sequence)
    for i in range(len(sequence)):
        mutated_sequence = sequence[:i] + sequence[i+1:]
        mutations.append(mutated_sequence)
    for i in range(len(sequence) + 1):
        for nucleotide in nucleotides:
            mutated_sequence = sequence[:i] + nucleotide + sequence[i:]
            mutations.append(mutated_sequence)
    return mutations


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


def main():
    parser = argparse.ArgumentParser(description="Script to process RNA mutations and analyze results.")
    parser.add_argument("path", help="Path to the directory containing sequence files.")
    args = parser.parse_args()

    sequences_directory = args.path
    script_directory = os.getcwd()
    os.chdir(sequences_directory)

    results = []

    with open("wt.txt", 'r') as f:
        original_sequence = f.readline().strip()

    mutations = generate_mutations(original_sequence)
    ten_best = {
        'no':{},
        'seq': {},
        'score':{}
    }
    arr_pdist=[]
    arr_distance=[]
    arr_seq=[]
    arr_pdist = np.array(arr_pdist)
    arr_distance = np.array(arr_distance)
    arr_seq=np.array(arr_seq)

    ten_best=pd.DataFrame(ten_best)
    
    for i, mutation in enumerate(mutations, start=1):
        print(f'Processing mutation {i}/{len(mutations)}: {mutation}')

        with open("mut.txt", 'w') as f:
            f.write(mutation + '\n')

        # executing RNApdist
        try:
            command = f'bash {os.path.join(script_directory,"pipeline", "01-RNApdist")}'
            rnapdist_output = run_command(command)
        except RuntimeError as e:
            print(e)
            rnapdist_output = "Error during RNApdist"

        rnapdist_result_path = os.path.join(sequences_directory, "RNApdist-result.txt")
        if os.path.exists(rnapdist_result_path):
            with open(rnapdist_result_path) as f:
                rnapdist_output = f.read().strip()

        # logging files after RNApdist
        log_generated_files(sequences_directory)

        # executing RNAfold
        try:
            command = f'bash {os.path.join(script_directory,"pipeline", "02-RNAfold")}'
            run_command(command)
        except RuntimeError as e:
            print(e)

        # logging files after RNAfold
        log_generated_files(sequences_directory)

        # executing RNAdistance
        try:
            command = f'bash {os.path.join(script_directory,"pipeline", "03-RNAdistance")}'
            run_command(command)
        except RuntimeError as e:
            print(e)

        rnadistance_result_path = os.path.join(sequences_directory, "RNAdistance-result.txt")
        if os.path.exists(rnadistance_result_path):
            with open(rnadistance_result_path) as f:
                rnadistance_output = f.read().strip()
        else:
            rnadistance_output = "Error: RNAdistance-result.txt not found."

        # logging files after RNAdistance
        log_generated_files(sequences_directory)

        result_row = {
            "Original": original_sequence,
            "Mutation": mutation,
            "RNApdist_result": rnapdist_output,
            "RNAdistance_Result": rnadistance_output
        }
        results.append(result_row)
        
        arr_pdist = np.append(arr_pdist, float(rnapdist_output))
        arr_distance = np.append(arr_distance, float(rnadistance_result[1]))
        arr_seq=np.append(arr_seq, mutation)

    arr_pdist=stats.zscore(arr_pdist)
    arr_distance=stats.zscore(arr_distance)

    print(arr_distance)
    print(arr_pdist)
    for elem, arr in enumerate(arr_distance, start=0):
        sum=arr_distance[elem] + arr_pdist[elem]
        new_row = {'no': elem, 'seq': arr_seq[elem], 'score': sum}
        ten_best.loc[len(ten_best)]= new_row

    ten_best = ten_best.sort_values(by='score', ascending=False)
    ten_best=ten_best.head(10)
    ten_best.to_csv("ten_best_results.csv", index=False)
    print (ten_best)

    results_df = pd.DataFrame(results)
    output_csv_path = os.path.join(sequences_directory, "mutation_results.csv")
    results_df.to_csv(output_csv_path, index=False)
    print(f"Zakończono generowanie mutacji i zapis wyników do {output_csv_path}.")


if __name__ == "__main__":
    main()
