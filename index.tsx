import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, Alert, Platform } from "react-native";
import { Camera, CameraType } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { rgbToLab } from "./colorUtils";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Attempt to compute average RGB from an image URI using Skia if available.
async function computeAverageRGBFromUri(uri: string): Promise<[number, number, number] | null> {
  // Try Skia-based decode (guarded)
  try {
    // dynamic require so app runs even if Skia isn't installed
    // @ts-ignore
    const Skia = require('@shopify/react-native-skia');
    if (!Skia) throw new Error('Skia not available');

    // read file as base64
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    // decode base64 to bytes
    let bytes: Uint8Array;
    if (typeof atob === 'function') {
      const bin = atob(b64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else if (typeof Buffer !== 'undefined') {
      // Node-style Buffer available in some RN setups
      const buf = Buffer.from(b64, 'base64');
      bytes = new Uint8Array(buf);
    } else {
      throw new Error('No base64->bytes available');
    }

    const img = Skia.Image.MakeImageFromEncoded(bytes);
    if (!img) throw new Error('Skia failed to decode image');
    const w = img.width();
    const h = img.height();
    // readPixels may not be present on every binding; attempt it
    // @ts-ignore
    if (typeof img.readPixels === 'function') {
      // readPixels returns a Uint8Array RGBA
      // @ts-ignore
      const px = img.readPixels(0, 0, w, h);
      if (!px) throw new Error('readPixels returned null');
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < px.length; i += 4) {
        r += px[i];
        g += px[i + 1];
        b += px[i + 2];
        count++;
      }
      return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
    } else {
      throw new Error('img.readPixels not available on this Skia build');
    }
  } catch (e) {
    console.warn('computeAverageRGBFromUri Skia path failed:', e);
  }

  // Fallback: upload the cropped image to a decode server which returns average RGB.
  try {
    const SERVER = "http://10.0.2.2:3000"; // change to your server host (use 10.0.2.2 for Android emulator)
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const resp = await fetch(`${SERVER}/decode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: b64 })
    });
    if (!resp.ok) throw new Error(`server decode failed: ${resp.status}`);
    const data = await resp.json();
    if (data && typeof data.r === 'number' && typeof data.g === 'number' && typeof data.b === 'number') {
      return [Math.round(data.r), Math.round(data.g), Math.round(data.b)];
    }
    return null;
  } catch (e) {
    console.warn('computeAverageRGBFromUri server fallback failed:', e);
    return null;
  }
}

export default function Index() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [avgRgb, setAvgRgb] = useState<[number, number, number] | null>(null);
  const [lab, setLab] = useState<{ L: number; a: number; b: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera'|'logs'>('camera');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      // load existing scans
      try {
        const cur = await AsyncStorage.getItem('scans');
        const arr = cur ? JSON.parse(cur) : [];
        setLogs(arr);
      } catch (e) {
        console.warn('load scans failed', e);
      }
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

      // try to compute average RGB from the cropped image (in-app or server fallback)
      try {
        const avg = await computeAverageRGBFromUri(manipResult.uri);
        if (avg) {
          setAvgRgb(avg);
          const labVal = rgbToLab(avg[0], avg[1], avg[2]);
          setLab(labVal);
          const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            photoUri: photo.uri,
            croppedUri: manipResult.uri,
            avgRgb: avg,
            lab: labVal
          };
          // persist
          try {
            const cur = await AsyncStorage.getItem('scans');
            const arr = cur ? JSON.parse(cur) : [];
            arr.unshift(entry);
            await AsyncStorage.setItem('scans', JSON.stringify(arr));
            setLogs(arr);
          } catch (e) { console.warn('save scan failed', e); }
            // auto-upload scan to server (non-blocking)
            (async () => {
              try {
                const SERVER = 'http://10.0.2.2:3000';
                const b64 = await FileSystem.readAsStringAsync(manipResult.uri, { encoding: FileSystem.EncodingType.Base64 });
                await fetch(`${SERVER}/upload`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageBase64: b64, metadata: { timestamp: entry.timestamp, avgRgb: entry.avgRgb, lab: entry.lab } })
                });
              } catch (e) { console.warn('auto-upload failed', e); }
            })();
        }
      } catch (e) {
        console.warn("pixel decode failed", e);
      }

    } catch (e) {
      console.warn("capture error", e);
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    setPhotoUri(null);
    setCroppedUri(null);
    setAvgRgb(null);
    setLab(null);
  }

  async function clearScans() {
    try {
      await AsyncStorage.removeItem('scans');
      setLogs([]);
    } catch (e) {
      console.warn('clearScans failed', e);
    }
  }

  async function exportLogsCSV() {
    try {
      if (!logs || logs.length === 0) {
        Alert.alert('No logs', 'There are no scans to export.');
        return;
      }
      const header = 'id,timestamp,r,g,b,L,a,b,photoUri,croppedUri\n';
      const rows = logs.map((it: any) => {
        const r = it.avgRgb ? it.avgRgb[0] : '';
        const g = it.avgRgb ? it.avgRgb[1] : '';
        const b = it.avgRgb ? it.avgRgb[2] : '';
        const L = it.lab ? it.lab.L : '';
        const a = it.lab ? it.lab.a : '';
        const bb = it.lab ? it.lab.b : '';
        return `${it.id},${it.timestamp},${r},${g},${b},${L},${a},${bb},${it.photoUri || ''},${it.croppedUri || ''}`;
      }).join('\n');
      const csv = header + rows;
      const path = FileSystem.documentDirectory + `scans_export_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      Alert.alert('Exported', `CSV written to:\n${path}`);
    } catch (e) {
      console.warn('exportLogsCSV failed', e);
      Alert.alert('Export failed', String(e));
    }
  }

  if (hasPermission === null) return <View style={styles.container}><Text style={styles.info}>Requesting camera permission...</Text></View>;
  if (hasPermission === false) return <View style={styles.container}><Text style={styles.info}>No access to camera</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabButton, activeTab==='camera' && styles.tabActive]} onPress={() => setActiveTab('camera')}><Text style={styles.btnText}>Camera</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab==='logs' && styles.tabActive]} onPress={() => setActiveTab('logs')}><Text style={styles.btnText}>Logs</Text></TouchableOpacity>
      </View>

      {activeTab === 'camera' ? (
        !photoUri ? (
          <View style={styles.cameraContainer}>
            <Camera style={styles.camera} type={type} ref={cameraRef} ratio="16:9">
              <View style={styles.overlayContainer} pointerEvents="none">
                <View style={styles.roi} />
              </View>
            </Camera>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setType((prev: CameraType) => prev === CameraType.back ? CameraType.front : CameraType.back)}
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
            <Text style={styles.info}>Avg RGB: {avgRgb ? `${avgRgb[0]}, ${avgRgb[1]}, ${avgRgb[2]}` : '—'}</Text>
            <Text style={styles.info}>Lab: {lab ? `${lab.L.toFixed(2)}, ${lab.a.toFixed(2)}, ${lab.b.toFixed(2)}` : '—'}</Text>
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.button} onPress={reset}><Text style={styles.btnText}>Retake</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => { /* placeholder: export/send croppedUri for analysis */ }}><Text style={styles.btnText}>Use</Text></TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <View style={styles.logsContainer}>
          <View style={styles.logsHeader}>
            <Text style={styles.info}>Scans: {logs.length}</Text>
            <View style={{flexDirection:'row', gap:8}}>
              <TouchableOpacity style={styles.button} onPress={() => { Alert.alert('Clear logs','Remove all saved scans?', [{text:'Cancel'},{text:'Clear', style:'destructive', onPress: clearScans}])}}><Text style={styles.btnText}>Clear</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={exportLogsCSV}><Text style={styles.btnText}>Export CSV</Text></TouchableOpacity>
            </View>
          </View>
          <FlatList data={logs} keyExtractor={(item: any) => String(item.id)} renderItem={({item}: {item: any}) => (
            <View style={styles.logRow}>
              {item.croppedUri && <Image source={{uri:item.croppedUri}} style={styles.logThumb} />}
              <View style={{flex:1, marginLeft:8}}>
                <Text style={{color:'#fff'}}>{new Date(item.timestamp).toLocaleString()}</Text>
                <Text style={{color:'#ddd'}}>RGB: {item.avgRgb ? `${item.avgRgb[0]}, ${item.avgRgb[1]}, ${item.avgRgb[2]}` : '—'}</Text>
                <Text style={{color:'#ddd'}}>Lab: {item.lab ? `${item.lab.L.toFixed(1)}, ${item.lab.a.toFixed(1)}, ${item.lab.b.toFixed(1)}` : '—'}</Text>
              </View>
            </View>
          )} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  tabBar: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 24, paddingBottom: 8, backgroundColor: '#001' },
  tabButton: { padding: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1e90ff' },
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
  controlsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  logsContainer: { flex: 1, width: '100%', padding: 12 },
  logsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#111' },
  logThumb: { width: 64, height: 64, borderRadius: 6 }
});
