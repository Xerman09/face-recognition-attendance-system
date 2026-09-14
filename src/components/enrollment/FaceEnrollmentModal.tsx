"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  ScanFace,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import * as faceapi from "face-api.js";
import { Employee } from "@/types";
import { saveFaceBiometric } from "@/lib/directus";
import { soundFx } from "@/lib/audio";
import { toast } from "sonner";

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onEnrolled: () => void;
  modelsLoaded: boolean;
}

export function FaceEnrollmentModal({
  isOpen,
  onClose,
  employees,
  onEnrolled,
  modelsLoaded,
}: FaceEnrollmentModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | "new">(
    employees[0]?.id || "new"
  );
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDepartment, setNewDepartment] = useState("Operations");

  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stop camera when closing
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera for enrollment.");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedSnapshot(null);
      setCapturedDescriptor(null);
    }
  }, [isOpen, startCamera, stopCamera]);

  // Capture face and extract 128-D vector
  const handleCapture = async () => {
    if (!videoRef.current || !modelsLoaded) {
      toast.error("AI models not ready yet.");
      return;
    }

    try {
      setIsCapturing(true);
      soundFx.playDetect();

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("No face clearly detected. Please face the camera and try again.");
        setIsCapturing(false);
        return;
      }

      // Snapshot to canvas
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedSnapshot(dataUrl);
      }

      const descriptorArray = Array.from(detection.descriptor);
      setCapturedDescriptor(descriptorArray);
      soundFx.playSuccess();
      toast.success("Facial vector successfully extracted!");
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to extract face biometrics.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedSnapshot(null);
    setCapturedDescriptor(null);
  };

  const handleSaveBiometric = async () => {
    if (!capturedDescriptor) {
      toast.error("No biometric vector available.");
      return;
    }

    try {
      setIsSaving(true);
      let userId: number;

      if (selectedUserId === "new") {
        if (!newFirstName.trim()) {
          toast.error("Please enter a first name.");
          setIsSaving(false);
          return;
        }
        userId = Date.now();
        // create and store new employee locally
        const newEmp: Employee = {
          id: userId,
          firstName: newFirstName.trim(),
          lastName: newLastName.trim() || "Personnel",
          email: `${newFirstName.toLowerCase()}@company.com`,
          department: newDepartment,
          position: "Staff",
          avatarUrl: capturedSnapshot || undefined,
          isEnrolled: true,
        };

        const existingStr = localStorage.getItem("face_kiosk_employees_v1");
        const list: Employee[] = existingStr ? JSON.parse(existingStr) : [];
        list.push(newEmp);
        localStorage.setItem("face_kiosk_employees_v1", JSON.stringify(list));
      } else {
        userId = selectedUserId;
      }

      await saveFaceBiometric(userId, capturedDescriptor, capturedSnapshot || undefined);
      toast.success("Biometrics enrolled successfully! The terminal will now recognize this face.");
      soundFx.playSuccess();
      onEnrolled();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save biometric enrollment.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ScanFace className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Enroll Biometrics</h2>
              <p className="text-xs text-slate-400">
                Register a 128-D biometric face vector for attendance identification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Select Personnel
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedUserId(val === "new" ? "new" : Number(val));
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="new">+ Register New Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.department || "Staff"}){" "}
                    {emp.isEnrolled ? "✓ Enrolled" : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedUserId === "new" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Camera / Snapshot Preview Container */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {capturedSnapshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedSnapshot}
                alt="Captured Snapshot"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Visual Alignment Guide Oval */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-56 rounded-[48%] border-2 border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse" />
                </div>
              </>
            )}

            {isCapturing && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                <Loader2 className="h-10 w-10 text-emerald-400 animate-spin mb-2" />
                <span className="text-xs font-semibold text-emerald-300">
                  Computing 128-D Descriptor Vector...
                </span>
              </div>
            )}
          </div>

          {/* Capture Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!capturedSnapshot ? (
              <button
                onClick={handleCapture}
                disabled={isCapturing || !modelsLoaded}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 transition active:scale-[0.99]"
              >
                <Camera className="h-4 w-4" />
                Capture Face & Extract Descriptor
              </button>
            ) : (
              <div className="w-full flex gap-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retake Photo
                </button>
                <button
                  onClick={handleSaveBiometric}
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirm & Save Biometric
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
