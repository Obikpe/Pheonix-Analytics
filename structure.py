import os

def generate_folder_tree(start_path, output_filename):
    # Folders to exclude (including 'lessons' and its contents)
    exclude_dirs = {
        'lessons',
        'node_modules', 
        'node-module', 
        '.next', 
        '.vscode', 
        '__pycache__', 
        '_pycache_',
        '.git'
    }

    with open(output_filename, 'w', encoding='utf-8') as f:
        root_folder_name = os.path.basename(os.path.abspath(start_path))
        f.write(f"{root_folder_name}/\n")

        for root, dirs, files in os.walk(start_path):
            # Modify dirs in-place to prevent os.walk from entering excluded folders
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            # Compute relative path depth for indentation
            rel_path = os.path.relpath(root, start_path)
            if rel_path == '.':
                depth = 0
            else:
                depth = rel_path.count(os.sep) + 1

            indent = '│   ' * (depth - 1) + '├── ' if depth > 0 else ''

            if depth > 0:
                folder_name = os.path.basename(root)
                f.write(f"{indent}{folder_name}/\n")

            # Write files inside the current directory
            file_indent = '│   ' * depth + '├── '
            for file in files:
                f.write(f"{file_indent}{file}\n")

if __name__ == "__main__":
    # Scans the current directory where the script is executed
    target_directory = "."
    output_file = "folder_structure.txt"
    
    generate_folder_tree(target_directory, output_file)
    print(f"Success! Folder structure saved to '{output_file}'. The 'lessons' folder and its contents were skipped.")