# 모든 MP4 파일을 순회하며 WebP로 변환
for file in *.mp4; do
    # 파일 이름에서 확장자 제거
    filename=$(basename "$file" .mp4)

    # FFmpeg를 사용하여 최적화된 WebP로 변환
    ffmpeg -i "$file" -vcodec libwebp -filter:v fps=15 -lossless 0 -compression_level 6 -q:v 50 -loop 0 -preset picture -an -vsync 0 "${filename}.webp"

    echo "Converted $file to ${filename}.webp"
done

echo "All files converted successfully!"