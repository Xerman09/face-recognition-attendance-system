"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  ScanFace,
  CheckCircle2,
  Loader2,
  RotateCcw,
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
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ScanFace className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Enroll Face Biometrics</h2>
              <p className="text-[11px] text-slate-400">
                Register a 128-D biometric vector for automated attendance matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Employee Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Select Personnel
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedUserId(val === "new" ? "new" : Number(val));
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Camera / Snapshot Preview Container */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
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
                {/* Visual Alignment Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[70%] h-[75%] max-w-xs rounded-xl border border-emerald-400/50" />
                </div>
              </>
            )}

            {isCapturing && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-30">
                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mb-2" />
                <span className="text-xs font-medium text-emerald-300">
                  Extracting biometric vector...
                </span>
              </div>
            )}
          </div>

          {/* Capture Controls */}
          <div className="flex items-center justify-between gap-2.5 pt-1">
            {!capturedSnapshot ? (
              <button
                onClick={handleCapture}
                disabled={isCapturing || !modelsLoaded}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                <Camera className="h-4 w-4" />
                Capture Face & Extract Vector
              </button>
            ) : (
              <div className="w-full flex gap-2.5">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retake Photo
                </button>
                <button
                  onClick={handleSaveBiometric}
                  disabled={isSaving}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Save Biometrics
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
