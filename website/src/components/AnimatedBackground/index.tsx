import {useEffect, useRef, useCallback} from 'react';
import styles from './styles.module.css';

interface Node {
  x: number;
  y: number;
  radius: number;
  connections: number[];
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);

  const initNodes = useCallback((width: number, height: number) => {
    const nodeCount = Math.floor((width * height) / 15000);
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1.5,
        connections: [],
      });
    }

    // Build connections based on proximity
    const connectionDistance = Math.min(width, height) * 0.18;
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

    nodesRef.current = nodes;
  }, []);

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

    // Draw nodes and connections
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(109, 154, 251, 0.6)';
      ctx.fill();

      // Draw connections
      for (const j of node.connections) {
        const other = nodes[j];
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(width, height) * 0.2;
        const opacity = Math.max(0, 1 - dist / maxDist) * 0.15;

        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(other.x, other.y);
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

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initNodes(rect.width, rect.height);
      draw();
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [initNodes, draw]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.plane}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <div className={styles.gradient} />
    </div>
  );
}
