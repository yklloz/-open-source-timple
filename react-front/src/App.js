import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Mic, MicOff, Settings, Trash2, Video, VideoOff } from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_SIGN_API_URL || 'http://localhost:8000';
const CAPTURE_INTERVAL_MS = 220;
const CAPTURE_WIDTH = 320;
const MIN_CONFIDENCE = 0.35;
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
];

const getCurrentTime = () =>
  new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const App = () => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isTranslating, setIsTranslating] = useState(true);
  const [translations, setTranslations] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [recognitionStatus, setRecognitionStatus] = useState('idle');
  const [bufferProgress, setBufferProgress] = useState(0);
  const [latestConfidence, setLatestConfidence] = useState(0);
  const [skeletonData, setSkeletonData] = useState(null);

  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const lastCaptionRef = useRef({ label: '', addedAt: 0 });

  const isRecognizing = isCameraOn && isTranslating && apiStatus === 'online';

  const statusView = useMemo(() => {
    if (!isCameraOn) {
      return { label: '카메라 대기', tone: 'muted', ping: false };
    }
    if (apiStatus === 'checking') {
      return { label: '서버 연결 확인 중', tone: 'warning', ping: true };
    }
    if (apiStatus !== 'online') {
      return { label: 'AI 서버 연결 안 됨', tone: 'error', ping: false };
    }
    if (!isTranslating) {
      return { label: '인식 일시정지', tone: 'muted', ping: false };
    }
    if (recognitionStatus === 'collecting') {
      return { label: `프레임 수집 중 ${bufferProgress}%`, tone: 'warning', ping: true };
    }
    return { label: '실시간 인식 중', tone: 'success', ping: true };
  }, [apiStatus, bufferProgress, isCameraOn, isTranslating, recognitionStatus]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, translations]);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        if (isMounted) {
          setApiStatus('online');
        }
      } catch (error) {
        console.error('AI 서버 연결 실패:', error);
        if (isMounted) {
          setApiStatus('offline');
        }
      }
    };

    checkHealth();
    const intervalId = window.setInterval(checkHealth, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('카메라 접근에 실패했습니다:', error);
        setIsCameraOn(false);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
      setRecognitionStatus('idle');
      setBufferProgress(0);
    }

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isCameraOn]);

  useEffect(() => {
    if (!isRecognizing) {
      requestInFlightRef.current = false;
      return undefined;
    }

    const captureFrame = async () => {
      if (requestInFlightRef.current || !videoRef.current || !captureCanvasRef.current) {
        return;
      }

      const video = videoRef.current;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
        return;
      }

      const canvas = captureCanvasRef.current;
      const aspectRatio = video.videoHeight / video.videoWidth;
      canvas.width = CAPTURE_WIDTH;
      canvas.height = Math.round(CAPTURE_WIDTH * aspectRatio);

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      requestInFlightRef.current = true;
      try {
        const image = canvas.toDataURL('image/jpeg', 0.72);
        const response = await fetch(`${API_BASE_URL}/api/predict-frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        });

        if (!response.ok) {
          throw new Error(`Predict request failed: ${response.status}`);
        }

        const result = await response.json();
        setApiStatus('online');
        setLatestConfidence(result.confidence || 0);
        setSkeletonData(result.landmarks || null);

        const progress = result.frameWindow
          ? Math.min(100, Math.round((result.bufferedFrames / result.frameWindow) * 100))
          : 0;
        setBufferProgress(progress);
        setRecognitionStatus(result.ready ? 'recognizing' : 'collecting');

        if (result.ready && result.text && result.confidence >= MIN_CONFIDENCE) {
          const now = Date.now();
          const isDuplicate =
            lastCaptionRef.current.label === result.label &&
            now - lastCaptionRef.current.addedAt < 1800;

          if (!isDuplicate) {
            lastCaptionRef.current = { label: result.label, addedAt: now };
            setTranslations((previous) => [
              ...previous,
              {
                id: `${result.label}-${now}`,
                label: result.label,
                text: result.text,
                confidence: result.confidence,
                time: getCurrentTime(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error('수어 인식 요청 실패:', error);
        setApiStatus('offline');
        setRecognitionStatus('idle');
        setSkeletonData(null);
      } finally {
        requestInFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(captureFrame, CAPTURE_INTERVAL_MS);
    captureFrame();

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRecognizing]);

  useEffect(() => {
    if (isCameraOn && !isTranslating) {
      setRecognitionStatus('idle');
      setBufferProgress(0);
      setSkeletonData(null);
    }
  }, [isCameraOn, isTranslating]);

  const drawSkeleton = useCallback(() => {
    const canvas = skeletonCanvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (!width || !height) {
      return;
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);

    if (!isCameraOn || !skeletonData) {
      return;
    }

    const imageWidth = skeletonData.imageWidth || CAPTURE_WIDTH;
    const imageHeight = skeletonData.imageHeight || Math.round(CAPTURE_WIDTH * 0.75);
    const imageAspect = imageWidth / imageHeight;
    const canvasAspect = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasAspect > imageAspect) {
      drawHeight = width / imageAspect;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imageAspect;
      offsetX = (width - drawWidth) / 2;
    }

    const toCanvasPoint = (point) => ({
      x: offsetX + point.x * drawWidth,
      y: offsetY + point.y * drawHeight,
    });

    const drawLine = (from, to, color, lineWidth) => {
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 14;
      context.stroke();
      context.shadowBlur = 0;
    };

    const drawJoint = (point, radius, color) => {
      context.beginPath();
      context.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
      context.fillStyle = 'rgba(3, 7, 18, 0.42)';
      context.fill();

      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 16;
      context.fill();
      context.shadowBlur = 0;

      context.beginPath();
      context.arc(point.x, point.y, Math.max(1.5, radius * 0.42), 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.fill();
    };

    const poseMap = new Map(
      (skeletonData.pose || [])
        .filter((point) => point.visibility === undefined || point.visibility > 0.35)
        .map((point) => [point.index, toCanvasPoint(point)])
    );

    context.globalCompositeOperation = 'lighter';

    POSE_CONNECTIONS.forEach(([fromIndex, toIndex]) => {
      const from = poseMap.get(fromIndex);
      const to = poseMap.get(toIndex);
      if (from && to) {
        drawLine(from, to, 'rgba(56, 189, 248, 0.88)', 4);
      }
    });
    poseMap.forEach((point) => drawJoint(point, 5, 'rgba(125, 211, 252, 0.95)'));

    (skeletonData.hands || []).forEach((hand) => {
      const pointMap = new Map(
        hand.points.map((point) => [point.index, toCanvasPoint(point)])
      );
      const isLeft = hand.handedness === 'Left';
      const lineColor = isLeft ? 'rgba(52, 211, 153, 0.9)' : 'rgba(168, 85, 247, 0.9)';
      const jointColor = isLeft ? 'rgba(110, 231, 183, 0.96)' : 'rgba(216, 180, 254, 0.96)';

      HAND_CONNECTIONS.forEach(([fromIndex, toIndex]) => {
        const from = pointMap.get(fromIndex);
        const to = pointMap.get(toIndex);
        if (from && to) {
          drawLine(from, to, lineColor, 3);
        }
      });
      pointMap.forEach((point, index) => {
        drawJoint(point, index === 0 ? 4.8 : 3.6, jointColor);
      });
    });

    context.globalCompositeOperation = 'source-over';
  }, [isCameraOn, skeletonData]);

  useEffect(() => {
    drawSkeleton();
    window.addEventListener('resize', drawSkeleton);
    return () => window.removeEventListener('resize', drawSkeleton);
  }, [drawSkeleton]);

  const clearTranslations = () => {
    setTranslations([]);
    lastCaptionRef.current = { label: '', addedAt: 0 };
  };

  const toggleTranslation = async () => {
    const nextValue = !isTranslating;
    setIsTranslating(nextValue);

    if (nextValue) {
      try {
        await fetch(`${API_BASE_URL}/api/reset`, { method: 'POST' });
      } catch (error) {
        console.error('AI 버퍼 초기화 실패:', error);
      }
      setBufferProgress(0);
      setSkeletonData(null);
      setRecognitionStatus('collecting');
    }
  };

  return (
    <div className="app-container">
      <div className="camera-section">
        {isCameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
        ) : (
          <div className="camera-empty-state">
            <VideoOff size={48} className="empty-icon" />
            <p>카메라가 꺼져 있습니다.</p>
          </div>
        )}

        <canvas ref={captureCanvasRef} className="capture-canvas" aria-hidden="true" />
        <canvas ref={skeletonCanvasRef} className="skeleton-canvas" aria-hidden="true" />

        <div className={`status-badge ${statusView.tone}`}>
          <div className="status-dot-container">
            {statusView.ping ? <span className="status-dot-ping" /> : null}
            <span className="status-dot" />
          </div>
          <span>{statusView.label}</span>
        </div>

        <div className="guide-icon" title="AI 서버와 웹캠을 켠 뒤 수어 동작을 보여주세요.">
          <AlertCircle size={20} />
        </div>

        <div className="prediction-overlay">
          <span>최근 신뢰도</span>
          <strong>{Math.round(latestConfidence * 100)}%</strong>
        </div>
      </div>

      <div className="caption-section">
        <div className="caption-handle-wrap">
          <div className="caption-handle" />
        </div>

        <div className="caption-content">
          {translations.length === 0 ? (
            <div className="caption-empty">
              <p>
                {apiStatus === 'online'
                  ? '수어 동작을 시작하면 이곳에 인식 결과가 나타납니다.'
                  : 'Python AI 서버를 실행하면 수어 인식을 시작할 수 있습니다.'}
              </p>
            </div>
          ) : (
            translations.map((item, index) => (
              <div
                key={item.id}
                className={`caption-item ${index !== translations.length - 1 ? 'dimmed' : ''}`}
              >
                <div className="caption-row">
                  <span className="caption-text">{item.text}</span>
                  <span className="caption-meta">
                    {item.label} · {Math.round(item.confidence * 100)}% · {item.time}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="floating-controls">
        <button
          type="button"
          onClick={() => setIsCameraOn((value) => !value)}
          className={`control-btn ${isCameraOn ? '' : 'danger'}`}
          title="카메라 켜기/끄기"
        >
          {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          type="button"
          onClick={toggleTranslation}
          className={`control-btn ${isTranslating ? 'active' : ''}`}
          title="수어 인식 켜기/끄기"
        >
          {isTranslating ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          type="button"
          onClick={clearTranslations}
          className="control-btn"
          title="인식 기록 지우기"
        >
          <Trash2 size={24} />
        </button>

        <button
          type="button"
          className="control-btn"
          title="설정"
          disabled
        >
          <Settings size={24} />
        </button>
      </div>
    </div>
  );
};

export default App;
