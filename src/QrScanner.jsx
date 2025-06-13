import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import Webcam from "react-webcam";
import {
  Button, Box, Typography, Select, MenuItem, Paper,
  FormControl, InputLabel, CircularProgress, Snackbar, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Divider, Card, CardContent
} from "@mui/material";
import {
  PlayCircleOutline, StopCircleOutlined, Delete as DeleteIcon,
  Sync as SyncIcon, Construction as ConstructionIcon
} from "@mui/icons-material";

const QrScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const webcamRef = useRef(null);
  const codeReader = useRef(null);
  const scanTimeout = useRef(null);

  // Custom theme colors
  const theme = {
    primary: '#f9d950',
    background: '#f9f5e1',
    text: '#000000',
  };

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
    setApiResponse(null);

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

  const addToPendingUpdates = useCallback(() => {
    if (!scanResult || !selectedValue) return;

    setPendingUpdates(prev => [...prev, {
      qrCode: scanResult,
      selectedValue: parseInt(selectedValue, 10),
      timestamp: new Date().toISOString()
    }]);

    setScanResult(null);
    setSelectedValue("");
  }, [scanResult, selectedValue]);

  const removePendingUpdate = useCallback((index) => {
    setPendingUpdates(prev => prev.filter((_, i) => i !== index));
  }, []);

  const syncUpdates = useCallback(async () => {
    if (pendingUpdates.length === 0) return;

    setSyncing(true);
    setError(null);

    try {
      const results = await Promise.all(
        pendingUpdates.map(async (update) => {
          try {
            const response = await fetch('/api/submit', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify(update)
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to submit score');
            }

            return await response.json();
          } catch (error) {
            console.error('API Error:', error);
            throw error;
          }
        })
      );

      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        setSuccess(true);
        setPendingUpdates([]);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        throw new Error('Some updates failed');
      }
    } catch (err) {
      console.error('Sync Error:', err);
      setError(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [pendingUpdates]);

  const handleValueChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  const buildInfoRow = (label, value, isBold = false) => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      py: 1,
      '& > *': {
        fontWeight: isBold ? 'bold' : 'normal',
        fontSize: '1rem'
      }
    }}>
      <Typography>{label}</Typography>
      <Typography>{value}</Typography>
    </Box>
  );

  return (
    <Box sx={{ 
      maxWidth: 600, 
      margin: "auto", 
      p: 3,
      backgroundColor: theme.background,
      minHeight: '100vh'
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        align="center"
        sx={{ 
          color: theme.text,
          fontWeight: 'bold',
          mb: 3
        }}
      >
        مسح كود QR
      </Typography>

      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 3, 
          position: "relative",
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', aspectRatio: '1' }}>
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
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Typography color="text.secondary">
                الكاميرا مغلقة
              </Typography>
            </Box>
          )}

          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 220,
            height: 220,
            border: '3px solid white',
            borderRadius: 2,
          }} />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlayCircleOutline />}
            onClick={startScanner}
            disabled={isScanning || !!scanResult}
            sx={{
              bgcolor: theme.primary,
              color: theme.text,
              '&:hover': {
                bgcolor: theme.primary,
                opacity: 0.9
              }
            }}
          >
            تشغيل
          </Button>
          <Button
            variant="contained"
            startIcon={<StopCircleOutlined />}
            onClick={stopScanner}
            disabled={!isScanning}
            sx={{
              bgcolor: theme.primary,
              color: theme.text,
              '&:hover': {
                bgcolor: theme.primary,
                opacity: 0.9
              }
            }}
          >
            إيقاف
          </Button>
        </Box>
      </Paper>

      {scanResult && (
        <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            تم مسح: {scanResult}
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>اختيار النقاط</InputLabel>
            <Select
              value={selectedValue}
              onChange={handleValueChange}
              label="اختيار النقاط"
              sx={{
                bgcolor: 'white',
                borderRadius: 2
              }}
            >
              <MenuItem value="50">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ConstructionIcon sx={{ color: 'yellow' }} />
                  <Typography>حضور اول ١٠ دقايق = ٥٠ طوبة</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="25">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ConstructionIcon sx={{ color: 'yellow' }} />
                  <Typography>حضور تاني ١٠ دقايق = ٢٥ طوبة</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="10">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ConstructionIcon sx={{ color: 'yellow' }} />
                  <Typography>مشاركة في الموضوع = ١٠ طوبات</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={addToPendingUpdates}
            disabled={!selectedValue}
            fullWidth
            size="large"
            sx={{
              mt: 2,
              bgcolor: theme.primary,
              color: theme.text,
              height: 50,
              borderRadius: 2,
              '&:hover': {
                bgcolor: theme.primary,
                opacity: 0.9
              }
            }}
          >
            إضافة إلى القائمة
          </Button>
        </Paper>
      )}

      {pendingUpdates.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              التحديثات المعلقة ({pendingUpdates.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={syncUpdates}
              disabled={syncing}
              sx={{
                bgcolor: theme.primary,
                color: theme.text,
                '&:hover': {
                  bgcolor: theme.primary,
                  opacity: 0.9
                }
              }}
            >
              {syncing ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  جاري المزامنة...
                </>
              ) : (
                'مزامنة الكل'
              )}
            </Button>
          </Box>
          <List>
            {pendingUpdates.map((update, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={update.qrCode}
                    secondary={`النقاط: ${update.selectedValue} طوبة`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removePendingUpdate(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < pendingUpdates.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {apiResponse && (
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography 
              variant="h6" 
              align="center" 
              sx={{ 
                color: 'success.main',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              تم تسجيل النقاط بنجاح
            </Typography>
            {buildInfoRow("الاسم:", apiResponse.userData.name)}
            {buildInfoRow("الفصل:", apiResponse.userData.class)}
            {buildInfoRow("الفريق:", apiResponse.userData.team)}
            <Divider sx={{ my: 2 }} />
            {buildInfoRow("النقاط السابقة:", `${apiResponse.userData.previousScore} طوبة`, true)}
            {buildInfoRow("النقاط الجديدة:", `${apiResponse.userData.newScore} طوبة`, true)}
            <Typography 
              align="center" 
              sx={{ 
                mt: 2,
                color: 'primary.main',
                fontWeight: 'bold'
              }}
            >
              تم إضافة {selectedValue} طوبة
            </Typography>
          </CardContent>
        </Card>
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
          {success ? "تم حفظ جميع التحديثات بنجاح!" : error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QrScanner;
