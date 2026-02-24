import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext("2d");
    if (context) {
      context.lineCap = "round";
      context.strokeStyle = "red";
      context.lineWidth = 5;
    }
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.beginPath();
      context.moveTo(e.clientX, e.clientY);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.lineTo(e.clientX, e.clientY);
      context.stroke();
    }
  };

  const stopDrawing = () => {
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      context.closePath();
      setIsDrawing(false);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ display: "block", cursor: "crosshair" }}
      />
    </div>
  );
}

export default App;
