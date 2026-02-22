import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";

export default function Index() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const cameraRef = useRef<Camera | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  async function takePhotoAndCropROI() {
    if (!cameraRef.current || processing) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: Platform.OS === "android" });
      setPhotoUri(photo.uri);

      const w = photo.width ?? 0;
      const h = photo.height ?? 0;
      const cropSize = Math.floor(Math.min(w, h) * 0.12);
      const originX = Math.floor((w - cropSize) / 2);
      const originY = Math.floor((h - cropSize) / 2);

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: { originX, originY, width: cropSize, height: cropSize } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCroppedUri(manipResult.uri);

      // Placeholder: here you'd analyze the cropped image and return numeric/color data.
      // analyzeImage(manipResult.uri)

    } catch (e) {
      console.warn("capture error", e);
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    setPhotoUri(null);
    setCroppedUri(null);
  }

  if (hasPermission === null) return <View style={styles.container}><Text style={styles.info}>Requesting camera permission...</Text></View>;
  if (hasPermission === false) return <View style={styles.container}><Text style={styles.info}>No access to camera</Text></View>;

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <View style={styles.cameraContainer}>
          <Camera style={styles.camera} type={type} ref={cameraRef} ratio="16:9">
            <View style={styles.overlayContainer} pointerEvents="none">
              <View style={styles.roi} />
            </View>
          </Camera>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setType(prev => prev === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back)}
            >
              <Text style={styles.btnText}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhotoAndCropROI} disabled={processing}>
              <Text style={styles.btnText}>{processing ? "Scanning..." : "Scan"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {}}>
              <Text style={styles.btnText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.info}>Captured</Text>
          {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
          <Text style={styles.info}>Cropped ROI</Text>
          {croppedUri && <Image source={{ uri: croppedUri }} style={styles.roiPreview} />}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.button} onPress={reset}><Text style={styles.btnText}>Retake</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => { /* placeholder: export/send croppedUri for analysis */ }}><Text style={styles.btnText}>Use</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  cameraContainer: { flex: 1, width: "100%" },
  camera: { flex: 1 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  roi: { width: "18%", aspectRatio: 1, borderWidth: 2, borderColor: "rgba(255,255,255,0.9)", borderRadius: 6, backgroundColor: "transparent" },
  controls: { position: "absolute", bottom: 24, left: 0, right: 0, flexDirection: "row", justifyContent: "space-evenly", alignItems: "center" },
  button: { padding: 12, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 8 },
  captureButton: { padding: 14, backgroundColor: "#1e90ff", borderRadius: 36 },
  btnText: { color: "white", fontWeight: "600" },
  info: { color: "white", margin: 8 },
  resultContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12 },
  preview: { width: 300, height: 300 * (16/9), resizeMode: "contain", marginVertical: 8 },
  roiPreview: { width: 120, height: 120, resizeMode: "cover", marginVertical: 8 },
  controlsRow: { flexDirection: "row", gap: 12, marginTop: 12 }
});
