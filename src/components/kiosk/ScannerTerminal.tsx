"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  ScanFace,
  RefreshCw,
  Loader2,
  Video,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Gauge,
  Sliders,
} from "lucide-react";
import * as faceapi from "face-api.js";
import confetti from "canvas-confetti";
import { Employee, FaceBiometricRecord, ScanMode, ScanStatus } from "@/types";
import { BiometricOverlay } from "./BiometricOverlay";
import { EmployeeCard } from "./EmployeeCard";
import { LivenessTracker, LivenessMode } from "@/lib/liveness";
import { findBestMatch, MatchResult } from "@/lib/faceMatcher";
import {
  getFaceBiometrics,
  getEmployees,
  logScanAttempt,
  recordAttendance,
} from "@/lib/directus";
import { soundFx } from "@/lib/audio";
import { checkModelsStatus, loadModels } from "@/lib/models";
import { toast } from "sonner";

interface ScannerTerminalProps {
  modelsLoaded: boolean;
  activeMode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  onScanCompleted: () => void;
  onStreamStateChange: (isStreaming: boolean) => void;
}

export function ScannerTerminal({
  modelsLoaded,
  activeMode,
  onModeChange,
  onScanCompleted,
  onStreamStateChange,
}: ScannerTerminalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // Speed Mode state: Turbo (sub-second), Balanced, or Strict
  const [speedMode, setSpeedMode] = useState<LivenessMode>("TURBO");
  const [modelType, setModelType] = useState<"tiny" | "ssd">("tiny");

  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [livenessVariance, setLivenessVariance] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number>(0);

  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // References for processing loops
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const livenessTrackerRef = useRef<LivenessTracker>(new LivenessTracker("TURBO"));

  // Biometric state references
  const biometricsRef = useRef<FaceBiometricRecord[]>([]);
  const employeesMapRef = useRef<Map<number, Employee>>(new Map());
  const lastPunchMap = useRef<Map<number, number>>(new Map());

  // Update speed mode on tracker
  useEffect(() => {
    livenessTrackerRef.current.setMode(speedMode);
  }, [speedMode]);

  // Load registered biometrics and employees
  const reloadData = useCallback(async () => {
    try {
      const [bios, emps] = await Promise.all([getFaceBiometrics(), getEmployees()]);
      biometricsRef.current = bios;
      const map = new Map<number, Employee>();
      emps.forEach((e) => map.set(e.id, e));
      employeesMapRef.current = map;
    } catch (e) {
      console.warn("Failed to load biometrics data:", e);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Enumerate video devices
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devs) => {
          const videoDevs = devs.filter((d) => d.kind === "videoinput");
          setDevices(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        })
        .catch(() => {});
    }
  }, [selectedDeviceId]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      onStreamStateChange(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    isProcessingRef.current = false;
    livenessTrackerRef.current.reset();
  }, [stream, onStreamStateChange]);

  // Start camera helper with pre-loaded models guarantee
  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      setScanStatus("idle");
      setMatchResult(null);
      setStatusMessage("");
      livenessTrackerRef.current.reset();

      // Ensure neural models are loaded before streaming starts
      await loadModels("/models");

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            }
          : {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      onStreamStateChange(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera. Please verify device permissions.");
      onStreamStateChange(false);
    }
  }, [selectedDeviceId, stopCamera, onStreamStateChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Manual reset
  const handleResetTerminal = useCallback(() => {
    setScanStatus("idle");
    setMatchResult(null);
    setStatusMessage("");
    setLivenessVariance(0);
    livenessTrackerRef.current.reset();
    isProcessingRef.current = false;
  }, []);

  // Main scan and biometric recognition loop (Optimized for Sub-Second Detection)
  const handleVideoPlay = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(async () => {
      // Guard conditions
      if (isProcessingRef.current) return;
      if (scanStatus === "success" || scanStatus === "error") return;
      if (!videoRef.current) return;

      try {
        isProcessingRef.current = true;
        const startTime = performance.now();

        // 1. Verify model readiness from actual network weights
        const status = checkModelsStatus();
        if (!status.isReady) {
          isProcessingRef.current = false;
          return;
        }

        // 2. Select detector with fallback: only use Tiny if tinyFaceDetector weights are loaded
        let detectorOptions: faceapi.TinyFaceDetectorOptions | faceapi.SsdMobilenetv1Options;
        let useTiny = false;

        if (modelType === "tiny" && status.tinyFaceDetector) {
          detectorOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.2,
          });
          useTiny = true;
        } else if (status.ssdMobilenetv1) {
          detectorOptions = new faceapi.SsdMobilenetv1Options({
            minConfidence: 0.2, // fast threshold, lowered for other directions
          });
          useTiny = false;
        } else if (status.tinyFaceDetector) {
          detectorOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.2,
          });
          useTiny = true;
        } else {
          isProcessingRef.current = false;
          return;
        }

        const useTinyLandmarks = useTiny && status.faceLandmark68TinyNet;

        // 3. UNIFIED SINGLE-PASS INFERENCE
        let fullDetection;
        try {
          fullDetection = await faceapi
            .detectSingleFace(videoRef.current, detectorOptions)
            .withFaceLandmarks(useTinyLandmarks)
            .withFaceDescriptor();
        } catch (inferErr) {
          console.warn("Inference skipped on frame:", inferErr);
          isProcessingRef.current = false;
          return;
        }

        const latency = Math.round(performance.now() - startTime);
        setInferenceTimeMs(latency);

        if (!fullDetection) {
          if (scanStatus !== "idle") {
            setScanStatus("idle");
            setStatusMessage("");
          }
          isProcessingRef.current = false;
          return;
        }

        // Face detected!
        const leftEye = fullDetection.landmarks.getLeftEye()[0];
        const rightEye = fullDetection.landmarks.getRightEye()[0];
        const nose = fullDetection.landmarks.getNose()[0];

        // 4. Passive Anti-Spoofing Liveness Evaluation
        const sample = livenessTrackerRef.current.addSample(leftEye, rightEye, nose);
        setLivenessVariance(sample.variance);

        // If a printed image is detected (no variance over 15+ frames)
        if (sample.isSpoof) {
          setScanStatus("error");
          setStatusMessage("Spoof Detected: Printed Image");
          soundFx.playError();
          logScanAttempt(null, "FAILED", 0, activeMode).catch(() => {});
          onScanCompleted();
          setTimeout(() => handleResetTerminal(), 3500);
          return;
        }

        // If not verified yet, and we are not in TURBO mode (or we are in TURBO but waiting for 2 frames)
        if (!sample.isVerified && speedMode !== "TURBO") {
          setScanStatus("waiting_liveness");
          setStatusMessage("Analyzing Liveness...");
          isProcessingRef.current = false;
          return;
        } else if (!sample.isVerified && speedMode === "TURBO" && sample.frameCount < 2) {
          // Even in TURBO mode, wait for at least 2 frames to ensure it's not an immediate still image
          isProcessingRef.current = false;
          return;
        }

        // 5. INSTANT BIOMETRIC MATCHING
        setScanStatus("scanning");
        setStatusMessage("Matching Biometrics...");
        soundFx.playDetect();

        const liveDescriptor = Array.from(fullDetection.descriptor);

        // Euclidean match against in-memory enrolled templates (< 0.1ms)
        const result = findBestMatch(
          liveDescriptor,
          biometricsRef.current,
          employeesMapRef.current,
          0.55
        );

        setMatchResult(result);

        if (result.matched && result.userId) {
          // Check 30s cooldown
          const now = Date.now();
          const lastPunch = lastPunchMap.current.get(result.userId) || 0;
          if (now - lastPunch < 30000) {
            setScanStatus("error");
            setStatusMessage("Cooldown active. Wait 30s.");
            soundFx.playError();
            
            setTimeout(() => {
              handleResetTerminal();
            }, 2000);
            return;
          }
          lastPunchMap.current.set(result.userId, now);

          // Record punch in background and automatically determine mode
          if (result.employee) {
            recordAttendance(result.employee)
              .then(({ mode, isLate }) => {
                if (mode === "ALREADY_COMPLETED") {
                  setScanStatus("error");
                  setStatusMessage("Attendance Completed");
                  soundFx.playError();
                  setTimeout(() => handleResetTerminal(), 3500);
                  logScanAttempt(result.userId!, "FAILED", result.distance, "CLOCK_IN").catch(() => {});
                  onScanCompleted();
                } else {
                  setScanStatus("success");
                  setStatusMessage(isLate ? "Time In (Late)" : "Access Granted");
                  soundFx.playSuccess();
                  
                  if (isLate) {
                    toast.warning("You are LATE! Your time has been recorded.", {
                      position: "top-center",
                      duration: 5000,
                    });
                  }

                  try {
                    confetti({
                      particleCount: 80,
                      spread: 65,
                      origin: { y: 0.7 },
                      colors: isLate 
                        ? ["#ef4444", "#f97316", "#f59e0b"] // Red, Orange, Amber for late
                        : ["#10b981", "#34d399", "#06b6d4"], // Green, Teal for on time
                    });
                  } catch {}

                  logScanAttempt(
                    result.userId!,
                    "SUCCESS",
                    result.distance,
                    mode
                  ).catch((e: any) => console.warn(`Scan attempt network warning: ${e.message}`));
                  
                  onScanCompleted();
                  setTimeout(() => handleResetTerminal(), 3500);
                }
              })
              .catch((e: any) => {
                console.warn(`Record attendance network warning: ${e.message}`);
                setScanStatus("error");
                setStatusMessage("Network Error");
                soundFx.playError();
                setTimeout(() => handleResetTerminal(), 3500);
                onScanCompleted();
              });
          }
        } else {
          // UNRECOGNIZED FACE
          setScanStatus("error");
          setStatusMessage("User Not Found");
          soundFx.playError();

          logScanAttempt(
            null,
            "FAILED",
            result.distance,
            activeMode
          ).catch((e: any) => console.warn(`Scan attempt network warning: ${e.message}`));

          onScanCompleted();

          // Fast reset after 2.5 seconds
          setTimeout(() => {
            handleResetTerminal();
          }, 2500);
        }
      } catch (err) {
        console.error("Fast scan cycle error:", err);
        isProcessingRef.current = false;
      }
    }, 45); // 45ms cycle (~22 FPS)
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* Left: Camera Feed & Biometric HUD */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col relative">
        {/* Terminal Video Viewport */}
        <div className="relative aspect-[4/3] sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
          {/* Inactive State Prompt */}
          {!stream && (
            <div className="flex flex-col items-center justify-center p-8 text-center z-10">
              <div className="h-20 w-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-emerald-400 shadow-xl shadow-emerald-500/10">
                <ScanFace className="h-10 w-10 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Biometric Terminal Idle
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                Activate camera stream to begin instant facial recognition with single-pass AI inference.
              </p>
              <button
                onClick={startCamera}
                disabled={!modelsLoaded}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 transition active:scale-[0.98]"
              >
                {!modelsLoaded ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading Neural Models...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Activate High-Speed Camera
                  </>
                )}
              </button>
            </div>
          )}

          {/* Live Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlay={handleVideoPlay}
            className={`absolute inset-0 w-full h-full object-cover ${
              !stream ? "hidden" : ""
            }`}
          />

          {/* Interactive HUD Overlay */}
          {stream && (
            <BiometricOverlay
              status={scanStatus}
              livenessVariance={livenessVariance}
              message={statusMessage}
            />
          )}

          {/* Active Mode Pill (Top Left of Camera) */}
          {stream && (
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-200">
                Mode:{" "}
                <span className="text-emerald-400 font-bold">
                  Automatic (Smart Punch)
                </span>
              </span>
            </div>
          )}

          {/* Live Latency & Speed Badge (Top Right of Camera) */}
          {stream && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <Gauge className="h-3 w-3 text-emerald-400" />
                <span>{inferenceTimeMs ? `${inferenceTimeMs}ms` : "Live"}</span>
              </div>

              {devices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    setTimeout(() => startCamera(), 100);
                  }}
                  className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-300 text-[11px] rounded-xl px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                >
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Camera Footer Controls & Speed Optimization Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Speed Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Speed Profile:
            </span>
            <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setSpeedMode("TURBO")}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  speedMode === "TURBO"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Instant Sub-Second Attendance Verification"
              >
                ⚡ Turbo (Sub-Second)
              </button>
              <button
                onClick={() => setSpeedMode("BALANCED")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  speedMode === "BALANCED"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Balanced Speed and 3-Frame Micro-Movement Verification"
              >
                Balanced
              </button>
              <button
                onClick={() => setSpeedMode("STRICT")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  speedMode === "STRICT"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Strict 4-Frame Liveness Verification"
              >
                Strict
              </button>
            </div>
          </div>

          {/* Model toggle and Deactivate */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModelType(modelType === "tiny" ? "ssd" : "tiny")}
              className="text-xs text-slate-400 hover:text-slate-200 font-mono transition"
              title="Toggle between TinyFaceDetector (Ultra-Fast) and SSD MobileNet"
            >
              Engine: <span className="text-emerald-400 font-bold">{modelType.toUpperCase()}</span>
            </button>

            {stream && (
              <button
                onClick={stopCamera}
                className="text-xs text-rose-400 hover:text-rose-300 transition font-medium"
              >
                Deactivate Camera
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Biometric Verification Card */}
      <div className="w-full lg:w-96 flex flex-col gap-5">
        {/* Verification Result Card or Ready Prompt */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex-1 flex flex-col justify-center">
          {scanStatus === "success" || scanStatus === "error" ? (
            <EmployeeCard
              success={scanStatus === "success"}
              employee={matchResult?.employee}
              confidenceScore={matchResult?.confidenceScore}
              message={
                scanStatus === "success"
                  ? "Face matched enrolled biometric template instantly."
                  : statusMessage === "Attendance Completed"
                  ? "You have already completed your time in and time out today."
                  : statusMessage === "Cooldown active. Wait 30s."
                  ? "Your attendance was just recorded. Please wait a moment."
                  : "User Not Found. Please ensure your face is enrolled in the system."
              }
              scanMode={activeMode}
              onReset={handleResetTerminal}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
                <ScanFace className="h-8 w-8 stroke-[1.2]" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">
                Ready for Instant Punch
              </h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Step in front of the camera. Attendance is detected and confirmed in sub-second speed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
