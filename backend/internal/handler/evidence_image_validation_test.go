package handler

import (
	"bytes"
	"encoding/binary"
	"errors"
	"hash/crc32"
	"image"
	"image/gif"
	"image/png"
	"testing"
)

func TestDecodeEvidenceImageChecksDimensionsBeforeDecoding(t *testing.T) {
	var content bytes.Buffer
	if err := png.Encode(&content, image.NewRGBA(image.Rect(0, 0, 1, 1))); err != nil {
		t.Fatal(err)
	}
	data := content.Bytes()
	binary.BigEndian.PutUint32(data[16:20], 100000)
	binary.BigEndian.PutUint32(data[20:24], 100000)
	binary.BigEndian.PutUint32(data[29:33], crc32.ChecksumIEEE(data[12:29]))
	// Only the header remains: full decoding would fail or allocate huge memory.
	config, format, err := decodeEvidenceImage(data[:33])
	if err != nil || format != "png" || config.Width != 100000 || config.Height != 100000 {
		t.Fatalf("got config=%+v format=%q err=%v", config, format, err)
	}
}

func TestDecodeEvidenceImageRejectsTruncatedPixels(t *testing.T) {
	var content bytes.Buffer
	if err := png.Encode(&content, image.NewRGBA(image.Rect(0, 0, 2, 3))); err != nil {
		t.Fatal(err)
	}
	if _, _, err := decodeEvidenceImage(content.Bytes()[:33]); err == nil {
		t.Fatal("accepted an image header without pixel data")
	}
}

func TestDecodeEvidenceImageUsesImageContent(t *testing.T) {
	var content bytes.Buffer
	if err := png.Encode(&content, image.NewRGBA(image.Rect(0, 0, 2, 3))); err != nil {
		t.Fatal(err)
	}

	config, format, err := decodeEvidenceImage(content.Bytes())
	if err != nil {
		t.Fatal(err)
	}
	if format != "png" || config.Width != 2 || config.Height != 3 {
		t.Fatalf("got format=%q dimensions=%dx%d", format, config.Width, config.Height)
	}
}

func TestDecodeEvidenceImageRejectsNonJPGPNG(t *testing.T) {
	var content bytes.Buffer
	if err := gif.Encode(&content, image.NewRGBA(image.Rect(0, 0, 2, 3)), nil); err != nil {
		t.Fatal(err)
	}

	_, _, err := decodeEvidenceImage(content.Bytes())
	if !errors.Is(err, errUnsupportedEvidenceImageFormat) {
		t.Fatalf("got error %v, want unsupported image format", err)
	}
}

func TestDecodeEvidenceImageRejectsInvalidContent(t *testing.T) {
	_, _, err := decodeEvidenceImage([]byte("not an image"))
	if err == nil || errors.Is(err, errUnsupportedEvidenceImageFormat) {
		t.Fatalf("got error %v, want image decode error", err)
	}
}
