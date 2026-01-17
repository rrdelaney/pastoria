import {useEffect, useRef, useCallback} from 'react';
import styles from './styles.module.css';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
}

interface Spark {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

const SPARK_COLORS = [
  '#6d9afb', // blue
  '#a855f7', // purple
  '#f97316', // orange
  '#22d3ee', // cyan
];

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const mouseRef = useRef({x: 0, y: 0, active: false});

  const initNodes = useCallback((width: number, height: number) => {
    // More nodes for the 3D perspective view
    const nodeCount = Math.floor((width * height) / 15000);
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 2.5 + 1.5,
        connections: [],
      });
    }

    // Build connections based on proximity - larger distance for more connections
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

  const spawnSpark = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    // Find a node with connections
    const nodesWithConnections = nodes
      .map((n, i) => ({node: n, index: i}))
      .filter((n) => n.node.connections.length > 0);

    if (nodesWithConnections.length === 0) return;

    const source =
      nodesWithConnections[
        Math.floor(Math.random() * nodesWithConnections.length)
      ];
    const targetIndex =
      source.node.connections[
        Math.floor(Math.random() * source.node.connections.length)
      ];

    sparksRef.current.push({
      fromNode: source.index,
      toNode: targetIndex,
      progress: 0,
      speed: 0.008 + Math.random() * 0.012,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    });
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
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Spawn sparks periodically - more sparks for the 3D view
    const sparkInterval = setInterval(() => {
      if (sparksRef.current.length < 25) {
        spawnSpark();
      }
    }, 150);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const sparks = sparksRef.current;
      const mouse = mouseRef.current;

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Mouse interaction - gentle repulsion
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            node.vx += (dx / dist) * force * 0.02;
            node.vy += (dy / dist) * force * 0.02;
          }
        }

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Apply friction
        node.vx *= 0.99;
        node.vy *= 0.99;

        // Bounce off edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));

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

      // Update and draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.progress += spark.speed;

        if (spark.progress >= 1) {
          sparks.splice(i, 1);
          continue;
        }

        const fromNode = nodes[spark.fromNode];
        const toNode = nodes[spark.toNode];

        if (!fromNode || !toNode) {
          sparks.splice(i, 1);
          continue;
        }

        // Calculate spark position
        const x = fromNode.x + (toNode.x - fromNode.x) * spark.progress;
        const y = fromNode.y + (toNode.y - fromNode.y) * spark.progress;

        // Draw spark glow - larger for 3D perspective
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 16);
        gradient.addColorStop(0, spark.color);
        gradient.addColorStop(0.4, spark.color + 'aa');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw spark core
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw trail
        const trailLength = 0.1;
        const trailStart = Math.max(0, spark.progress - trailLength);
        const trailX = fromNode.x + (toNode.x - fromNode.x) * trailStart;
        const trailY = fromNode.y + (toNode.y - fromNode.y) * trailStart;

        const trailGradient = ctx.createLinearGradient(trailX, trailY, x, y);
        trailGradient.addColorStop(0, 'transparent');
        trailGradient.addColorStop(1, spark.color + 'cc');

        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(sparkInterval);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initNodes, spawnSpark]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.plane}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <div className={styles.gradient} />
    </div>
  );
}
