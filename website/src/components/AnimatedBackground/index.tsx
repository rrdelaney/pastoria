import {useEffect, useRef, useCallback} from 'react';
import styles from './styles.module.css';

interface Node {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  radius: number;
  connections: number[];
}

// Generate nodes once with normalized coordinates
function createNodes(): Node[] {
  // Use a fixed node count for consistency
  const nodeCount = 80;
  const nodes: Node[] = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 2.5 + 1.5,
      connections: [],
    });
  }

  // Build connections based on proximity (in normalized space)
  const connectionDistance = 0.18;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < connectionDistance && nodes[i].connections.length < 5) {
        nodes[i].connections.push(j);
      }
    }
  }

  return nodes;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[] | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const nodes = nodesRef.current;
    if (!nodes) return;

    // Draw nodes and connections, scaling from normalized to screen coordinates
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeX = node.x * width;
      const nodeY = node.y * height;

      // Draw node
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(109, 154, 251, 0.6)';
      ctx.fill();

      // Draw connections
      for (const j of node.connections) {
        const other = nodes[j];
        const otherX = other.x * width;
        const otherY = other.y * height;
        const dx = otherX - nodeX;
        const dy = otherY - nodeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(width, height) * 0.2;
        const opacity = Math.max(0, 1 - dist / maxDist) * 0.15;

        ctx.beginPath();
        ctx.moveTo(nodeX, nodeY);
        ctx.lineTo(otherX, otherY);
        ctx.strokeStyle = `rgba(109, 154, 251, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize nodes once
    if (!nodesRef.current) {
      nodesRef.current = createNodes();
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      draw();
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.plane}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <div className={styles.gradient} />
    </div>
  );
}
