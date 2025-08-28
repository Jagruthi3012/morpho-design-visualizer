import pandas as pd
import json
import os

# Constants
IMAGE_FOLDER_NAMES = {
    "front": "Front_view",
    "top": "Top_view",
    "iso": "Isometric",
    "deformation": "Truss_deformation"
}

# Load CSV and drop the first row (offset by 1)
df = pd.read_csv("solutions.csv")
df = df.iloc[0:].reset_index(drop=True)

# Function to pad filenames like image_000.png
def get_image_name(i):
    return f"{i + 1}.png"

# Build the data
output = []
for i in range(len(df)):
    row = df.iloc[i].to_dict()
    entry = {
        "id": i+1,
        "params": row,
        "views": {
            view: f"{folder}/{get_image_name(i)}"
            for view, folder in IMAGE_FOLDER_NAMES.items()
        }
    }
    output.append(entry)

# Save to file
with open("data.json", "w") as f:
    json.dump(output, f, indent=2)

print("Successfully created data.json")