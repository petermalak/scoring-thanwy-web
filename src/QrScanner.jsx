import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import Webcam from "react-webcam";
import {
  Button, Box, Typography, Select, MenuItem, Paper,
  FormControl, InputLabel, CircularProgress, Snackbar, Alert
} from "@mui/material";
import { PlayCircleOutline, StopCircleOutlined } from "@mui/icons-material";

const QrScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const webcamRef = useRef(null);
  const codeReader = useRef(null);
  const scanTimeout = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    codeReader.current = new BrowserMultiFormatReader();
    return () => {
      stopScanner();
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    };
  }, []);

  const startScanner = useCallback(async () => {
    setScanResult(null);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      stream.getTracks().forEach(track => track.stop());

      setIsScanning(true);

      scanTimeout.current = setTimeout(() => {
        if (!scanResult) {
          setError("Scanning timed out");
          stopScanner();
        }
      }, 10000);

      if (!webcamRef.current?.video) {
        setError("Camera not ready");
        return;
      }

      codeReader.current.decodeFromVideoDevice(
        undefined,
        webcamRef.current.video,
        (result, err) => {
          if (result) {
            clearTimeout(scanTimeout.current);
            setScanResult(result.getText());
            stopScanner();
          }
          if (err && !(err instanceof Error)) {
            console.error("Scan error:", err);
          }
        }
      );
    } catch (error) {
      setError("Camera access denied");
      setIsScanning(false);
    }
  }, [scanResult]);

  const stopScanner = useCallback(() => {
    clearTimeout(scanTimeout.current);
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  }, []);

  const submitToGoogleSheet = useCallback(async () => {
    if (!scanResult || !selectedValue) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: scanResult,
          selectedValue,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setScanResult(null);
        setSelectedValue("");
      }, 2000);
    } catch (err) {
      setError(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }, [scanResult, selectedValue]);

  const handleValueChange = (event) => {
    setSelectedValue(event.target.value);
  };

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
            aspectRatio: "1"
          }}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }}
        />

        {!isScanning && (
          <Box sx={{
            backgroundColor: "#f5f5f5",
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: "1"
          }}>
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
            <Typography sx={{
              wordBreak: "break-all",
              mb: 2,
              fontFamily: "monospace",
              backgroundColor: "#f5f5f5",
              p: 1,
              borderRadius: 1
            }}>
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
                  <MenuItem key={num} value={num}>{num}</MenuItem>
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
              'Submit to Google Sheet'
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
