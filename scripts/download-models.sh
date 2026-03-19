#!/bin/bash
set -e

BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
DEST="frontend/src/assets/models"
mkdir -p "$DEST"

FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_tiny_model-weights_manifest.json"
  "face_landmark_68_tiny_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)

for f in "${FILES[@]}"; do
  echo "Descargando $f..."
  curl -sL "$BASE/$f" -o "$DEST/$f"
done

echo "✓ Modelos descargados en $DEST"
