import React, { useEffect, useRef } from "react";

function VisualizationCanvas({ visualization }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!visualization) return;
    const ctx = canvasRef.current.getContext("2d");
    const { layers, fps } = visualization;
    let animationId;
    let startTime;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      layers.forEach((layer) => {
        let { x, y, r, fill } = layer.props;
        layer.animations.forEach((anim) => {
          if (anim.property === "x") {
            const progress = Math.min(elapsed / (anim.end - anim.start), 1);
            x = anim.from + (anim.to - anim.from) * progress;
          }
        });
        if (layer.type === "circle") {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [visualization]);

  return <canvas ref={canvasRef} width={600} height={400} style={{ width: "100%", height: "100%" }} />;
}

export default VisualizationCanvas;
