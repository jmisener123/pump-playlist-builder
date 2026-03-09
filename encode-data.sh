#!/bin/bash

# Encode data.csv to base64 for privacy
# Usage: ./encode-data.sh

CSV_FILE="public/data.csv"
OUTPUT_FILE="public/playlist-data.txt"

if [ ! -f "$CSV_FILE" ]; then
  echo "Error: $CSV_FILE not found!"
  exit 1
fi

echo "Encoding $CSV_FILE..."
base64 -i "$CSV_FILE" -o "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "✓ Successfully encoded to $OUTPUT_FILE"
  echo "  Original size: $(wc -c < "$CSV_FILE" | xargs) bytes"
  echo "  Encoded size:  $(wc -c < "$OUTPUT_FILE" | xargs) bytes"
else
  echo "✗ Encoding failed"
  exit 1
fi
