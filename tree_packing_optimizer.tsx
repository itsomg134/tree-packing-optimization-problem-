import React, { useState, useRef, useEffect } from 'react';
import { Download, Play, RotateCcw, Info } from 'lucide-react';

const TreePackingOptimizer = () => {
  const [numTrees, setNumTrees] = useState(10);
  const [algorithm, setAlgorithm] = useState('greedy');
  const [trees, setTrees] = useState([]);
  const [boundingBox, setBoundingBox] = useState(0);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef(null);

  // Simple tree shape (triangle on rectangle)
  const createTreeShape = (size = 1) => {
    const scale = 8 * size;
    return [
      { x: 0, y: -2 * scale },      // top of triangle
      { x: -scale, y: 0 },          // left of triangle
      { x: -0.4 * scale, y: 0 },    // trunk top left
      { x: -0.4 * scale, y: scale }, // trunk bottom left
      { x: 0.4 * scale, y: scale },  // trunk bottom right
      { x: 0.4 * scale, y: 0 },      // trunk top right
      { x: scale, y: 0 }             // right of triangle
    ];
  };

  // Rotate a point around origin
  const rotatePoint = (point, angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos
    };
  };

  // Get rotated and translated tree polygon
  const getTreePolygon = (tree) => {
    return tree.shape.map(point => {
      const rotated = rotatePoint(point, tree.rotation);
      return {
        x: rotated.x + tree.x,
        y: rotated.y + tree.y
      };
    });
  };

  // Check if two polygons overlap using SAT (Separating Axis Theorem)
  const polygonsOverlap = (poly1, poly2) => {
    const checkAxes = (p1, p2) => {
      for (let i = 0; i < p1.length; i++) {
        const edge = {
          x: p1[(i + 1) % p1.length].x - p1[i].x,
          y: p1[(i + 1) % p1.length].y - p1[i].y
        };
        const axis = { x: -edge.y, y: edge.x };
        
        let min1 = Infinity, max1 = -Infinity;
        let min2 = Infinity, max2 = -Infinity;
        
        for (const point of p1) {
          const proj = point.x * axis.x + point.y * axis.y;
          min1 = Math.min(min1, proj);
          max1 = Math.max(max1, proj);
        }
        
        for (const point of p2) {
          const proj = point.x * axis.x + point.y * axis.y;
          min2 = Math.min(min2, proj);
          max2 = Math.max(max2, proj);
        }
        
        if (max1 < min2 || max2 < min1) return false;
      }
      return true;
    };
    
    return checkAxes(poly1, poly2) && checkAxes(poly2, poly1);
  };

  // Check if tree overlaps with any existing trees
  const hasOverlap = (newTree, existingTrees) => {
    const newPoly = getTreePolygon(newTree);
    for (const tree of existingTrees) {
      const existingPoly = getTreePolygon(tree);
      if (polygonsOverlap(newPoly, existingPoly)) {
        return true;
      }
    }
    return false;
  };

  // Calculate bounding box for all trees
  const calculateBoundingBox = (treeList) => {
    if (treeList.length === 0) return 0;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    treeList.forEach(tree => {
      const polygon = getTreePolygon(tree);
      polygon.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    return Math.max(maxX - minX, maxY - minY);
  };

  // Greedy packing algorithm
  const greedyPacking = (n) => {
    const placed = [];
    const treeShape = createTreeShape();
    const gridSize = 20;
    const rotations = [0, 45, 90, 135, 180, 225, 270, 315];
    
    for (let i = 0; i < n; i++) {
      let bestTree = null;
      let bestBox = Infinity;
      
      // Try spiral pattern from center
      for (let radius = 0; radius < 150; radius += gridSize) {
        for (let angle = 0; angle < 360; angle += 45) {
          const x = radius * Math.cos((angle * Math.PI) / 180);
          const y = radius * Math.sin((angle * Math.PI) / 180);
          
          for (const rotation of rotations) {
            const candidate = {
              id: i + 1,
              x: Math.round(x),
              y: Math.round(y),
              rotation: rotation,
              shape: treeShape
            };
            
            if (!hasOverlap(candidate, placed)) {
              const testList = [...placed, candidate];
              const box = calculateBoundingBox(testList);
              
              if (box < bestBox) {
                bestBox = box;
                bestTree = candidate;
              }
            }
          }
        }
        
        if (bestTree) break;
      }
      
      if (bestTree) {
        placed.push(bestTree);
      }
    }
    
    return placed;
  };

  // Random with simulated annealing
  const simulatedAnnealingPacking = (n) => {
    const treeShape = createTreeShape();
    let current = [];
    
    // Initial random placement
    for (let i = 0; i < n; i++) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 1000) {
        const candidate = {
          id: i + 1,
          x: Math.round((Math.random() - 0.5) * 150),
          y: Math.round((Math.random() - 0.5) * 150),
          rotation: Math.floor(Math.random() * 8) * 45,
          shape: treeShape
        };
        
        if (!hasOverlap(candidate, current)) {
          current.push(candidate);
          placed = true;
        }
        attempts++;
      }
    }
    
    return current;
  };

  // Run optimization
  const runOptimization = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      let result;
      
      if (algorithm === 'greedy') {
        result = greedyPacking(numTrees);
      } else {
        result = simulatedAnnealingPacking(numTrees);
      }
      
      setTrees(result);
      const box = calculateBoundingBox(result);
      setBoundingBox(box);
      setScore((box * box) / result.length);
      setIsRunning(false);
    }, 100);
  };

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Transform to center origin
    ctx.save();
    ctx.translate(width / 2, height / 2);
    
    const scale = Math.min(width, height) / (boundingBox || 200) * 0.8;
    
    // Draw bounding box
    if (boundingBox > 0) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2 / scale;
      const half = boundingBox / 2;
      ctx.strokeRect(-half * scale, -half * scale, boundingBox * scale, boundingBox * scale);
    }
    
    // Draw trees
    trees.forEach(tree => {
      const polygon = getTreePolygon(tree);
      
      ctx.beginPath();
      ctx.moveTo(polygon[0].x * scale, polygon[0].y * scale);
      polygon.forEach(point => {
        ctx.lineTo(point.x * scale, point.y * scale);
      });
      ctx.closePath();
      
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    ctx.restore();
  }, [trees, boundingBox]);

  // Export to CSV
  const exportCSV = () => {
    if (trees.length === 0) {
      alert('Please run optimization first!');
      return;
    }
    
    let csv = 'id,x,y,deg\n';
    trees.forEach(tree => {
      csv += `${tree.id},${Math.round(tree.x)},${Math.round(tree.y)},${tree.rotation}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trees_${numTrees}_score_${score.toFixed(0)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-red-600 p-6 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              🎄 Santa's Tree Packing Optimizer
            </h1>
            <p className="mt-2 text-green-100">Minimize bounding box size for optimal packing</p>
          </div>
          
          <div className="p-6 grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Trees: {numTrees}
                </label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={numTrees}
                  onChange={(e) => setNumTrees(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Algorithm
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full p-2 border rounded"
                  disabled={isRunning}
                >
                  <option value="greedy">Greedy Spiral</option>
                  <option value="random">Random + Annealing</option>
                </select>
              </div>
              
              <button
                onClick={runOptimization}
                disabled={isRunning}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:bg-gray-400"
              >
                <Play size={20} />
                {isRunning ? 'Running...' : 'Run Optimization'}
              </button>
              
              <button
                onClick={() => {
                  setTrees([]);
                  setBoundingBox(0);
                  setScore(0);
                }}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-700"
              >
                <RotateCcw size={18} />
                Reset
              </button>
              
              {trees.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Info size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Results</h3>
                    <p className="text-sm text-blue-800 mt-1">
                      Trees Placed: <span className="font-bold">{trees.length}</span>
                    </p>
                    <p className="text-sm text-blue-800">
                      Box Size: <span className="font-bold">{boundingBox.toFixed(1)}</span>
                    </p>
                    <p className="text-sm text-blue-800">
                      Score: <span className="font-bold">{score.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="w-full border-2 border-gray-300 rounded-lg bg-gray-900"
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>How it works:</strong> The greedy algorithm places trees in a spiral pattern from the center, 
              testing different rotations. The random algorithm uses initial random placement. Both minimize the bounding box size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreePackingOptimizer;