import React from 'react';
import { fmtINR } from './ui';

const useMeasure = () => {
  const ref = React.useRef(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
};

// Shared tooltip bubble
const Tooltip = ({ x, y, children, svgW }) => {
  const PAD = 8, W = 130, H = 44;
  // Clamp so tooltip never overflows left/right edge
  const left = Math.min(Math.max(x - W / 2, 4), (svgW || 9999) - W - 4);
  const top = y - H - 10;
  return (
    <foreignObject x={left} y={top} width={W} height={H} style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <div xmlns="http://www.w3.org/1999/xhtml" style={{
        background: 'var(--ink-1)', color: 'white',
        borderRadius: 6, padding: `${PAD - 2}px ${PAD + 2}px`,
        fontSize: 11, fontFamily: 'var(--font-mono)',
        lineHeight: 1.5, whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        animation: 'tooltipPop 120ms cubic-bezier(0.16,1,0.3,1) forwards',
      }}>
        {children}
      </div>
    </foreignObject>
  );
};

// ─── LineChart ────────────────────────────────────────────────────────────────
const LineChart = ({ data, height = 140, accent = 'var(--ink-1)', xKey = 'm', yKey = 'v', showAxis = true, fill = true }) => {
  const gradId   = React.useRef(`grad-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`).current;
  const clipId   = React.useRef(`clip-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`).current;
  const [animKey, setAnimKey] = React.useState(0);
  const [hovered, setHovered] = React.useState(null); // index
  const prevDataRef = React.useRef(data);

  React.useEffect(() => {
    if (data !== prevDataRef.current) {
      prevDataRef.current = data;
      setAnimKey(k => k + 1);
      setHovered(null);
    }
  }, [data]);

  const [ref, { w }] = useMeasure();
  const padL = 42, padR = 12, padT = 16, padB = showAxis ? 24 : 8;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;

  if (!data || data.length === 0) {
    return <div ref={ref} style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12 }}>No data</div>;
  }

  const ys = data.map(d => d[yKey]).filter(v => v != null && !isNaN(v));
  let minY = 0, maxY = 1, range = 1;
  if (ys.length > 0) {
    const dataMin = Math.min(...ys);
    const dataMax = Math.max(...ys);
    const dataRange = dataMax - dataMin || dataMax * 0.1 || 1;
    const pad = dataRange * 0.18;
    minY = dataMin > 0 ? Math.max(0, dataMin - pad) : dataMin - pad;
    maxY = dataMax + pad * 0.5;
    range = maxY - minY || 1;
  }

  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - ((range > 0 ? ((d[yKey] || 0) - minY) / range : 0) * innerH),
    raw: d[yKey] || 0,
    label: d[xKey],
  }));

  // Smooth bezier path
  const bezierPath = points.map((p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }).join(' ');

  const area = bezierPath + ` L${padL + innerW},${padT + innerH} L${padL},${padT + innerH} Z`;

  const pathLen = points.reduce((len, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return len + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0) || 1000;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => minY + (range * i / yTicks));

  const fmtY = (v) => {
    if (v >= 10000000) return (v / 10000000).toFixed(1).replace(/\.?0+$/, '') + 'Cr';
    if (v >= 100000)   return (v / 100000).toFixed(1).replace(/\.?0+$/, '') + 'L';
    if (v >= 1000)     return (v / 1000).toFixed(0) + 'k';
    return Math.round(v);
  };

  const fmtTooltip = (v) => {
    if (v >= 100000) return fmtINR(v);
    if (v >= 1000)   return v.toLocaleString('en-IN');
    return v;
  };

  const hov = hovered !== null ? points[hovered] : null;

  return (
    <div ref={ref} style={{ width: '100%', height, position: 'relative' }}>
      {w > 0 && (
        <svg key={animKey} width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor={accent} stopOpacity="0.14"/>
              <stop offset="100%" stopColor={accent} stopOpacity="0"/>
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={padL} y={padT} width={innerW} height={innerH + 2}/>
            </clipPath>
          </defs>

          {/* Grid lines + Y axis labels */}
          {ticks.map((t, i) => {
            const y = padT + innerH - ((range > 0 ? (t - minY) / range : 0) * innerH);
            return (
              <g key={i}>
                <line x1={padL} x2={padL + innerW} y1={y} y2={y}
                  stroke="var(--border-subtle)" strokeDasharray={i === 0 ? '0' : '2 4'} strokeWidth={0.8}/>
                <text x={padL - 8} y={y + 3.5} fontSize="10" textAnchor="end"
                  fill="var(--ink-4)" fontFamily="var(--font-mono)">{fmtY(t)}</text>
              </g>
            );
          })}

          {/* Area fill */}
          {fill && (
            <path d={area} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`}
              style={{ opacity: 0, animation: 'fadeIn 500ms 250ms ease forwards' }}/>
          )}

          {/* Crosshair vertical line on hover */}
          {hov && (
            <line x1={hov.x} x2={hov.x} y1={padT} y2={padT + innerH}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3"
              style={{ pointerEvents: 'none' }}/>
          )}

          {/* Line draws in */}
          <path d={bezierPath} fill="none" stroke={accent} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={pathLen} strokeDashoffset={pathLen}
            style={{ animation: `drawPath 750ms cubic-bezier(0.16,1,0.3,1) forwards` }}/>

          {/* Invisible hit areas for hover */}
          {points.map((p, i) => (
            <rect key={i}
              x={p.x - stepX / 2} y={padT} width={stepX || 20} height={innerH}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'crosshair' }}
            />
          ))}

          {/* Dots — always visible, enlarge on hover */}
          {points.map((p, i) => {
            const isHov = hovered === i;
            return (
              <circle key={i} cx={p.x} cy={p.y}
                r={isHov ? 5 : 2.5}
                fill={isHov ? accent : 'var(--bg-elevated)'}
                stroke={accent} strokeWidth="1.8"
                style={{
                  opacity: 0,
                  animation: `fadeIn 200ms ${650 + i * 25}ms ease forwards`,
                  transition: 'r 120ms ease, fill 120ms ease',
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {/* X axis labels */}
          {showAxis && data.map((d, i) => {
            // For dense daily data, only show every Nth label
            const skip = data.length > 20 ? 5 : data.length > 10 ? 2 : 1;
            if (i % skip !== 0 && i !== data.length - 1) return null;
            return (
              <text key={i} x={padL + i * stepX} y={height - 6}
                fontSize="10" textAnchor="middle"
                fill={hovered === i ? accent : 'var(--ink-4)'}
                fontFamily="var(--font-mono)"
                style={{ transition: 'fill 120ms', fontWeight: hovered === i ? 600 : 400 }}>
                {d[xKey]}
              </text>
            );
          })}

          {/* Tooltip */}
          {hov && (
            <Tooltip x={hov.x} y={hov.y} svgW={w}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 1 }}>{hov.label}</div>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{fmtTooltip(hov.raw)}</div>
            </Tooltip>
          )}
        </svg>
      )}
    </div>
  );
};

// ─── BarChart ─────────────────────────────────────────────────────────────────
const BarChart = ({ data, height = 140, accent = 'var(--ink-1)', xKey = 'd', yKey = 'v', showAxis = true }) => {
  const [animKey, setAnimKey] = React.useState(0);
  const [hovered, setHovered] = React.useState(null);
  const prevDataRef = React.useRef(data);

  React.useEffect(() => {
    if (data !== prevDataRef.current) {
      prevDataRef.current = data;
      setAnimKey(k => k + 1);
      setHovered(null);
    }
  }, [data]);

  const [ref, { w }] = useMeasure();
  const padL = 32, padR = 8, padT = 16, padB = showAxis ? 24 : 8;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;

  const ys = (data || []).map(d => d[yKey]);
  const maxY = Math.max(...ys, 1);
  // Fix #B2: data.length was accessed without a null guard — (data||[]) already
  // protects ys but slot used data.length directly, crashing if data was null.
  const slot = (data || []).length > 0 ? innerW / (data || []).length : 0;
  const barW = Math.max(8, slot * 0.58);
  const yTicks = 3;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => maxY * i / yTicks);

  const fmtY = (v) => {
    if (v >= 100000) return (v / 100000).toFixed(1).replace(/\.?0+$/, '') + 'L';
    if (v >= 1000)   return (v / 1000).toFixed(0) + 'k';
    return Math.round(v);
  };

  return (
    <div ref={ref} style={{ width: '100%', height, position: 'relative' }}>
      {w > 0 && (
        <svg key={animKey} width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
          {/* Grid lines */}
          {ticks.map((t, i) => {
            const y = padT + innerH - (t / maxY) * innerH;
            return (
              <g key={i}>
                <line x1={padL} x2={padL + innerW} y1={y} y2={y}
                  stroke="var(--border-subtle)" strokeDasharray={i === 0 ? '0' : '2 4'} strokeWidth={0.8}/>
                <text x={padL - 6} y={y + 3.5} fontSize="10" textAnchor="end"
                  fill="var(--ink-4)" fontFamily="var(--font-mono)">{fmtY(t)}</text>
              </g>
            );
          })}

          {/* Bars */}
          {(data || []).map((d, i) => {
            const h = Math.max(2, (d[yKey] / maxY) * innerH);
            const x = padL + i * slot + (slot - barW) / 2;
            const y = padT + innerH - h;
            const isHov = hovered === i;
            const delay = i * 35;
            return (
              <g key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}>
                {/* Bar background (full height, subtle) */}
                <rect x={x} y={padT} width={barW} height={innerH} rx={3}
                  fill={isHov ? 'var(--bg-subtle)' : 'transparent'}
                  style={{ transition: 'fill 120ms' }}/>
                {/* Actual bar */}
                <rect x={x} y={padT + innerH} width={barW} height={0} rx={3}
                  fill={accent}
                  opacity={isHov ? 1 : 0.78}
                  style={{ transition: 'opacity 120ms' }}>
                  <animate attributeName="height" from="0" to={h}
                    dur="480ms" begin={`${delay}ms`} fill="freeze"
                    calcMode="spline" keySplines="0.16 1 0.3 1" keyTimes="0;1"/>
                  <animate attributeName="y" from={padT + innerH} to={y}
                    dur="480ms" begin={`${delay}ms`} fill="freeze"
                    calcMode="spline" keySplines="0.16 1 0.3 1" keyTimes="0;1"/>
                </rect>
                {/* X label */}
                {showAxis && (
                  <text x={x + barW / 2} y={height - 6} fontSize="10" textAnchor="middle"
                    fill={isHov ? accent : 'var(--ink-4)'}
                    fontFamily="var(--font-mono)"
                    style={{ transition: 'fill 120ms', fontWeight: isHov ? 600 : 400 }}>
                    {d[xKey]}
                  </text>
                )}
                {/* Tooltip */}
                {isHov && (
                  <Tooltip x={x + barW / 2} y={y} svgW={w}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 1 }}>{d[xKey]}</div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {d[yKey] >= 1000 ? d[yKey].toLocaleString('en-IN') : d[yKey]}
                    </div>
                  </Tooltip>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

// ─── DonutChart ───────────────────────────────────────────────────────────────
const DonutChart = ({ data, size = 180, thickness = 22 }) => {
  const [hovered, setHovered] = React.useState(null);

  if (!data || data.length === 0) {
    return <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12 }}>No spending data</div>;
  }

  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) {
    return <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12 }}>No spending data</div>;
  }

  const r = (size - thickness) / 2;
  const rHov = r + 4; // expanded radius on hover
  const cx = size / 2, cy = size / 2;

  let acc = 0;
  const segs = data.map((d, idx) => {
    const startA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value || 0;
    const endA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = (endA - startA) > Math.PI ? 1 : 0;
    const isHov = hovered === idx;
    const rad = isHov ? rHov : r;

    const x1 = cx + rad * Math.cos(startA);
    const y1 = cy + rad * Math.sin(startA);
    const x2 = cx + rad * Math.cos(endA);
    const y2 = cy + rad * Math.sin(endA);

    // Midpoint angle for tooltip placement
    const midA = (startA + endA) / 2;
    const tipR = rad + thickness / 2 + 18;
    const tipX = cx + tipR * Math.cos(midA);
    const tipY = cy + tipR * Math.sin(midA);

    return {
      path: `M${x1},${y1} A${rad},${rad} 0 ${large} 1 ${x2},${y2}`,
      color: d.color,
      label: d.label,
      value: d.value || 0,
      pct: Math.round(((d.value || 0) / total) * 100),
      tipX, tipY,
      isHov,
      strokeW: isHov ? thickness + 5 : thickness,
    };
  });

  const hovSeg = hovered !== null ? segs[hovered] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="var(--bg-subtle)" strokeWidth={thickness}/>
          {/* Segments */}
          {segs.map((s, i) => (
            <path key={i} d={s.path} fill="none"
              stroke={s.color} strokeWidth={s.strokeW}
              strokeLinecap="butt"
              style={{
                opacity: hovered !== null && !s.isHov ? 0.45 : 1,
                transition: 'opacity 180ms ease, stroke-width 180ms ease',
                cursor: 'pointer',
                animation: `fadeIn 350ms ${i * 70}ms cubic-bezier(0.16,1,0.3,1) forwards`,
                filter: s.isHov ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' : 'none',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Tooltip near hovered segment */}
          {hovSeg && (() => {
            const W = 110, H = 40;
            const lx = Math.min(Math.max(hovSeg.tipX - W / 2, 4), size + 60 - W);
            const ly = hovSeg.tipY - H / 2;
            return (
              <foreignObject x={lx} y={ly} width={W} height={H} style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <div xmlns="http://www.w3.org/1999/xhtml" style={{
                  background: 'var(--ink-1)', color: 'white',
                  borderRadius: 6, padding: '5px 8px',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  lineHeight: 1.5, whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  animation: 'tooltipPop 120ms cubic-bezier(0.16,1,0.3,1) forwards',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{hovSeg.label}</div>
                  <div style={{ fontWeight: 600 }}>{fmtINR(hovSeg.value)} · {hovSeg.pct}%</div>
                </div>
              </foreignObject>
            );
          })()}
        </svg>
        {/* Centre label — shows hovered item or total */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          transition: 'opacity 150ms',
        }}>
          {hovSeg ? (
            <>
              <div style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{hovSeg.pct}%</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(hovSeg.value)}</div>
            </>
          ) : (
            <>
              <div className="eyebrow" style={{ fontSize: 10 }}>Total</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(total)}</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 150 }}>
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round(((d.value || 0) / total) * 100) : 0;
          const isHov = hovered === i;
          return (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5,
                cursor: 'default', borderRadius: 4, padding: '2px 4px',
                background: isHov ? 'var(--bg-subtle)' : 'transparent',
                transition: 'background 150ms',
              }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0,
                transform: isHov ? 'scale(1.3)' : 'scale(1)', transition: 'transform 150ms' }}/>
              <span style={{ flex: 1, color: isHov ? 'var(--ink-1)' : 'var(--ink-2)', transition: 'color 150ms', fontWeight: isHov ? 600 : 400 }}>{d.label}</span>
              <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{pct}%</span>
              <span style={{ color: 'var(--ink-1)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', minWidth: 60, textAlign: 'right' }}>{fmtINR(d.value || 0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── HeatmapChart ─────────────────────────────────────────────────────────────
const HeatmapChart = ({ data, accent = 'var(--ink-1)', accentHex = '#1c1917' }) => {
  const [hovered, setHovered] = React.useState(null);
  const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p'];
  const cellW = 28, cellH = 18, gap = 3;
  const padL = 32, padT = 4, padB = 24;
  const gridW = hours.length * (cellW + gap) - gap;
  const gridH = days.length * (cellH + gap) - gap;
  const svgW  = padL + gridW;
  const svgH  = padT + gridH + padB;

  const hexToRgb = (hex) => {
    const clean = hex.startsWith('#') ? hex : '#1c1917';
    return {
      r: parseInt(clean.slice(1, 3), 16),
      g: parseInt(clean.slice(3, 5), 16),
      b: parseInt(clean.slice(5, 7), 16),
    };
  };
  const { r, g, b } = hexToRgb(accentHex);

  // Fix #B3: (data||[]).flat() can contain null/undefined when rows have gaps,
  // making Math.max return NaN and all cells render as transparent.
  // Filter to finite numbers only before finding the max.
  const allVals = (data || []).flat().filter(Number.isFinite);
  const maxVal  = Math.max(...allVals, 1);

  return (
    <div style={{ position: 'relative', overflowX: 'auto' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block', overflow: 'visible' }}>
        {/* Day labels */}
        {days.map((d, di) => (
          <text key={di}
            x={padL - 6}
            y={padT + di * (cellH + gap) + cellH / 2 + 4}
            fontSize={9} textAnchor="end"
            fill={hovered && hovered[0] === di ? accent : 'var(--ink-4)'}
            fontFamily="var(--font-mono)"
            style={{ transition: 'fill 120ms', fontWeight: hovered && hovered[0] === di ? 600 : 400 }}>
            {d}
          </text>
        ))}
        {/* Hour labels */}
        {hours.map((h, hi) => (
          <text key={hi}
            x={padL + hi * (cellW + gap) + cellW / 2}
            y={svgH - 6}
            fontSize={9} textAnchor="middle"
            fill={hovered && hovered[1] === hi ? accent : 'var(--ink-4)'}
            fontFamily="var(--font-mono)"
            style={{ transition: 'fill 120ms', fontWeight: hovered && hovered[1] === hi ? 600 : 400 }}>
            {h}
          </text>
        ))}
        {/* Cells */}
        {(data || []).map((row, di) =>
          row.map((val, hi) => {
            const x = padL + hi * (cellW + gap);
            const y = padT + di * (cellH + gap);
            const alpha = val / maxVal;
            const fill  = `rgba(${r},${g},${b},${(alpha * 0.88 + 0.04).toFixed(2)})`;
            const isHov = hovered && hovered[0] === di && hovered[1] === hi;
            const delay = (di * hours.length + hi) * 4;
            return (
              <rect key={`${di}-${hi}`}
                x={x} y={y} width={cellW} height={cellH} rx={3}
                fill={fill}
                stroke={isHov ? accent : 'transparent'}
                strokeWidth={1.5}
                style={{
                  cursor: 'default',
                  transition: 'stroke 80ms, transform 80ms',
                  transform: isHov ? 'scale(1.08)' : 'scale(1)',
                  transformOrigin: `${x + cellW / 2}px ${y + cellH / 2}px`,
                  opacity: 0,
                  animation: `fadeIn 200ms ${delay}ms ease forwards`,
                }}
                onMouseEnter={() => setHovered([di, hi])}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })
        )}
        {/* Tooltip */}
        {hovered && (() => {
          const [di, hi] = hovered;
          const val = (data[di] || [])[hi] ?? 0;
          const tipX = padL + hi * (cellW + gap) + cellW / 2;
          const tipY = padT + di * (cellH + gap);
          const W = 120, H = 40;
          const lx = Math.min(Math.max(tipX - W / 2, 0), svgW - W);
          const ly = tipY - H - 6;
          return (
            <foreignObject x={lx} y={ly} width={W} height={H} style={{ overflow: 'visible', pointerEvents: 'none' }}>
              <div xmlns="http://www.w3.org/1999/xhtml" style={{
                background: 'var(--ink-1)', color: 'white',
                borderRadius: 6, padding: '5px 8px',
                fontSize: 11, fontFamily: 'var(--font-mono)',
                lineHeight: 1.5, whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                animation: 'tooltipPop 120ms cubic-bezier(0.16,1,0.3,1) forwards',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{days[di]} · {hours[hi]}</div>
                <div style={{ fontWeight: 600 }}>{val}% activity</div>
              </div>
            </foreignObject>
          );
        })()}
      </svg>
    </div>
  );
};

export { LineChart, BarChart, DonutChart, HeatmapChart };
