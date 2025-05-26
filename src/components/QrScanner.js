import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import Webcam from "react-webcam";
import {
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  Paper,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { PlayCircleOutline, StopCircleOutlined } from "@mui/icons-material";
import axios from "axios";

const QrScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const webcamRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  const handleValueChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const startScanner = async () => {
    setScanResult(null);
    setError(null);

    try {
      // Check camera permissions first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());

      setIsScanning(true);
      codeReader.current.decodeFromVideoDevice(
        undefined,
        webcamRef.current.video,
        (result, err) => {
          if (result) {
            setScanResult(result.getText());
            stopScanner();
          }
          if (err && !(err instanceof Error)) {
            console.error("Scanning error:", err);
          }
        }
      );
    } catch (error) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error("Camera error:", error);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    try {
      codeReader.current.reset();
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
    setIsScanning(false);
  };

  const submitToGoogleSheet = async () => {
    if (!scanResult || !selectedValue) return;

    setLoading(true);
    setError(null);

    try {
      // Using JSONP approach to bypass CORS
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbw1TvhizAjJoQhrk8ZvSfwww8loSoE46X9Qkz2r5r0ogs0ZfTbxBINBnT0w5xwBeTuiyA/exec";
      const callbackName = `jsonp_${Date.now()}`;

      var data = JSON.stringify({
        qrCode: "test123adsadasd",
        selectedValue: "10",
        timestamp: "2023-05-15T34:00:00Z",
      });

      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
          console.log(this.responseText);
        }
      });

      xhr.open(
        "POST",
        "https://script.google.com/macros/s/AKfycbwynDyJndKBVGnOM_1kMrH5S3vS4H0KzsuLkU4ppeplNm4UNl4yXLwLD_a8-X75lD0_6A/exec"
      );
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.send(data);

      //   await new Promise((resolve, reject) => {
      //     window[callbackName] = (response) => {
      //       delete window[callbackName];
      //       document.body.removeChild(script);

      //       if (response.success) {
      //         setSuccess(true);
      //         setTimeout(() => {
      //           setSuccess(false);
      //           setScanResult(null);
      //           setSelectedValue('');
      //         }, 2000);
      //         resolve();
      //       } else {
      //         reject(new Error(response.message || 'Failed to save data'));
      //       }
      //     };

      //     const script = document.createElement('script');
      //     script.src = `${scriptUrl}?callback=${callbackName}&qrCode=${encodeURIComponent(scanResult)}&selectedValue=${encodeURIComponent(selectedValue)}&timestamp=${encodeURIComponent(new Date().toISOString())}`;
      //     script.onerror = () => {
      //       delete window[callbackName];
      //       reject(new Error('Failed to connect to server'));
      //     };
      //     document.body.appendChild(script);
      //   });
    } catch (err) {
      setError(err.message || "Failed to submit data");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        QR Code Scanner
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3, position: "relative" }}>
        <Webcam
          ref={webcamRef}
          style={{
            width: "100%",
            display: isScanning ? "block" : "none",
            aspectRatio: "1",
          }}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
        />

        {!isScanning && (
          <Box
            sx={{
              backgroundColor: "#f5f5f5",
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              aspectRatio: "1",
            }}
          >
            <Typography color="text.secondary">
              {error ? "Camera Error" : "Camera is off"}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayCircleOutline />}
            onClick={startScanner}
            disabled={isScanning || !!scanResult}
          >
            Start Scanner
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<StopCircleOutlined />}
            onClick={stopScanner}
            disabled={!isScanning}
          >
            Stop Scanner
          </Button>
        </Box>
      </Paper>

      {scanResult && (
        <>
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6">Scanned QR Code:</Typography>
            <Typography
              sx={{
                wordBreak: "break-all",
                mb: 2,
                fontFamily: "monospace",
                backgroundColor: "#f5f5f5",
                p: 1,
                borderRadius: 1,
              }}
            >
              {scanResult}
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Rating (1-5)</InputLabel>
              <Select
                value={selectedValue}
                onChange={handleValueChange}
                label="Select Rating (1-5)"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          <Button
            variant="contained"
            color="primary"
            onClick={submitToGoogleSheet}
            disabled={!selectedValue || loading}
            fullWidth
            size="large"
            sx={{ mb: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              "Submit to Google Sheet"
            )}
          </Button>
        </>
      )}

      <Snackbar
        open={!!error || success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={success ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {success ? "Data successfully saved!" : error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QrScanner;
