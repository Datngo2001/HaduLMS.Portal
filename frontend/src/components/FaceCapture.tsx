import React, { useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RotateCcw } from "lucide-react";

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onCapture,
  onError,
  isLoading = false,
  disabled = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setCapturedImage(null);
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      let errorMessage = "Failed to access camera. ";

      if (error.name === "NotAllowedError") {
        errorMessage += "Please allow camera permissions and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += "Please check your camera and try again.";
      }

      onError(errorMessage);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 with good quality
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const isDisabled = disabled || isLoading;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-80 h-60 bg-gray-100 rounded-lg object-cover ${
            isStreaming && !capturedImage ? "block" : "hidden"
          }`}
        />

        {/* Captured Image Preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured face"
            className="w-80 h-60 bg-gray-100 rounded-lg object-cover"
          />
        )}

        {/* Placeholder when no camera */}
        {!isStreaming && !capturedImage && (
          <div className="w-80 h-60 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Camera not active</p>
            </div>
          </div>
        )}

        {/* Canvas for capturing (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay instructions when streaming */}
        {isStreaming && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
              Position your face in the center
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Face Capture Instructions
        </h3>
        <ul className="text-sm text-gray-600 space-y-1 text-left">
          <li>• Look directly at the camera</li>
          <li>• Ensure good lighting on your face</li>
          <li>• Remove glasses if possible</li>
          <li>• Keep a neutral expression</li>
          <li>• Make sure your face fills the frame</li>
        </ul>
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        {!isStreaming && !capturedImage && (
          <button
            onClick={startCamera}
            disabled={isDisabled}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>{isLoading ? "Processing..." : "Start Camera"}</span>
          </button>
        )}

        {isStreaming && !capturedImage && (
          <>
            <button
              onClick={captureImage}
              disabled={isDisabled}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Processing..." : "Capture Face"}
            </button>
            <button
              onClick={stopCamera}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {capturedImage && (
          <>
            <button
              onClick={confirmCapture}
              disabled={isDisabled}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Processing..." : "Use This Photo"}
            </button>
            <button
              onClick={retakePhoto}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake</span>
            </button>
          </>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Processing your face image...</span>
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
