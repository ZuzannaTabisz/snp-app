import re
import graphviz
import argparse
import os

#assumptins made:
# - underscores are never present after the token before the closing bracket; they are always added before a node label in vienna code
# - nodes in string are always read in left to right order exept nodes with P in them are read first

# function to build a tree from text
def build_tree(tokens, original_string):
    stack = []
    current_list = []
    root = current_list
    token_positions = {}  # storing token positions in the original string

    position = 0  # tracking position of tokens in the original string

    for token in tokens:
        # "clean" token by removing underscores
        #token = token.replace('_', '')

        # skipping tokens that are purely underscores
        if re.fullmatch(r'_+', token):
            position += len(token)  # updating position
            continue

        else:
            last_char_pos = position + len(token) - 1  # position of the last character in the original label
            if token not in token_positions:
                token_positions[token] = []
            token_positions[token].append(last_char_pos)  # storing positions in map

        # building the tree structure list
        if token == '(':
            new_list = []
            current_list.append(new_list)
            stack.append(current_list)
            current_list = new_list
        elif token == ')':
            current_list = stack.pop()
        elif 'R1' in token:  # skip R1 which is added later
            position += len(token)  # updating position
            continue
        else:
            current_list.append(token)
            current_list.reverse()

        #print(f"Token: {token}, Stack: {stack}, Current List: {current_list}")

        # updating position
        position += len(token)

    #print(f"Final Tree Structure: {root}")
    #print(f"Token Positions Dictionary: {token_positions}")
    return root[0] if root else [], token_positions

# function to add nodes and edges to the Graphviz graph with coloring logic
def add_edges(graph, subtree, previous_parent, current_parent, common_positions, common_position_labels, pos_dict, key_usage_count, is_root=False):
    subtree_list = list(subtree)
    #print(f"\nAdding edges to graph: Subtree={subtree_list}, Current Parent={current_parent}")

    for index, element in enumerate(subtree_list):
        if not isinstance(element, list):
            #print(f"\nProcessing element: {element}")

            # check if the element is in the pos_dict
            if element in pos_dict:
                # getting the list of values and usage count for this key
                values = pos_dict[element]

                count = key_usage_count.get(element, 0)

                # creating unique label
                unique_label = f"{re.sub(r'_', '', element)}_{values[count]}"
                #print(f"Adding node {unique_label} (Element: {re.sub(r'_', '', element)}, Value: {values[count]})")

                # update the usage count for the key
                key_usage_count[element] = count + 1
                #print(f"Updated usage count for {element}: {key_usage_count[element]}")
                # adding the node to the graph

                if values[count] + 1  in common_positions:
                    if values[count] + 1 in common_position_labels:
                        color = "green"
                    else:
                        #print(f'Common posit {common_positions}')
                        #print(f'Common posit labels {common_position_labels}')
                        #print(f'Adding orange {unique_label} (Element: {element}, Value: {values[count]}')
                        color = "orange"
                else:
                    color = "red"

                graph.node(unique_label, re.sub(r'_', '', element), color="black", fillcolor=color, style="filled", shape="ellipse")

                if current_parent is not None:
                    graph.edge(current_parent, unique_label, color="black")
                    #print(f"Edge Added from {current_parent} to {unique_label}")

                    previous_parent = current_parent
                    current_parent = unique_label

                # if 'P' is found in the element, reverse the remaining subtree
                if 'P' in element:
                    #print(f"Found 'P' in {element}, reversing subtree.")
                    subtree_list[index + 1:] = reversed(subtree_list[index + 1:])
                    #print(f"Reversed subtree list: {subtree_list[index + 1:]}")
        else:
            # if element is a list, process it recursively

            #print(f"Processing nested list: {element}")
            add_edges(graph, element, previous_parent, current_parent, common_positions, common_position_labels, pos_dict, key_usage_count, is_root=False)


# ============================================================================================

# parser = argparse.ArgumentParser(description="Script to process RNA mutations and analyze results.")
# parser.add_argument("path", help="Path to the directory containing sequence files.")
# args = parser.parse_args()

# sequences_directory = args.path

file_path=os.path.join("RNAdistance-backtrack.txt")

# load HIT tree strings from file
with open(file_path, 'r') as file:
    lines = file.readlines()

og_tree_str1 = lines[5].strip()
og_tree_str2 = lines[4].strip()


tokens1 = re.sub(r'(\(|\))', r' \1 ', og_tree_str1).split()
tokens2 = re.sub(r'(\(|\))', r' \1 ', og_tree_str2).split()

tree_list1,pos_dict1 = build_tree(tokens1,og_tree_str1)
tree_list2,pos_dict2 = build_tree(tokens2,og_tree_str1)


closing_positions1 = pos_dict1[')']
closing_positions2 = pos_dict2[')']


# finding common closing bracket positions
common_positions = set(closing_positions1).intersection(closing_positions2)
common_position_labels = []
for pos in common_positions:
    label1 = og_tree_str1[pos-1]
    label2 = og_tree_str2[pos-1]

    # finding only identical labels for coloring the node orange
    if label1 == label2:
        #print(f"Different Labels - Position: {pos}, Original 1: {label1}, Original 2: {label2}")
        common_position_labels.append(pos)



#print(f"Closing positions in tree_str1: {closing_positions1}")
#print(f"Closing positions in tree_str2: {closing_positions2}")
#print(f"Common closing positions: {common_positions}")
#print(f"Common position labels: {common_position_labels}")

# drawing graphs

key_usage_count1 = {}
graph1 = graphviz.Digraph(comment='Tree 1')
graph1.attr(bgcolor='white')
graph1.node("R1", "R1", color="black", fillcolor="green", style="filled", shape="ellipse")
add_edges(graph1, tree_list1, "R1", "R1", common_positions, common_position_labels, pos_dict1, key_usage_count1, is_root=True)

key_usage_count2 = {}
graph2 = graphviz.Digraph(comment='Tree 2')
graph2.attr(bgcolor='white')
graph2.node("R1", "R1", color="black", fillcolor="green", style="filled", shape="ellipse")
add_edges(graph2, tree_list2, "R1", "R1", common_positions, common_position_labels, pos_dict2, key_usage_count2, is_root=True)

# save the graphs as SVG files
graph1.render(os.path.join('tree_wt'), format='svg')
graph2.render(os.path.join('tree_mut'), format='svg')
